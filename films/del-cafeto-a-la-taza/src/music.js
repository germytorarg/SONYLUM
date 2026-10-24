// music.js : the score and sound design of the film.
// Owner: music. Contract: docs/CONTRACT.md, section Audio.
//
// FILM.audio.render(ctx, { start = 0, dest = ctx.destination }) schedules the whole piece,
// music and effects, from global time `start` into any BaseAudioContext.
// Every sound is synthesised here: oscillators, periodic waves, seeded noise, filters, envelopes,
// a ping-pong delay, convolver reverbs on generated impulse responses, a glue compressor and a
// soft limiter. Randomness comes only from FILM.lib.rng, seeded per event, so any start time
// schedules the same notes at the same global times.
//
// The engine, instruments, effects and master chain below are film-agnostic. Per film the music
// agent replaces three things: the CH chord table, the MIX.ride section automation, and the whole
// score() function — composing against FILM.TIMELINE.bpm and FILM.TIMELINE.cues so hits land on
// the cuts. What ships here is a demo score that gives the stub pass a pulse; see the skill's
// reference/music.md before composing.
(function () {
  'use strict';
  const FILM = window.FILM;
  const lib = FILM.lib;
  const TAU = Math.PI * 2;
  const FLOOR = 1e-5;

  // DynamicsCompressorNode delays its output by a fixed 6 ms look-ahead (measured: 288 samples at
  // 48 kHz). Every event before the compressor is scheduled that much early, so it leaves the master
  // exactly on its cue. Only an event inside the first 6 ms of a render window can land late.
  const LAT = 0.006;

  // Mix constants, tuned by measurement (tools/audio): loudness, peaks, per-bar profile.
  const MIX = {
    trim: 1.05,
    ceiling: 0.66, // soft limiter output ceiling (about -3.6 dBFS)
    knee: 0.5,
    bus: { drums: 0.6, perc: 0.8, bass: 0.3, pad: 0.26, keys: 0.6, bells: 0.45, lead: 0.5, sfx: 0.62, amb: 0.5 },
    // Master tilt EQ in dB: a low shelf under the subs, presence and air for phone speakers.
    eq: { low: -4, presence: 5, air: 3 },
    comp: { threshold: -18, knee: 10, ratio: 2, attack: 0.006, release: 0.2 },
    // Section fader rides in dB at global times, pre-compressor: quiet egg, hushed pupa, full drop,
    // hushed winter, and an ending level that meets the opening level at the loop seam.
    // Per film: section fader rides in dB at global times, pre-compressor (see reference/music.md).
    ride: [[0, -2], [11.5, -2], [12, -1], [23.5, -1], [24, 0], [42, 0], [44.5, -2], [45, -2]],
  };

  // ---------------------------------------------------------------- pitch
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function hz(n) {
    if (typeof n === 'number') return n;
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
    const midi = 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ---------------------------------------------------------------- envelopes
  // pts: [[dt, value, shape]] with dt from the note start; shape is the ramp INTO that point:
  // 'lin' (default), 'exp' or 'set'. The first point must sit at dt 0.
  // When the voice started before the render window (skip > 0) the value at `skip` is computed
  // and automation resumes from there, so a seek hears the same envelope.
  function setEnv(param, pts, c0, skip) {
    let i;
    let prev;
    if (skip > 0) {
      let v = pts[0][1];
      for (i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        if (skip < b[0]) {
          const f = (skip - a[0]) / Math.max(1e-9, b[0] - a[0]);
          const sh = b[2] || 'lin';
          if (sh === 'set') v = a[1];
          else if (sh === 'exp' && a[1] > 0) v = a[1] * Math.pow(Math.max(b[1], FLOOR) / a[1], f);
          else v = a[1] + (b[1] - a[1]) * f;
          break;
        }
        v = b[1];
      }
      param.setValueAtTime(v, c0 + skip);
      prev = v;
    } else {
      param.setValueAtTime(pts[0][1], c0);
      prev = pts[0][1];
      i = 1;
    }
    for (; i < pts.length; i++) {
      const v = pts[i][1];
      const sh = pts[i][2] || 'lin';
      const w = c0 + pts[i][0];
      if (sh === 'set') {
        param.setValueAtTime(v, w);
        prev = v;
      } else if (sh === 'exp' && prev > 0) {
        param.exponentialRampToValueAtTime(Math.max(v, FLOOR), w);
        prev = Math.max(v, FLOOR);
      } else {
        param.linearRampToValueAtTime(v, w);
        prev = v;
      }
    }
  }

  // Percussive amplitude envelope: attack then exponential decay to silence.
  const perc = (vel, att, dec) => [[0, 0], [att, vel], [att + dec, FLOOR, 'exp']];

  // ---------------------------------------------------------------- generated buffers
  function noiseBuffer(ctx, secs, channels, seed) {
    const n = Math.floor(secs * ctx.sampleRate);
    const buf = ctx.createBuffer(channels, n, ctx.sampleRate);
    for (let ch = 0; ch < channels; ch++) {
      const r = lib.rng(lib.hash('film-noise', seed, ch));
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
    }
    return buf;
  }

  // Impulse response: seeded stereo noise, exponential decay to -60 dB at `secs`, a two-pole
  // lowpass that darkens over the tail, a pre-delay and a few early reflections.
  function impulse(ctx, secs, seed, o) {
    const sr = ctx.sampleRate;
    const n = Math.floor(secs * sr);
    const buf = ctx.createBuffer(2, n, sr);
    const pre = Math.floor(o.pre * sr);
    const tail = secs - o.pre;
    for (let ch = 0; ch < 2; ch++) {
      const r = lib.rng(lib.hash('film-ir', seed, ch));
      const d = buf.getChannelData(ch);
      let l1 = 0;
      let l2 = 0;
      for (let i = pre; i < n; i++) {
        const t = (i - pre) / sr;
        const u = t / tail;
        const env = Math.exp(-6.9 * u) * (t < 0.005 ? t / 0.005 : 1);
        const a = o.bright + (o.dark - o.bright) * Math.sqrt(u);
        l1 += a * (r() * 2 - 1 - l1);
        l2 += a * (l1 - l2);
        d[i] = l2 * env;
      }
      for (let k = 0; k < o.early; k++) {
        const i = pre + Math.floor((0.003 + r() * o.spread) * sr);
        if (i < n) d[i] += (r() * 2 - 1) * 0.35 * (1 - k / o.early);
      }
    }
    return buf;
  }

  // Grains rendered straight into a stereo buffer: band-passed noise flaps and clicks, or short sines.
  // g: { t, dur, amp, pan (-1..1), f, q, att, dec, sine }
  function grainBuffer(ctx, key, secs, grains) {
    const sr = ctx.sampleRate;
    const n = Math.max(1, Math.ceil(secs * sr));
    const buf = ctx.createBuffer(2, n, sr);
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    const r = lib.rng(lib.hash('film-grain', key));
    for (const g of grains) {
      const i0 = Math.floor(g.t * sr);
      const m = Math.floor(g.dur * sr);
      const gl = Math.cos(((g.pan + 1) * Math.PI) / 4);
      const gr = Math.sin(((g.pan + 1) * Math.PI) / 4);
      const att = g.att || 0.002;
      const dec = g.dec || g.dur * 0.3;
      const w = (TAU * g.f) / sr;
      const al = Math.sin(w) / (2 * (g.q || 1));
      const cw = Math.cos(w);
      const a0 = 1 + al;
      let x1 = 0;
      let x2 = 0;
      let y1 = 0;
      let y2 = 0;
      const ph = r() * TAU;
      for (let k = 0; k < m; k++) {
        const j = i0 + k;
        if (j >= n) break;
        const tt = k / sr;
        let s;
        if (g.sine) s = Math.sin(ph + w * k);
        else {
          const x = r() * 2 - 1;
          s = (al * x - al * x2 + 2 * cw * y1 - (1 - al) * y2) / a0;
          x2 = x1;
          x1 = x;
          y2 = y1;
          y1 = s;
        }
        const env = tt < att ? tt / att : Math.exp(-(tt - att) / dec);
        const tailFade = k > m - 64 ? (m - k) / 64 : 1;
        const v = s * env * tailFade * g.amp;
        if (j >= 0) {
          L[j] += v * gl;
          R[j] += v * gr;
        }
      }
    }
    return buf;
  }

  // Stick-slip creak: irregular pulses, each ringing three damped wooden resonances.
  function creakBuffer(ctx, key, secs, rate0, rate1, formants) {
    const sr = ctx.sampleRate;
    const n = Math.ceil(secs * sr);
    const buf = ctx.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    const r = lib.rng(lib.hash('film-creak', key));
    let t = 0.004;
    while (t < secs - 0.01) {
      const u = t / secs;
      const swell = Math.sin(Math.PI * Math.min(1, u * 1.15)) * (0.55 + 0.45 * r());
      const i0 = Math.floor(t * sr);
      for (const [f, tau, a] of formants) {
        const m = Math.min(n - i0, Math.floor(tau * 5 * sr));
        const fj = f * (0.94 + 0.12 * r());
        for (let k = 0; k < m; k++) d[i0 + k] += swell * a * Math.exp(-k / sr / tau) * Math.sin((TAU * fj * k) / sr);
      }
      const rate = rate0 + (rate1 - rate0) * u;
      t += (1 / rate) * (0.7 + 0.6 * r());
    }
    for (let k = 0; k < 96 && k < n; k++) d[n - 1 - k] *= k / 96;
    return buf;
  }

  // Soft limiter transfer curve. The shaper is fed at half level, so the curve covers inputs up to
  // +6 dBFS: linear to the knee, then a tanh shoulder that never passes the ceiling.
  function limiterCurve(ceiling, knee) {
    const n = 16385;
    const c = new Float32Array(n);
    const room = ceiling - knee;
    for (let i = 0; i < n; i++) {
      const x = ((i / (n - 1)) * 2 - 1) * 2;
      const a = Math.abs(x);
      const y = a <= knee ? a : knee + room * Math.tanh((a - knee) / room);
      c[i] = x < 0 ? -y : y;
    }
    return c;
  }

  function periodic(ctx, n, amp) {
    const real = new Float32Array(n + 1);
    const imag = new Float32Array(n + 1);
    for (let k = 1; k <= n; k++) imag[k] = amp(k);
    return ctx.createPeriodicWave(real, imag);
  }

  // ---------------------------------------------------------------- engine
  function makeEngine(ctx, start, dest, DUR, MIX) {
    const base = ctx.currentTime;
    const E = { ctx, sr: ctx.sampleRate, start, base, DUR, duckTargets: [] };

    // A voice is a note or effect that starts at global time t0 and lasts len seconds (release included).
    // A sustained voice whose compensated start falls before the window resumes mid-envelope on time.
    // A short voice that starts inside the first 6 ms plays whole, up to 6 ms late; one that began
    // earlier is skipped.
    E.w0 = -Infinity;
    E.w1 = Infinity;
    E.voice = function (t0, len, sustain) {
      if (t0 < E.w0 || t0 >= E.w1) return null; // belongs to another scheduling window
      if (t0 >= DUR || t0 + len <= start) return null;
      const c = base + (t0 - start) - LAT;
      let c0 = c;
      let skip = 0;
      if (c < base) {
        if (sustain) skip = base - c;
        else if (t0 >= start) c0 = base;
        else return null;
      }
      return {
        c0,
        skip,
        len,
        env: (param, pts) => setEnv(param, pts, c0, skip),
        osc(node, stopDt) {
          node.start(c0 + skip);
          node.stop(c0 + Math.max(stopDt === undefined ? len : stopDt, skip + 0.002));
          return node;
        },
        buf(node, offset, stopDt) {
          const d = node.buffer.duration;
          let off = (offset || 0) + skip;
          if (node.loop) off %= d;
          else if (off >= d) return node;
          node.start(c0 + skip, off);
          node.stop(c0 + Math.max(stopDt === undefined ? len : stopDt, skip + 0.002));
          return node;
        },
      };
    };

    E.gain = (v) => {
      const g = ctx.createGain();
      g.gain.value = v === undefined ? 1 : v;
      return g;
    };
    E.osc = (type, f) => {
      const o = ctx.createOscillator();
      if (typeof type === 'string') o.type = type;
      else o.setPeriodicWave(type);
      o.frequency.value = f;
      return o;
    };
    E.filt = (type, f, q) => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q === undefined ? 0.707 : q;
      return b;
    };
    E.panner = (p) => {
      const s = ctx.createStereoPanner();
      s.pan.value = p;
      return s;
    };
    E.rng = (...k) => lib.rng(lib.hash('film-score', ...k));

    // ---- master: highpass, glue compressor, trim, soft limiter, output fades
    const master = E.gain(1);
    const hp = E.filt('highpass', 26, 0.6);
    const lowShelf = E.filt('lowshelf', 140, 0.7);
    lowShelf.gain.value = MIX.eq.low;
    const presence = E.filt('peaking', 3000, 0.7);
    presence.gain.value = MIX.eq.presence;
    const air = E.filt('highshelf', 8000, 0.7);
    air.gain.value = MIX.eq.air;
    const comp = ctx.createDynamicsCompressor();
    for (const k in MIX.comp) comp[k].value = MIX.comp[k];
    const trim = E.gain(MIX.trim * 0.5);
    const lim = ctx.createWaveShaper();
    lim.curve = limiterCurve(MIX.ceiling, MIX.knee);
    lim.oversample = 'none';
    const out = E.gain(1);
    master.connect(hp);
    hp.connect(lowShelf);
    lowShelf.connect(presence);
    presence.connect(air);
    air.connect(comp);
    comp.connect(trim);
    trim.connect(lim);
    lim.connect(out);
    out.connect(dest);
    E.master = master;
    // Output fades sit after the compressor, so they use uncompensated times. The compressor's
    // first 6 ms are silent; the output then opens over 3 ms, and the last 10 ms taper to zero, so the
    // loop seam and every seek start without a click.
    out.gain.setValueAtTime(0, base);
    out.gain.setValueAtTime(0, base + LAT);
    out.gain.linearRampToValueAtTime(1, base + LAT + 0.003);
    const cEnd = base + (DUR - start);
    if (DUR - start > 0.05) {
      out.gain.setValueAtTime(1, cEnd - 0.01);
      out.gain.linearRampToValueAtTime(0, cEnd);
    }
    // Section rides on the master input, compensated like every other pre-compressor event.
    setEnv(master.gain, MIX.ride.map(([t, d], i) => [t, Math.pow(10, d / 20), i ? 'lin' : undefined]), base - start - LAT, start + LAT);

    // ---- shared buffers
    E.white = noiseBuffer(ctx, 2.5, 1, 'white');
    E.wide = noiseBuffer(ctx, 5, 2, 'wide');
    E.warmSaw = periodic(ctx, 48, (k) => Math.pow(k, -1.35) * (k > 24 ? Math.exp(-(k - 24) / 10) : 1));
    E.softSquare = periodic(ctx, 31, (k) => (k % 2 ? Math.pow(k, -1.5) : 0.04 / k));
    E.brassSaw = periodic(ctx, 40, (k) => Math.pow(k, -1.05));

    // ---- effects returns
    E.fx = {};
    const verb = (name, secs, o, ret) => {
      const c = ctx.createConvolver();
      c.buffer = impulse(ctx, secs, name, o);
      const g = E.gain(ret);
      c.connect(g);
      g.connect(master);
      E.fx[name] = c;
    };
    verb('room', 0.9, { pre: 0.006, bright: 0.55, dark: 0.18, early: 10, spread: 0.035 }, 0.9);
    verb('hall', 2.8, { pre: 0.018, bright: 0.45, dark: 0.09, early: 14, spread: 0.07 }, 0.9);
    verb('cave', 6.0, { pre: 0.03, bright: 0.35, dark: 0.05, early: 18, spread: 0.12 }, 0.85);

    // Ping-pong delay, a dotted 8th (0.375 s) each side.
    const dIn = E.gain(1);
    dIn.channelCount = 1;
    dIn.channelCountMode = 'explicit';
    const dL = ctx.createDelay(1);
    const dR = ctx.createDelay(1);
    dL.delayTime.value = 0.375;
    dR.delayTime.value = 0.375;
    const fL = E.filt('lowpass', 4200, 0.5);
    const fR = E.filt('lowpass', 3400, 0.5);
    const gL = E.gain(0.4);
    const gR = E.gain(0.4);
    dIn.connect(dL);
    dL.connect(fL);
    fL.connect(gL);
    gL.connect(dR);
    dR.connect(fR);
    fR.connect(gR);
    gR.connect(dL);
    const mrg = ctx.createChannelMerger(2);
    fL.connect(mrg, 0, 0);
    fR.connect(mrg, 0, 1);
    const dRet = E.gain(0.75);
    mrg.connect(dRet);
    dRet.connect(master);
    const dVerb = E.gain(0.25);
    dRet.connect(dVerb);
    dVerb.connect(E.fx.hall);
    E.fx.delay = dIn;

    // ---- buses
    E.bus = {};
    // Per-voice sends pass through a tap scaled by the bus gain, so a bus fader moves its reverb too.
    E.tap = {};
    const taps = (name) => {
      E.tap[name] = {};
      for (const k of ['room', 'hall', 'cave', 'delay']) {
        const g = E.gain(MIX.bus[name]);
        g.connect(E.fx[k]);
        E.tap[name][k] = g;
      }
    };
    const bus = (name, sends, duck, hpf) => {
      taps(name);
      const b = E.gain(MIX.bus[name]);
      let tail = b;
      if (hpf) {
        const h = E.filt('highpass', hpf, 0.6);
        tail.connect(h);
        tail = h;
      }
      if (duck) {
        const d = E.gain(1);
        b.connect(d);
        tail = d;
        E.duckTargets.push(d.gain);
      }
      tail.connect(master);
      for (const k in sends) {
        const s = E.gain(sends[k]);
        tail.connect(s);
        s.connect(E.fx[k]);
      }
      E.bus[name] = b;
    };
    // Drum bus: a gentle saturator adds harmonics so the kick reads on phone speakers.
    {
      const b = E.gain(MIX.bus.drums);
      const drive = E.gain(1.6);
      const sat = ctx.createWaveShaper();
      const curve = new Float32Array(2049);
      for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 1.4) / Math.tanh(1.4);
      }
      sat.curve = curve;
      const back = E.gain(0.72);
      b.connect(drive);
      drive.connect(sat);
      sat.connect(back);
      back.connect(master);
      const rs = E.gain(0.1);
      back.connect(rs);
      rs.connect(E.fx.room);
      E.bus.drums = b;
      taps('drums');
    }
    bus('perc', { room: 0.1 });
    bus('bass', {}, true);
    bus('pad', { hall: 0.22 }, true, 180);
    bus('keys', { room: 0.12, hall: 0.14, delay: 0.06 });
    bus('bells', { hall: 0.3, cave: 0.06, delay: 0.14 });
    bus('lead', { hall: 0.22, delay: 0.18 });
    bus('sfx', { room: 0.14 });
    bus('amb', { hall: 0.12 });

    // Route a voice's last node to a bus, with an optional pan and extra sends.
    E.out = (node, busName, o) => {
      o = o || {};
      let n = node;
      if (o.pan) {
        const p = E.panner(o.pan);
        n.connect(p);
        n = p;
      }
      n.connect(E.bus[busName]);
      for (const k of ['room', 'hall', 'cave', 'delay']) {
        if (o[k]) {
          const s = E.gain(o[k]);
          n.connect(s);
          s.connect(E.tap[busName][k]);
        }
      }
      return n;
    };

    // Looping noise source with a per-event deterministic read offset.
    E.noise = (V, key, stereo) => {
      const s = ctx.createBufferSource();
      s.buffer = stereo ? E.wide : E.white;
      s.loop = true;
      const off = ((lib.hash('film-nz', key) % 100003) / 100003) * s.buffer.duration;
      return V.buf(s, off);
    };

    // Sidechain-style pump: a decaying negative curve added to the pad and bass bus gains on a kick.
    const duckLen = 0.32;
    E.duckBuf = ctx.createBuffer(1, Math.floor(duckLen * E.sr), E.sr);
    {
      const d = E.duckBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / E.sr;
        d[i] = -(t < 0.006 ? t / 0.006 : Math.exp(-(t - 0.006) / 0.085)) * (i > d.length - 48 ? (d.length - i) / 48 : 1);
      }
    }
    E.duck = (t, depth) => {
      const V = E.voice(t, duckLen, false);
      if (!V) return;
      const s = ctx.createBufferSource();
      s.buffer = E.duckBuf;
      for (const p of E.duckTargets) {
        const g = E.gain(depth);
        s.connect(g);
        g.connect(p);
      }
      V.buf(s, 0);
    };
    return E;
  }

  // ---------------------------------------------------------------- instruments
  function instruments(E) {
    const ctx = E.ctx;
    const I = {};

    // Felt, full, heartbeat or thud kick: a pitch-dropping sine with a short filtered click.
    I.kick = (t, vel, kind) => {
      const P = {
        felt: { f0: 125, f1: 50, fd: 0.055, dec: 0.36, click: 0.18, cf: 1600 },
        full: { f0: 165, f1: 47, fd: 0.065, dec: 0.5, click: 0.3, cf: 4200 },
        heart: { f0: 96, f1: 46, fd: 0.05, dec: 0.3, click: 0.16, cf: 1500 },
        thud: { f0: 95, f1: 52, fd: 0.04, dec: 0.2, click: 0.12, cf: 1200 },
      }[kind || 'felt'];
      const V = E.voice(t, P.dec + 0.03, false);
      if (!V) return;
      const o = E.osc('sine', P.f0);
      V.env(o.frequency, [[0, P.f0], [P.fd, P.f1, 'exp'], [P.dec, P.f1 * 0.92, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.002, vel], [0.06, vel * 0.75, 'exp'], [P.dec, FLOOR, 'exp']]);
      o.connect(g);
      E.out(g, 'drums');
      V.osc(o);
      const n = E.noise(V, ['kick', t]);
      const f = E.filt('lowpass', P.cf, 0.7);
      const cg = E.gain(0);
      V.env(cg.gain, perc(vel * P.click, 0.0008, 0.012));
      n.connect(f);
      f.connect(cg);
      E.out(cg, 'drums');
    };

    I.brush = (t, vel, pan) => {
      const V = E.voice(t, 0.26, false);
      if (!V) return;
      const n = E.noise(V, ['brush', t]);
      const f = E.filt('bandpass', 3000, 0.55);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.004, vel], [0.05, vel * 0.45, 'exp'], [0.24, FLOOR, 'exp']]);
      n.connect(f);
      f.connect(g);
      E.out(g, 'perc', { pan: pan || 0.12 });
      const o = E.osc('sine', 185);
      const og = E.gain(0);
      V.env(og.gain, perc(vel * 0.35, 0.002, 0.06));
      o.connect(og);
      E.out(og, 'drums');
      V.osc(o, 0.1);
    };

    I.hat = (t, vel, open) => {
      const len = open ? 0.22 : 0.055;
      const V = E.voice(t, len + 0.01, false);
      if (!V) return;
      const n = E.noise(V, ['hat', t]);
      const f = E.filt('highpass', 7200, 0.8);
      const f2 = E.filt('peaking', 10500, 1.2);
      f2.gain.value = 5;
      const g = E.gain(0);
      V.env(g.gain, perc(vel, 0.001, len));
      n.connect(f);
      f.connect(f2);
      f2.connect(g);
      E.out(g, 'perc', { pan: -0.25 });
    };

    I.shaker = (t, vel, pan) => {
      const V = E.voice(t, 0.09, false);
      if (!V) return;
      const n = E.noise(V, ['shaker', t]);
      const f = E.filt('bandpass', 6500, 1.1);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.01, vel], [0.075, FLOOR, 'exp']]);
      n.connect(f);
      f.connect(g);
      E.out(g, 'perc', { pan: pan || 0.3 });
    };

    I.crash = (t, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.55;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const n = E.noise(V, ['crash', t], true);
      const f = E.filt('highpass', 4800, 0.6);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [0.12, vel * 0.45, 'exp'], [dec, FLOOR, 'exp']]);
      n.connect(f);
      f.connect(g);
      E.out(g, 'perc', o);
    };

    // Woodblock tock or small wooden click.
    I.tock = (t, vel, f, o) => {
      o = o || {};
      const V = E.voice(t, 0.1, false);
      if (!V) return;
      const s = E.osc('sine', f * 1.5);
      V.env(s.frequency, [[0, f * 1.5], [0.006, f, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, perc(vel, 0.001, o.dec || 0.06));
      s.connect(g);
      E.out(g, o.bus || 'perc', o);
      V.osc(s);
      const tri = E.osc('triangle', f * 2.71);
      const tg = E.gain(0);
      V.env(tg.gain, perc(vel * 0.25, 0.001, 0.025));
      tri.connect(tg);
      E.out(tg, o.bus || 'perc', o);
      V.osc(tri, 0.05);
      const n = E.noise(V, ['tock', t, f]);
      const nf = E.filt('bandpass', Math.min(9000, f * 2.4), 2.5);
      const ng = E.gain(0);
      V.env(ng.gain, perc(vel * 0.5, 0.0005, 0.01));
      n.connect(nf);
      nf.connect(ng);
      E.out(ng, o.bus || 'perc', o);
    };

    // FM marimba: soft-mallet FM attack on the fundamental, the tuned 4th partial, a mallet thump.
    I.marimba = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || Math.min(2.2, Math.max(0.35, 1.5 * Math.sqrt(220 / f)));
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const c = E.osc('sine', f);
      const m = E.osc('sine', f);
      const mg = E.gain(0);
      V.env(mg.gain, [[0, f * 1.4], [0.04, f * 0.04, 'exp'], [dec, FLOOR, 'exp']]);
      m.connect(mg);
      mg.connect(c.frequency);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [dec, FLOOR, 'exp']]);
      c.connect(g);
      E.out(g, o.bus || 'keys', o);
      V.osc(c);
      V.osc(m);
      if (f * 4 < 16000) {
        const p = E.osc('sine', f * 4);
        const pg = E.gain(0);
        V.env(pg.gain, perc(vel * 0.22, 0.002, 0.12));
        p.connect(pg);
        E.out(pg, o.bus || 'keys', o);
        V.osc(p, 0.2);
      }
      const n = E.noise(V, ['mar', t, f]);
      const nf = E.filt('lowpass', 1400, 0.7);
      const ng = E.gain(0);
      V.env(ng.gain, perc(vel * 0.12, 0.001, 0.012));
      n.connect(nf);
      nf.connect(ng);
      E.out(ng, o.bus || 'keys', o);
    };

    // Kalimba: sine tine with a small pitch settle, an inharmonic overtone and a thumb click.
    I.kalimba = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.5;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const s = E.osc('sine', f);
      V.env(s.frequency, [[0, f * 1.007], [0.03, f, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.002, vel], [0.09, vel * 0.55, 'exp'], [dec, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, o.bus || 'keys', o);
      V.osc(s);
      if (f * 5.93 < 17000) {
        const p = E.osc('sine', f * 5.93);
        const pg = E.gain(0);
        V.env(pg.gain, perc(vel * 0.28, 0.001, 0.07));
        p.connect(pg);
        E.out(pg, o.bus || 'keys', o);
        V.osc(p, 0.12);
      }
      const h = E.osc('sine', f * 2);
      const hg = E.gain(0);
      V.env(hg.gain, perc(vel * 0.1, 0.002, 0.35));
      h.connect(hg);
      E.out(hg, o.bus || 'keys', o);
      V.osc(h, 0.5);
      const n = E.noise(V, ['kal', t, f]);
      const nf = E.filt('bandpass', 3300, 1.8);
      const ng = E.gain(0);
      V.env(ng.gain, perc(vel * 0.3, 0.0005, 0.008));
      n.connect(nf);
      nf.connect(ng);
      E.out(ng, o.bus || 'keys', o);
    };

    // Glockenspiel: free-bar partial ratios, higher partials die first.
    I.glock = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.8;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const parts = [
        [1, 1, 1],
        [2.756, 0.3, 0.35],
        [5.404, 0.11, 0.14],
        [8.933, 0.05, 0.06],
      ];
      for (const [ratio, a, d] of parts) {
        if (f * ratio > 18000) continue;
        const s = E.osc('sine', f * ratio);
        const g = E.gain(0);
        V.env(g.gain, perc(vel * a, 0.001, dec * d));
        s.connect(g);
        E.out(g, o.bus || 'bells', o);
        V.osc(s, dec * d + 0.02);
      }
    };

    // Glassy sine ping.
    I.glass = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.6;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const parts = [
        [1, 1, 1],
        [2, 0.12, 0.35],
        [3.01, 0.05, 0.18],
      ];
      for (const [ratio, a, d] of parts) {
        const s = E.osc('sine', f * ratio);
        const g = E.gain(0);
        V.env(g.gain, perc(vel * a, o.att || 0.003, dec * d));
        s.connect(g);
        E.out(g, o.bus || 'bells', o);
        V.osc(s, dec * d + 0.02);
      }
    };

    // FM bell: modulator at an inharmonic or harmonic ratio, index decaying with the note.
    I.fmBell = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.6;
      const ratio = o.ratio || 1.4;
      const idx = o.index || 3;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const c = E.osc('sine', f);
      const m = E.osc('sine', f * ratio);
      const mg = E.gain(0);
      V.env(mg.gain, [[0, f * idx], [dec * 0.5, f * idx * 0.08, 'exp']]);
      m.connect(mg);
      mg.connect(c.frequency);
      const g = E.gain(0);
      V.env(g.gain, perc(vel, o.att || 0.002, dec));
      c.connect(g);
      E.out(g, o.bus || 'bells', o);
      V.osc(c);
      V.osc(m);
    };

    // Soft FM gong.
    I.gong = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 2.2;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const c = E.osc('sine', f);
      const m = E.osc('sine', f * 1.41);
      const mg = E.gain(0);
      V.env(mg.gain, [[0, f * 0.3], [0.09, f * 2.2], [dec, f * 0.15, 'exp']]);
      m.connect(mg);
      mg.connect(c.frequency);
      const lp = E.filt('lowpass', 1900, 0.5);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.012, vel], [dec, FLOOR, 'exp']]);
      c.connect(lp);
      lp.connect(g);
      E.out(g, o.bus || 'bells', o);
      V.osc(c);
      V.osc(m);
    };

    // Metallic FM ting for the gold dots.
    I.ting = (t, f, vel, o) => I.fmBell(t, f, vel, Object.assign({ ratio: 3.51, index: 1.6, dec: 0.45 }, o || {}));

    // Warm detuned pad: two warm-saw voices per note, spread left and right, one shared lowpass.
    // o: att, rel, cut0, cut1 (cutoff at the start and at t1), q, sine (hushed sine pad), bus, sends
    I.pad = (t0, t1, notes, vel, o) => {
      o = o || {};
      const att = Math.min(o.att === undefined ? 0.25 : o.att, t1 - t0);
      const rel = o.rel === undefined ? 0.35 : o.rel;
      const hold = t1 - t0;
      const len = hold + rel;
      const V = E.voice(t0, len, true);
      if (!V) return;
      const lp = E.filt('lowpass', o.cut0 || 1200, o.q || 0.6);
      V.env(lp.frequency, [[0, o.cut0 || 1200], [hold, o.cut1 || o.cut0 || 1200, 'exp'], [len, (o.cut1 || o.cut0 || 1200) * 0.7, 'exp']]);
      const g = E.gain(0);
      const pts = [[0, 0], [att, vel, o.attShape || 'lin']];
      if (hold > att) pts.push([hold, vel * (o.sus === undefined ? 1 : o.sus), 'lin']);
      pts.push([len, 0, 'lin']);
      V.env(g.gain, pts);
      lp.connect(g);
      E.out(g, o.bus || 'pad', o);
      const per = 1 / Math.sqrt(notes.length * 2);
      notes.forEach((nm, i) => {
        const f = hz(nm);
        const sides = o.sine ? [0] : [-1, 1];
        for (const side of sides) {
          const s = E.osc(o.sine ? 'sine' : E.warmSaw, f);
          s.detune.value = side * (o.detune || 8) + (i % 2 ? 1.5 : -1.5);
          const sg = E.gain(per * (o.sine ? 1.4 : 1));
          const p = E.panner(side * (o.width === undefined ? 0.55 : o.width) * (i % 2 ? 0.8 : 1));
          s.connect(sg);
          sg.connect(p);
          p.connect(lp);
          V.osc(s);
        }
      });
    };

    // Sub bass: sine with a little 2nd and 3rd harmonic so it survives small speakers.
    I.sub = (t0, t1, note, vel, o) => {
      o = o || {};
      const att = Math.min(o.att === undefined ? 0.008 : o.att, t1 - t0);
      const rel = o.rel === undefined ? 0.06 : o.rel;
      const hold = t1 - t0;
      const len = hold + rel;
      const V = E.voice(t0, len, true);
      if (!V) return;
      const f = hz(note);
      const g = E.gain(0);
      const pts = [[0, 0], [att, vel, o.attShape || 'lin']];
      if (hold > att) pts.push([hold, vel * (o.sus === undefined ? 0.85 : o.sus), 'lin']);
      pts.push([len, 0, 'lin']);
      V.env(g.gain, pts);
      const lp = E.filt('lowpass', 420, 0.5);
      for (const [k, a] of [
        [1, 1],
        [2, 0.3],
        [3, 0.1],
      ]) {
        const s = E.osc('sine', f * k);
        const sg = E.gain(a);
        s.connect(sg);
        sg.connect(lp);
        V.osc(s);
      }
      lp.connect(g);
      E.out(g, 'bass');
    };

    // Sub drop: a sine sweeping down under a hit.
    I.subDrop = (t, f0, f1, len, vel) => {
      const V = E.voice(t, len + 0.02, false);
      if (!V) return;
      const s = E.osc('sine', f0);
      V.env(s.frequency, [[0, f0], [len, f1, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.004, vel], [len * 0.5, vel * 0.7, 'lin'], [len, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, 'bass');
      V.osc(s);
    };

    // Warm pluck: warm saw plus soft square an octave up, a fast lowpass sweep.
    I.pluck = (t, note, vel, o) => {
      o = o || {};
      const f = hz(note);
      const dec = o.dec || 0.8;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const lp = E.filt('lowpass', 2000, o.q || 1.2);
      const top = Math.min(11000, f * (o.bright || 9));
      V.env(lp.frequency, [[0, top], [0.16, Math.max(180, f * 1.8), 'exp'], [dec, Math.max(150, f * 1.2), 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [0.14, vel * 0.45, 'exp'], [dec, FLOOR, 'exp']]);
      const a = E.osc(E.warmSaw, f);
      a.detune.value = -5;
      const b = E.osc(E.softSquare, f * 2);
      b.detune.value = 6;
      const bg = E.gain(0.35);
      a.connect(lp);
      b.connect(bg);
      bg.connect(lp);
      lp.connect(g);
      E.out(g, o.bus || 'keys', o);
      V.osc(a);
      V.osc(b);
    };

    // FM boop with an upward bend (the molts).
    I.boop = (t, note, vel, o) => {
      o = o || {};
      const f = hz(note);
      const V = E.voice(t, 0.32, false);
      if (!V) return;
      const c = E.osc('sine', f * 0.8);
      V.env(c.frequency, [[0, f * 0.8], [0.06, f, 'exp']]);
      const m = E.osc('sine', f * 1.6);
      V.env(m.frequency, [[0, f * 1.6], [0.06, f * 2, 'exp']]);
      const mg = E.gain(0);
      V.env(mg.gain, [[0, f * 2.2], [0.14, f * 0.2, 'exp']]);
      m.connect(mg);
      mg.connect(c.frequency);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.004, vel], [0.08, vel * 0.6, 'exp'], [0.3, FLOOR, 'exp']]);
      c.connect(g);
      E.out(g, 'keys', Object.assign({ room: 0.2 }, o));
      V.osc(c);
      V.osc(m);
    };

    // Detuned, band-passed saw stab.
    I.stab = (t, notes, vel, o) => {
      o = o || {};
      const len = o.len || 0.22;
      const V = E.voice(t, len + 0.02, false);
      if (!V) return;
      const bp = E.filt('bandpass', o.f || 1500, 1.4);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [len, FLOOR, 'exp']]);
      bp.connect(g);
      E.out(g, 'keys', o);
      for (const nm of notes) {
        for (const d of [-14, 14]) {
          const s = E.osc('sawtooth', hz(nm));
          s.detune.value = d;
          const sg = E.gain(0.5 / notes.length);
          s.connect(sg);
          sg.connect(bp);
          V.osc(s);
        }
      }
    };

    // Continuous FM lead with glides and delayed vibrato. phrase: [[t, note, glide]]
    I.lead = (phrase, tEnd, vel, o) => {
      o = o || {};
      const t0 = phrase[0][0];
      const rel = o.rel || 0.3;
      const len = tEnd - t0 + rel;
      const V = E.voice(t0, len, true);
      if (!V) return;
      const pitch = ctx.createConstantSource();
      const pp = [[0, hz(phrase[0][1])]];
      const vib = [[0, 0]];
      for (let i = 1; i < phrase.length; i++) {
        const dt = phrase[i][0] - t0;
        const gl = Math.max(0.005, phrase[i][2] || 0);
        pp.push([dt, hz(phrase[i - 1][1]), 'set']);
        pp.push([dt + gl, hz(phrase[i][1]), 'exp']);
      }
      for (let i = 0; i < phrase.length; i++) {
        const a = phrase[i][0] - t0;
        const b = (i + 1 < phrase.length ? phrase[i + 1][0] : tEnd + rel) - t0;
        const f = hz(phrase[i][1]);
        vib.push([a, 0, 'set']);
        if (b - a > 0.35) {
          vib.push([a + 0.18, 0, 'set']);
          vib.push([Math.min(b, a + 0.45), f * 0.008, 'lin']);
          vib.push([b, f * 0.008, 'lin']);
        }
      }
      V.env(pitch.offset, pp);
      const c = E.osc('sine', 0);
      const m = E.osc('sine', 0);
      const sub = E.osc('triangle', 0);
      pitch.connect(c.frequency);
      const mr = E.gain(1);
      pitch.connect(mr);
      mr.connect(m.frequency);
      const sr = E.gain(0.5);
      pitch.connect(sr);
      sr.connect(sub.frequency);
      const mg = E.gain(hz(phrase[0][1]) * 0.9);
      m.connect(mg);
      mg.connect(c.frequency);
      const lfo = E.osc('sine', 5.3);
      const vg = E.gain(0);
      V.env(vg.gain, vib);
      lfo.connect(vg);
      vg.connect(c.frequency);
      const lp = E.filt('lowpass', 3200, 0.8);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.012, vel], [tEnd - t0, vel * 0.9, 'lin'], [len, 0, 'lin']]);
      const sg = E.gain(0.35);
      c.connect(lp);
      sub.connect(sg);
      sg.connect(lp);
      lp.connect(g);
      E.out(g, 'lead', o);
      V.osc(pitch);
      V.osc(c);
      V.osc(m);
      V.osc(sub);
      V.osc(lfo);
    };

    // Synth horn: two brass saws with a filter swell per note and a scoop into pitch.
    I.horn = (phrase, tEnd, vel, o) => {
      o = o || {};
      const t0 = phrase[0][0];
      const rel = 0.25;
      const len = tEnd - t0 + rel;
      const V = E.voice(t0, len, true);
      if (!V) return;
      const pitch = ctx.createConstantSource();
      const pp = [];
      const cut = [];
      phrase.forEach(([t, nm], i) => {
        const dt = t - t0;
        const f = hz(nm);
        if (i === 0) pp.push([0, f * 0.97]);
        else pp.push([dt, f * 0.97, 'set']);
        pp.push([dt + 0.07, f, 'exp']);
        cut.push([dt, 300, i === 0 ? 'lin' : 'set']);
        cut.push([dt + 0.16, 2400, 'exp']);
        cut.push([dt + 0.45, 1500, 'exp']);
      });
      cut[0] = [0, 300];
      V.env(pitch.offset, pp);
      const lp = E.filt('lowpass', 300, 1.1);
      V.env(lp.frequency, cut);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.06, vel], [tEnd - t0, vel, 'lin'], [len, 0, 'lin']]);
      for (const d of [-7, 7]) {
        const s = E.osc(E.brassSaw, 0);
        s.detune.value = d;
        pitch.connect(s.frequency);
        const sg = E.gain(0.5);
        s.connect(sg);
        sg.connect(lp);
        V.osc(s);
      }
      lp.connect(g);
      E.out(g, 'lead', o);
      V.osc(pitch);
    };

    // Generic filtered noise: whooshes, sweeps, cracks, risers.
    // o: { type, f: env pts, q, amp: env pts, pan, panEnv, bus, sustain, stereo, sends }
    I.nz = (t, len, o) => {
      const V = E.voice(t, len, !!o.sustain);
      if (!V) return;
      const n = E.noise(V, ['nz', t, len, o.key || ''], !!o.stereo);
      const f = E.filt(o.type || 'bandpass', o.f[0][1], o.q || 0.8);
      V.env(f.frequency, o.f);
      const g = E.gain(0);
      V.env(g.gain, o.amp);
      n.connect(f);
      let last = f;
      if (o.type2) {
        const f2 = E.filt(o.type2, o.f2, o.q2 || 0.7);
        f.connect(f2);
        last = f2;
      }
      last.connect(g);
      let node = g;
      if (o.panEnv) {
        const p = E.panner(0);
        V.env(p.pan, o.panEnv);
        g.connect(p);
        node = p;
      }
      E.out(node, o.bus || 'sfx', o);
    };

    // A generated buffer played through an optional filter. make() builds the buffer only when the
    // voice is actually scheduled; secs must match its length.
    I.play = (t, secs, make, vel, o) => {
      o = o || {};
      const V = E.voice(t, secs + 0.01, o.sustain !== false);
      if (!V) return;
      const s = ctx.createBufferSource();
      s.buffer = make();
      let last = s;
      if (o.filt) {
        const f = E.filt(o.filt[0], o.filt[1], o.filt[2]);
        s.connect(f);
        last = f;
      }
      const g = E.gain(vel);
      last.connect(g);
      E.out(g, o.bus || 'sfx', o);
      V.buf(s, 0);
    };

    // Wing flutter: band-passed noise sweeping f0 to f1 with a flap on each listed offset.
    I.flutter = (t, len, flaps, o) => {
      const amp = [[0, 0]];
      const fl = o.floor || 0.08;
      flaps.forEach((dt, i) => {
        const pk = o.vel * (o.grow ? 0.6 + (0.4 * i) / Math.max(1, flaps.length - 1) : 1);
        amp.push([dt, amp.length > 1 ? o.vel * fl : 0, 'lin']);
        amp.push([dt + 0.008, pk, 'lin']);
        amp.push([dt + 0.06, o.vel * fl, 'exp']);
      });
      amp.push([len, FLOOR, 'exp']);
      I.nz(t, len, {
        type: 'bandpass',
        q: 1.1,
        f: [[0, o.f0], [len, o.f1, 'exp']],
        amp,
        panEnv: o.pan ? [[0, -o.pan], [len, o.pan, 'lin']] : null,
        bus: 'sfx',
        room: 0.25,
        key: 'flutter',
      });
    };

    I.chew = (t, vel, pan) =>
      I.nz(t, 0.02, { type: 'highpass', q: 0.7, f: [[0, 4200]], amp: perc(vel, 0.0008, 0.012), pan, key: 'chew' });

    I.plip = (t, f0, f1, vel, o) => {
      o = o || {};
      const V = E.voice(t, 0.14, false);
      if (!V) return;
      for (const [k, a] of [
        [1, 1],
        [2, 0.25],
      ]) {
        const s = E.osc('sine', f0 * k);
        V.env(s.frequency, [[0, f0 * k], [0.05, f1 * k, 'exp']]);
        const g = E.gain(0);
        V.env(g.gain, [[0, 0], [0.002, vel * a], [0.02, vel * a * 0.6, 'exp'], [0.12, FLOOR, 'exp']]);
        s.connect(g);
        E.out(g, 'sfx', Object.assign({ room: 0.2 }, o));
        V.osc(s);
      }
    };

    I.glide = (t, f0, f1, len, vel, o) => {
      o = o || {};
      const V = E.voice(t, len + 0.3, false);
      if (!V) return;
      const s = E.osc('sine', f0);
      V.env(s.frequency, [[0, f0], [len, f1, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [len, vel * 0.5, 'exp'], [len + 0.28, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, o.bus || 'sfx', o);
      V.osc(s);
    };

    // Low whump for the wing pumps: a rising sine body plus a soft rising noise sweep.
    I.whump = (t, vel) => {
      const V = E.voice(t, 0.42, false);
      if (!V) return;
      const s = E.osc('sine', 55);
      V.env(s.frequency, [[0, 55], [0.14, 88, 'exp'], [0.4, 80, 'lin']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.006, vel], [0.12, vel * 0.7, 'exp'], [0.4, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, 'bass');
      V.osc(s);
      const h = E.osc('triangle', 110);
      V.env(h.frequency, [[0, 110], [0.14, 176, 'exp']]);
      const hg = E.gain(0);
      V.env(hg.gain, perc(vel * 0.25, 0.005, 0.18));
      h.connect(hg);
      E.out(hg, 'sfx');
      V.osc(h, 0.25);
      I.nz(t, 0.3, {
        type: 'bandpass',
        q: 1.5,
        f: [[0, 220], [0.26, 1500, 'exp']],
        amp: [[0, 0], [0.02, vel * 0.08], [0.2, vel * 0.18, 'lin'], [0.3, FLOOR, 'exp']],
        key: 'whump',
      });
    };

    I.whistle = (t, len, f0, f1, vel) => {
      const V = E.voice(t, len + 0.05, false);
      if (!V) return;
      const s = E.osc('sine', f0);
      V.env(s.frequency, [[0, f0], [len, f1, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.015, vel], [len, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, 'sfx', { hall: 0.15 });
      V.osc(s);
    };

    I.bleep = (t, f, vel) => {
      const V = E.voice(t, 0.07, false);
      if (!V) return;
      const s = E.osc('sine', f);
      const lp = E.filt('lowpass', 6500, 0.7);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.002, vel], [0.062, FLOOR, 'exp']]);
      s.connect(lp);
      lp.connect(g);
      E.out(g, 'sfx', { room: 0.15 });
      V.osc(s);
    };

    // Striated buzz: a rising saw, chopped at 30 Hz, through a feedback comb.
    I.buzz = (t, len, vel) => {
      const V = E.voice(t, len + 0.05, false);
      if (!V) return;
      const s = E.osc('sawtooth', 98);
      V.env(s.frequency, [[0, 98], [len, 196, 'exp']]);
      const chop = E.gain(0.5);
      const lfo = E.osc('square', 30);
      const lg = E.gain(0.45);
      lfo.connect(lg);
      lg.connect(chop.gain);
      const d = ctx.createDelay(0.05);
      d.delayTime.value = 0.0034;
      const fb = E.gain(0.55);
      const bp = E.filt('bandpass', 1300, 0.8);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.04, vel * 0.5], [len * 0.85, vel, 'lin'], [len, FLOOR, 'exp']]);
      s.connect(chop);
      chop.connect(bp);
      chop.connect(d);
      d.connect(fb);
      fb.connect(d);
      d.connect(bp);
      bp.connect(g);
      E.out(g, 'sfx', { hall: 0.25 });
      V.osc(s);
      V.osc(lfo);
    };

    // Reverse swell: noise rising exponentially into a hard stop at t + len.
    I.revSwell = (t, len, vel, o) => {
      o = o || {};
      const hi = o.hi || false;
      I.nz(t, len, {
        type: hi ? 'highpass' : 'lowpass',
        q: 0.7,
        f: hi ? [[0, 9000], [len, 3500, 'exp']] : [[0, 400], [len, o.fTop || 3500, 'exp']],
        type2: hi ? 'peaking' : null,
        f2: 9500,
        amp: [[0, vel * 0.004], [len - 0.012, vel, 'exp'], [len, FLOOR, 'lin']],
        stereo: true,
        sustain: true,
        bus: o.bus || 'sfx',
        hall: o.hall || 0.2,
        key: 'rev',
      });
    };

    // Stereo wind bed: wide noise through a slowly wandering band-pass. amp: env pts.
    I.wind = (t0, t1, amp, o) => {
      o = o || {};
      const len = t1 - t0;
      const f = [[0, 700]];
      for (let k = 1; k * 0.25 < len; k++) f.push([k * 0.25, 650 + 380 * lib.noise1(k * 0.23 + t0, 'film-wind'), 'lin']);
      I.nz(t0, len, { type: 'bandpass', q: 0.45, f, type2: 'lowpass', f2: o.lp || 2600, amp, stereo: true, sustain: true, bus: 'amb', key: 'wind' });
    };

    return I;
  }

  // ---------------------------------------------------------------- grain textures
  function flapGrains(r, t0, len, rate, o) {
    const out = [];
    const n = Math.floor(len * rate);
    for (let i = 0; i < n; i++) {
      const t = t0 + r() * len;
      out.push({
        t,
        dur: 0.05 + r() * 0.05,
        amp: (o.amp || 0.3) * (0.4 + 0.6 * r()),
        pan: (r() * 2 - 1) * (o.width || 0.9),
        f: (o.f0 || 380) + r() * (o.f1 || 1200),
        q: 0.9,
        att: 0.008 + r() * 0.008,
        dec: 0.02 + r() * 0.02,
      });
    }
    return out;
  }
  function clickGrains(r, t0, len, count, o) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const u = o.shape ? Math.pow(r(), o.shape) : r();
      out.push({
        t: t0 + u * len,
        dur: 0.008,
        amp: (o.amp || 0.3) * (0.3 + 0.7 * r()),
        pan: (r() * 2 - 1) * (o.width || 0.9),
        f: (o.f0 || 3000) + r() * (o.f1 || 5000),
        q: o.q || 1.2,
        att: 0.0004,
        dec: o.dec || 0.0015,
      });
    }
    return out;
  }

  // ---------------------------------------------------------------- the score
  // Del cafeto a la taza: D major, 80 bpm (beat 0.75 s, 8th 0.375 s, 8th-triplet 0.25 s), 15 bars.
  // A laid-back bossa pulse under bells and kalimba; every cue in FILM.TIMELINE.cues is implemented
  // by hand at its own time below, act by act.
  const CH = {
    Dmaj9: ['D3', 'A3', 'C#4', 'E4', 'F#4'],
    Bm9: ['B2', 'F#3', 'A3', 'C#4', 'D4'],
    Gmaj9: ['G2', 'D3', 'F#3', 'A3', 'B3'],
    Gmaj7: ['G2', 'D3', 'F#3', 'B3'],
    Em9: ['E3', 'G3', 'B3', 'D4', 'F#4'],
    FSm7: ['F#2', 'C#3', 'E3', 'A3'],
    A7sus4: ['A2', 'D3', 'E3', 'G3'],
    A7: ['A2', 'E3', 'G3', 'C#4'],
    A13: ['A2', 'G3', 'C#4', 'F#4'],
  };
  // [bar start, chord, bass root, bass fifth]
  const BARS = [
    [0, 'Dmaj9', 'D2', 'A1'], [3, 'Bm9', 'B1', 'F#2'], [6, 'Gmaj9', 'G1', 'D2'], [9, 'Em9', 'E2', 'B1'],
    [12, 'Gmaj7', 'G1', 'D2'], [15, 'FSm7', 'F#1', 'C#2'], [18, 'Em9', 'E2', 'B1'], [21, 'A7sus4', 'A1', 'E2'],
    [24, 'Gmaj7', 'G1', 'D2'], [27, 'A13', 'A1', 'E2'], [30, 'Bm9', 'B1', 'F#2'],
    [33, 'Dmaj9', 'D2', 'A1'], [36, 'Bm9', 'B1', 'F#2'], [39, 'Gmaj9', 'G1', 'D2'], [42, 'A7sus4', 'A1', 'E2'],
  ];

  function score(E, I) {
    const ctx = E.ctx;
    const { kick, brush, hat, shaker, crash, tock, marimba, kalimba, glock, glass, fmBell, gong, ting, pad, sub, subDrop, pluck, stab, lead, nz, play, chew, plip, glide, whump, buzz, revSwell, wind } = I;
    const G = (key, secs, grains) => grainBuffer(ctx, key, secs, grains);
    const R = (key) => lib.rng(lib.hash('cafe-tex', key));
    const B = 0.75, H8 = 0.375, TR = 0.25;
    const at = (t) => Math.round(t * 1000) / 1000;
    const clicks = (t, secs, n, o, vel, key) =>
      play(t, secs, () => G(key + t, secs, clickGrains(R(key + t), 0, secs * 0.9, n, o)), vel, { sustain: false, room: 0.2 });

    // ---------------------------------------------------------- harmony and groove, bar by bar
    BARS.forEach(([t0, ch, root, fifth], k) => {
      const t1 = t0 + 3;
      const act = t0 < 12 ? 1 : t0 < 24 ? 2 : t0 < 33 ? 3 : 4;
      const last = k === BARS.length - 1;
      // pad: the act-1 pads breathe in, later pads sit under the groove
      const padVel = act === 1 ? 0.3 : act === 3 ? 0.3 : 0.26;
      if (ch === 'A7sus4' && t0 === 21) {
        pad(t0, 22.5, CH.A7sus4, padVel, { att: 0.2, rel: 0.1, cut0: 900, cut1: 1400, hall: 0.18 });
        pad(22.5, t1, CH.A7, padVel, { att: 0.05, rel: 0.1, cut0: 1200, cut1: 2200, hall: 0.18 });
      } else if (t0 === 42) {
        pad(t0, 43.5, CH.A7sus4, padVel, { att: 0.15, rel: 0.1, cut0: 900, cut1: 1300, hall: 0.2 });
        pad(43.5, t1, CH.Dmaj9, 0.3, { att: 0.3, rel: 0.05, cut0: 900, cut1: 1300, hall: 0.22 });
      } else if (t0 === 9) {
        pad(t0, 9.75, CH.Em9, padVel, { att: 0.1, rel: 0.1, cut0: 900, cut1: 1200, hall: 0.18 });
        pad(9.75, 10.5, CH.Bm9, padVel, { att: 0.05, rel: 0.1, cut0: 900, cut1: 1200, hall: 0.18 });
        pad(10.5, t1, CH.A7, padVel, { att: 0.05, rel: 0.1, cut0: 1000, cut1: 1600, hall: 0.18 });
      } else {
        pad(t0, t1, CH[ch], padVel, { att: t0 === 0 ? 0.6 : 0.08, rel: 0.1, cut0: t0 === 0 ? 500 : 900, cut1: 1400, hall: 0.18 });
      }
      // bass: root on 1, fifth on 3 with a bossa anticipation on the "and" of 2 in acts 2-4
      if (act === 1) {
        sub(t0, t0 + 1.5, root, t0 === 0 ? 0.3 : 0.38, { att: t0 === 0 ? 0.4 : 0.02, rel: 0.08 });
        sub(t0 + 1.5, t1, fifth, 0.34, { att: 0.02, rel: 0.08 });
      } else {
        sub(t0, t0 + 1.125, root, 0.42, { att: 0.01, rel: 0.06 });
        sub(t0 + 1.125, t0 + 1.5, root, 0.3, { att: 0.01, rel: 0.04 });
        sub(t0 + 1.5, t0 + 2.625, fifth, 0.4, { att: 0.01, rel: 0.06 });
        sub(t0 + 2.625, t1, root, 0.3, { att: 0.01, rel: 0.04 });
      }
      // drums
      for (let b = 0; b < 4; b++) {
        const t = at(t0 + b * B);
        const down = b === 0;
        if (act === 1) {
          if (b === 0 || b === 2) kick(t, down ? 0.62 : 0.4, 'felt');
          brush(t + H8, 0.12, b % 2 ? 0.3 : -0.3);
        } else {
          kick(t, down ? 0.72 : b === 2 ? 0.5 : 0.32, down ? 'full' : 'felt');
          if (b === 1) kick(at(t + H8), 0.3, 'felt');
          E.duck(t, down ? 0.3 : 0.15);
          for (let e = 0; e < 2; e++) shaker(at(t + e * H8), (e ? 0.1 : 0.14) * (act === 2 ? 0.8 : 1), e ? 0.35 : -0.35);
          if (act >= 3) hat(at(t + H8), 0.09, b === 3);
          if (b === 1 || b === 3) brush(t, 0.22, 0.1);
        }
      }
      // bossa rim clave (acts 2 to 4): 8ths 0, 3, 6 of the bar, then 2, 4 of the half
      if (act >= 2 && !last) [0, 3, 6].forEach((e) => tock(at(t0 + e * H8), 0.16, 1700, { pan: 0.25 }));
      // keys comp (acts 2 to 4): soft plucked chords on the bossa offbeats
      if (act >= 2) {
        const chord = CH[ch === 'A7sus4' && t0 === 21 ? 'A7sus4' : ch];
        [1, 3, 6].forEach((e) => chord.slice(1).forEach((n, i) => pluck(at(t0 + e * H8) + i * 0.008, n.replace(/\d/, (d) => String(+d + 1)), 0.09, { dec: 0.5, room: 0.15, pan: i % 2 ? 0.2 : -0.2 })));
      }
    });

    // =========================================================== ACT 1, planta (0 to 12)
    // 0.0 open: felt kick, Dmaj9 swell, wooden tock
    tock(0, 0.4, 900, { pan: -0.2 });
    glass(0, hz('A5'), 0.1, { dec: 1.5, hall: 0.3 });
    // 0.75 hook: marimba stab D4+A4 and a sub thump
    marimba(0.75, hz('D4'), 0.45, { room: 0.2 });
    marimba(0.75, hz('A4'), 0.38, { room: 0.2 });
    marimba(0.75, hz('D3'), 0.3, { room: 0.2 });
    kick(0.75, 0.7, 'full');
    subDrop(0.75, 110, 40, 0.4, 0.4);
    // 1.125 glass tick for the ruler
    glass(1.125, hz('D7'), 0.14, { dec: 0.35, pan: 0.4 });
    // 1.5 cut: reversed swell into a glass pling A5
    revSwell(1.125, 0.375, 0.12, { fTop: 3000, hall: 0.25 });
    glass(1.5, hz('A5'), 0.32, { dec: 1.6, hall: 0.25, cave: 0.2 });
    // 1.875 kalimba motif F#5 A5 B5 D6 on 8ths
    ['F#5', 'A5', 'B5', 'D6'].forEach((n, i) => kalimba(at(1.875 + i * H8), hz(n), 0.42 - i * 0.02, { hall: 0.18, delay: 0.12, pan: i % 2 ? 0.2 : -0.2 }));
    // 3.0 embryo pop: fmBell D6 with ping-pong echo
    fmBell(3.0, hz('D6'), 0.36, { delay: 0.3, hall: 0.2 });
    kick(3.0, 0.5, 'felt');
    // 3.75 seed drops into soil
    whump(3.75, 0.4);
    brush(3.75, 0.25, 0);
    // 4.5 rising glide as the stem rises; shaker on 8ths enters
    glide(4.5, hz('D4'), hz('A5'), 0.75, 0.16, { hall: 0.25 });
    for (let t = 4.5; t < 9 - 1e-9; t += H8) shaker(at(t), 0.08, Math.sin(t * 3) * 0.4);
    // 5.25 parchment cracks: a dry click pair
    clicks(5.25, 0.1, 10, { amp: 0.5, f0: 2000, f1: 3000, dec: 0.002 }, 0.8, 'parch');
    nz(5.25, 0.03, { type: 'bandpass', q: 1.4, f: [[0, 2600]], amp: perc(0.4, 0.0005, 0.02), key: 'parchcrack' });
    // 5.625 cotyledons open: kalimba chord D5 F#5 A5
    ['D5', 'F#5', 'A5'].forEach((n, i) => kalimba(5.625 + i * 0.01, hz(n), 0.3, { hall: 0.2, pan: (i - 1) * 0.3 }));
    // 6.0, 6.75, 7.5 blossoms: soft gong, then glock triads on 8th-triplets
    gong(6.0, hz('D4'), 0.22, { hall: 0.3 });
    [[6.0, ['D6', 'F#6', 'A6']], [6.75, ['E6', 'G6', 'B6']], [7.5, ['F#6', 'A6', 'D7']]].forEach(([t, ns]) =>
      ns.forEach((n, i) => glock(at(t + i * TR), hz(n), 0.26 - i * 0.03, { dec: 1.2, pan: (i - 1) * 0.4, hall: 0.15 })));
    // 6.375 to 8.25 the bee: a filtered buzz panning in
    nz(6.375, 1.875, { type: 'bandpass', q: 6, f: [[0, 230], [0.9, 260, 'lin'], [1.875, 240, 'lin']], amp: [[0, 0], [0.3, 0.05, 'lin'], [1.1, 0.07, 'lin'], [1.875, FLOOR, 'exp']], panEnv: [[0, -0.8], [1.125, 0, 'lin']], key: 'bee' });
    // 8.25 cut: reversed swell, kick
    revSwell(7.875, 0.375, 0.1, { fTop: 2500, hall: 0.2 });
    kick(8.25, 0.4, 'felt');
    // 8.625 fruit ladder: marimba D5 E5 F#5 A5 B5 on 8th-triplets
    ['D5', 'E5', 'F#5', 'A5', 'B5'].forEach((n, i) => marimba(at(8.625 + i * TR), hz(n), 0.32, { room: 0.2, pan: -0.4 + i * 0.2 }));
    // 9.625 ripe fruit: fmBell B5
    fmBell(9.625, hz('B5'), 0.26, { hall: 0.2 });
    // 9.75 cut: kick (pad change to Bm9 is in the harmony loop)
    kick(9.75, 0.62, 'full');
    tock(9.75, 0.42, 1250, { pan: -0.15 });
    marimba(9.75, hz('B3'), 0.36, { room: 0.2 });
    marimba(9.75, hz('F#4'), 0.3, { room: 0.2 });
    // 10.5 yellows: plucks A4 B4 D5 E5 on triplets
    ['A4', 'B4', 'D5', 'E5'].forEach((n, i) => pluck(at(10.5 + i * TR), n, 0.22, { dec: 0.6, room: 0.2, pan: -0.3 + i * 0.2 }));
    // 11.25 reds: glock F#5 A5 B5 D6 E6 with pops
    // the scene turns the reds two, two, one on 11.25, 11.5 and 11.75 (the shot ends at 12.0)
    ['F#5', 'A5', 'B5', 'D6', 'E6'].forEach((n, i) => {
      const t = at([11.25, 11.27, 11.5, 11.52, 11.75][i]);
      glock(t, hz(n), 0.24, { dec: 0.9, pan: -0.4 + i * 0.2 });
      plip(t, hz('A5'), hz('A6'), 0.1, { pan: -0.4 + i * 0.2 });
    });
    // 11.625 overripe: low tock
    tock(11.625, 0.4, 420, { dec: 0.12 });

    // =========================================================== ACT 2, cosecha (12 to 24)
    crash(12.0, 0.18, { dec: 1.2 });
    // picks: a snap, then a soft thud into the basket 9 frames later
    [12.0, 12.375, 12.75, 13.5, 13.875].forEach((t, i) => {
      tock(t, 0.36, 2300 + i * 80, { pan: 0.35 - i * 0.12 });
      kick(at(t + H8), 0.22, 'felt');
    });
    // 13.125 the skipped green cherry: a muted blip
    stab(13.125, ['D4', 'F4'], 0.08, { len: 0.12, f: 700 });
    // 14.25 cut: glass ping
    glass(14.25, hz('E6'), 0.24, { dec: 1.0, hall: 0.2 });
    // 14.625 slice: noise sweep high to low
    nz(14.625, 0.3, { type: 'bandpass', q: 1.6, f: [[0, 8000], [0.3, 900, 'exp']], amp: [[0, 0], [0.01, 0.3], [0.3, FLOOR, 'exp']], room: 0.2, key: 'slice' });
    // 15.0 split whump, then kalimba layers D5 F#5 A5 D6 F#6 on triplets
    whump(15.0, 0.45);
    ['D5', 'F#5', 'A5', 'D6', 'F#6'].forEach((n, i) => kalimba(at(15.0 + i * TR), hz(n), 0.32 - i * 0.02, { hall: 0.15, delay: 0.1, pan: -0.4 + i * 0.2 }));
    // 16.5 washing: a water bed and squelches on 8ths
    wind(16.5, 18.0, [[0, 0], [0.2, 0.18, 'lin'], [1.3, 0.16, 'lin'], [1.5, FLOOR, 'exp']], { lp: 1400 });
    for (let t = 16.5; t < 18 - 1e-9; t += H8) chew(at(t), 0.16, Math.sin(t * 7) * 0.5);
    // 17.25 splash
    nz(17.25, 0.5, { type: 'lowpass', q: 0.7, f: [[0, 5000], [0.5, 800, 'exp']], amp: [[0, 0], [0.008, 0.4], [0.5, FLOOR, 'exp']], stereo: true, room: 0.3, key: 'splash' });
    [0.02, 0.07, 0.13, 0.2, 0.28].forEach((d, i) => plip(17.25 + d, hz(['A5', 'D6', 'F#5', 'B5', 'E6'][i]), hz('A6'), 0.1, { pan: (i % 2 ? 1 : -1) * 0.4 }));
    // 18.0 to 21.0 drying: day chime, then a glock tick per day with a rake scrape on its 8th
    glass(18.0, hz('A6'), 0.18, { dec: 1.4, hall: 0.25 });
    ['D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'D6'].forEach((n, i) => {
      const t = at(18.0 + i * H8);
      glock(t, hz(n), 0.22, { dec: 0.8, pan: -0.5 + i * 0.16 });
      nz(at(t + (i === 6 ? H8 : H8 / 2)), 0.14, { type: 'bandpass', q: 2.2, f: [[0, 1800], [0.14, 1100, 'exp']], amp: [[0, 0], [0.02, 0.12], [0.14, FLOOR, 'exp']], key: 'rake' + i });
    });
    // 21.0 cut: descending water-drop plips on 8ths
    ['A6', 'F#6', 'D6', 'A5'].forEach((n, i) => plip(at(21.0 + i * TR), hz(n), hz(n) * 0.5, 0.14, { pan: 0.3 - i * 0.2 }));
    // 21.75 hull crack: click grains and a short crash
    clicks(21.75, 0.16, 30, { amp: 0.5, f0: 1600, f1: 3600, shape: 1.6, dec: 0.002 }, 0.9, 'hull');
    crash(21.75, 0.16, { dec: 0.5 });
    // 22.125 fmBell A5
    fmBell(22.125, hz('A5'), 0.26, { hall: 0.2 });
    // 22.5 cut, then the bean pour rattle from 22.875 and a riser from 23.25
    clicks(22.875, 1.1, 90, { amp: 0.25, f0: 1200, f1: 2600, dec: 0.003 }, 0.7, 'pour');
    revSwell(23.25, 0.75, 0.2, { fTop: 4000, hall: 0.2 });

    // =========================================================== ACT 3, tueste (24 to 33)
    // 24.0 the hinge: crash, sub drop, full drums, the drum rumble
    crash(24.0, 0.42, { dec: 1.8 });
    subDrop(24.0, 120, 36, 0.6, 0.6);
    E.duck(24.0, 0.45);
    nz(24.0, 3.0, { type: 'lowpass', q: 0.6, f: [[0, 160], [3.0, 520, 'exp']], amp: [[0, 0], [0.2, 0.14, 'lin'], [2.7, 0.18, 'lin'], [3.0, FLOOR, 'exp']], stereo: true, bus: 'amb', key: 'drum' });
    // 26.25 riser into the push-in
    revSwell(26.25, 0.75, 0.22, { fTop: 4200, hall: 0.2 });
    // 27.0 heat hiss
    nz(27.0, 1.5, { type: 'highpass', q: 0.5, f: [[0, 3000], [1.5, 5000, 'exp']], amp: [[0, 0], [0.3, 0.05, 'lin'], [1.5, FLOOR, 'exp']], stereo: true, bus: 'amb', key: 'hiss' });
    // 27.75 first crack: a sharp pop, a noise burst and a crash
    nz(27.75, 0.04, { type: 'bandpass', q: 1.2, f: [[0, 2200]], amp: perc(0.8, 0.0004, 0.03), room: 0.3, key: 'crack' });
    nz(27.75, 0.012, { type: 'highpass', q: 0.7, f: [[0, 6000]], amp: perc(0.55, 0.0003, 0.005), key: 'crack2' });
    clicks(27.75, 0.12, 20, { amp: 0.5, f0: 2000, f1: 4500, shape: 2, dec: 0.002 }, 0.8, 'crack3');
    crash(27.75, 0.3, { dec: 1.2 });
    // 28.125 and 28.25: two smaller pops
    [28.125, 28.25].forEach((t, i) => nz(t, 0.03, { type: 'bandpass', q: 1.3, f: [[0, 2600 + i * 400]], amp: perc(0.45, 0.0004, 0.02), pan: i ? 0.35 : -0.35, key: 'pop' + i }));
    // 28.5 cooling whoosh; ladder marimba D4 F#4 A4 B4 D5 F#5 on triplets
    wind(28.5, 30.75, [[0, 0], [0.15, 0.2, 'lin'], [2.0, 0.08, 'lin'], [2.25, FLOOR, 'exp']], { lp: 3000 });
    ['D4', 'F#4', 'A4', 'B4', 'D5', 'F#5'].forEach((n, i) => marimba(at(28.5 + i * TR), hz(n), 0.32, { room: 0.2, pan: -0.5 + i * 0.2 }));
    // 30.0 second crack: quiet, fast crackle
    clicks(30.0, 0.7, 70, { amp: 0.18, f0: 2500, f1: 5000, dec: 0.0015 }, 0.6, 'second');
    // 30.75 to 32.25 grinder whirr
    buzz(30.75, 1.5, 0.07);
    nz(30.75, 1.5, { type: 'bandpass', q: 3, f: [[0, 900], [1.5, 1500, 'exp']], amp: [[0, 0], [0.1, 0.1, 'lin'], [1.35, 0.1, 'lin'], [1.5, FLOOR, 'exp']], key: 'grind' });
    // 32.625 tamp: a felt thump and a metal clink
    kick(32.625, 0.4, 'thud');
    ting(32.625, hz('E6'), 0.22);

    // =========================================================== ACT 4, taza (33 to 45)
    // 33.0 walking bass fills in the harmony loop; here a soft crash marks the act
    crash(33.0, 0.16, { dec: 1.0 });
    // 33.375 pump hum and hiss
    nz(33.375, 1.875, { type: 'lowpass', q: 4, f: [[0, 110], [1.875, 140, 'lin']], amp: [[0, 0], [0.1, 0.12, 'lin'], [1.7, 0.12, 'lin'], [1.875, FLOOR, 'exp']], bus: 'amb', key: 'pump' });
    nz(33.375, 1.875, { type: 'highpass', q: 0.5, f: [[0, 4500]], amp: [[0, 0], [0.2, 0.04, 'lin'], [1.875, FLOOR, 'exp']], stereo: true, bus: 'amb', key: 'steamhiss' });
    // 34.125 first drips, then a pouring trickle to 36.75
    [0, 0.25, 0.5].forEach((d, i) => plip(at(34.125 + d), hz(['A5', 'F#5', 'D6'][i]), hz('A6'), 0.14, { pan: i % 2 ? 0.2 : -0.2 }));
    nz(34.5, 2.25, { type: 'bandpass', q: 2.5, f: [[0, 1300], [1.2, 1700, 'lin'], [2.25, 1500, 'lin']], amp: [[0, 0], [0.15, 0.12, 'lin'], [2.1, 0.1, 'lin'], [2.25, FLOOR, 'exp']], stereo: true, key: 'trickle' });
    // 35.25 cut: keys pad (a soft electric-piano colour on the keys bus)
    CH.Bm9.slice(1).forEach((n, i) => marimba(35.25 + i * 0.01, hz(n.replace(/\d/, (d) => String(+d + 1))), 0.12, { dec: 1.8, room: 0.2, pan: (i - 1.5) * 0.2 }));
    // 36.75 the stream stops: a last plip
    plip(36.75, hz('D6'), hz('A6'), 0.16);
    // 37.125 bell chord D6 F#6 A6
    ['D6', 'F#6', 'A6'].forEach((n, i) => fmBell(37.125, hz(n), 0.16, { hall: 0.22, pan: (i - 1) * 0.35 }));
    // 37.5 full groove and the lead motif
    lead([[37.5, 'D5'], [37.875, 'F#5', 0.04], [38.25, 'A5', 0.04], [38.625, 'B5', 0.04], [39.375, 'A5', 0.06], [39.75, 'F#5', 0.06]], 40.5, 0.14, { hall: 0.2, delay: 0.12 });
    // 38.25, 39.0, 39.75: a soft whoosh per layer, café clinks at 39.0
    [38.25, 39.0, 39.75].forEach((t, i) => nz(at(t - 0.25), 0.5, { type: 'bandpass', q: 0.8, f: [[0, 600], [0.25, 2400, 'exp'], [0.5, 900, 'exp']], amp: [[0, 0], [0.25, 0.1, 'lin'], [0.5, FLOOR, 'exp']], stereo: true, key: 'layer' + i }));
    [39.0, 39.25, 39.625].forEach((t, i) => ting(t, hz(['A6', 'E6', 'B6'][i]), 0.1, { pan: [0.5, -0.4, 0.2][i], room: 0.3 }));
    // 40.5 cut (pad to Bm9 is in the harmony loop)
    // 41.25 the puck lands: whump and crumble
    whump(41.25, 0.4);
    clicks(41.25, 0.35, 40, { amp: 0.25, f0: 800, f1: 2200, shape: 1.4, dec: 0.003 }, 0.7, 'crumble');
    // 42.0 rising whoosh into the snap zoom
    revSwell(42.0, 0.75, 0.22, { fTop: 4500, hall: 0.2 });
    // 42.75 the kalimba motif returns on 8ths
    ['F#5', 'A5', 'B5', 'D6'].forEach((n, i) => kalimba(at(42.75 + i * H8), hz(n), 0.4 - i * 0.02, { hall: 0.18, delay: 0.12, pan: i % 2 ? 0.2 : -0.2 }));
    // 43.5 wordmark: pad bloom (the Dmaj9 pad in the harmony loop) plus a high glass
    glass(43.5, hz('A6'), 0.12, { dec: 1.6, hall: 0.3 });
    // 44.25 the final embryo pulse
    fmBell(44.25, hz('D6'), 0.32, { delay: 0.25, hall: 0.2 });
  }

  FILM.audio = {
    render(ctx, opts) {
      const o = opts || {};
      const start = Math.max(0, Number(o.start) || 0);
      const dest = o.dest || ctx.destination;
      const DUR = (FILM.TIMELINE && FILM.TIMELINE.duration) || FILM.DURATION || 32;
      // opts.mix overrides the mix constants (bus gains, trim); the analysis tools use it for solo renders.
      const om = o.mix || {};
      const mix = Object.assign({}, MIX, om, {
        bus: Object.assign({}, MIX.bus, om.bus || {}),
        eq: Object.assign({}, MIX.eq, om.eq || {}),
        comp: Object.assign({}, MIX.comp, om.comp || {}),
      });
      const E = makeEngine(ctx, start, dest, DUR, mix);
      const I = instruments(E);
      // The score is scheduled one bar at a time, so the audio graph only ever holds the voices of
      // the next few seconds. Each voice belongs to exactly one bar by its start time, so the output
      // is the same as scheduling everything at once. The first bar also takes every earlier voice
      // still sounding at `start`.
      const BAR = 240 / ((FILM.TIMELINE && FILM.TIMELINE.bpm) || 120);
      const first = Math.floor(start / BAR);
      const last = Math.ceil(DUR / BAR) - 1;
      const run = (k) => {
        E.w0 = k === first ? -Infinity : k * BAR;
        E.w1 = k === last ? Infinity : (k + 1) * BAR;
        score(E, I);
      };
      const due = (k) => E.base + (k * BAR - start) - LAT; // context time of bar k's first event
      run(first);
      let k = first + 1;
      const isOffline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
      if (isOffline && typeof ctx.suspend !== 'function') {
        // An offline context that cannot pause mid-render gets every bar up front.
        for (; k <= last; k++) run(k);
      } else if (isOffline) {
        // Offline: pause the render 0.25 s before each bar, schedule it, resume.
        const q = 128 / ctx.sampleRate;
        const end = ctx.length / ctx.sampleRate;
        for (; k <= last; k++) {
          const j = k;
          const when = Math.floor((due(j) - 0.25) / q) * q;
          if (when >= end - q) break; // this bar starts after the render window ends
          let paused = null;
          if (when > ctx.currentTime + q) {
            try {
              paused = ctx.suspend(when);
            } catch (e) {
              paused = null;
            }
          }
          if (!paused) run(j);
          else
            paused.then(
              () => {
                run(j);
                ctx.resume();
              },
              () => run(j)
            );
        }
      } else {
        // Live: a look-ahead timer schedules each bar 1.5 s before it sounds.
        const AHEAD = 1.5;
        const pump = () => {
          while (k <= last && due(k) - ctx.currentTime < AHEAD) run(k++);
          return k <= last;
        };
        if (pump()) {
          const timer = setInterval(() => {
            if (ctx.state === 'closed' || !pump()) clearInterval(timer);
          }, 100);
        }
      }
    },
  };
})();
