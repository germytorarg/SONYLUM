/* Techno generativo con Web Audio: sin archivos, sin derechos de autor.
   Arranca solo cuando la persona toca el botón de sonido (los navegadores bloquean el audio automático).
   128 BPM, la menor. Cada 8 compases cambia la textura para que no se repita igual. */
(function () {
  "use strict";
  var btn = document.getElementById("soundBtn");
  if (!btn || !(window.AudioContext || window.webkitAudioContext)) { if (btn) btn.hidden = true; return; }

  var BPM = 128, STEP = 60 / BPM / 4;          // semicorchea
  var ctx = null, master, comp, delay, fb, delayOut, noiseBuf;
  var playing = false, step = 0, bar = 0, nextTime = 0, timer = 0;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // la menor: bajo rodante y acordes de stab
  var BASS = [45, 0, 45, 45, 0, 45, 48, 0, 45, 0, 45, 52, 0, 45, 43, 0];          // notas MIDI (0 = silencio)
  var STABS = [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]];
  var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0;
    comp.connect(master); master.connect(ctx.destination);
    // eco en negras con punto para los stabs
    delay = ctx.createDelay(1); delay.delayTime.value = STEP * 3;
    fb = ctx.createGain(); fb.gain.value = 0.38;
    delayOut = ctx.createGain(); delayOut.gain.value = 0.32;
    delay.connect(fb); fb.connect(delay); delay.connect(delayOut); delayOut.connect(comp);
    // ruido blanco reutilizable para hats y clap
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function kick(t) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g); g.connect(comp); o.start(t); o.stop(t + 0.45);
  }
  function noise(t, dur, type, freq, vol, q) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(comp); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function bass(t, note, open) {
    var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = mtof(note);
    f.type = "lowpass"; f.Q.value = 9;
    f.frequency.setValueAtTime(180 + open * 1400, t);
    f.frequency.exponentialRampToValueAtTime(120, t + STEP * 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.32, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + STEP * 0.95);
    o.connect(f); f.connect(g); g.connect(comp); o.start(t); o.stop(t + STEP);
  }
  function stab(t, chord) {
    var f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "lowpass"; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.25); f.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    chord.forEach(function (n) {
      [-7, 7].forEach(function (det) {
        var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(n); o.detune.value = det;
        o.connect(f); o.start(t); o.stop(t + 0.32);
      });
    });
    f.connect(g); g.connect(comp); g.connect(delay);
  }

  function beat(t) {   // avisa al cubo justo cuando suena el bombo
    if (reduce) return;
    var ms = Math.max(0, (t - ctx.currentTime) * 1000);
    setTimeout(function () { if (playing) dispatchEvent(new Event("sony:beat")); }, ms);
  }

  function schedule(s, t) {
    var phase = Math.floor(bar / 8) % 4;           // 0 intro, 1 groove, 2 stabs, 3 break
    var brk = phase === 3 && bar % 8 >= 6;          // dos compases sin bombo
    if (s % 4 === 0 && !brk) { kick(t); beat(t); }
    if (s % 4 === 2) noise(t, 0.05, "highpass", 8000, 0.22);                       // hat abierto en contratiempo
    if (phase >= 1 && s % 2 === 1) noise(t, 0.025, "highpass", 10000, 0.08);       // hats en 16
    if (phase >= 1 && (s === 4 || s === 12)) noise(t, 0.16, "bandpass", 1500, 0.35, 0.8);   // clap
    if (BASS[s] && phase !== 0) bass(t, BASS[s], 0.35 + 0.35 * Math.sin((bar * 16 + s) / 22));
    if (phase === 0 && s % 4 === 2) bass(t, 45, 0.15);
    if (phase >= 2 && (s === 3 || s === 10) && bar % 2 === 0) stab(t, STABS[(bar >> 1) % 4]);
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.12) {
      // swing leve en las semicorcheas pares
      schedule(step, nextTime + (step % 2 ? STEP * 0.08 : 0));
      nextTime += STEP;
      step = (step + 1) % 16;
      if (step === 0) bar++;
    }
  }

  function setUi(on) {
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Apagar música" : "Escuchar techno");
    btn.classList.toggle("is-on", on);
    btn.querySelector("i").className = "ph " + (on ? "ph-speaker-simple-high" : "ph-speaker-simple-slash");
  }

  function start() {
    if (!ctx) init();
    ctx.resume();
    playing = true; step = 0; nextTime = ctx.currentTime + 0.06;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);       // entra suave
    clearInterval(timer); timer = setInterval(tick, 25);
    setUi(true);
  }
  function stop() {
    playing = false;
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.4);
    setTimeout(function () { if (!playing) { clearInterval(timer); ctx.suspend(); } }, 450);
    setUi(false);
  }

  btn.addEventListener("click", function () { if (playing) stop(); else start(); });
  // pestaña oculta: se corta; al volver sigue si estaba sonando
  document.addEventListener("visibilitychange", function () {
    if (!ctx || !playing) return;
    if (document.hidden) { clearInterval(timer); ctx.suspend(); }
    else { ctx.resume().then(function () { nextTime = ctx.currentTime + 0.06; timer = setInterval(tick, 25); }); }
  });
})();
