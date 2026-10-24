// 20 grounds-to-soil : The grounds feed the next tree.  T 40.50 to 42.75 (54 frames), illustrated.
// A spent espresso puck is knocked off a knock-box bar at the top left, tumbles down a dashed blue
// trajectory and lands in the soil at the foot of a young coffee tree on the beat (T 41.25),
// crumbling into grounds that sink into the earth; a seedling hooks up beside it on the 8th
// (T 41.625). A magenta ring marks a ripe cherry on the branch above (T 42.00) and a snap zoom
// 1x to 9x (outExpo, 18 frames) lands that cherry exactly on G2 (centre (540, 900), rx 260,
// ry 290) on the last frame, for the hard cut to 21's blueprint oval.
//
// Camera: world (540, 620) is the target cherry centre; it moves from screen (540, 620) at zoom 1
// to screen (540, 900) at zoom 9, so cam.y = 620 - (sy - 960) / zoom. Every pen size (ink width,
// wobble, hatch spacing, stipple radius) is divided by the zoom so lines stay screen-constant, and
// anything outside the visible world rectangle is culled; hatch clips are cut to that rectangle.
//
// Layers, back to front:
//   1 stripes (stripeCream / stripeYellow, drifting 6 px per beat)
//   2 tree: back leaves, trunk, right lateral, upper sprays
//   3 soil cutaway: surface, soilDeep hatching, stones, roots, earthworm, grounds mixing in
//   4 the lateral branch with opposite leaf pairs and three axillary cherry clusters (target in front)
//   5 knock box edge with its bar (top left)
//   6 the puck tumbling, landing, crumbling; the seedling
//   7 overlays: annBlue dashed fall line, annYellow landing ring, annYellow dashed cluster ring,
//     annMagenta target ring
(function () {
  'use strict';

  const ID = 'grounds-to-soil';
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

  // beats (shot-local seconds)
  const B_LAND = 0.75; // T 41.25 puck lands
  const B_SHOOT = 1.125; // T 41.625 seedling pushes up
  const B_ZOOM = 1.5; // T 42.00 magenta ring, snap zoom starts
  const Z_FRAMES = 17; // zoom lands on frame 17 after the beat = the shot's last frame

  // target cherry: lands on G2 at 9x exactly
  const TGT = [540, 620];
  const TRX = 260 / 9, TRY = 290 / 9;
  const ZMAX = 9;

  // puck path
  const PUCK0 = [250, 372];
  const PUCK1 = [420, 1250];
  const PUCK_R = 130;
  const SOIL_Y = 1250;

  // ---------------------------------------------------------------------------
  // small geometry helpers
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

  // ---------------------------------------------------------------------------
  // the zoom-aware pen. Z = { k: zoom, v: [x0, y0, x1, y1] visible world rect }
  // ---------------------------------------------------------------------------

  const visB = (Z, b, pad = 0) => !(b[2] < Z.v[0] - pad || b[0] > Z.v[2] + pad || b[3] < Z.v[1] - pad || b[1] > Z.v[3] + pad);

  let BOIL = 0; // boil drawing index for every pen in this file (set per frame / per cache)

  function ink(ctx, Z, pts, o = {}) {
    const k = 1 / Z.k;
    const w = o.width != null ? o.width : 3;
    const q = Object.assign({}, o, {
      width: w * k,
      wobble: (o.wobble != null ? o.wobble : 2) * k,
      tremble: (o.tremble != null ? o.tremble : 0.4) * k,
      boilAmp: (o.boilAmp != null ? o.boilAmp : 0.7) * k,
      rough: (o.rough != null ? o.rough : 0.22 + 0.07 * w) * k,
      step: (o.step || 2.5) * k,
      boil: o.boil === false ? false : BOIL,
    });
    const tp = o.taper != null ? o.taper : o.closed ? [10, 22] : [18, 34];
    q.taper = Array.isArray(tp) ? [tp[0] * k, tp[1] * k] : tp * k;
    if (o.double) q.double = { offset: (w / 2 + 3) * k, width: 1.5 * k, alpha: 0.4 };
    LIB.inkPath(ctx, pts, q);
  }

  // hatch clipped to the visible rect, with every pen size in screen px
  function hatchZ(ctx, Z, poly, o = {}, cross = false) {
    const k = 1 / Z.k;
    const pad = 30 * k;
    const cp = Z.k > 1.01 ? clipPolyRect(poly, Z.v[0] - pad, Z.v[1] - pad, Z.v[2] + pad, Z.v[3] + pad) : poly;
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
      boil: BOIL,
    });
    if (cross) LIB.crossHatch(ctx, cp, q);
    else LIB.hatch(ctx, cp, q);
  }

  function stippleZ(ctx, Z, poly, o = {}) {
    const k = 1 / Z.k;
    const pad = 20 * k;
    const cp = Z.k > 1.01 ? clipPolyRect(poly, Z.v[0] - pad, Z.v[1] - pad, Z.v[2] + pad, Z.v[3] + pad) : poly;
    if (cp.length < 3) return;
    const r = o.r || [1.0, 2.2];
    LIB.stipple(ctx, cp, Object.assign({}, o, { spacing: (o.spacing || 7.5) * k, r: [r[0] * k, r[1] * k], boilAmp: (o.boilAmp != null ? o.boilAmp : 0.35) * k, boil: BOIL }));
  }

  // the runs of a polyline that fall inside the visible rect (padded), so off-screen ink costs nothing
  function runsIn(Z, pts, closed) {
    if (Z.k <= 1.01) return [closed ? pts.concat([pts[0]]) : pts];
    const pad = 60 / Z.k;
    const x0 = Z.v[0] - pad, y0 = Z.v[1] - pad, x1 = Z.v[2] + pad, y1 = Z.v[3] + pad;
    const src = closed ? pts.concat([pts[0]]) : pts;
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

  // ink a long line or outline only where it shows; closed outlines get their fill separately
  function inkRuns(ctx, Z, pts, o = {}) {
    if (Z.k <= 1.01) {
      ink(ctx, Z, pts, o);
      return;
    }
    if (o.closed && o.fill) fillPoly(ctx, pts, o.fill, o.fillAlpha != null ? o.fillAlpha : 1);
    const runs = runsIn(Z, pts, !!o.closed);
    const q = Object.assign({}, o, { closed: false, fill: null });
    runs.forEach((r, i) => {
      const whole = !o.closed && r[0] === pts[0] && r[r.length - 1] === pts[pts.length - 1];
      ink(ctx, Z, r, Object.assign({}, q, { seed: (o.seed || 1) + i * 31, taper: whole ? o.taper : [0, 0] }));
    });
  }

  function fillPoly(ctx, pts, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    LIB.tracePath(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // forms: leaf, cherry, bark tube
  // ---------------------------------------------------------------------------

  // a coffee leaf from its node: petiole, elliptic blade 2:1 with a drawn-out tip, wavy margin,
  // 9 lateral vein pairs looping toward the tip. side: which half is in shadow (+1 right of midrib)
  function leafGeom(bx, by, ang, len, wid, seed, bend = 0.06) {
    const r = LIB.rng(seed);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const nx = -sa, ny = ca;
    const pet = len * 0.08;
    const blade = len - pet;
    const ph = r() * TAU;
    const waves = r.int(4, 6);
    const mid = (s) => {
      const d = pet + blade * s;
      const off = Math.sin(Math.PI * s) * bend * blade;
      return [bx + ca * d + nx * off, by + sa * d + ny * off];
    };
    const hw = (s) => {
      const base = (wid / 2) * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.85)), 0.8) * (1 - 0.12 * s);
      return base * (1 + 0.045 * Math.sin(s * TAU * waves + ph)) * (s > 0.92 ? 1 - (s - 0.92) * 4 : 1);
    };
    const N = 40;
    const left = [], right = [], midPts = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const m = mid(s);
      const w = hw(s);
      midPts.push(m);
      left.push([m[0] - nx * w, m[1] - ny * w]);
      right.push([m[0] + nx * w, m[1] + ny * w]);
    }
    const outline = left.concat(right.slice(1, N).reverse());
    const veins = [];
    for (let k = 0; k < 9; k++) {
      const s = 0.1 + k * 0.088;
      for (const sg of [-1, 1]) {
        const m0 = mid(s);
        const s1 = Math.min(0.97, s + 0.1);
        const m1 = mid(s1);
        const w1 = hw(s1) * 0.84;
        const m2 = mid(s + 0.05);
        const w2 = hw(s + 0.05) * 0.5;
        veins.push([m0, [m2[0] + sg * nx * w2, m2[1] + sg * ny * w2], [m1[0] + sg * nx * w1, m1[1] + sg * ny * w1]]);
      }
    }
    const halfR = [midPts[0]].concat(right.slice(1, N), [midPts[N]], midPts.slice(1, N).reverse());
    const sheen = [];
    for (let i = 4; i <= 32; i++) {
      const s = i / N, m = mid(s), w = hw(s) * 0.22;
      sheen.push([m[0] - nx * w, m[1] - ny * w]);
    }
    return { outline, mid: midPts, veins, halfR, sheen, petiole: [[bx, by], mid(0)], ang, b: bbox(outline) };
  }

  function drawLeaf(ctx, Z, P, lf, seed, o = {}) {
    if (!visB(Z, lf.b, 10)) return;
    const col = o.color || P.leafCoffee;
    ink(ctx, Z, lf.petiole, { width: Math.max(2.5, 2.4 * Z.k), color: P.ink, seed: seed + 1, taper: [2, 6] });
    inkRuns(ctx, Z, lf.outline, { closed: true, width: o.width || 3, fill: col, seed: seed + 2, wobble: 1.4 });
    // gloss streak along one side of the midrib
    inkRuns(ctx, Z, lf.sheen, { width: 5, color: P.leafSheen, alpha: 0.8, seed: seed + 3, taper: [20, 30], wobble: 1 });
    // shadow half: hatching roughly parallel to the laterals
    hatchZ(ctx, Z, lf.halfR, { angle: lf.ang + 0.75, spacing: 7, width: 1.3, color: P.leafDeep, alpha: 0.75, length: [10, 34], seed: seed + 4, density: 0.85 });
    // veins
    const vp = new Path2D();
    for (const v of lf.veins) {
      vp.moveTo(v[0][0], v[0][1]);
      vp.quadraticCurveTo(v[1][0], v[1][1], v[2][0], v[2][1]);
    }
    ctx.save();
    ctx.strokeStyle = P.leafDeep;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 1.8 / Z.k;
    ctx.lineCap = 'round';
    ctx.stroke(vp);
    ctx.restore();
    inkRuns(ctx, Z, lf.mid, { width: 2.5, color: P.leafDeep, seed: seed + 5, taper: [4, 30], wobble: 0.8 });
  }

  const CHERRY_COLS = {
    red: ['cherryRed', 'cherryDeep', 'cherryLight'],
    deep: ['cherryDeep', 'ink', 'cherryRed'],
    yellow: ['cherryYellow', 'ochre', 'white'],
    green: ['cherryGreen', 'leafDeep', 'leafSheen'],
  };

  // G2 proportions: calyx disc radius 34/260 rx at 272/290 ry below the centre; gloss inset 40/260
  function drawCherry(ctx, Z, P, cx, cy, rx, ry, kind, seed, o = {}) {
    const b = [cx - rx - 4, cy - ry - 4, cx + rx + 4, cy + ry + 4];
    if (!visB(Z, b, 10)) return;
    const [cf, cd, cl] = CHERRY_COLS[kind].map((k) => P[k]);
    const n = Math.max(48, Math.min(160, Math.round(rx * Z.k * 0.5)));
    const pts = LIB.ellipsePts(cx, cy, rx, ry, n);
    ink(ctx, Z, pts, { closed: true, width: o.width || 3, fill: cf, seed: seed + 1, wobble: o.wobble != null ? o.wobble : 1.2 });
    const dens = (x, y) => sstep(-0.3, 0.85, ((x - cx) / rx) * 0.55 + ((y - cy) / ry) * 0.75);
    hatchZ(ctx, Z, pts, { spacing: o.spacing || 8, crossSpacing: (o.spacing || 8) * 0.8, width: 1.5, color: cd, alpha: 0.85, density: dens, tone: 0.9, layers: 3, length: [14, 50], seed: seed + 2 }, true);
    // gloss crescent at upper left, 200 to 250 degrees
    const gi = rx * (40 / 260);
    const gl = [];
    for (let i = 0; i <= 14; i++) {
      const a = (200 + (50 * i) / 14) * DEG;
      gl.push([cx + Math.cos(a) * (rx - gi), cy + Math.sin(a) * (ry - gi)]);
    }
    for (let i = 14; i >= 0; i--) {
      const a = (200 + (50 * i) / 14) * DEG;
      const th = Math.sin((Math.PI * i) / 14) * rx * 0.07;
      gl.push([cx + Math.cos(a) * (rx - gi - th), cy + Math.sin(a) * (ry - gi - th)]);
    }
    fillPoly(ctx, gl, cl, 0.95);
    // calyx scar: ink disc with a 5-point star scar
    const kx = cx, ky = cy + ry * (272 / 290), kr = rx * (34 / 260);
    ink(ctx, Z, LIB.ellipsePts(kx, ky, kr, kr * 0.62, 24), { closed: true, width: 2, fill: P.ink, seed: seed + 3, wobble: 0.3, taper: [3, 5] });
    const st = new Path2D();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 5 + 0.2;
      st.moveTo(kx, ky);
      st.lineTo(kx + Math.cos(a) * kr * 0.7, ky + Math.sin(a) * kr * 0.45);
    }
    ctx.save();
    ctx.strokeStyle = cd === P.ink ? P.cherryRed : cd;
    ctx.lineWidth = 1.4 / Z.k;
    ctx.stroke(st);
    ctx.restore();
    if (o.dew) {
      const [dx, dy, dr] = o.dew;
      ink(ctx, Z, LIB.ellipsePts(dx, dy, dr, dr, 20), { closed: true, width: 1.6, fill: P.white, fillAlpha: 0.85, seed: seed + 4, wobble: 0.3, taper: [2, 4] });
    }
  }

  // a tapering bark tube along a centreline, with lengthwise hatching on the shadow side
  function tubeGeom(line, w0, w1) {
    const sm = LIB.smoothPts(line, false, 8);
    const n = sm.length;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = sm[Math.max(0, i - 1)], b = sm[Math.min(n - 1, i + 1)];
      const tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      const w = lerp(w0, w1, i / (n - 1)) / 2;
      L.push([sm[i][0] - (ty / tl) * w, sm[i][1] + (tx / tl) * w]);
      R.push([sm[i][0] + (ty / tl) * w, sm[i][1] - (tx / tl) * w]);
    }
    const poly = L.concat(R.slice().reverse());
    // shadow strip: the R side half (lower/right in screen for left-to-right lines)
    const shade = sm.map((p, i) => [(p[0] + L[i][0]) / 2, (p[1] + L[i][1]) / 2]).concat(L.slice().reverse());
    return { sm, L, R, poly, shade, b: bbox(poly) };
  }

  function drawTube(ctx, Z, P, tb, seed, o = {}) {
    if (!visB(Z, tb.b, 10)) return;
    fillPoly(ctx, tb.poly, o.fill || P.bark);
    const along = Math.atan2(tb.sm[tb.sm.length - 1][1] - tb.sm[0][1], tb.sm[tb.sm.length - 1][0] - tb.sm[0][0]);
    hatchZ(ctx, Z, tb.shade, { angle: along, spacing: 5, width: 1.3, color: P.barkDeep, alpha: 0.85, length: [12, 40], seed: seed + 1, angleJitter: 0.03 });
    hatchZ(ctx, Z, tb.poly, { angle: along, spacing: 11, width: 1.1, color: P.barkDeep, alpha: 0.45, length: [8, 26], seed: seed + 2, density: 0.6 });
    inkRuns(ctx, Z, tb.L, { width: o.width || 3, seed: seed + 3, taper: [4, 20] });
    inkRuns(ctx, Z, tb.R, { width: o.width || 3, seed: seed + 4, taper: [4, 20] });
  }

  // ---------------------------------------------------------------------------
  // static world geometry (t-independent, built once)
  // ---------------------------------------------------------------------------

  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const r = LIB.rng(sd('geo'));
    const G = {};
    // trunk: x 760, from below the soil line to above the frame, slight lean
    G.trunk = tubeGeom([[772, 1330], [766, 1200], [760, 1000], [757, 800], [761, 560], [756, 300], [750, 60], [748, -120]], 62, 40);
    // the lateral branch through the target node: branch top edge at y 585 under G2 at 9x
    G.branch = tubeGeom([[760, 572], [690, 579], [540, 586.7], [420, 598], [300, 614], [160, 636], [-40, 668]], 9, 6);
    G.branchR = tubeGeom([[760, 520], [860, 512], [980, 520], [1120, 536]], 8, 6);
    G.branchLow = tubeGeom([[758, 960], [880, 948], [1000, 958], [1120, 980]], 9, 6);
    G.branchLowL = tubeGeom([[760, 990], [660, 1000], [560, 1020], [470, 1040]], 8, 5);
    // leaves: opposite pairs at each node
    const leaves = [];
    const pair = (x, y, a1, a2, l, w, key) => {
      leaves.push({ g: leafGeom(x, y, a1, l, w, sd('leaf', key, 1), 0.07), seed: sd('lf', key, 1) });
      leaves.push({ g: leafGeom(x, y, a2, l * 0.95, w * 0.95, sd('leaf', key, 2), -0.07), seed: sd('lf', key, 2) });
    };
    // back layer (drawn before the trunk): upper sprays and the far right lateral
    const back = [];
    const bpair = (x, y, a1, a2, l, w, key) => {
      back.push({ g: leafGeom(x, y, a1, l, w, sd('bleaf', key, 1), 0.06), seed: sd('blf', key, 1) });
      back.push({ g: leafGeom(x, y, a2, l * 0.92, w * 0.92, sd('bleaf', key, 2), -0.06), seed: sd('blf', key, 2) });
    };
    bpair(757, 230, -150 * DEG, -30 * DEG, 300, 140, 'top1');
    bpair(752, 60, -160 * DEG, -20 * DEG, 280, 130, 'top2');
    bpair(880, 513, -70 * DEG, 60 * DEG, 260, 124, 'r1');
    bpair(1010, 522, -60 * DEG, 70 * DEG, 240, 116, 'r2');
    bpair(890, 950, -60 * DEG, 65 * DEG, 270, 128, 'lo1');
    bpair(600, 1012, -125 * DEG, 115 * DEG, 230, 110, 'lo2');
    G.back = back;
    // front lateral: nodes at x 690, 540 (target), 330, 120
    pair(690, 579, -80 * DEG, 78 * DEG, 250, 118, 'n0');
    pair(540, 586.7, -128 * DEG, -52 * DEG, 300, 142, 'n1');
    pair(330, 610, -116 * DEG, 104 * DEG, 290, 138, 'n2');
    pair(120, 642, -112 * DEG, 98 * DEG, 270, 128, 'n3');
    G.leaves = leaves;
    // cherry clusters (target cluster scaled from 01's cluster by 1/9 about the target)
    const s9 = (x, y, rr) => [540 + (x - 540) / 9, 620 + (y - 900) / 9, rr / 9];
    G.cluster = [
      Object.assign({ kind: 'yellow' }, { p: s9(230, 760, 130) }),
      Object.assign({ kind: 'red' }, { p: s9(850, 760, 140) }),
      Object.assign({ kind: 'green' }, { p: s9(120, 1000, 110) }),
      Object.assign({ kind: 'deep' }, { p: s9(980, 1040, 120) }),
      Object.assign({ kind: 'green' }, { p: [507, 588, 9] }),
      Object.assign({ kind: 'red' }, { p: [574, 588, 10] }),
    ];
    const cl = (x, y, n, kinds, key) => {
      const out = [];
      const rr = LIB.rng(sd('cl', key));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI + rr.range(-0.2, 0.2);
        const d = rr.range(10, 26);
        const rad = rr.range(11, 15);
        out.push({ kind: kinds[i % kinds.length], p: [x - Math.cos(a) * d * 1.3, y + 8 + Math.sin(a) * d, rad] });
      }
      out.sort((A, B) => A.p[1] - B.p[1]);
      return out;
    };
    G.clusterL = cl(330, 612, 7, ['red', 'yellow', 'red', 'green', 'deep', 'red', 'yellow'], 'a');
    G.clusterLL = cl(120, 644, 6, ['green', 'yellow', 'red', 'green', 'red', 'green'], 'b');
    G.clusterN0 = cl(690, 581, 5, ['red', 'deep', 'yellow', 'red', 'green'], 'c');
    // soil
    const surf = [];
    for (let x = -40; x <= 1120; x += 20) surf.push([x, SOIL_Y + 6 * LIB.noise1(x * 0.012, sd('surf')) + 3 * LIB.noise1(x * 0.05, sd('surf2'))]);
    G.surf = surf;
    G.soil = surf.concat([[1120, 1960], [-40, 1960]]);
    G.stones = [];
    for (let i = 0; i < 26; i++) {
      const x = r.range(20, 1060), y = r.range(1300, 1880);
      if (Math.abs(x - 230) < 120 && Math.abs(y - 1560) < 70) continue;
      G.stones.push([x, y, r.range(8, 22), r.range(5, 13), r.range(-0.5, 0.5), r.int(0, 1)]);
    }
    G.roots = [];
    const root = (pts, w) => G.roots.push({ pts: LIB.smoothPts(pts, false, 8), w });
    root([[770, 1250], [700, 1330], [610, 1380], [520, 1470], [430, 1500]], 4);
    root([[770, 1260], [840, 1350], [930, 1400], [1010, 1500], [1100, 1540]], 4);
    root([[766, 1270], [760, 1400], [740, 1560], [770, 1720], [750, 1880]], 5);
    root([[700, 1330], [650, 1420], [660, 1530]], 2);
    root([[840, 1350], [860, 1460], [900, 1560]], 2);
    root([[610, 1380], [560, 1360], [500, 1380]], 1.6);
    root([[760, 1560], [700, 1640], [640, 1660]], 1.6);
    root([[740, 1560], [820, 1630], [880, 1700]], 1.6);
    // leaf litter on the surface
    G.litter = [];
    for (let i = 0; i < 9; i++) {
      const x = r.range(40, 1040);
      if (Math.abs(x - 420) < 150) continue;
      G.litter.push({ g: leafGeom(x, SOIL_Y - 4 + r.range(-3, 6), r.pick([-1, 1]) * r.range(0.05, 0.25) + (r() < 0.5 ? Math.PI : 0), r.range(70, 110), r.range(30, 44), sd('lit', i), 0.02), seed: sd('litS', i) });
    }
    // grounds crumbs: where each crumb sits on the puck face, and where it settles in the soil
    G.crumbs = [];
    for (let i = 0; i < 360; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * PUCK_R;
      const sx = PUCK1[0] + Math.cos(a) * d, sy = SOIL_Y - 14 + Math.sin(a) * d * 0.18;
      const ex = sx + r.range(-30, 30), ey = SOIL_Y + 8 + Math.pow(r(), 1.7) * 190;
      G.crumbs.push([sx, sy, ex, ey, r.range(1.6, 4.2), r() < 0.25]);
    }
    GEO = G;
    return G;
  }

  // ---------------------------------------------------------------------------
  // puck: a short cylinder seen tumbling. face tilt phi, in-plane turn theta
  // ---------------------------------------------------------------------------

  function puckShape(cx, cy, theta, phi, R, seed) {
    const ry = Math.max(0.16, Math.abs(Math.cos(phi))) * R;
    const th = 34 * Math.abs(Math.sin(phi)) + 6;
    const c = Math.cos(theta), s = Math.sin(theta);
    const T = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];
    const face = [], body = [], rim = [];
    const N = 56;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU;
      const rr = 1 + 0.035 * LIB.noise1(i * 0.45, seed);
      face.push(T(Math.cos(a) * R * rr, Math.sin(a) * ry * rr - th / 2));
    }
    // silhouette = face ellipse swept down by the thickness
    for (let i = 0; i <= N / 2; i++) {
      const a = (i / (N / 2)) * Math.PI;
      const rr = 1 + 0.035 * LIB.noise1(i * 0.9 + 3, seed);
      body.push(T(Math.cos(a) * R * rr, Math.sin(a) * ry * rr + th / 2));
    }
    for (let i = N / 2; i <= N; i++) {
      const a = (i / (N / 2)) * Math.PI;
      body.push(T(Math.cos(a) * R, Math.sin(a) * ry - th / 2));
    }
    for (let i = 0; i <= N / 2; i++) {
      const a = (i / (N / 2)) * Math.PI;
      rim.push(T(Math.cos(a) * R, Math.sin(a) * ry - th / 2));
    }
    return { face, body, rim, ry, th };
  }

  function drawPuck(ctx, Z, P, cx, cy, theta, phi, seed, squash = 0) {
    const sh = puckShape(cx, cy, theta, phi, PUCK_R * (1 + squash * 0.1), seed);
    ink(ctx, Z, sh.body, { closed: true, width: 4, fill: LIB.mix(P.grounds, P.ink, 0.25), seed: seed + 1, wobble: 1.5 });
    hatchZ(ctx, Z, sh.body, { spacing: 6, width: 1.4, color: P.ink, alpha: 0.7, seed: seed + 2, density: (x, y) => sstep(-20, 90, (x - cx) * 0.5 + (y - cy) * 0.9) });
    ink(ctx, Z, sh.face, { closed: true, width: 3, fill: P.grounds, seed: seed + 3, wobble: 1.2 });
    // the face: fine grounds texture, the shower-screen ring, a few lighter specks
    stippleZ(ctx, Z, sh.face, { spacing: 6.5, r: [0.9, 1.9], color: P.beanMedium, alpha: 0.9, seed: seed + 4, density: 0.85 });
    stippleZ(ctx, Z, sh.face, { spacing: 9, r: [0.8, 1.6], color: P.ink, alpha: 0.7, seed: seed + 5, density: 0.6 });
    const ring = puckShape(cx, cy, theta, phi, PUCK_R * 0.72, seed + 9).face;
    ink(ctx, Z, ring, { closed: true, width: 1.6, color: P.beanMedium, alpha: 0.8, seed: seed + 6, wobble: 1 });
    hatchZ(ctx, Z, sh.face, { spacing: 8, width: 1.3, color: P.ink, alpha: 0.6, seed: seed + 7, density: (x, y) => sstep(10, 110, (x - cx) * 0.6 + (y - cy) * 0.8) });
  }

  // ---------------------------------------------------------------------------
  // camera
  // ---------------------------------------------------------------------------

  function camAt(t) {
    if (t <= B_ZOOM) return { zoom: 1, x: 540, y: 960, e: 0 };
    const u = clamp((t - B_ZOOM) / (Z_FRAMES * FR));
    const e = LIB.ease.outExpo(u);
    const zoom = Math.pow(ZMAX, e);
    const sy = lerp(620, 900, e);
    return { zoom, x: TGT[0], y: TGT[1] - (sy - 960) / zoom, e, sy };
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
      const bi = L.boil(info.T);
      const G = geo();
      const hit = (a, frames, e, lead = 1) => {
        if (t < a) return 0;
        const u = clamp((t - a) / (frames * FR) + lead / frames);
        return e ? e(u) : u;
      };
      const drawing = (a) => Math.floor((t - a) * 12 + 1e-6);

      const cam = camAt(t);
      const zk = cam.zoom;
      const Z = {
        k: zk,
        v: [cam.x - 540 / zk, cam.y - 960 / zk, cam.x + 540 / zk, cam.y + 960 / zk],
      };

      // ---- 1 stripes ---------------------------------------------------------------
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeYellow], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') & 0xffff });

      // ST draws the static world (cached per boil drawing while the camera is locked), DY the
      // moving parts (worm, grounds, puck, seedling)
      const world = (ctx, Z, ST, DY) => {
        const zk = Z.k;
        // ---- 2 back of the tree ---------------------------------------------------------
        if (ST) {
        for (const lf of G.back) drawLeaf(ctx, Z, P, lf.g, lf.seed, { color: L.mix(P.leafCoffee, P.leafDeep, 0.35) });
        drawTube(ctx, Z, P, G.branchR, sd('brR'));
        drawTube(ctx, Z, P, G.branchLow, sd('brLo'));
        drawTube(ctx, Z, P, G.branchLowL, sd('brLoL'));
        // trunk with lenticels
        drawTube(ctx, Z, P, G.trunk, sd('trunk'), { width: 4 });
        if (visB(Z, G.trunk.b)) {
          const lent = new Path2D();
          const rr = L.rng(sd('lent'));
          for (let i = 0; i < 70; i++) {
            const y = rr.range(-100, 1240), x = 760 + rr.range(-14, 14) - (y - 600) * 0.008;
            const w = rr.range(3, 6) / zk * Math.min(zk, 3);
            lent.moveTo(x - w, y);
            lent.lineTo(x + w, y);
          }
          ctx.save();
          ctx.strokeStyle = P.barkDeep;
          ctx.lineWidth = 1.6 / zk;
          ctx.lineCap = 'round';
          ctx.stroke(lent);
          ctx.restore();
        }
        }

        // ---- 3 soil cutaway ----------------------------------------------------------------
        if (Z.v[3] > SOIL_Y - 20) {
          if (ST) {
          ink(ctx, Z, G.soil, { closed: true, width: 0.01, fill: P.soil, seed: sd('soilfill'), wobble: 0 });
          hatchZ(ctx, Z, G.soil, { spacing: 8, width: 1.4, color: P.soilDeep, alpha: 0.8, seed: sd('soilh'), tone: 0.8, layers: 3, crossSpacing: 7, density: (x, y) => 0.35 + 0.65 * sstep(SOIL_Y, 1900, y) }, true);
          stippleZ(ctx, Z, G.soil, { spacing: 9, r: [1, 2.2], color: P.soilDeep, alpha: 0.8, seed: sd('soilst'), density: 0.5 });
          stippleZ(ctx, Z, G.soil, { spacing: 14, r: [1, 2], color: P.tan, alpha: 0.6, seed: sd('soilst2'), density: 0.35 });
          // roots
          for (let i = 0; i < G.roots.length; i++) {
            const rt = G.roots[i];
            ink(ctx, Z, rt.pts, { width: rt.w * 1.6, color: P.barkDeep, seed: sd('root', i), taper: [2, 40] });
          }
          // stones
          for (let i = 0; i < G.stones.length; i++) {
            const [x, y, a, b, rot, k] = G.stones[i];
            const pts = L.ellipsePts(x, y, a, b, 16, rot);
            ink(ctx, Z, pts, { closed: true, width: 2, fill: k ? P.tan : P.paperDeep, seed: sd('stone', i), wobble: 1.5 });
            hatchZ(ctx, Z, pts, { spacing: 4, width: 1, color: P.inkSoft, alpha: 0.7, seed: sd('stoneh', i), density: (px, py) => sstep(-2, a * 0.6, (px - x) + (py - y)) });
          }
          }
          // earthworm, rose, curling on twos
          if (DY) {
            const ph = Math.floor(tw * 12) * 0.5;
            const wp = [];
            for (let i = 0; i <= 26; i++) {
              const u = i / 26;
              const a = u * 4.2 + 0.4 * Math.sin(ph + u * 3);
              const rad = (38 - u * 22) * 1.8;
              wp.push([230 + Math.cos(a) * rad + u * 46, 1560 + Math.sin(a) * rad * 0.7]);
            }
            ink(ctx, Z, wp, { width: 18, color: P.ink, seed: sd('worm'), taper: [8, 8], swell: 0, boil: false });
            ink(ctx, Z, wp, { width: 12.5, color: P.rose, seed: sd('worm'), taper: [7, 7], swell: 0, boil: false });
            const segs = new Path2D();
            for (let i = 2; i < wp.length - 2; i += 2) {
              const a = wp[i - 1], b = wp[i + 1];
              const tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
              segs.moveTo(wp[i][0] - (ty / tl) * 6, wp[i][1] + (tx / tl) * 6);
              segs.lineTo(wp[i][0] + (ty / tl) * 6, wp[i][1] - (tx / tl) * 6);
            }
            ctx.save();
            ctx.strokeStyle = P.inkSoft;
            ctx.globalAlpha = 0.8;
            ctx.lineWidth = 1.2 / zk;
            ctx.stroke(segs);
            ctx.restore();
          }
          // soil surface line and litter
          if (ST) {
            ink(ctx, Z, G.surf, { width: 4, seed: sd('surfline'), taper: [0, 0] });
            for (const lt of G.litter) drawLeaf(ctx, Z, P, lt.g, lt.seed, { color: P.tan, width: 2 });
          }
          // grounds mixing into the soil after the landing: crumbs sink over 9 frames, then rest
          if (DY && t >= B_LAND) {
            const k = hit(B_LAND, 9, E.outCubic);
            const cp = new Path2D(), cp2 = new Path2D();
            for (const c of G.crumbs) {
              const x = lerp(c[0], c[2], k), y = lerp(c[1], c[3], k);
              const rad = c[4] * (1 - 0.25 * k);
              const pth = c[5] ? cp2 : cp;
              pth.moveTo(x + rad, y);
              pth.arc(x, y, rad, 0, TAU);
            }
            ctx.save();
            ctx.fillStyle = P.grounds;
            ctx.fill(cp);
            ctx.fillStyle = P.beanMedium;
            ctx.fill(cp2);
            ctx.restore();
            // what is left on the surface: a low crumbly mound
            const mk = 1 - 0.7 * k;
            const mound = [];
            for (let i = 0; i <= 24; i++) {
              const u = i / 24;
              const x = PUCK1[0] - 150 + u * 300;
              const h = Math.sin(Math.PI * u) * 34 * mk * (1 + 0.25 * L.noise1(u * 9, sd('mound')));
              mound.push([x, SOIL_Y + 2 - h]);
            }
            mound.push([PUCK1[0] + 150, SOIL_Y + 8], [PUCK1[0] - 150, SOIL_Y + 8]);
            ink(ctx, Z, mound, { closed: true, width: 2.5, fill: P.grounds, seed: sd('moundI'), wobble: 1.5 });
            stippleZ(ctx, Z, mound, { spacing: 6, r: [0.8, 1.7], color: P.beanMedium, alpha: 0.9, seed: sd('moundS'), density: 0.7 });
          }
        }

        // ---- 4 the lateral branch, leaves and clusters -------------------------------------
        if (ST) {
        drawTube(ctx, Z, P, G.branch, sd('branch'));
        // the leaf behind the cluster first, front leaves after the clusters
        for (let i = 0; i < G.leaves.length; i++) {
          const lf = G.leaves[i];
          const upward = lf.g.ang < 0;
          if (upward) drawLeaf(ctx, Z, P, lf.g, lf.seed);
        }
        const clusterDraw = (list, key) => {
          list.forEach((c, i) => drawCherry(ctx, Z, P, c.p[0], c.p[1], c.p[2], c.p[2] * 1.1, c.kind, sd('ch', key, i), { width: 2.5, spacing: 6 }));
        };
        clusterDraw(G.clusterLL, 'LL');
        clusterDraw(G.clusterL, 'L');
        clusterDraw(G.clusterN0, 'N0');
        // target cluster: neighbours, then the hero cherry on top
        G.cluster.forEach((c, i) => drawCherry(ctx, Z, P, c.p[0], c.p[1], c.p[2], c.p[2] * 1.1, c.kind, sd('tc', i), { width: 3, spacing: 7 }));
        drawCherry(ctx, Z, P, TGT[0], TGT[1], TRX, TRY, 'red', sd('target'), {
          width: lerp(3, 5, cam.e),
          spacing: 8,
          wobble: 1.2,
          dew: [540 + 110 / 9, 620 - 140 / 9, 18 / 9],
        });
        for (let i = 0; i < G.leaves.length; i++) {
          const lf = G.leaves[i];
          if (!(lf.g.ang < 0)) drawLeaf(ctx, Z, P, lf.g, lf.seed);
        }

        // ---- 5 knock box edge (top left) ----------------------------------------------------
        if (Z.v[0] < 330 && Z.v[1] < 380) {
          const box = [[-40, 300], [210, 300], [222, 312], [222, 420], [-40, 420]];
          ink(ctx, Z, box, { closed: true, width: 4, fill: P.wood, seed: sd('box'), smooth: false, wobble: 1 });
          hatchZ(ctx, Z, [[-40, 330], [222, 330], [222, 420], [-40, 420]], { angle: 0.02, spacing: 6, width: 1.3, color: P.barkDeep, alpha: 0.75, length: [30, 90], seed: sd('boxh'), angleJitter: 0.01 });
          const inner = [[-40, 300], [200, 300], [200, 318], [-40, 318]];
          fillPoly(ctx, inner, P.ink, 0.85);
          // the knock bar: a rubber-sleeved rod across the box mouth
          ink(ctx, Z, [[-40, 296], [214, 288]], { width: 22, color: P.ink, seed: sd('bar'), taper: [0, 4], swell: 0 });
          ink(ctx, Z, [[-40, 291], [210, 283]], { width: 5, color: P.steelDeep, seed: sd('bar2'), taper: [0, 4], swell: 0 });
          ink(ctx, Z, [[214, 278], [214, 300]], { width: 3, seed: sd('barEnd'), taper: 0 });
          // a few grounds left on the bar edge
          const g0 = new Path2D();
          const rr = L.rng(sd('bargr'));
          for (let i = 0; i < 26; i++) {
            const x = rr.range(150, 230), y = rr.range(266, 282);
            const rad = rr.range(1.2, 3);
            g0.moveTo(x + rad, y);
            g0.arc(x, y, rad, 0, TAU);
          }
          ctx.fillStyle = P.grounds;
          ctx.fill(g0);
        }

        }

        // ---- 6 puck and seedling ----------------------------------------------------------------
        if (DY && t < B_LAND + 2 * FR && Z.v[3] > 200) {
          const u = clamp(tw / B_LAND);
          const x = lerp(PUCK0[0], PUCK1[0], u);
          const y = PUCK0[1] + (PUCK1[1] - 30 - PUCK0[1]) * u * u;
          const theta = -0.35 + u * 2.3 * Math.PI * 0.5;
          const phi = 0.9 + u * 2.6;
          if (t < B_LAND) drawPuck(ctx, Z, P, x, y, theta, phi, sd('puck'));
          else {
            // impact drawing (one held drawing): the puck flattens and splits
            drawPuck(ctx, Z, P, PUCK1[0], SOIL_Y - 20, 0.04, 1.42, sd('puck'), 0.6);
            const crack = new Path2D();
            crack.moveTo(PUCK1[0] - 40, SOIL_Y - 30);
            crack.lineTo(PUCK1[0] - 6, SOIL_Y - 16);
            crack.lineTo(PUCK1[0] + 30, SOIL_Y - 28);
            crack.moveTo(PUCK1[0] - 6, SOIL_Y - 16);
            crack.lineTo(PUCK1[0] + 4, SOIL_Y - 4);
            ctx.save();
            ctx.strokeStyle = P.ink;
            ctx.lineWidth = 2.5;
            ctx.stroke(crack);
            ctx.restore();
          }
        }
        if (DY && t >= B_SHOOT && Z.v[3] > SOIL_Y - 120) {
          // soldier stage: the hooked stem lifts the seed in its parchment
          const gstep = Math.min(3, drawing(B_SHOOT));
          const hgt = [0.45, 0.8, 1.06, 1][gstep];
          const bx = 548, by = SOIL_Y + 2;
          const h = 112 * hgt;
          const stem = [[bx, by + 6], [bx + 1, by - h * 0.5], [bx + 4, by - h * 0.92], [bx + 14, by - h * 1.02], [bx + 22, by - h * 0.86]];
          ink(ctx, Z, stem, { width: 8, color: P.ink, seed: sd('stem'), taper: [2, 6], swell: 0 });
          ink(ctx, Z, stem, { width: 4.5, color: P.leafLight, seed: sd('stem'), taper: [2, 6], swell: 0 });
          const seedP = L.ellipsePts(bx + 25, by - h * 0.86 + 12, 11, 15, 18, -0.4);
          ink(ctx, Z, seedP, { closed: true, width: 2, fill: P.parchment, seed: sd('seed'), wobble: 0.4, taper: [2, 4] });
          // a crack in the soil around the stem
          ink(ctx, Z, [[bx - 18, by + 2], [bx - 6, by - 3], [bx + 8, by + 1], [bx + 20, by - 2]], { width: 2, seed: sd('crack'), taper: [4, 4] });
        }
      };

      if (zk <= 1) {
        // locked camera: the static world comes from a cache, one canvas per boil drawing (3 cycle)
        BOIL = bi % 3;
        const S = FILM.S || 1;
        const img = L.cached(['grounds-to-soil-static', S, BOIL].join('|'), () => {
          const c = FILM.makeCanvas(Math.round(1080 * S), Math.round(1920 * S));
          const g = c.getContext('2d');
          g.setTransform(S, 0, 0, S, 0, 0);
          world(g, Z, true, false);
          return c;
        });
        ctx.drawImage(img, 0, 0, 1080, 1920);
        BOIL = bi;
        world(ctx, Z, false, true);
      } else {
        BOIL = bi;
        L.camera(ctx, { x: cam.x, y: cam.y, zoom: zk }, () => world(ctx, Z, true, true));
      }

      // ---- 7 overlays (screen space) ---------------------------------------------------------
      const toS = (x, y) => [540 + (x - cam.x) * zk, 960 + (y - cam.y) * zk];
      // annBlue dashed fall trajectory, drawing on behind the puck at 24 fps
      if (zk < 1.5) {
        const u = clamp(t / B_LAND);
        const pts = [];
        const n = 40;
        for (let i = 0; i <= n; i++) {
          const v = (i / n) * u * 0.8;
          pts.push(toS(lerp(PUCK0[0], PUCK1[0], v), PUCK0[1] + (PUCK1[1] - 30 - PUCK0[1]) * v * v));
        }
        const fade = 1 - clamp((t - 1.2) / 0.3);
        if (pts.length > 1 && fade > 0) {
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.strokeStyle = P.annBlue;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.setLineDash([14, 10]);
          ctx.beginPath();
          L.tracePath(ctx, pts, false);
          ctx.stroke();
          ctx.setLineDash([]);
          // arrowhead at the leading end
          const a = pts[pts.length - 1], b = pts[Math.max(0, pts.length - 3)];
          const ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
          if (u > 0.08) {
            ctx.beginPath();
            ctx.moveTo(a[0] + Math.cos(ang) * 10, a[1] + Math.sin(ang) * 10);
            ctx.lineTo(a[0] + Math.cos(ang + 2.5) * 12, a[1] + Math.sin(ang + 2.5) * 12);
            ctx.lineTo(a[0] + Math.cos(ang - 2.5) * 12, a[1] + Math.sin(ang - 2.5) * 12);
            ctx.closePath();
            ctx.fillStyle = P.annBlue;
            ctx.fill();
          }
          // motion ticks beside the falling puck
          ctx.restore();
        }
      }
      // annYellow ring where it lands (expands outExpo, fades over 12 frames)
      if (t >= B_LAND && zk < 1.5) {
        const k = hit(B_LAND, 12, E.outExpo);
        const a = 1 - hit(B_LAND + 3 * FR, 9);
        if (a > 0) {
          const c = toS(PUCK1[0], SOIL_Y - 10);
          ctx.save();
          ctx.strokeStyle = P.annYellow;
          ctx.globalAlpha = a;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(c[0], c[1], 120 + 110 * k, 34 + 40 * k, 0, 0, TAU);
          ctx.stroke();
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(c[0], c[1], 90 + 70 * k, 24 + 26 * k, 0, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
      }
      // annYellow dashed ring around the target cluster after the shoot: the eye goes up
      if (t >= B_SHOOT && cam.e < 0.6) {
        const k = hit(B_SHOOT, 6, E.outExpo);
        const fade = 1 - clamp(cam.e / 0.4);
        const c = toS(TGT[0], TGT[1] - 4);
        ctx.save();
        ctx.strokeStyle = P.annYellow;
        ctx.globalAlpha = fade;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = -t * 40;
        ctx.beginPath();
        ctx.arc(c[0], c[1], (70 + 40 * (1 - k)) * zk, -Math.PI / 2, -Math.PI / 2 + TAU * k);
        ctx.stroke();
        ctx.restore();
      }
      // annMagenta target ring on the beat, riding the zoom and fading over 10 frames
      if (t >= B_ZOOM) {
        const k = hit(B_ZOOM, 3, E.outBack);
        const a = 1 - hit(B_ZOOM + 2 * FR, 8, E.inQuad, 0);
        if (a > 0.003) {
          const c = toS(TGT[0], TGT[1]);
          const rr = (TRX * 1.55 + 6) * zk * k;
          ctx.save();
          ctx.strokeStyle = P.annMagenta;
          ctx.globalAlpha = a;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(c[0], c[1], rr, rr * 1.08, 0, 0, TAU);
          ctx.stroke();
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const an = (i * Math.PI) / 2 + Math.PI / 4;
            ctx.moveTo(c[0] + Math.cos(an) * rr * 1.08, c[1] + Math.sin(an) * rr * 1.16);
            ctx.lineTo(c[0] + Math.cos(an) * (rr * 1.08 + 18), c[1] + Math.sin(an) * (rr * 1.16 + 18));
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    },
  });
})();
