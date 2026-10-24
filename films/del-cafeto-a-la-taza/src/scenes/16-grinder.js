// 16 grinder : "Burrs" (illustrated, global T 30.75 to 33.00, hard cut)
//
// A conical burr grinder in partial cutaway, centred on x 540. Roasted beans sink in the glass hopper
// and tumble into the throat; the inner cone burr turns inside the toothed ring burr; fine grounds fall
// from the spout (540, 1180) into the portafilter basket at (540, 1380); a steel tamper flattens the
// heap on the 8th at T 32.625.
//
// Layers, back to front:
//   1 stripes stripeCream / stripeApricot (drift 6 px per beat), counter top and back construction lines
//   2 base plate, back column and portafilter fork (behind the portafilter)
//   3 grinder body (steel cylinder, contour hatching), dial, vents, screws
//   4 cutaway window: back wall, throat with falling beans, ring burr in section, turning cone burr,
//     grounds in the gap, chute mouth
//   5 hopper: glass, sinking beans (on twos), reflections, lid
//   6 spout, grounds stream (from T 31.50 to T 32.25), portafilter with heap (peaks T 32.25)
//   7 tamper (enters T 32.33, presses on T 32.625 with popTwos), puff of grounds
//   8 overlays: annBlue rotation arrow around the burr, annYellow fineness ruler, annMagenta dose ring
(function () {
  'use strict';

  const ID = 'grinder';
  const LIB = FILM.lib;
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const FR = 1 / 24;

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => {
    const u = clamp((x - a) / (b - a));
    return u * u * (3 - 2 * u);
  };
  const sd = (...k) => LIB.hash(ID, ...k) & 0x7fffffff;

  // ---------------------------------------------------------------------------
  // beats (shot-local seconds)
  // ---------------------------------------------------------------------------
  const B_GRIND = 0.75; // T 31.50 grounds start falling
  const B_PEAK = 1.5; // T 32.25 heap peaks, grinding stops
  const B_TAMP_IN = 1.583333; // T 32.333 tamper enters
  const B_TAMP = 1.875; // T 32.625 tamp (8th)

  // ---------------------------------------------------------------------------
  // small drawing helpers
  // ---------------------------------------------------------------------------
  function trace(ctx, pts, closed = true) {
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
      else ctx.lineTo(pts[i][0], pts[i][1]);
    }
    if (closed) ctx.closePath();
  }
  function fillPoly(ctx, pts, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    trace(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  }
  function stroke(ctx, path, color, alpha, width, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha *= alpha;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.stroke(path);
    ctx.restore();
  }
  function arcPts(cx, cy, rx, ry, a0, a1, n = 32) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = lerp(a0, a1, i / n);
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }
  function ell(cx, cy, rx, ry, n = 48) {
    return LIB.ellipsePts(cx, cy, rx, ry, n);
  }

  // ---------------------------------------------------------------------------
  // geometry
  // ---------------------------------------------------------------------------
  const HOP = { x0: 330, x1: 750, y0: 260, bx0: 440, bx1: 640, y1: 620 };
  const hopHalf = (y) => lerp(210, 100, clamp((y - 260) / 360));
  const BODY = { x0: 360, x1: 720, y0: 640, y1: 1180 };
  const WIN = { x0: 392, x1: 688, y0: 700, y1: 1022 };
  const BURR = { cx: 540, cy: 870, yTop: 800, yBot: 940, rTop: 38, rBot: 100 };
  const coneR = (y) => lerp(BURR.rTop, BURR.rBot, clamp((y - BURR.yTop) / (BURR.yBot - BURR.yTop)));
  const gapAt = (y) => lerp(22, 4, clamp((y - BURR.yTop) / (BURR.yBot - BURR.yTop)));
  const SPOUT = { x: 540, y: 1180 };
  const PF = { cx: 540, rimY: 1350, rx: 130, ry: 30 };

  let GEO = null;
  function geo(L) {
    if (GEO) return GEO;
    const r = L.rng(sd('beans'));
    // hopper beans: packed rows, (u across the hopper -1..1, y0 at t = 0)
    const beans = [];
    for (let y = 606, row = 0; y > 150; y -= 25, row++) {
      const hw = hopHalf(Math.max(260, y)) - 30;
      const n = Math.max(2, Math.floor((hw * 2) / 38));
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0 : -1 + (2 * (i + 0.5 + r.range(-0.3, 0.3) + (row % 2 ? 0.25 : -0.25))) / n;
        beans.push({
          u: clamp(u, -1, 1),
          y0: y + r.range(-6, 6),
          rot: r.range(0, TAU),
          s: r.range(0.88, 1.08),
          dark: r() < 0.62,
          flip: r() < 0.3,
          k: beans.length,
        });
      }
    }
    // the surface of the heap at t = 0 sits near y 300: drop beans above an uneven surface line
    const surf = (u) => 300 + 18 * Math.sin(u * 2.1 + 0.6) + 10 * Math.abs(u);
    const hb = beans.filter((b) => b.y0 >= surf(b.u));
    hb.sort((a, b) => a.y0 - b.y0);
    // grounds stream particles (template, re-seeded per drawing at draw time)
    // window back-wall rivets
    const rivets = [];
    for (let i = 0; i < 6; i++) rivets.push([WIN.x0 + 18 + (i * (WIN.x1 - WIN.x0 - 36)) / 5, WIN.y0 + 14]);
    GEO = { beans: hb, rivets };
    return GEO;
  }

  // a roasted bean (canvas direct, batched by the caller's state); returns nothing
  function bean(ctx, x, y, rot, s, fill, P, flip, jit) {
    const a = 22 * s, b = 15.5 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, a, b, 0, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = P.ink;
    ctx.beginPath();
    ctx.ellipse(jit * 0.4, 0, a, b + jit * 0.3, 0, 0, TAU);
    ctx.stroke();
    if (!flip) {
      // the opened crease with its pale silverskin line
      ctx.beginPath();
      ctx.moveTo(-a * 0.78, jit * 0.5);
      ctx.bezierCurveTo(-a * 0.3, -b * 0.42, a * 0.25, b * 0.42, a * 0.78, -jit * 0.5);
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = P.beanCinnamon;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(-a * 0.25, -b * 0.35, a * 0.4, b * 0.18, -0.2, 0, TAU);
      ctx.fillStyle = P.beanOil;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  // shade arc on the lower-right side of a bean in screen space
  function beanShade(path, x, y, s) {
    const a = 20 * s, b = 13.5 * s;
    path.moveTo(x + Math.cos(-0.2) * a, y + Math.sin(-0.2) * b);
    path.ellipse(x, y, a, b, 0, -0.2, 1.9);
  }

  // ---------------------------------------------------------------------------
  // scene
  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, E = L.ease;
      const dur = info.dur;
      let t = clamp(tIn, 0, dur);
      const tFrame = Math.round(t * 24) / 24;
      if (Math.abs(t - tFrame) < 1e-4) t = tFrame + 1e-7;
      const tw = L.onTwos(t);
      const bi = L.boil(info.T);
      const g = geo(L);

      const drawing = (a) => Math.floor((t - a) * 12 + 1e-6);
      const hit = (a, frames, e, lead = 1) => {
        if (t < a) return 0;
        const u = clamp((t - a) / (frames * FR) + lead / frames);
        return e ? e(u) : u;
      };
      const popTwos = (a) => (t < a ? 0 : [0.72, 1.08, 1][Math.min(2, drawing(a))]);
      const ink = (pts, o) => L.inkPath(ctx, pts, Object.assign({ step: 4.5 }, o));

      const ink0 = P.ink, inkSoft = P.inkSoft, steel = P.steel, steelDeep = P.steelDeep;
      const steelLight = L.mix(P.steel, P.white, 0.45);

      // ---- 1 stripes, counter, construction ---------------------------------
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeApricot], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') });

      // counter top (scenery, full bleed)
      fillPoly(ctx, [[0, 1600], [1080, 1600], [1080, 1920], [0, 1920]], L.mix(P.wood, P.paper, 0.35));
      L.hatch(ctx, [[0, 1606], [1080, 1606], [1080, 1920], [0, 1920]], { angle: 0.04, spacing: 9, width: 1.3, color: P.bark, alpha: 0.55, length: [40, 160], gap: [6, 24], seed: sd('counter'), density: (x, y) => 0.35 + 0.5 * sstep(1600, 1900, y) });
      ink([[-20, 1600], [1100, 1600]], { width: 3, seed: sd('counterL'), taper: [0, 0], smooth: false, step: 8 });
      ink([[-20, 1614], [1100, 1614]], { width: 1.5, color: inkSoft, alpha: 0.7, seed: sd('counterL2'), taper: [0, 0], smooth: false, step: 8 });

      {
        const cons = new Path2D();
        cons.moveTo(540, 170);
        cons.lineTo(540, 1640);
        stroke(ctx, cons, P.inkFaint, 0.32, 1.5, [10, 8]);
        L.guideCircle(ctx, BURR.cx, BURR.cy, 215, { color: P.inkFaint, alpha: 0.3, width: 1.5 });
        L.guideCircle(ctx, BURR.cx, BURR.cy, 236, { color: P.inkFaint, alpha: 0.22, width: 1.2, dash: [3, 7] });
        const reg = new Path2D();
        for (const [x, y] of [[330, 260], [750, 260], [440, 620], [640, 620], [540, 870], [540, 1180], [540, 1350], [120, 1430], [960, 870], [120, 870]]) {
          reg.moveTo(x - 9, y);
          reg.lineTo(x + 9, y);
          reg.moveTo(x, y - 9);
          reg.lineTo(x, y + 9);
        }
        stroke(ctx, reg, P.inkFaint, 0.5, 1.5);
        const hl = new Path2D();
        hl.moveTo(60, 870);
        hl.lineTo(300, 870);
        hl.moveTo(780, 870);
        hl.lineTo(1020, 870);
        hl.moveTo(140, 260);
        hl.lineTo(300, 260);
        hl.moveTo(780, 260);
        hl.lineTo(940, 260);
        stroke(ctx, hl, P.inkFaint, 0.3, 1.5);
        // degree ticks on the guide circle
        const deg = new Path2D();
        for (let a = 0; a < 360; a += 10) {
          const c = Math.cos(a * DEG), s = Math.sin(a * DEG);
          const l = a % 30 === 0 ? 14 : 7;
          deg.moveTo(BURR.cx + c * 215, BURR.cy + s * 215);
          deg.lineTo(BURR.cx + c * (215 + l), BURR.cy + s * (215 + l));
        }
        stroke(ctx, deg, P.inkFaint, 0.4, 1.3);
      }

      // ---- 2 base plate, back column, fork ------------------------------------
      {
        // plate
        const plateTop = ell(540, 1530, 330, 54, 64);
        const plateSide = arcPts(540, 1530, 330, 54, 0, Math.PI, 40).concat(arcPts(540, 1556, 330, 54, Math.PI, 0, 40));
        fillPoly(ctx, plateSide, steelDeep);
        L.hatch(ctx, plateSide, { angle: Math.PI / 2 - 0.1, spacing: 6, width: 1.3, color: ink0, alpha: 0.6, length: [8, 22], seed: sd('plateS'), density: (x) => 0.3 + 0.7 * sstep(400, 860, x) });
        ink(arcPts(540, 1556, 330, 54, 0, Math.PI, 40), { width: 3, seed: sd('plateB') });
        ink(plateTop, { closed: true, width: 3, fill: steel, seed: sd('plate') });
        L.hatch(ctx, plateTop, { angle: -Math.PI / 4, spacing: 8, width: 1.3, color: steelDeep, alpha: 0.75, seed: sd('plateH'), density: (x, y) => sstep(560, 860, x + (y - 1530) * 2) });
        // grounds spill on the plate
        L.stipple(ctx, ell(560, 1528, 150, 22, 32), { spacing: 9, color: P.grounds, alpha: 0.85, seed: sd('spill'), density: (x, y) => 1 - sstep(0.3, 1, Math.hypot((x - 560) / 150, (y - 1528) / 22)) });
        // back column
        const col = [[478, 1170], [602, 1170], [602, 1532], [478, 1532]];
        fillPoly(ctx, col, L.mix(steelDeep, steel, 0.4));
        L.hatch(ctx, col, { angle: 0, spacing: 6, width: 1.3, color: ink0, alpha: 0.7, length: [10, 30], bend: 1.5, seed: sd('colH'), density: (x) => 0.25 + 0.75 * sstep(500, 600, x) });
        ink([[478, 1170], [478, 1534]], { width: 3, seed: sd('colL'), taper: [0, 4] });
        ink([[602, 1170], [602, 1534]], { width: 3, seed: sd('colR'), taper: [0, 4] });
        // fork arms reaching the portafilter ears
        for (const sgn of [-1, 1]) {
          const arm = [[540 + sgn * 55, 1262], [540 + sgn * 168, 1300], [540 + sgn * 168, 1350], [540 + sgn * 156, 1350], [540 + sgn * 156, 1312], [540 + sgn * 55, 1284]];
          ink(arm, { closed: true, width: 2.6, fill: steel, seed: sd('fork', sgn), smooth: false });
          if (sgn > 0) L.hatch(ctx, arm, { angle: -Math.PI / 4, spacing: 5, width: 1.2, color: steelDeep, alpha: 0.8, seed: sd('forkH') });
        }
        ink(ell(540, 1272, 62, 16, 32), { closed: true, width: 2.6, fill: steelLight, seed: sd('forkHub') });
      }

      // ---- 3 grinder body ------------------------------------------------------
      {
        const top = ell(540, BODY.y0, 180, 28, 64);
        const body = arcPts(540, BODY.y0, 180, 28, Math.PI, 0, 32).concat([[720, 1150]]).concat(arcPts(540, 1150, 180, 32, 0, Math.PI, 40));
        ink(body, { closed: true, width: 5, fill: steel, seed: sd('body'), double: true });
        // contour hatching on the shadow half, light from the upper left
        L.hatch(ctx, body, { angle: 0, spacing: 7, width: 1.5, color: steelDeep, alpha: 0.9, length: [18, 60], bend: 3, seed: sd('bodyH'), density: (x) => sstep(560, 700, x) });
        L.crossHatch(ctx, body, { angle: -Math.PI / 4, spacing: 6, width: 1.3, color: ink0, alpha: 0.55, layers: 2, seed: sd('bodyX'), density: (x) => sstep(650, 720, x) });
        // highlight streaks on the lit side
        const hl = new Path2D();
        hl.moveTo(392, 680);
        hl.lineTo(392, 1140);
        hl.moveTo(404, 690);
        hl.lineTo(404, 1000);
        stroke(ctx, hl, P.white, 0.85, 3);
        // top face and collar
        ink(top, { closed: true, width: 3, fill: steelLight, seed: sd('bodyTop') });
        L.hatch(ctx, top, { angle: -Math.PI / 4, spacing: 8, width: 1.2, color: steelDeep, alpha: 0.6, seed: sd('topH'), density: (x) => sstep(560, 720, x) });
        const collar = arcPts(540, 600, 112, 18, Math.PI, 0, 24).concat(arcPts(540, 640, 112, 18, 0, Math.PI, 24));
        ink(collar, { closed: true, width: 3, fill: steel, seed: sd('collar') });
        L.hatch(ctx, collar, { angle: 0.05, spacing: 5, width: 1.2, color: ink0, alpha: 0.6, length: [8, 20], seed: sd('collarH'), density: (x) => sstep(560, 650, x) });
        ink(ell(540, 600, 112, 18, 40), { closed: true, width: 2.4, fill: steelLight, seed: sd('collarTop') });
        // base band
        ink(arcPts(540, 1130, 180, 30, 0, Math.PI, 40), { width: 2, color: inkSoft, alpha: 0.9, seed: sd('band1') });
        ink(arcPts(540, 1118, 180, 30, 0, Math.PI, 40), { width: 1.6, color: inkSoft, alpha: 0.7, seed: sd('band2') });
        // vents on the right
        const vents = new Path2D();
        for (let i = 0; i < 7; i++) {
          const y = 1040 + i * 11;
          vents.moveTo(640, y);
          vents.lineTo(690, y + 2);
        }
        stroke(ctx, vents, ink0, 0.85, 3.2);
        // grind dial with fineness ticks, pointer near "fine"
        L.inkPath(ctx, ell(480, 1072, 40, 36, 40), { closed: true, width: 3, fill: steelLight, seed: sd('dial') });
        L.hatch(ctx, ell(480, 1072, 38, 34, 32), { angle: -Math.PI / 4, spacing: 5, width: 1.2, color: steelDeep, alpha: 0.7, seed: sd('dialH'), density: (x, y) => sstep(0, 30, x - 480 + y - 1072) });
        L.ticks(ctx, 480, 1072, { r: 46, n: 24, len: 6, start: -Math.PI * 0.85, span: Math.PI * 0.7, major: 4, majorLen: 11, color: ink0, alpha: 0.85, width: 1.5 });
        const pa = -Math.PI * 0.8;
        ink([[480, 1072], [480 + Math.cos(pa) * 30, 1072 + Math.sin(pa) * 28]], { width: 3.5, seed: sd('ptr'), taper: [0, 6] });
        ctx.beginPath();
        ctx.arc(480, 1072, 5, 0, TAU);
        ctx.fillStyle = ink0;
        ctx.fill();
        // power switch
        ink(L.rrectPts(560, 1050, 44, 26, 8, 8), { closed: true, width: 2.4, fill: P.ink, seed: sd('switch') });
        ink(L.rrectPts(566, 1054, 18, 18, 5, 6), { closed: true, width: 1.5, fill: P.red, seed: sd('switch2') });
      }

      // ---- 4 cutaway window ----------------------------------------------------
      {
        const win = L.rrectPts(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, 26, 10);
        const winIn = L.rrectPts(WIN.x0 + 11, WIN.y0 + 11, WIN.x1 - WIN.x0 - 22, WIN.y1 - WIN.y0 - 22, 18, 10);
        // wall thickness in section
        fillPoly(ctx, win, L.mix(steel, P.white, 0.2));
        ctx.save();
        ctx.beginPath();
        trace(ctx, win, true);
        trace(ctx, winIn.slice().reverse(), true);
        ctx.clip();
        const sec = new Path2D();
        for (let k = -400; k < 400; k += 7) {
          sec.moveTo(WIN.x0 + k, WIN.y1 + 10);
          sec.lineTo(WIN.x0 + k + 340, WIN.y1 - 330);
        }
        stroke(ctx, sec, ink0, 0.55, 1.2);
        ctx.restore();
        // back wall of the chamber
        fillPoly(ctx, winIn, L.mix(steelDeep, P.ink, 0.25));
        L.hatch(ctx, winIn, { angle: -Math.PI / 4, spacing: 5, width: 1.3, color: ink0, alpha: 0.6, seed: sd('backH'), clip: true });
        ctx.save();
        ctx.beginPath();
        trace(ctx, winIn, true);
        ctx.clip();
        // throat channel
        const thr = [[494, 700], [586, 700], [578, 790], [502, 790]];
        fillPoly(ctx, thr, L.mix(steelDeep, P.paper, 0.18));
        ink([[494, 690], [502, 792]], { width: 2.4, seed: sd('thrL'), taper: [0, 0] });
        ink([[586, 690], [578, 792]], { width: 2.4, seed: sd('thrR'), taper: [0, 0] });
        // beans tumbling down the throat (on twos), cracking near the cone
        for (let i = 0; i < 4; i++) {
          const ph = ((tw * 1.6 + i * 0.25) % 1);
          const y = 690 + ph * 110;
          const x = 540 + 18 * Math.sin(i * 2.3 + tw * 3);
          const s = ph > 0.75 ? 0.7 : 0.9;
          bean(ctx, x, y, i * 1.7 + tw * 5, s, i % 2 ? P.beanDark : P.beanMedium, P, i % 3 === 0, L.h3(i, bi, 3) - 0.5);
        }
        // ring burr, in section, with teeth on its inner edge
        for (const sgn of [-1, 1]) {
          const inner = [];
          for (let y = BURR.yTop - 14; y <= BURR.yBot + 14; y += 5) {
            const k = Math.round((y - BURR.yTop) / 5);
            const tooth = k % 2 ? 6 : 0;
            inner.push([540 + sgn * (coneR(y) + gapAt(y) + tooth), y]);
          }
          const block = inner.concat([[540 + sgn * 150, BURR.yBot + 14], [540 + sgn * 150, BURR.yTop - 14]]);
          fillPoly(ctx, block, steel);
          L.hatch(ctx, block, { angle: sgn > 0 ? -Math.PI / 4 : Math.PI / 4, spacing: 6, width: 1.3, color: ink0, alpha: 0.75, seed: sd('ringH', sgn), clip: true, length: [20, 80] });
          ink(block, { closed: true, width: 3, seed: sd('ring', sgn), smooth: false, wobble: 0.8 });
        }
        // the cone burr turning (24 fps), helical teeth seen from the side
        const ang = t * 7.5;
        const cone = [[540 - BURR.rTop, BURR.yTop], [540 + BURR.rTop, BURR.yTop], [540 + BURR.rBot, BURR.yBot], [540 - BURR.rBot, BURR.yBot]];
        fillPoly(ctx, cone, steelLight);
        const teeth = new Path2D(), teethB = new Path2D();
        const NT = 14;
        for (let k = 0; k < NT; k++) {
          let pen = false, penB = false;
          for (let y = BURR.yTop; y <= BURR.yBot; y += 4) {
            const phi = ang + (k * TAU) / NT + (y - BURR.yTop) * 0.012;
            const c = Math.cos(phi);
            const x = 540 + coneR(y) * Math.sin(phi);
            if (c > 0) {
              if (!pen) teeth.moveTo(x, y);
              else teeth.lineTo(x, y);
              pen = true;
              penB = false;
            } else {
              pen = false;
              if (!penB) teethB.moveTo(x, y);
              else teethB.lineTo(x, y);
              penB = true;
            }
          }
        }
        ctx.save();
        ctx.beginPath();
        trace(ctx, cone, true);
        ctx.clip();
        stroke(ctx, teeth, ink0, 0.95, 2.2);
        // shade on the right half of the cone
        L.hatch(ctx, cone, { angle: Math.PI / 2 + 0.25, spacing: 5, width: 1.3, color: steelDeep, alpha: 0.85, length: [10, 40], seed: sd('coneH'), density: (x, y) => sstep(0.1, 0.8, (x - 540) / coneR(y)) });
        ctx.restore();
        ink(cone, { closed: true, width: 3, seed: sd('cone'), smooth: false, wobble: 0.6 });
        // top nut and carrier disk, shaft
        ink(ell(540, BURR.yTop, 30, 9, 24), { closed: true, width: 2.2, fill: steel, seed: sd('nut') });
        ink(L.rrectPts(428, BURR.yBot, 224, 18, 6, 10), { closed: true, width: 2.6, fill: steel, seed: sd('carrier') });
        const shaft = [[527, 958], [553, 958], [553, 1030], [527, 1030]];
        ink(shaft, { closed: true, width: 2.4, fill: steelDeep, seed: sd('shaft'), smooth: false });
        // grounds in the gap and spilling below the burrs, moving down with the turn
        const grind = t >= B_GRIND - 0.25 && t < B_PEAK + 0.2;
        if (grind) {
          const gp = new Path2D(), gp2 = new Path2D();
          const rr = L.rng(sd('gap', drawing(0)));
          for (let i = 0; i < 90; i++) {
            const y = BURR.yTop + rr() * (BURR.yBot - BURR.yTop + 70);
            const sgn = rr() < 0.5 ? -1 : 1;
            let x;
            if (y < BURR.yBot) x = 540 + sgn * (coneR(y) + rr() * gapAt(y));
            else x = 540 + sgn * (40 + rr() * 80) * (1 - (y - BURR.yBot) / 140);
            const rad = rr.range(1, 2.2);
            const pth = rr() < 0.6 ? gp : gp2;
            pth.moveTo(x + rad, y);
            pth.arc(x, y, rad, 0, TAU);
          }
          ctx.fillStyle = P.grounds;
          ctx.fill(gp);
          ctx.fillStyle = P.beanCinnamon;
          ctx.fill(gp2);
        }
        // chute mouth at the lower left of the chamber
        const chute = [[420, 985], [500, 985], [470, 1012], [430, 1012]];
        fillPoly(ctx, chute, P.ink, 0.85);
        ink([[412, 980], [508, 980]], { width: 2.4, seed: sd('chuteL'), taper: [0, 0] });
        ctx.restore();
        ink(win, { closed: true, width: 4, seed: sd('win') });
        ink(winIn, { closed: true, width: 1.8, color: inkSoft, alpha: 0.9, seed: sd('winIn') });
        // screws at the window corners
        for (const [x, y] of [[WIN.x0 - 14, WIN.y0 + 8], [WIN.x1 + 14, WIN.y0 + 8], [WIN.x0 - 14, WIN.y1 - 8], [WIN.x1 + 14, WIN.y1 - 8]]) {
          ink(ell(x, y, 7, 7, 14), { closed: true, width: 1.8, fill: steelLight, seed: sd('screw', x, y), wobble: 0.3 });
          const sl = new Path2D();
          sl.moveTo(x - 4, y + 3);
          sl.lineTo(x + 4, y - 3);
          stroke(ctx, sl, ink0, 0.9, 1.5);
        }
      }

      // ---- 5 hopper ---------------------------------------------------------------
      {
        const hop = [[HOP.x0, HOP.y0], [HOP.x1, HOP.y0], [HOP.bx1, HOP.y1], [HOP.bx0, HOP.y1]];
        fillPoly(ctx, hop, L.mix(P.white, P.stripeApricot, 0.4), 0.55);
        // beans sink on twos; the middle sinks faster (funnel flow)
        const sink = 84 * E.inOutSine(tw / dur) + 12 * tw;
        ctx.save();
        ctx.beginPath();
        trace(ctx, [[HOP.x0 + 8, HOP.y0 + 6], [HOP.x1 - 8, HOP.y0 + 6], [HOP.bx1 - 6, HOP.y1 + 30], [HOP.bx0 + 6, HOP.y1 + 30]], true);
        ctx.clip();
        const shade = new Path2D();
        const vis = [];
        for (const b of g.beans) {
          const y = b.y0 + sink * (1 + 0.7 * (1 - Math.abs(b.u)));
          if (y > HOP.y1 + 22) continue;
          const hw = Math.max(10, hopHalf(y) - 26);
          const x = 540 + b.u * hw;
          const rot = b.rot + (y - b.y0) * 0.012 * (b.u < 0 ? -1 : 1);
          vis.push([b, x, y, rot]);
        }
        for (const [b, x, y, rot] of vis) {
          bean(ctx, x, y, rot, b.s, b.dark ? P.beanDark : P.beanMedium, P, b.flip, (L.h3(b.k, bi, 11) - 0.5) * 1.6);
          beanShade(shade, x + 1, y + 1, b.s);
        }
        stroke(ctx, shade, ink0, 0.35, 3.5);
        // shadow inside the glass on the right
        L.hatch(ctx, hop, { angle: -Math.PI / 4, spacing: 8, width: 1.3, color: ink0, alpha: 0.4, seed: sd('hopH'), density: (x, y) => sstep(0.55, 1, (x - 540) / hopHalf(y)) });
        ctx.restore();
        // glass reflections
        const refl = new Path2D();
        refl.moveTo(360, 292);
        refl.lineTo(452, 586);
        refl.moveTo(382, 292);
        refl.lineTo(424, 430);
        refl.moveTo(700, 300);
        refl.lineTo(688, 340);
        stroke(ctx, refl, P.white, 0.85, 5);
        ink([[346, 276], [450, 612]], { width: 1.8, color: inkSoft, alpha: 0.8, seed: sd('glassIn1'), taper: [10, 10] });
        ink([[734, 276], [630, 612]], { width: 1.8, color: inkSoft, alpha: 0.8, seed: sd('glassIn2'), taper: [10, 10] });
        ink(hop, { closed: true, width: 5, seed: sd('hop'), smooth: false, double: true });
        // lid
        const lid = L.rrectPts(316, 232, 448, 32, 12, 10);
        ink(lid, { closed: true, width: 4, fill: P.ink, seed: sd('lid') });
        const lidHl = new Path2D();
        lidHl.moveTo(336, 242);
        lidHl.lineTo(600, 242);
        stroke(ctx, lidHl, P.inkFaint, 0.9, 2.5);
        ink(L.rrectPts(518, 204, 44, 30, 10, 8), { closed: true, width: 3, fill: P.ink, seed: sd('knob') });
      }

      // ---- 6 spout, stream, portafilter -----------------------------------------
      // heap height above the rim (on twos): grounds fill the basket, then mound up to a peak
      const gPh = clamp((tw - B_GRIND) / (B_PEAK - B_GRIND));
      const fillFrac = clamp(gPh / 0.4); // basket below the rim
      let heapH = 76 * E.outQuad(clamp((gPh - 0.4) / 0.6));
      const tampK = popTwos(B_TAMP);
      if (tampK > 0) heapH = Math.max(0, heapH * (1 - tampK));
      const tamped = tampK > 0;
      // surface impact point of the stream
      const floorY = lerp(1384, PF.rimY, fillFrac);
      const impY = (gPh < 0.4 ? floorY : PF.rimY - heapH) - 2;

      {
        // spout
        const sp = [[512, 1124], [568, 1124], [562, 1180], [518, 1180]];
        ink(sp, { closed: true, width: 3, fill: steel, seed: sd('spout'), smooth: false });
        L.hatch(ctx, sp, { angle: 0.05, spacing: 5, width: 1.2, color: steelDeep, alpha: 0.85, length: [6, 18], seed: sd('spoutH'), density: (x) => sstep(535, 565, x) });
        ink(ell(540, 1180, 23, 7, 20), { closed: true, width: 2.4, fill: P.ink, seed: sd('spoutM') });
      }

      // portafilter body (behind the stream impact, in front of the column)
      {
        // handle: steel neck then wooden grip off to the left (to x 120)
        const neck = [[402, 1366], [330, 1386], [330, 1414], [404, 1402]];
        ink(neck, { closed: true, width: 3, fill: steel, seed: sd('neck') });
        L.hatch(ctx, neck, { angle: Math.PI / 2 - 0.25, spacing: 5, width: 1.2, color: steelDeep, alpha: 0.85, seed: sd('neckH'), density: (x, y) => sstep(1392, 1412, y) });
        const grip = [[338, 1378], [250, 1392], [150, 1408], [118, 1418], [108, 1436], [122, 1452], [156, 1452], [254, 1434], [338, 1420]];
        ink(grip, { closed: true, width: 4, fill: P.wood, seed: sd('grip') });
        L.hatch(ctx, grip, { angle: -0.14, spacing: 5, width: 1.3, color: P.barkDeep, alpha: 0.85, length: [20, 60], seed: sd('gripH'), density: (x, y) => sstep(1418, 1446, y + (x - 230) * -0.15) });
        const grain = new Path2D();
        grain.moveTo(320, 1392);
        grain.bezierCurveTo(260, 1398, 200, 1406, 140, 1424);
        grain.moveTo(318, 1404);
        grain.bezierCurveTo(250, 1414, 190, 1424, 150, 1436);
        stroke(ctx, grain, P.barkDeep, 0.7, 1.4);
        ink(ell(124, 1436, 9, 9, 14), { closed: true, width: 1.8, fill: P.barkDeep, seed: sd('gripEnd') });

        // bowl
        const bowl = arcPts(540, 1356, 152, 36, Math.PI, 0, 32).concat(arcPts(540, 1374, 150, 66, 0, Math.PI, 40));
        ink(bowl, { closed: true, width: 5, fill: steel, seed: sd('bowl'), double: true });
        L.hatch(ctx, bowl, { angle: Math.PI / 2 - 0.35, spacing: 6, width: 1.4, color: steelDeep, alpha: 0.9, length: [10, 40], bend: 2, seed: sd('bowlH'), density: (x) => sstep(560, 680, x) });
        L.crossHatch(ctx, bowl, { spacing: 5, width: 1.2, color: ink0, alpha: 0.5, layers: 2, seed: sd('bowlX'), density: (x, y) => sstep(640, 690, x) * sstep(1370, 1420, y) });
        const bhl = new Path2D();
        bhl.moveTo(410, 1386);
        bhl.quadraticCurveTo(430, 1420, 470, 1430);
        stroke(ctx, bhl, P.white, 0.85, 3.5);
        // ears
        for (const sgn of [-1, 1]) {
          const ear = [[540 + sgn * 146, 1344], [540 + sgn * 170, 1346], [540 + sgn * 172, 1362], [540 + sgn * 146, 1366]];
          ink(ear, { closed: true, width: 2.4, fill: steel, seed: sd('ear', sgn), smooth: false });
        }
        // spouts under the bowl
        for (const sgn of [-1, 1]) {
          const s = [[540 + sgn * 6, 1436], [540 + sgn * 26, 1436], [540 + sgn * 30, 1470], [540 + sgn * 14, 1470]];
          ink(s, { closed: true, width: 2.2, fill: steel, seed: sd('pfs', sgn), smooth: false });
        }
        // rim ring and the basket mouth
        ink(ell(540, PF.rimY + 2, 152, 36, 56), { closed: true, width: 3, fill: steelLight, seed: sd('ring') });
        const mouth = ell(540, PF.rimY, PF.rx, PF.ry, 56);
        fillPoly(ctx, mouth, L.mix(steelDeep, P.ink, 0.3));
        // inside of the basket: wall shading and the perforated floor (until it is covered)
        ctx.save();
        ctx.beginPath();
        trace(ctx, mouth, true);
        ctx.clip();
        L.hatch(ctx, mouth, { angle: -Math.PI / 4, spacing: 5, width: 1.2, color: ink0, alpha: 0.6, seed: sd('mouthH') });
        if (fillFrac < 1) {
          const fl = ell(540, 1384, 112, 22, 40);
          fillPoly(ctx, fl, steel);
          const holes = new Path2D();
          for (let i = -5; i <= 5; i++) for (let j = -1; j <= 1; j++) {
            const x = 540 + i * 18 + (j % 2) * 9, y = 1384 + j * 10;
            if (((x - 540) / 104) ** 2 + ((y - 1384) / 18) ** 2 > 1) continue;
            holes.moveTo(x + 1.6, y);
            holes.arc(x, y, 1.6, 0, TAU);
          }
          ctx.fillStyle = ink0;
          ctx.fill(holes);
          // grounds layer rising in the basket
          if (fillFrac > 0) {
            const y = lerp(1388, PF.rimY + 4, fillFrac);
            const rx = lerp(112, PF.rx, fillFrac), ry = lerp(22, PF.ry, fillFrac);
            const gs = arcPts(540, y, rx, ry, 0, TAU, 40);
            fillPoly(ctx, gs, P.grounds);
            // the little cone under the impact
            const cone = [[540 - 50, y + 4], [540, y - 26 * fillFrac], [540 + 50, y + 4]];
            fillPoly(ctx, cone, P.grounds);
          }
        }
        ctx.restore();
        ink(mouth, { closed: true, width: 2.4, color: ink0, seed: sd('mouth') });
      }

      // the heap (from the moment the basket is full) or the tamped puck
      if (fillFrac >= 1 || tamped) {
        const rx = PF.rx - 3, ry = PF.ry - 2;
        const pts = [];
        const n = 36;
        for (let i = 0; i <= n; i++) {
          const a = Math.PI + (i / n) * Math.PI; // back half of the rim, under the mound
          const x = 540 + Math.cos(a) * rx;
          const dx = (x - 540) / rx;
          const mound = heapH * Math.pow(Math.max(0, 1 - dx * dx), 1.15);
          const lump = heapH > 4 ? 3 * L.noise1(i * 0.7 + drawing(0) * 0.3, sd('lump')) : 0;
          pts.push([x, PF.rimY + Math.sin(a) * ry - mound + lump]);
        }
        const front = arcPts(540, PF.rimY, rx, ry, 0, Math.PI, 30).reverse();
        const heap = pts.concat(front.reverse());
        fillPoly(ctx, heap, P.grounds);
        L.stipple(ctx, heap, { spacing: 6, color: P.beanMedium, alpha: 0.9, r: [0.8, 1.8], seed: sd('heapSt', heapH > 0 ? drawing(0) % 4 : 9) });
        L.hatch(ctx, heap, { angle: -Math.PI / 4, spacing: 5, width: 1.3, color: ink0, alpha: 0.75, length: [8, 24], seed: sd('heapH'), density: (x) => sstep(545, 640, x) });
        if (heapH > 3) ink(pts, { width: 2.2, color: ink0, seed: sd('heapL', drawing(0) % 3), taper: [8, 8] });
        else {
          // the tamped puck: flat, polished, a fine ring at the wall
          const pk = ell(540, PF.rimY + 3, rx - 6, ry - 3, 40);
          ink(pk, { closed: true, width: 1.6, color: P.beanMedium, alpha: 0.9, seed: sd('puckL') });
        }
      }

      // the grounds stream: on from T 31.50, off at T 32.25 (the tail falls over 4 frames)
      if (t >= B_GRIND) {
        const fall = 1182;
        const headU = hit(B_GRIND, 4, E.inQuad); // head reaches the heap in 4 frames
        const tailU = t >= B_PEAK ? clamp((t - B_PEAK) / (4 * FR)) : 0;
        const yHead = lerp(fall, impY, headU);
        const yTail = lerp(fall, impY, E.inQuad(tailU));
        if (yHead > yTail + 1) {
          const rr = L.rng(sd('stream', drawing(0)));
          const pa = new Path2D(), pb = new Path2D();
          const len = yHead - yTail;
          const cnt = Math.floor(len * 1.5);
          for (let i = 0; i < cnt; i++) {
            const y = yTail + rr() * len;
            const f = (y - fall) / (impY - fall);
            const x = 540 + rr.gauss() * (3.6 + 5.5 * f);
            const rad = rr.range(0.8, 2.0);
            const pth = rr() < 0.7 ? pa : pb;
            pth.moveTo(x + rad, y);
            pth.arc(x, y, rad, 0, TAU);
          }
          ctx.fillStyle = P.grounds;
          ctx.fill(pa);
          ctx.fillStyle = P.beanMedium;
          ctx.fill(pb);
          // a dusty core line
          const core = new Path2D();
          core.moveTo(540, yTail);
          core.lineTo(540, yHead);
          stroke(ctx, core, P.grounds, 0.7, 5);
          // tiny splash at the impact while flowing
          if (headU >= 1 && tailU === 0) {
            const sp = new Path2D();
            for (let i = 0; i < 14; i++) {
              const a = Math.PI + rr() * Math.PI;
              const d = rr.range(10, 34);
              const x = 540 + Math.cos(a) * d * 1.6, y = impY + Math.sin(a) * d * 0.5;
              sp.moveTo(x + 1.4, y);
              sp.arc(x, y, 1.4, 0, TAU);
            }
            ctx.fillStyle = P.grounds;
            ctx.fill(sp);
          }
        }
      }

      // ---- 7 tamper --------------------------------------------------------------
      if (t >= B_TAMP_IN) {
        const hover = PF.rimY - 76 - 34; // disk bottom just above the peak heap
        const enterU = E.outCubic(clamp((tw - B_TAMP_IN) / (B_TAMP - B_TAMP_IN - 1 / 12)));
        let yb = lerp(hover - 300, hover, enterU);
        if (tampK > 0) yb = lerp(hover, PF.rimY + 1, tampK);
        const a = clamp((t - B_TAMP_IN) / (3 * FR));
        ctx.save();
        ctx.globalAlpha = a;
        // cast shadow on the bowl rim while hovering
        // disk (cylinder)
        const dTop = yb - 26;
        const side = arcPts(540, dTop, 122, 27, Math.PI, 0, 28).concat(arcPts(540, yb, 122, 27, 0, Math.PI, 28));
        ink(side, { closed: true, width: 4, fill: steel, seed: sd('tdisk') });
        L.hatch(ctx, side, { angle: 0.04, spacing: 5, width: 1.3, color: steelDeep, alpha: 0.9, length: [10, 40], seed: sd('tdiskH'), density: (x) => sstep(560, 660, x) });
        ink(ell(540, dTop, 122, 27, 48), { closed: true, width: 3, fill: steelLight, seed: sd('tdiskT') });
        L.hatch(ctx, ell(540, dTop, 118, 24, 40), { angle: -Math.PI / 4, spacing: 7, width: 1.2, color: steelDeep, alpha: 0.6, seed: sd('tdiskTH'), density: (x) => sstep(560, 660, x) });
        // neck and wooden handle
        const neck = [[524, dTop - 6], [524, dTop - 62], [556, dTop - 62], [556, dTop - 6]];
        ink(neck, { closed: true, width: 3, fill: steel, seed: sd('tneck'), smooth: false });
        L.hatch(ctx, neck, { angle: 0, spacing: 5, width: 1.2, color: steelDeep, alpha: 0.85, length: [6, 14], seed: sd('tneckH'), density: (x) => sstep(540, 556, x) });
        const hdl = [[516, dTop - 60], [500, dTop - 100], [498, dTop - 150], [514, dTop - 178], [540, dTop - 186], [566, dTop - 178], [582, dTop - 150], [580, dTop - 100], [564, dTop - 60]];
        ink(hdl, { closed: true, width: 4, fill: P.wood, seed: sd('thdl'), double: true });
        L.hatch(ctx, hdl, { angle: 0.05, spacing: 5, width: 1.3, color: P.barkDeep, alpha: 0.85, length: [10, 30], bend: 2, seed: sd('thdlH'), density: (x) => sstep(546, 580, x) });
        const hh = new Path2D();
        hh.moveTo(512, dTop - 92);
        hh.quadraticCurveTo(508, dTop - 130, 518, dTop - 160);
        stroke(ctx, hh, P.white, 0.75, 3);
        ctx.restore();
        // motion lines above the tamper as it slams
        if (tampK > 0 && drawing(B_TAMP) < 3) {
          const ml = new Path2D();
          for (const dx of [-90, -60, 60, 90]) {
            ml.moveTo(540 + dx, yb - 230);
            ml.lineTo(540 + dx, yb - 150);
          }
          stroke(ctx, ml, ink0, 0.6, 2.2);
        }
        // puff of grounds squeezed out at the rim on the tamp (6 frames)
        const puff = t >= B_TAMP ? clamp((t - B_TAMP) / (6 * FR) + 1 / 6) : 0;
        if (puff > 0 && puff < 1) {
          const rr = L.rng(sd('puff'));
          const pp = new Path2D();
          for (let i = 0; i < 40; i++) {
            const sgn = rr() < 0.5 ? -1 : 1;
            const d = rr.range(10, 60) * E.outCubic(puff);
            const x = 540 + sgn * (130 + d), y = PF.rimY - rr.range(0, 30) * E.outCubic(puff) + 30 * puff * puff;
            const rad = rr.range(1, 2.2) * (1 - puff * 0.5);
            pp.moveTo(x + rad, y);
            pp.arc(x, y, rad, 0, TAU);
          }
          ctx.fillStyle = P.grounds;
          ctx.fill(pp);
        }
      }

      // ---- 8 overlays --------------------------------------------------------------
      {
        // annBlue rotation arrow around the burr: a front arc with an animated dash and an arrowhead
        ctx.save();
        ctx.strokeStyle = P.annBlue;
        ctx.fillStyle = P.annBlue;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = -t * 96;
        ctx.beginPath();
        ctx.ellipse(540, 880, 176, 44, 0, 0.12 * Math.PI, 0.88 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        const ae = 0.12 * Math.PI;
        const ex = 540 + Math.cos(ae) * 176, ey = 880 + Math.sin(ae) * 44;
        // tangent direction of travel (toward decreasing angle: left to right across the front)
        const tx = Math.sin(ae) * 176, ty = -Math.cos(ae) * 44;
        const tl = Math.hypot(tx, ty);
        const ux = tx / tl, uy = ty / tl, nx = -uy, ny = ux;
        ctx.beginPath();
        ctx.moveTo(ex + ux * 10, ey + uy * 10);
        ctx.lineTo(ex - ux * 12 + nx * 9, ey - uy * 12 + ny * 9);
        ctx.lineTo(ex - ux * 12 - nx * 9, ey - uy * 12 - ny * 9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // the back half of the motion ellipse, faint, behind nothing (drawn thin)
        ctx.save();
        ctx.strokeStyle = P.annBlue;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 9]);
        ctx.lineDashOffset = t * 96;
        ctx.beginPath();
        ctx.ellipse(540, 880, 176, 44, 0, 1.06 * Math.PI, 1.94 * Math.PI);
        ctx.stroke();
        ctx.restore();

        // annYellow fineness ruler beside the stream (draws on with the grounds)
        const rk = hit(B_GRIND, 6, E.outExpo);
        if (rk > 0) {
          L.ticks(ctx, 600, 1200, { length: 120, angle: Math.PI / 2, n: 20, len: 9, major: 5, majorLen: 20, side: 1, color: P.annYellow, alpha: 1, width: 2, p: rk });
          L.bracket(ctx, 586, 1236, 586, 1260, { style: 'square', cap: 10, color: P.annYellow, alpha: rk, width: 2.5, p: rk });
          // magnified grain circle linked to the ruler
          const mx = 690, my = 1248;
          ctx.save();
          ctx.globalAlpha = rk;
          ctx.strokeStyle = P.annYellow;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(mx, my, 30 * rk, 0, TAU);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(624, 1248);
          ctx.lineTo(mx - 30 * rk, my);
          ctx.stroke();
          const mg = new Path2D();
          const rr = L.rng(sd('mag'));
          for (let i = 0; i < 26; i++) {
            const a = rr() * TAU, d = Math.sqrt(rr()) * 22 * rk;
            const x = mx + Math.cos(a) * d, y = my + Math.sin(a) * d;
            mg.moveTo(x + 2.2, y);
            mg.arc(x, y, rr.range(1.4, 2.6), 0, TAU);
          }
          ctx.fillStyle = P.grounds;
          ctx.fill(mg);
          ctx.restore();
        }

        // annYellow attention ring on the heap at its peak (8 frames)
        if (t >= B_PEAK && t < B_PEAK + 10 * FR) {
          const u = clamp((t - B_PEAK) / (10 * FR) + 0.1);
          ctx.save();
          ctx.strokeStyle = P.annYellow;
          ctx.globalAlpha = 1 - u * u;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(540, PF.rimY - 30, 120 + 70 * E.outExpo(u), 50 + 26 * E.outExpo(u), 0, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }

        // annMagenta dose ring on the tamp (12 frames)
        if (t >= B_TAMP) {
          const u = clamp((t - B_TAMP) / (12 * FR) + 1 / 12);
          if (u < 1) {
            ctx.save();
            ctx.strokeStyle = P.annMagenta;
            ctx.globalAlpha = 1 - u * u;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(540, PF.rimY + 4, 170 + 110 * E.outExpo(u), 44 + 30 * E.outExpo(u), 0, 0, TAU);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(540, PF.rimY + 4, 160 + 50 * E.outExpo(u), 40 + 14 * E.outExpo(u), 0, 0, TAU);
            ctx.globalAlpha = 0.6 * (1 - u);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
          }
          // a level line on the tamped puck (stays)
          const lv = new Path2D();
          lv.moveTo(372, PF.rimY + 1);
          lv.lineTo(708, PF.rimY + 1);
          stroke(ctx, lv, P.annMagenta, 0.9 * clamp((t - B_TAMP) / (6 * FR) + 1 / 6), 2.5, [14, 10]);
        }
      }
    },
  });
})();
