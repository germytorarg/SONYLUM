// 19 cup-pullback : Pull-back: cup, café, window, mountain.  T 37.50 to 40.50 (72 frames), illustrated.
// One continuous log-linear zoom out, 1.0 -> 0.4 -> 0.16 -> 0.07 -> 0.05, each knot on a beat
// (T 38.25, 39.00, 39.75). Frame 0 is the inked G3 cup with caramel crema and steam, on the same
// pixels shot 18 ends on. The camera keeps the cup at screen (540, 1100) until T 39.00, then drifts
// so the café window is centred by T 40.50; through the window, terraced coffee mountains under a
// morning sun.
//
// One world, in L1 (cup) pixels: 1 cm is about 55 px, so the table is 3800 px across and the room
// is about 4 m (22000 px). Every pen size (ink width, wobble, hatch spacing, stipple radius) is
// divided by the zoom, so lines stay screen-constant at every layer as in the butterfly pull-back;
// objects outside the view or too small to read are culled, and long lines and hatch clips are cut
// to the visible rectangle.
//
// Layers, back to front:
//   1 stripes (stripeCream / stripeYellow): the café wall and the sky behind the window
//   2 landscape inside the window: sun, far ridge, terraced mountain, near terraces, shade tree
//   3 room: window frame and sill (with a potted seedling), picture, shelf, wainscot, floor tiles,
//     hanging lamp, counter with the espresso machine, bistro chair
//   4 table: pedestal, round wood top, sugar bowl, water glass, book, the hand in a tealDeep sleeve
//   5 L1 cup: saucer, spoon, cup body, handle, rim, crema, steam
//   6 overlays: annYellow ring 1.4x the cup radius, annBlue arc annotation around the window
(function () {
  'use strict';

  const ID = 'cup-pullback';
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
  // camera: log-linear zoom through the knots, cup anchored, then drift to the window
  // ---------------------------------------------------------------------------

  const KN = [[0, 1], [0.75, 0.4], [1.5, 0.16], [2.25, 0.07], [3.0, 0.05]];
  const ANCHOR = [540, 1100];
  const WIN = { x0: -6400, x1: 7400, y0: -13400, y1: -1200 };
  const WIN_C = [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2];

  function zoomAt(t) {
    let i = 0;
    while (i < KN.length - 2 && t >= KN[i + 1][0]) i++;
    const u = clamp((t - KN[i][0]) / (KN[i + 1][0] - KN[i][0]));
    // a slight breath at each knot so every layer lands on its beat
    const e = u - (0.12 * Math.sin(TAU * u)) / TAU;
    return Math.exp(lerp(Math.log(KN[i][1]), Math.log(KN[i + 1][1]), e));
  }
  function camAt(t) {
    const z = zoomAt(t);
    let x = ANCHOR[0] - (ANCHOR[0] - 540) / z, y = ANCHOR[1] - (ANCHOR[1] - 960) / z;
    if (t > 1.5) {
      const k = LIB.ease.inOutSine((t - 1.5) / 1.5);
      x = lerp(x, WIN_C[0], k);
      y = lerp(y, WIN_C[1], k);
    }
    return { z, x, y };
  }

  // ---------------------------------------------------------------------------
  // geometry helpers
  // ---------------------------------------------------------------------------

  function clipPolyRect(pts, x0, y0, x1, y1) {
    let out = pts;
    const inside = [(p) => p[0] >= x0, (p) => p[0] <= x1, (p) => p[1] >= y0, (p) => p[1] <= y1];
    const cut = [
      (a, b) => [x0, lerp(a[1], b[1], (x0 - a[0]) / (b[0] - a[0]))],
      (a, b) => [x1, lerp(a[1], b[1], (x1 - a[0]) / (b[0] - a[0]))],
      (a, b) => [lerp(a[0], b[0], (y0 - a[1]) / (b[1] - a[1])), y0],
      (a, b) => [lerp(a[0], b[0], (y1 - a[1]) / (b[1] - a[1])), y1],
    ];
    for (let e = 0; e < 4; e++) {
      const inp = out;
      out = [];
      if (!inp.length) break;
      for (let i = 0; i < inp.length; i++) {
        const a = inp[(i + inp.length - 1) % inp.length], b = inp[i];
        const ia = inside[e](a), ib = inside[e](b);
        if (ib) {
          if (!ia) out.push(cut[e](a, b));
          out.push(b);
        } else if (ia) out.push(cut[e](a, b));
      }
    }
    return out;
  }
  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return [x0, y0, x1, y1];
  }
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const ell = (cx, cy, rx, ry, n = 64, a0 = 0, a1 = TAU) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    if (Math.abs(a1 - a0 - TAU) < 1e-9) out.pop();
    return out;
  };

  // ---------------------------------------------------------------------------
  // the zoom-aware pen. Z = { k: zoom, v: [x0, y0, x1, y1] visible world rect }
  // ---------------------------------------------------------------------------

  const visB = (Z, b, pad = 0) => !(b[2] < Z.v[0] - pad || b[0] > Z.v[2] + pad || b[3] < Z.v[1] - pad || b[1] > Z.v[3] + pad);
  const insideV = (Z, b) => b[0] >= Z.v[0] && b[2] <= Z.v[2] && b[1] >= Z.v[1] && b[3] <= Z.v[3];
  const scr = (Z, b) => Math.max(b[2] - b[0], b[3] - b[1]) * Z.k; // screen size of a bbox
  // drawable: on screen and at least px pixels across
  const shows = (Z, b, px = 3) => visB(Z, b, 4 / Z.k) && scr(Z, b) >= px;

  function ink(ctx, Z, pts, o = {}) {
    const k = 1 / Z.k;
    const w = o.width != null ? o.width : 3;
    const q = Object.assign({}, o, {
      width: w * k,
      wobble: (o.wobble != null ? o.wobble : 2) * k,
      tremble: (o.tremble != null ? o.tremble : 0.4) * k,
      boilAmp: (o.boilAmp != null ? o.boilAmp : 0.7) * k,
      rough: (o.rough != null ? o.rough : 0.22 + 0.07 * w) * k,
      step: (o.step || 4.5) * k,
    });
    const tp = o.taper != null ? o.taper : o.closed ? [10, 22] : [18, 34];
    q.taper = Array.isArray(tp) ? [tp[0] * k, tp[1] * k] : tp * k;
    if (o.double) q.double = { offset: (w / 2 + 3) * k, width: 1.5 * k, alpha: 0.4 };
    LIB.inkPath(ctx, pts, q);
  }

  function runsIn(Z, pts, closed) {
    const src = closed ? pts.concat([pts[0]]) : pts;
    const pad = 60 / Z.k;
    const x0 = Z.v[0] - pad, y0 = Z.v[1] - pad, x1 = Z.v[2] + pad, y1 = Z.v[3] + pad;
    const out = [];
    let cur = null;
    for (let i = 0; i < src.length; i++) {
      const p = src[i];
      const inside = p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
      if (inside) {
        if (!cur) {
          cur = [];
          if (i > 0) cur.push(src[i - 1]);
        }
        cur.push(p);
      } else if (cur) {
        cur.push(p);
        out.push(cur);
        cur = null;
      }
    }
    if (cur) out.push(cur);
    return out.filter((r) => r.length > 1);
  }

  function fillPoly(ctx, pts, color, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    LIB.tracePath(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  }

  // ink a shape: whole when it sits inside the view, only its visible runs when it does not
  function inkS(ctx, Z, pts, o = {}) {
    const b = o.b || bbox(pts);
    if (!shows(Z, b, o.minPx || 2)) return;
    const size = scr(Z, b);
    if (size < 160) {
      // small on screen: a plain boiling polyline (fill + stroke) instead of the full ink ribbon
      const bi = LIB.boil(LIB.T);
      const seed = LIB.hash(o.seed || 1) | 0;
      const j = (0.55 / Z.k);
      const path = new Path2D();
      const step = Math.max(1, Math.floor(pts.length / 40));
      for (let i = 0; i < pts.length; i += step) {
        const x = pts[i][0] + (LIB.h3(i, bi, seed) - 0.5) * 2 * j, y = pts[i][1] + (LIB.h3(bi, i, seed + 1) - 0.5) * 2 * j;
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
      if (!o.closed && (pts.length - 1) % step) path.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      if (o.closed) path.closePath();
      ctx.save();
      if (o.closed && o.fill) {
        ctx.globalAlpha = o.fillAlpha != null ? o.fillAlpha : 1;
        ctx.fillStyle = o.fill;
        ctx.fill(path);
      }
      ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
      ctx.strokeStyle = o.color || LIB.pal.ink;
      ctx.lineWidth = (o.width != null ? o.width : 3) * 0.85 / Z.k;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke(path);
      ctx.restore();
      return;
    }
    if (insideV(Z, b) || size < 300) {
      ink(ctx, Z, pts, o);
      return;
    }
    if (o.closed && o.fill) fillPoly(ctx, pts, o.fill, o.fillAlpha != null ? o.fillAlpha : 1);
    const runs = runsIn(Z, pts, !!o.closed);
    const q = Object.assign({}, o, { closed: false, fill: null });
    runs.forEach((r, i) => ink(ctx, Z, r, Object.assign({}, q, { seed: (o.seed || 1) + i * 31, taper: [0, 0] })));
  }

  function hatchZ(ctx, Z, poly, o = {}, cross = false) {
    const b = bbox(poly);
    if (!shows(Z, b, o.minPx || 30)) return;
    const k = 1 / Z.k;
    const pad = 30 * k;
    const cp = insideV(Z, b) ? poly : clipPolyRect(poly, Z.v[0] - pad, Z.v[1] - pad, Z.v[2] + pad, Z.v[3] + pad);
    if (cp.length < 3) return;
    const len = o.length || [16, 64];
    const gap = o.gap || [2, 7];
    const q = Object.assign({}, o, {
      spacing: (o.spacing || 8) * k,
      crossSpacing: o.crossSpacing ? o.crossSpacing * k : undefined,
      width: (o.width != null ? o.width : 1.4) * k,
      length: [len[0] * k, len[1] * k],
      gap: [gap[0] * k, gap[1] * k],
      inset: (o.inset != null ? o.inset : 6) * k,
      overshoot: (o.overshoot != null ? o.overshoot : 3) * k,
      bow: (o.bow != null ? o.bow : 0.7) * k,
      bend: (o.bend || 0) * k,
      boilAmp: (o.boilAmp != null ? o.boilAmp : 0.45) * k,
    });
    if (cross) LIB.crossHatch(ctx, cp, q);
    else LIB.hatch(ctx, cp, q);
  }

  function stippleZ(ctx, Z, poly, o = {}) {
    const b = bbox(poly);
    if (!shows(Z, b, o.minPx || 30)) return;
    const k = 1 / Z.k;
    const pad = 20 * k;
    const cp = insideV(Z, b) ? poly : clipPolyRect(poly, Z.v[0] - pad, Z.v[1] - pad, Z.v[2] + pad, Z.v[3] + pad);
    if (cp.length < 3) return;
    const r = o.r || [1.0, 2.2];
    LIB.stipple(ctx, cp, Object.assign({}, o, { spacing: (o.spacing || 7.5) * k, r: [r[0] * k, r[1] * k], boilAmp: (o.boilAmp != null ? o.boilAmp : 0.35) * k }));
  }

  // a plain stroked path with a screen-constant width
  function strokeZ(ctx, Z, path, color, width, alpha = 1, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha *= alpha;
    ctx.lineWidth = width / Z.k;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash.map((d) => d / Z.k));
    ctx.stroke(path);
    ctx.restore();
  }

  // a tapering tube along a centreline (chair rods, pedestal, lamp cord)
  function tube(line, w0, w1) {
    const sm = LIB.smoothPts(line, false, 10);
    const n = sm.length;
    const A = [], B = [];
    for (let i = 0; i < n; i++) {
      const a = sm[Math.max(0, i - 1)], b = sm[Math.min(n - 1, i + 1)];
      const tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      const w = lerp(w0, w1, i / Math.max(1, n - 1)) / 2;
      A.push([sm[i][0] - (ty / tl) * w, sm[i][1] + (tx / tl) * w]);
      B.push([sm[i][0] + (ty / tl) * w, sm[i][1] - (tx / tl) * w]);
    }
    return A.concat(B.reverse());
  }

  // ---------------------------------------------------------------------------
  // static geometry
  // ---------------------------------------------------------------------------

  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const r = LIB.rng(sd('geo'));
    const G = {};
    // --- L1 cup on G3 ---
    G.rimO = ell(540, 1080, 250, 70, 96);
    G.rimI = ell(540, 1080, 238, 62, 96);
    G.liquid = ell(540, 1102, 232, 60, 96);
    const front = ell(540, 1080, 250, 70, 40, 0, Math.PI); // 790 -> 290 through the front
    const left = LIB.smoothPts([[290, 1080], [294, 1170], [316, 1270], [356, 1350], [392, 1398]], false, 10);
    const foot = ell(540, 1395, 160, 34, 24, Math.PI * 0.94, Math.PI * 0.06).reverse();
    const footF = ell(540, 1395, 160, 34, 30, Math.PI * 0.94, Math.PI * 0.06);
    const right = LIB.smoothPts([[688, 1398], [724, 1350], [764, 1270], [786, 1170], [790, 1080]], false, 10);
    G.body = left.concat(footF, right, front.slice(1, front.length - 1));
    void foot;
    G.saucerTop = ell(540, 1420, 400, 96, 96);
    G.saucerUnder = ell(540, 1436, 392, 92, 96);
    G.saucerWell = ell(540, 1420, 190, 44, 64);
    G.handle = LIB.smoothPts([[782, 1130], [858, 1128], [905, 1200], [884, 1268], [810, 1300], [752, 1300]], false, 6);
    G.spoonBowl = LIB.ellipsePts(632, 1458, 56, 21, 32, 0.06);
    G.spoonHandle = tube([[684, 1462], [780, 1466], [860, 1468], [920, 1470]], 18, 10);
    G.cupShadow = ell(600, 1440, 210, 46, 48);
    // crema mottling blobs (in liquid-local units, -1..1)
    G.blobs = [];
    for (let i = 0; i < 26; i++) G.blobs.push([r.range(-0.85, 0.85), r.range(-0.75, 0.75), r.range(0.06, 0.18), r.range(0.4, 1), r() * TAU, r() < 0.5]);
    // --- L2 table ---
    G.top = ell(560, 1350, 1900, 600, 160);
    const edgeF = ell(560, 1350, 1900, 600, 80, 0, Math.PI);
    G.edge = edgeF.concat(edgeF.slice().reverse().map((p) => [p[0], p[1] + 80]));
    G.grain = [];
    for (let i = 0; i < 16; i++) {
      const f = r.range(0.15, 0.95), a0 = r.range(0, TAU), span = r.range(0.6, 2.2);
      G.grain.push(ell(560 + r.range(-80, 80), 1350 + r.range(-30, 30), 1900 * f, 600 * f, 30, a0, a0 + span));
    }
    G.pedestal = [[470, 1960], [650, 1960], [612, 2400], [598, 4900], [522, 4900], [508, 2400]];
    G.foot = ell(560, 5000, 820, 170, 64);
    G.footRim = ell(560, 5040, 820, 170, 64, 0, Math.PI);
    // sugar bowl
    G.sugarBody = ell(-520, 1130, 230, 70, 32, Math.PI, TAU).concat(LIB.smoothPts([[-290, 1130], [-300, 1260], [-380, 1360], [-520, 1384], [-660, 1360], [-740, 1260], [-750, 1130]], false, 12));
    G.sugarLid = ell(-520, 1130, 230, 70, 48);
    G.sugarKnob = ell(-520, 1070, 50, 34, 20);
    // water glass
    G.glass = LIB.smoothPts([[-110, 560], [-118, 760], [-104, 980], [-50, 1004], [80, 1004], [136, 980], [150, 760], [142, 560]], false, 12);
    G.glassTop = ell(16, 560, 126, 34, 48);
    G.glassWater = ell(18, 700, 130, 34, 48);
    // book
    G.book = [[1180, 1160], [1960, 1030], [2280, 1290], [1480, 1440]];
    G.bookEdge = [[1480, 1440], [2280, 1290], [2280, 1350], [1480, 1500]];
    G.bookEdgeL = [[1180, 1160], [1480, 1440], [1480, 1500], [1180, 1220]];
    // hand and sleeve
    G.sleeve = tube([[2900, 2700], [2300, 2200], [1640, 1790]], 470, 360);
    G.cuff = tube([[1720, 1840], [1600, 1760]], 400, 380);
    G.forearm = tube([[1700, 1830], [1470, 1690]], 300, 250);
    G.palm = LIB.ellipsePts(1340, 1630, 190, 120, 40, -0.42);
    G.fingers = [];
    for (let i = 0; i < 4; i++) {
      const bx = 1210 - i * 22, by = 1575 + i * 44;
      G.fingers.push(LIB.capsulePts(bx - 30 + i * 10, by, 230 - i * 22, 33 - i * 2, Math.PI - 0.12 + i * 0.05, 36));
    }
    G.thumb = LIB.capsulePts(1215, 1495, 200, 38, Math.PI + 0.5, 36);
    // the hand rests a little to the right of the saucer, clear of the frame on frame 0
    const HX = 230, HY = 70;
    for (const k of ['sleeve', 'cuff', 'forearm', 'palm', 'thumb']) G[k] = G[k].map((p) => [p[0] + HX, p[1] + HY]);
    G.fingers = G.fingers.map((f) => f.map((p) => [p[0] + HX, p[1] + HY]));
    // --- L3 room ---
    G.wallBase = 3000;
    G.floor = rect(-60000, 3000, 60000, 60000);
    G.wainscot = rect(-60000, 1500, 60000, 3000);
    G.tiles = [];
    for (let k = 0; k < 18; k++) G.tiles.push(3000 + 700 * (Math.pow(1.22, k) - 1) * 1.6);
    G.tileRays = [];
    for (let k = -40; k <= 40; k++) G.tileRays.push(k * 1600);
    G.frameO = rect(WIN.x0 - 380, WIN.y0 - 380, WIN.x1 + 380, WIN.y1 + 120);
    G.sill = [[WIN.x0 - 700, WIN.y1 + 120], [WIN.x1 + 700, WIN.y1 + 120], [WIN.x1 + 560, WIN.y1 + 520], [WIN.x0 - 560, WIN.y1 + 520]];
    G.pot = [[-3900, -1700], [-3100, -1700], [-3220, -1200 + 120], [-3780, -1200 + 120]];
    G.picture = rect(-10200, -8600, -7700, -5000);
    G.pictureIn = rect(-9900, -8300, -8000, -5300);
    G.shelf = rect(8400, -4200, 13000, -3950);
    G.jars = [];
    for (let i = 0; i < 6; i++) G.jars.push([8800 + i * 820, -4200, r.range(260, 360), r.range(600, 1000), r.int(0, 2)]);
    G.counter = rect(3600, 1350, 60000, 3600);
    G.counterTop = rect(3400, 1250, 60000, 1450);
    G.machine = LIB.rrectPts(4300, -1700, 3200, 2950, 300, 60);
    G.machineTop = rect(4200, -1900, 7600, -1700);
    G.chairSeat = ell(-2900, 2700, 760, 210, 48);
    G.chairBack = LIB.smoothPts([[-3560, 2650], [-3620, 1400], [-3420, 600], [-2900, 420], [-2380, 600], [-2180, 1400], [-2240, 2650]], false, 30);
    G.chairLegs = [
      tube([[-3500, 2780], [-3620, 4000], [-3720, 5100]], 120, 90),
      tube([[-2300, 2780], [-2180, 4000], [-2080, 5100]], 120, 90),
      tube([[-3150, 2860], [-3170, 4100], [-3210, 5400]], 120, 90),
      tube([[-2650, 2860], [-2630, 4100], [-2590, 5400]], 120, 90),
    ];
    G.chairRing = ell(-2900, 4300, 520, 130, 40);
    G.lampShade = [[360, -5200], [720, -5200], [1460, -3900], [-380, -3900]];
    G.lampRim = ell(540, -3900, 920, 160, 48);
    G.lampCord = [[540, -60000], [540, -5200]];
    // --- L4 landscape inside the window ---
    const ridge = (y0, amp, seed, peaks) => {
      const pts = [];
      for (let x = WIN.x0 - 400; x <= WIN.x1 + 400; x += 200) {
        let y = y0;
        for (const [px, ph, pw] of peaks) y -= ph * Math.exp(-((x - px) * (x - px)) / (2 * pw * pw));
        y += amp * LIB.noise1(x * 0.0007, seed) + amp * 0.35 * LIB.noise1(x * 0.003, seed + 5);
        pts.push([x, y]);
      }
      return pts;
    };
    G.far = ridge(-6600, 300, sd('far'), [[-3600, 1500, 1800], [3200, 2300, 2200]]);
    G.mid = ridge(-4300, 220, sd('mid'), [[300, 2100, 2800], [6200, 1000, 1500]]);
    G.near = ridge(-2500, 160, sd('near'), [[-4200, 900, 1700], [4600, 500, 1500]]);
    const terr = (base, rows, gap, bushR, step, key, x0 = WIN.x0, x1 = WIN.x1) => {
      const rowsOut = [];
      const rr = LIB.rng(sd('terr', key));
      for (let k = 1; k <= rows; k++) {
        const row = [];
        const bushes = [];
        for (let i = 0; i < base.length; i++) row.push([base[i][0], base[i][1] + k * gap + 30 * Math.sin(base[i][0] * 0.001 + k)]);
        for (let x = x0 + rr.range(0, step); x < x1; x += step * rr.range(0.85, 1.15)) {
          const j = Math.max(0, Math.min(base.length - 2, Math.floor((x - base[0][0]) / 200)));
          const u = (x - row[j][0]) / 200;
          const y = lerp(row[j][1], row[j + 1][1], u);
          bushes.push([x, y - bushR * 0.6, bushR * rr.range(0.8, 1.15)]);
        }
        rowsOut.push({ row, bushes });
      }
      return rowsOut;
    };
    G.midTerr = terr(G.mid, 11, 260, 85, 230, 'mid');
    G.nearTerr = terr(G.near, 6, 230, 135, 330, 'near');
    G.tree = { trunk: tube([[3500, -1200], [3560, -2600], [3380, -3600]], 230, 150), canopy: [] };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      G.tree.canopy.push([3400 + Math.cos(a) * 900 * r.range(0.8, 1.1), -3900 + Math.sin(a) * 420 * r.range(0.8, 1.1), r.range(420, 620)]);
    }
    G.clouds = [[1400, -11600, 1000], [-1200, -9700, 650], [5200, -10400, 800]];
    GEO = G;
    return G;
  }

  // ---------------------------------------------------------------------------
  // layer drawers
  // ---------------------------------------------------------------------------

  function drawLandscape(ctx, Z, P, G, tw) {
    const W = [WIN.x0, WIN.y0, WIN.x1, WIN.y1];
    if (!shows(Z, W, 20)) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
    ctx.clip();
    const close = (pts) => pts.concat([[WIN.x1 + 400, WIN.y1 + 400], [WIN.x0 - 400, WIN.y1 + 400]]);
    // morning sun with short rays
    const sun = [-3700, -10900];
    const rays = new Path2D();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + tw * 0.15;
      rays.moveTo(sun[0] + Math.cos(a) * 820, sun[1] + Math.sin(a) * 820);
      rays.lineTo(sun[0] + Math.cos(a) * (i % 2 ? 1040 : 1200), sun[1] + Math.sin(a) * (i % 2 ? 1040 : 1200));
    }
    strokeZ(ctx, Z, rays, P.ochre, 2, 0.9);
    inkS(ctx, Z, ell(sun[0], sun[1], 650, 650, 48), { closed: true, width: 2.5, fill: P.sun, seed: sd('sun') });
    for (let i = 0; i < G.clouds.length; i++) {
      const [cx, cy, s] = G.clouds[i];
      const pts = [];
      for (let k = 0; k < 28; k++) {
        const a = (k / 28) * TAU;
        const bump = 1 + 0.18 * Math.abs(Math.sin(a * 3 + i));
        pts.push([cx + Math.cos(a) * s * 1.6 * bump, cy + Math.min(0.2, Math.sin(a)) * s * 0.55 * bump]);
      }
      inkS(ctx, Z, pts, { closed: true, width: 2, fill: P.white, seed: sd('cloud', i), wobble: 1 });
    }
    // far ridge, pale
    const far = close(G.far);
    fillPoly(ctx, far, LIB.mix(P.sage, P.stripeSky, 0.55));
    inkS(ctx, Z, G.far, { width: 2, seed: sd('farI'), taper: [0, 0] });
    hatchZ(ctx, Z, far, { angle: -0.3, spacing: 10, width: 1.1, color: P.tealDeep, alpha: 0.35, seed: sd('farH'), density: 0.5 });
    // mid mountain with terraces of coffee
    const mid = close(G.mid);
    fillPoly(ctx, mid, P.sage);
    inkS(ctx, Z, G.mid, { width: 2.5, seed: sd('midI'), taper: [0, 0] });
    hatchZ(ctx, Z, mid, { spacing: 9, width: 1.2, color: P.leafDeep, alpha: 0.45, seed: sd('midH'), density: (x, y) => sstep(-1500, 4500, x) * 0.8 });
    const terr = (list, bushCol, w) => {
      const rows = new Path2D(), bush = new Path2D(), hi = new Path2D();
      for (const t of list) {
        LIB.tracePath(rows, t.row, false);
        for (const [x, y, rr] of t.bushes) {
          if (x + rr < Z.v[0] || x - rr > Z.v[2] || y + rr < Z.v[1] || y - rr > Z.v[3]) continue;
          bush.moveTo(x + rr, y);
          bush.arc(x, y, rr, 0, TAU);
          bush.moveTo(x - rr * 0.45 + rr * 0.7, y + rr * 0.2);
          bush.arc(x - rr * 0.45, y + rr * 0.2, rr * 0.7, 0, TAU);
          bush.moveTo(x + rr * 0.5 + rr * 0.65, y + rr * 0.25);
          bush.arc(x + rr * 0.5, y + rr * 0.25, rr * 0.65, 0, TAU);
          hi.moveTo(x - rr * 0.35 + rr * 0.3, y - rr * 0.3);
          hi.arc(x - rr * 0.35, y - rr * 0.3, rr * 0.3, 0, TAU);
        }
      }
      strokeZ(ctx, Z, rows, P.inkSoft, w * 0.7, 0.7);
      // outline of the lobed union: a wide ink stroke under the fill
      strokeZ(ctx, Z, bush, P.ink, w * 1.3, 0.9);
      ctx.save();
      ctx.fillStyle = bushCol;
      ctx.fill(bush);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = P.leafLight;
      ctx.globalAlpha = 0.7;
      ctx.fill(hi);
      ctx.restore();
    };
    terr(G.midTerr, P.leafCoffee, 1.6);
    // near slope, bigger terraces, shade tree
    const near = close(G.near);
    fillPoly(ctx, near, LIB.mix(P.leafLight, P.sage, 0.4));
    inkS(ctx, Z, G.near, { width: 3, seed: sd('nearI'), taper: [0, 0] });
    hatchZ(ctx, Z, near, { spacing: 8, width: 1.3, color: P.leafDeep, alpha: 0.5, seed: sd('nearH'), density: (x, y) => 0.25 + 0.6 * sstep(-2600, -1300, y) });
    terr(G.nearTerr, LIB.mix(P.leafCoffee, P.leafDeep, 0.2), 2);
    inkS(ctx, Z, G.tree.trunk, { closed: true, width: 2.5, fill: P.bark, seed: sd('treeT') });
    for (let i = 0; i < G.tree.canopy.length; i++) {
      const [cx, cy, rr] = G.tree.canopy[i];
      inkS(ctx, Z, ell(cx, cy, rr, rr * 0.7, 28), { closed: true, width: 2.5, fill: LIB.mix(P.leafCoffee, P.sage, 0.3), seed: sd('canopy', i), wobble: 3 });
    }
    const canopyAll = ell(3400, -3800, 1350, 700, 40);
    hatchZ(ctx, Z, canopyAll, { spacing: 7, width: 1.3, color: P.leafDeep, alpha: 0.7, seed: sd('canH'), density: (x, y) => sstep(-200, 700, (x - 3400) * 0.5 + (y + 3800) * 0.9) });
    // window glare on the glass
    const glare = new Path2D();
    for (const [x, y, l] of [[-5000, -3000, 2600], [-4400, -2600, 1300], [1800, -9800, 2800], [2500, -9300, 1400]]) {
      glare.moveTo(x, y);
      glare.lineTo(x + l * 0.7, y - l * 0.7);
    }
    strokeZ(ctx, Z, glare, P.white, 3, 0.55);
    ctx.restore();
  }

  function drawRoom(ctx, Z, P, G, tw) {
    // floor tiles in perspective toward a vanishing point above the window
    if (Z.v[3] > G.wallBase) {
      const fl = clipPolyRect(G.floor, Z.v[0] - 400 / Z.k, Z.v[1], Z.v[2] + 400 / Z.k, Z.v[3] + 400 / Z.k);
      if (fl.length > 2) {
        fillPoly(ctx, fl, LIB.mix(P.tan, P.paper, 0.35));
        const vp = [540, -14000];
        const lines = new Path2D();
        for (const y of G.tiles) {
          lines.moveTo(Z.v[0] - 100 / Z.k, y);
          lines.lineTo(Z.v[2] + 100 / Z.k, y);
        }
        const yB = Z.v[3] + 200 / Z.k;
        for (const xk of G.tileRays) {
          const x0 = vp[0] + (xk - vp[0]) * ((G.wallBase - vp[1]) / (60000 - vp[1]));
          const x1 = vp[0] + (xk - vp[0]) * ((yB - vp[1]) / (60000 - vp[1]));
          lines.moveTo(x0, G.wallBase);
          lines.lineTo(x1, yB);
        }
        strokeZ(ctx, Z, lines, P.inkSoft, 1.6, 0.8);
        hatchZ(ctx, Z, fl, { angle: 0.02, spacing: 9, width: 1.2, color: P.inkSoft, alpha: 0.45, seed: sd('floorH'), density: (x, y) => 1 - sstep(G.wallBase, G.wallBase + 5000, y), angleJitter: 0.02 });
      }
    }
    // wainscot
    if (shows(Z, [-60000, 1500, 60000, 3000])) {
      const ws = clipPolyRect(G.wainscot, Z.v[0] - 400 / Z.k, Z.v[1], Z.v[2] + 400 / Z.k, Z.v[3]);
      if (ws.length > 2) {
        fillPoly(ctx, ws, LIB.mix(P.wood, P.paper, 0.2));
        hatchZ(ctx, Z, ws, { angle: Math.PI / 2, spacing: 10, width: 1.2, color: P.barkDeep, alpha: 0.5, seed: sd('wainH'), length: [40, 120] });
        const pan = new Path2D();
        const s = 1500;
        for (let x = Math.floor(Z.v[0] / s) * s; x <= Z.v[2]; x += s) {
          pan.moveTo(x, 1700);
          pan.lineTo(x, 2850);
        }
        strokeZ(ctx, Z, pan, P.barkDeep, 2, 0.8);
        inkS(ctx, Z, [[Z.v[0] - 200 / Z.k, 1500], [Z.v[2] + 200 / Z.k, 1500]], { width: 3, taper: [0, 0], seed: sd('rail') });
        inkS(ctx, Z, [[Z.v[0] - 200 / Z.k, G.wallBase], [Z.v[2] + 200 / Z.k, G.wallBase]], { width: 3.5, taper: [0, 0], seed: sd('base') });
      }
    }
    // picture on the wall: a little cherry study
    if (shows(Z, bbox(G.picture), 8)) {
      inkS(ctx, Z, G.picture, { closed: true, width: 3, fill: P.wood, seed: sd('pic'), smooth: false });
      inkS(ctx, Z, G.pictureIn, { closed: true, width: 2, fill: P.paper, seed: sd('picIn'), smooth: false });
      inkS(ctx, Z, [[-9300, -6900], [-8500, -7050], [-7700, -6800]], { width: 2.5, color: P.barkDeep, seed: sd('picB') });
      for (const [x, y, k] of [[-8900, -6500, 'cherryRed'], [-8400, -6450, 'cherryYellow'], [-8150, -6550, 'cherryRed'], [-8650, -6200, 'cherryGreen']]) {
        inkS(ctx, Z, ell(x, y, 190, 210, 20), { closed: true, width: 2, fill: P[k], seed: sd('picC', x) });
      }
      inkS(ctx, Z, ell(-8400, -7500, 420, 170, 20, 0, TAU), { closed: true, width: 2, fill: P.leafCoffee, seed: sd('picL') });
    }
    // shelf with jars over the counter
    if (shows(Z, bbox(G.shelf), 8)) {
      for (let i = 0; i < G.jars.length; i++) {
        const [x, y, w, h, k] = G.jars[i];
        const jar = LIB.rrectPts(x - w / 2, y - h, w, h, w * 0.25, 60);
        inkS(ctx, Z, jar, { closed: true, width: 2.2, fill: [P.ceramic, P.jute, P.beanMedium][k], seed: sd('jar', i) });
        hatchZ(ctx, Z, jar, { spacing: 6, width: 1.1, color: P.ink, alpha: 0.5, seed: sd('jarH', i), density: (px) => sstep(x - w * 0.1, x + w * 0.5, px) });
      }
      inkS(ctx, Z, G.shelf, { closed: true, width: 2.5, fill: P.wood, seed: sd('shelf'), smooth: false });
    }
    // window frame and sill
    const fo = G.frameO;
    if (shows(Z, bbox(fo), 8)) {
      const k = 1 / Z.k;
      const t = 380;
      const bars = [
        rect(WIN.x0 - t, WIN.y0 - t, WIN.x1 + t, WIN.y0),
        rect(WIN.x0 - t, WIN.y0, WIN.x0, WIN.y1),
        rect(WIN.x1, WIN.y0, WIN.x1 + t, WIN.y1),
        rect(WIN_C[0] - 110, WIN.y0, WIN_C[0] + 110, WIN.y1),
        rect(WIN.x0, -7500, WIN.x1, -7280),
      ];
      for (let i = 0; i < bars.length; i++) {
        inkS(ctx, Z, bars[i], { closed: true, width: 2.5, fill: P.white, seed: sd('bar', i), smooth: false, wobble: 1 });
        hatchZ(ctx, Z, bars[i], { spacing: 6, width: 1.1, color: P.inkSoft, alpha: 0.55, seed: sd('barH', i), density: 0.5, minPx: 6 });
      }
      void k;
      inkS(ctx, Z, G.sill, { closed: true, width: 3, fill: P.white, seed: sd('sill'), smooth: false });
      hatchZ(ctx, Z, G.sill, { angle: 0.05, spacing: 6, width: 1.2, color: P.inkSoft, alpha: 0.6, seed: sd('sillH'), density: (x, y) => sstep(WIN.y1 + 260, WIN.y1 + 520, y) });
      // a potted coffee seedling on the sill: the first shot's plant, waiting by the window
      inkS(ctx, Z, G.pot, { closed: true, width: 2.5, fill: P.orange, seed: sd('pot'), smooth: false });
      hatchZ(ctx, Z, G.pot, { spacing: 6, width: 1.2, color: P.ink, alpha: 0.6, seed: sd('potH'), density: (x) => sstep(-3600, -3150, x) });
      inkS(ctx, Z, [[-3500, -1700], [-3490, -2300], [-3520, -2900]], { width: 3, color: P.leafDeep, seed: sd('stemP') });
      const lv = [[-3500, -2350, -2.5], [-3500, -2350, -0.6], [-3515, -2850, -2.3], [-3515, -2850, -0.85]];
      for (let i = 0; i < lv.length; i++) {
        const [x, y, a] = lv[i];
        const ca = Math.cos(a), sa = Math.sin(a);
        const L0 = 520, W0 = 130;
        const pts = [[x, y], [x + ca * L0 * 0.5 - sa * W0, y + sa * L0 * 0.5 + ca * W0], [x + ca * L0, y + sa * L0], [x + ca * L0 * 0.5 + sa * W0, y + sa * L0 * 0.5 - ca * W0]];
        inkS(ctx, Z, pts, { closed: true, width: 2, fill: P.leafCoffee, seed: sd('potL', i) });
      }
    }
    // hanging lamp over the table: enamel shade, warm glow
    if (shows(Z, [-400, -60000, 1500, -3700], 6)) {
      const cord = new Path2D();
      cord.moveTo(540, Math.max(G.lampCord[0][1], Z.v[1] - 200 / Z.k));
      cord.lineTo(540, -5200);
      strokeZ(ctx, Z, cord, P.ink, 2.5, 1);
      ctx.save();
      ctx.globalAlpha = 0.35;
      fillPoly(ctx, [[-380, -3900], [1460, -3900], [2600, 400], [-1500, 400]], P.sun, 0.35);
      ctx.restore();
      inkS(ctx, Z, G.lampShade, { closed: true, width: 3, fill: P.teal, seed: sd('shade'), smooth: false });
      hatchZ(ctx, Z, G.lampShade, { spacing: 6, width: 1.2, color: P.tealDeep, alpha: 0.8, seed: sd('shadeH'), density: (x) => sstep(500, 1300, x) });
      inkS(ctx, Z, ell(540, -3900, 920, 160, 40, 0, Math.PI), { width: 3, seed: sd('shadeRim') });
      inkS(ctx, Z, ell(540, -3830, 220, 110, 20), { closed: true, width: 2, fill: P.sun, seed: sd('bulb') });
    }
    // counter and espresso machine at the far right
    if (shows(Z, [3400, -2000, 60000, 3600], 6)) {
      const ct = clipPolyRect(G.counter, Z.v[0], Z.v[1], Z.v[2] + 600 / Z.k, Z.v[3]);
      if (ct.length > 2) {
        inkS(ctx, Z, ct, { closed: true, width: 3, fill: P.wood, seed: sd('counter'), smooth: false });
        hatchZ(ctx, Z, ct, { angle: Math.PI / 2, spacing: 7, width: 1.2, color: P.barkDeep, alpha: 0.6, seed: sd('counterH'), length: [40, 140] });
        const pan = new Path2D();
        for (let x = 5200; x < Math.min(60000, Z.v[2] + 2000); x += 1800) {
          pan.moveTo(x, 1650);
          pan.lineTo(x, 3400);
        }
        strokeZ(ctx, Z, pan, P.barkDeep, 2, 0.8);
      }
      const ctop = clipPolyRect(G.counterTop, Z.v[0], Z.v[1], Z.v[2] + 600 / Z.k, Z.v[3]);
      if (ctop.length > 2) inkS(ctx, Z, ctop, { closed: true, width: 3, fill: P.paperDeep, seed: sd('ctop'), smooth: false });
      if (shows(Z, bbox(G.machine), 6)) {
        inkS(ctx, Z, G.machine, { closed: true, width: 3, fill: P.steel, seed: sd('mach') });
        hatchZ(ctx, Z, G.machine, { angle: Math.PI / 2, spacing: 6, width: 1.3, color: P.steelDeep, alpha: 0.8, seed: sd('machH'), density: (x) => 0.2 + 0.8 * sstep(5600, 7400, x) });
        inkS(ctx, Z, G.machineTop, { closed: true, width: 2.5, fill: P.steelDeep, seed: sd('machT'), smooth: false });
        // two group heads with portafilters, gauge, drip tray, a cup
        for (let g = 0; g < 2; g++) {
          const gx = 5100 + g * 1500;
          inkS(ctx, Z, LIB.rrectPts(gx - 260, -300, 520, 380, 80, 40), { closed: true, width: 2.5, fill: P.steelDeep, seed: sd('grp', g) });
          inkS(ctx, Z, [[gx - 200, 160], [gx + 520, 200]], { width: 9, color: P.ink, seed: sd('pf', g), taper: [0, 6] });
          inkS(ctx, Z, ell(gx, 1050, 170, 50, 20), { closed: true, width: 2, fill: P.ceramic, seed: sd('mcup', g) });
          inkS(ctx, Z, rect(gx - 170, 1050, gx + 170, 1230), { closed: true, width: 2, fill: P.ceramic, seed: sd('mcupB', g), smooth: false });
        }
        inkS(ctx, Z, ell(5850, -1000, 240, 240, 28), { closed: true, width: 2.5, fill: P.white, seed: sd('gauge') });
        inkS(ctx, Z, [[5850, -1000], [5980, -1130]], { width: 2, seed: sd('needle'), taper: [0, 4] });
        inkS(ctx, Z, rect(4500, 1230, 7300, 1250 + 60), { closed: true, width: 2, fill: P.steelDeep, seed: sd('tray'), smooth: false });
        inkS(ctx, Z, [[7400, -200], [7650, 400], [7600, 900]], { width: 5, color: P.ink, seed: sd('wand') });
        for (let c = 0; c < 3; c++) inkS(ctx, Z, rect(4600 + c * 520, -2350, 4980 + c * 520, -1900), { closed: true, width: 2, fill: P.ceramic, seed: sd('topcup', c), smooth: false });
      }
    }
    // bistro chair at the left
    if (shows(Z, [-3800, 300, -2000, 5500], 6)) {
      for (let i = 0; i < G.chairLegs.length; i++) inkS(ctx, Z, G.chairLegs[i], { closed: true, width: 2.5, fill: P.barkDeep, seed: sd('leg', i) });
      inkS(ctx, Z, G.chairRing, { closed: true, width: 4, color: P.barkDeep, seed: sd('ring') });
      inkS(ctx, Z, G.chairBack, { width: 10, color: P.ink, seed: sd('back'), taper: [4, 4] });
      inkS(ctx, Z, G.chairBack, { width: 5, color: P.wood, seed: sd('back2'), taper: [4, 4] });
      inkS(ctx, Z, LIB.smoothPts([[-3480, 2620], [-3400, 1500], [-2900, 1100], [-2400, 1500], [-2320, 2620]], false, 30), { width: 4, color: P.barkDeep, seed: sd('back3') });
      inkS(ctx, Z, G.chairSeat, { closed: true, width: 3, fill: P.wood, seed: sd('seat') });
      hatchZ(ctx, Z, G.chairSeat, { spacing: 6, width: 1.2, color: P.barkDeep, alpha: 0.7, seed: sd('seatH'), density: (x, y) => sstep(2650, 2900, y) });
    }
  }

  function drawTable(ctx, Z, P, G, t, tw) {
    // pedestal and foot
    if (shows(Z, [-300, 1950, 1400, 5300])) {
      inkS(ctx, Z, G.foot, { closed: true, width: 3, fill: LIB.mix(P.ink, P.steelDeep, 0.4), seed: sd('foot') });
      inkS(ctx, Z, G.pedestal, { closed: true, width: 3, fill: LIB.mix(P.ink, P.steelDeep, 0.5), seed: sd('ped') });
      hatchZ(ctx, Z, G.pedestal, { angle: 0, spacing: 6, width: 1.2, color: P.steel, alpha: 0.4, seed: sd('pedH'), density: (x) => 1 - sstep(520, 600, x) });
    }
    if (!shows(Z, bbox(G.top))) return;
    // edge band and top
    inkS(ctx, Z, G.edge, { closed: true, width: 3, fill: LIB.mix(P.wood, P.barkDeep, 0.35), seed: sd('edge') });
    hatchZ(ctx, Z, G.edge, { angle: 0.04, spacing: 5, width: 1.2, color: P.barkDeep, alpha: 0.8, seed: sd('edgeH'), length: [30, 90] });
    inkS(ctx, Z, G.top, { closed: true, width: 4, fill: LIB.mix(P.wood, P.paper, 0.22), seed: sd('top') });
    if (Z.k > 0.1) {
      const gp = new Path2D();
      for (const g of G.grain) LIB.tracePath(gp, g, false);
      strokeZ(ctx, Z, gp, P.barkDeep, 1.4, 0.45);
    }
    hatchZ(ctx, Z, G.top, { angle: 0.05, spacing: 10, width: 1.2, color: P.barkDeep, alpha: 0.4, seed: sd('topH'), density: (x, y) => 0.15 + 0.7 * sstep(800, 2400, (x - 560) * 0.6 + (y - 1350) * 1.4), length: [40, 120] });
    // cast shadows under the objects (lower right of each)
    hatchZ(ctx, Z, ell(-470, 1370, 260, 70, 32), { spacing: 5, width: 1.3, color: P.barkDeep, alpha: 0.8, seed: sd('shSug') });
    hatchZ(ctx, Z, ell(70, 1000, 160, 40, 32), { spacing: 5, width: 1.3, color: P.barkDeep, alpha: 0.7, seed: sd('shGl') });
    hatchZ(ctx, Z, ell(640, 1500, 440, 90, 40), { spacing: 5, width: 1.3, color: P.barkDeep, alpha: 0.8, seed: sd('shCup') });
    // sugar bowl
    if (shows(Z, [-760, 1000, -280, 1400], 4)) {
      inkS(ctx, Z, G.sugarBody, { closed: true, width: 3, fill: P.ceramic, seed: sd('sug') });
      hatchZ(ctx, Z, G.sugarBody, { spacing: 7, width: 1.3, color: P.ceramicShade, alpha: 1, seed: sd('sugH'), density: (x) => sstep(-560, -320, x) });
      hatchZ(ctx, Z, G.sugarBody, { spacing: 6, width: 1.2, color: P.inkSoft, alpha: 0.6, seed: sd('sugH2'), density: (x) => sstep(-420, -300, x) });
      inkS(ctx, Z, ell(-520, 1250, 200, 40, 30, 0.1, Math.PI - 0.1), { width: 2.5, color: P.annBlue, alpha: 0.6, seed: sd('sugBand') });
      inkS(ctx, Z, G.sugarLid, { closed: true, width: 3, fill: P.ceramic, seed: sd('lid') });
      inkS(ctx, Z, G.sugarKnob, { closed: true, width: 2.5, fill: P.ceramic, seed: sd('knob') });
      inkS(ctx, Z, [[-330, 1110], [-180, 960], [-110, 900]], { width: 7, color: P.ink, seed: sd('sugSp'), taper: [2, 2] });
      inkS(ctx, Z, [[-330, 1110], [-180, 960], [-110, 900]], { width: 3.5, color: P.steel, seed: sd('sugSp'), taper: [2, 2] });
    }
    // water glass
    if (shows(Z, [-130, 520, 160, 1010], 4)) {
      fillPoly(ctx, G.glass.concat(ell(16, 560, 126, 34, 24, 0, Math.PI).reverse()), P.white, 0.35);
      fillPoly(ctx, [[-118, 700], [150, 700], [136, 980], [80, 1004], [-50, 1004], [-104, 980]], P.water, 0.3);
      hatchZ(ctx, Z, [[-110, 700], [148, 700], [136, 980], [80, 1004], [-50, 1004], [-104, 980]], { angle: 0.02, spacing: 6, width: 1.1, color: P.waterDeep, alpha: 0.6, seed: sd('glassH'), density: 0.6 });
      inkS(ctx, Z, G.glass, { width: 2.5, seed: sd('glassO'), taper: [6, 6] });
      inkS(ctx, Z, G.glassTop, { closed: true, width: 2.2, seed: sd('glassT') });
      inkS(ctx, Z, G.glassWater, { closed: true, width: 1.6, color: P.waterDeep, seed: sd('glassW') });
      inkS(ctx, Z, [[-60, 620], [-70, 900]], { width: 4, color: P.white, alpha: 0.9, seed: sd('glassHi') });
    }
    // book
    if (shows(Z, bbox(G.book), 4)) {
      inkS(ctx, Z, G.bookEdgeL, { closed: true, width: 2.5, fill: P.white, seed: sd('bookL'), smooth: false });
      inkS(ctx, Z, G.bookEdge, { closed: true, width: 2.5, fill: P.white, seed: sd('bookE'), smooth: false });
      const pages = new Path2D();
      for (let i = 1; i < 5; i++) {
        pages.moveTo(1480, 1440 + i * 12);
        pages.lineTo(2280, 1290 + i * 12);
      }
      strokeZ(ctx, Z, pages, P.inkSoft, 1.2, 0.7);
      inkS(ctx, Z, G.book, { closed: true, width: 3, fill: P.rose, seed: sd('book'), smooth: false });
      hatchZ(ctx, Z, G.book, { angle: -0.6, spacing: 8, width: 1.2, color: P.cherryDeep, alpha: 0.5, seed: sd('bookH'), density: 0.6 });
      inkS(ctx, Z, [[1330, 1300], [2110, 1160]], { width: 14, color: P.ochre, seed: sd('bookBand'), taper: [0, 0] });
    }
    // the hand, resting, lifting toward the cup on the beat
    if (shows(Z, [1150, 1400, 3200, 2900], 4)) {
      const d = t < 0.75 ? 0 : [0.55, 1.06, 1][Math.min(2, Math.floor((t - 0.75) * 12 + 1e-6))];
      const dx = -34 * d, dy = -46 * d;
      const sh = (pts, f = 1) => pts.map((p) => [p[0] + dx * f, p[1] + dy * f]);
      inkS(ctx, Z, G.sleeve, { closed: true, width: 3, fill: P.tealDeep, seed: sd('sleeve') });
      hatchZ(ctx, Z, G.sleeve, { angle: 0.6, spacing: 6, width: 1.3, color: P.ink, alpha: 0.6, seed: sd('sleeveH'), density: (x, y) => sstep(1900, 2300, y) });
      const fa = sh(G.forearm, 0.5);
      inkS(ctx, Z, fa, { closed: true, width: 3, fill: P.skin, seed: sd('forearm') });
      for (let i = G.fingers.length - 1; i >= 0; i--) {
        const f = sh(G.fingers[i], 1 + 0.06 * i);
        inkS(ctx, Z, f, { closed: true, width: 2.5, fill: P.skin, seed: sd('finger', i) });
        hatchZ(ctx, Z, f, { spacing: 5, width: 1.1, color: P.skinDeep, alpha: 0.75, seed: sd('fingerH', i), density: 0.5, minPx: 8 });
      }
      const pm = sh(G.palm);
      inkS(ctx, Z, pm, { closed: true, width: 3, fill: P.skin, seed: sd('palm') });
      hatchZ(ctx, Z, pm, { spacing: 6, width: 1.2, color: P.skinDeep, alpha: 0.8, seed: sd('palmH'), density: (x, y) => sstep(1580, 1740, y) });
      inkS(ctx, Z, sh(G.thumb, 1.1), { closed: true, width: 2.5, fill: P.skin, seed: sd('thumb') });
      inkS(ctx, Z, G.cuff, { closed: true, width: 3, fill: LIB.mix(P.tealDeep, P.teal, 0.4), seed: sd('cuff') });
    }
  }

  function drawCup(ctx, Z, P, G, t, tw) {
    if (!shows(Z, [140, 1010, 940, 1530], 2)) return;
    const detail = Z.k > 0.09;
    // saucer
    inkS(ctx, Z, G.saucerUnder, { closed: true, width: 4, fill: P.ceramicShade, seed: sd('saucerU') });
    inkS(ctx, Z, G.saucerTop, { closed: true, width: 5, fill: P.ceramic, seed: sd('saucerT') });
    if (detail) {
      hatchZ(ctx, Z, G.saucerTop, { spacing: 8, width: 1.3, color: P.ceramicShade, alpha: 1, seed: sd('saucerH'), density: (x, y) => sstep(250, 380, (x - 540) * 0.7 + (y - 1420) * 2.2) });
      inkS(ctx, Z, G.saucerWell, { closed: true, width: 1.8, color: P.inkSoft, alpha: 0.9, seed: sd('well') });
      hatchZ(ctx, Z, G.cupShadow, { spacing: 5, width: 1.3, color: P.ceramicShade, alpha: 1, seed: sd('cupSh'), crossSpacing: 7, tone: 0.6, layers: 2 }, true);
    }
    // spoon on the saucer
    inkS(ctx, Z, G.spoonHandle, { closed: true, width: 2.5, fill: P.steel, seed: sd('spoonH') });
    inkS(ctx, Z, G.spoonBowl, { closed: true, width: 3, fill: P.steel, seed: sd('spoonB') });
    if (detail) hatchZ(ctx, Z, G.spoonBowl, { spacing: 5, width: 1.2, color: P.steelDeep, alpha: 0.9, seed: sd('spoonBH'), density: (x, y) => sstep(1452, 1475, y), minPx: 8 });
    // handle (geometric width 26, ink outline screen-constant)
    {
      const hp = new Path2D();
      LIB.tracePath(hp, G.handle, false);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 26 + 8 / Z.k;
      ctx.stroke(hp);
      if (26 - 2 / Z.k > 0) {
        ctx.strokeStyle = P.ceramic;
        ctx.lineWidth = 26 - 2 / Z.k;
        ctx.stroke(hp);
      }
      ctx.restore();
      if (detail) inkS(ctx, Z, LIB.smoothPts([[862, 1150], [894, 1200], [876, 1258], [820, 1288]], false, 6), { width: 2, color: P.ceramicShade, seed: sd('handleSh') });
    }
    // body
    inkS(ctx, Z, G.body, { closed: true, width: 5, fill: P.ceramic, seed: sd('body') });
    if (detail) {
      hatchZ(ctx, Z, G.body, { spacing: 8, width: 1.4, color: P.ceramicShade, alpha: 1, seed: sd('bodyH'), crossSpacing: 7, tone: 0.7, layers: 2, density: (x) => sstep(560, 770, x) }, true);
      hatchZ(ctx, Z, G.body, { spacing: 7, width: 1.3, color: P.inkSoft, alpha: 0.75, seed: sd('bodyH2'), density: (x, y) => sstep(600, 760, x + (y - 1100) * 0.25) });
      inkS(ctx, Z, LIB.smoothPts([[350, 1150], [362, 1250], [400, 1330]], false, 6), { width: 5, color: P.white, alpha: 0.95, seed: sd('hi') });
      inkS(ctx, Z, ell(540, 1395, 160, 34, 30, 0.1, Math.PI - 0.1), { width: 2, color: P.inkSoft, seed: sd('footL') });
    }
    // rim, inner wall, crema
    inkS(ctx, Z, G.rimO, { closed: true, width: 5, fill: P.ceramic, seed: sd('rim') });
    inkS(ctx, Z, G.rimI, { closed: true, width: 2, fill: P.ceramicShade, seed: sd('rimI') });
    fillPoly(ctx, G.liquid, P.crema);
    if (detail) {
      // tiger mottling, drifting slowly on twos, clipped to the liquid
      ctx.save();
      ctx.beginPath();
      LIB.tracePath(ctx, G.liquid, true);
      ctx.clip();
      const spin = tw * 0.25;
      const pl = new Path2D(), pd = new Path2D();
      for (const [bx, by, br, el, ph, light] of G.blobs) {
        const a = Math.atan2(by, bx) + spin, d = Math.hypot(bx, by);
        const x = 540 + Math.cos(a) * d * 232, y = 1102 + Math.sin(a) * d * 60;
        const p = light ? pl : pd;
        p.moveTo(x + br * 232, y);
        p.ellipse(x, y, br * 232, br * 60 * el + 4, ph * 0.1, 0, TAU);
      }
      ctx.fillStyle = P.cremaLight;
      ctx.globalAlpha = 0.85;
      ctx.fill(pl);
      ctx.fillStyle = LIB.mix(P.crema, P.espresso, 0.25);
      ctx.globalAlpha = 0.6;
      ctx.fill(pd);
      ctx.globalAlpha = 1;
      const ring = new Path2D();
      LIB.tracePath(ring, G.liquid, true);
      ctx.strokeStyle = LIB.mix(P.crema, P.espresso, 0.45);
      ctx.lineWidth = 16;
      ctx.stroke(ring);
      ctx.restore();
      stippleZ(ctx, Z, G.liquid, { spacing: 7, r: [0.8, 1.5], color: P.cremaLight, alpha: 0.8, seed: sd('cremaSt'), density: 0.5, minPx: 10 });
    }
    inkS(ctx, Z, G.liquid, { closed: true, width: 1.8, color: P.inkSoft, seed: sd('liqO') });
  }

  function drawSteam(ctx, Z, P, t, tw) {
    // three ribbons rising and curling on twos; kept while the cup is wider than 20 px
    if (Z.k * 500 < 20 || !shows(Z, [300, 400, 800, 1100], 2)) return;
    for (let s = 0; s < 3; s++) {
      const x0 = 470 + s * 70;
      const ph = s * 2.1 + tw * 3.2;
      const pts = [];
      for (let i = 0; i <= 30; i++) {
        const u = i / 30;
        const y = 1080 - u * 520;
        const amp = 12 + u * 50;
        pts.push([x0 + amp * Math.sin(u * 7 + ph) + u * 30 * (s - 1), y]);
      }
      const w = Math.max(2.5, 11 * Math.min(1, Z.k * 1.4));
      ink(ctx, Z, pts, { width: w, color: P.steam, alpha: 0.75, seed: sd('steam', s), taper: [20, 60], wobble: 1, boil: true });
      ink(ctx, Z, pts.map((p) => [p[0] + 9, p[1] - 4]), { width: w * 0.35, color: P.white, alpha: 0.6, seed: sd('steam2', s), taper: [30, 80], wobble: 1 });
    }
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
      const tf = Math.round(t * 24) / 24;
      if (Math.abs(t - tf) < 1e-4) t = tf + 1e-7;
      const tw = L.onTwos(t);
      const G = geo();
      const cam = camAt(t);
      const zk = cam.z;
      const Z = { k: zk, v: [cam.x - 540 / zk, cam.y - 960 / zk, cam.x + 540 / zk, cam.y + 960 / zk] };
      const toS = (x, y) => [540 + (x - cam.x) * zk, 960 + (y - cam.y) * zk];

      // ---- 1 stripes: the wall and the sky ------------------------------------------------
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeYellow], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') & 0xffff });

      L.camera(ctx, { x: cam.x, y: cam.y, zoom: zk }, () => {
        // ---- 2 landscape through the window ---------------------------------------------------
        drawLandscape(ctx, Z, P, G, tw);
        // ---- 3 room ---------------------------------------------------------------------------
        drawRoom(ctx, Z, P, G, tw);
        // ---- 4 table and what is on it ----------------------------------------------------------
        drawTable(ctx, Z, P, G, t, tw);
        // ---- 5 the cup ---------------------------------------------------------------------------
        drawCup(ctx, Z, P, G, t, tw);
        drawSteam(ctx, Z, P, t, tw);
      });

      // ---- 6 overlays (screen space) -----------------------------------------------------------
      // annYellow ring 1.4x the cup radius, shrinking with the cup
      {
        const c = toS(540, 1240);
        const r = 1.4 * 250 * zk;
        ctx.save();
        ctx.strokeStyle = P.annYellow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(c[0], c[1], Math.max(r, 14), 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      // annBlue arc annotation around the window, drawing on from the layer-3 beat
      if (t >= 1.5) {
        const p = E.outExpo(clamp((t - 1.5) / (18 * FR) + 1 / 18));
        const c = toS(WIN_C[0], WIN_C[1]);
        const r = 9600 * zk;
        L.arcAnnotation(ctx, c[0], c[1], r, -160 * DEG, -20 * DEG, { color: P.annBlue, width: 2, p, endTicks: 8, arrow: 14, dot: 4 });
      }
    },
  });
})();
