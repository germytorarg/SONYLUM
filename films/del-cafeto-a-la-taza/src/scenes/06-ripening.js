// 06 ripening : Green, yellow, red. Illustrated, global T 9.75 to 12.00 (t 0 to 2.25).
// A horizontal coffee branch at y 700 with opposite leaf pairs at x 220 and 860. At the centre node
// (540, 760) a tight axillary cluster of 11 nearly stalkless cherries packs around the branch: 7 in front
// hanging just under it, 4 behind peeking over it. They start small and green, swell to full size on twos
// (T 9.75 to 10.50), then ripen unevenly: four turn yellow from T 10.50 (8th-triplets), five turn red from
// T 11.25 with magenta change rings, one darkens to overripe on T 11.625; two stay yellow and four green.
// A nine-dot month tally (annYellow) fills one dot per 8th-triplet; an annBlue ruler shows the growth.
//
// Layers, back to front:
//   1. stripes (stripeCream / stripeSpring), screen-fixed, drifting 6 px per beat
//   2. (camera push 1.00 to 1.05 about (540, 800))
//   3. leaves (cached static layer, 4-drawing boil cycle)
//   4. back-row cherries (behind the branch)
//   5. the branch (cached static layer)
//   6. young cherries in the side axils, front-row cherries with cast shadows on their neighbours
//   7. magenta change rings on the cherries that turn red
//   8. screen-fixed overlays: annBlue growth ruler (x 160, y 780 to 940), annYellow month tally ring
(function () {
  'use strict';

  const ID = 'ripening';
  const LIB = FILM.lib;
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const FR = 1 / 24;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
  const sstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const sd = (...k) => LIB.hash(ID, ...k) & 0x7fffffff;

  // While a cached static layer is drawn, BOIL pins every line to one of four boil drawings
  // (a 4-drawing boil cycle), so each cached layer is the same whichever frame builds it.
  let BOIL = null;
  const bo = (o) => (BOIL == null ? o : Object.assign({}, o, { boil: BOIL }));
  const ink = (ctx, pts, o) => LIB.inkPath(ctx, pts, bo(o));
  const hatchB = (ctx, clip, o) => LIB.hatch(ctx, clip, bo(o));
  const stippleB = (ctx, clip, o) => LIB.stipple(ctx, clip, bo(o));

  // beats (shot-local seconds; global T in comments)
  const B_SWELL = 0; // T 9.75 swell starts (pairs of cherries, one drawing apart)
  const B_YEL = [0.75, 1.0, 1.25, 1.5]; // T 10.50, 10.75, 11.00, 11.25 yellow events
  const B_RED = [1.5, 1.75, 2.0]; // T 11.25, 11.50, 11.75 red events
  const B_DEEP = 1.875; // T 11.625 overripe

  // hoisted colours (pal is a read-only proxy)
  const P0 = LIB.pal;
  const C = {
    ink: P0.ink, inkSoft: P0.inkSoft, inkFaint: P0.inkFaint,
    leaf: P0.leafCoffee, leafDeep: P0.leafDeep, leafLight: P0.leafLight, leafSheen: P0.leafSheen,
    bark: P0.bark, barkDeep: P0.barkDeep,
    white: P0.white, ochre: P0.ochre, tan: P0.tan,
    annYellow: P0.annYellow, annBlue: P0.annBlue, annMagenta: P0.annMagenta,
    leafInk: LIB.mix(P0.leafDeep, P0.ink, 0.45),
    barkLight: LIB.mix(P0.bark, P0.tan, 0.45),
    sheenWhite: LIB.mix(P0.leafSheen, P0.white, 0.55),
  };
  // cherry colour stages: fill, shade (hatch), gloss
  const STAGE = {
    green: { fill: P0.cherryGreen, shade: LIB.mix(P0.cherryGreen, P0.leafDeep, 0.6), gloss: LIB.mix(P0.cherryGreen, P0.white, 0.55) },
    yellow: { fill: P0.cherryYellow, shade: LIB.mix(P0.cherryYellow, P0.ochre, 0.55), gloss: LIB.mix(P0.cherryYellow, P0.white, 0.6) },
    red: { fill: P0.cherryRed, shade: P0.cherryDeep, gloss: P0.cherryLight },
    deep: { fill: P0.cherryDeep, shade: LIB.mix(P0.cherryDeep, P0.ink, 0.5), gloss: LIB.mix(P0.cherryDeep, P0.cherryLight, 0.45) },
  };

  function trace(ctx, pts, closed = true) {
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
      else ctx.lineTo(pts[i][0], pts[i][1]);
    }
    if (closed) ctx.closePath();
  }
  function pathOf(pts, closed = true) {
    const p = new Path2D();
    trace(p, pts, closed);
    return p;
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
  function strokeP(ctx, p, color, alpha, width, dash) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.globalAlpha *= alpha;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke(p);
    ctx.restore();
  }
  function bboxOf(pts, pad = 4) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[0] > x1) x1 = p[0];
      if (p[1] > y1) y1 = p[1];
    }
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
  }
  function polyLen(pts) {
    let s = 0;
    for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return s;
  }

  // ---------------------------------------------------------------------------
  // Coffee leaf: elliptic, about 2 : 1, drawn-out tip, wavy margin (5 undulations a side),
  // 9 pairs of looping lateral veins, a pale gloss streak beside the midrib on the lit side.
  // ---------------------------------------------------------------------------
  function leafGeom(bx, by, ang, len, width, key, bend) {
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const nx = -uy, ny = ux;
    const pet = 34, blade = len - pet;
    const ph = LIB.h3(sd('leafph', key), 1, 2) * TAU;
    const at = (u, v) => {
      const b = bend * 4 * u * (1 - u);
      return [bx + ux * (pet + u * blade) + nx * (v + b), by + uy * (pet + u * blade) + ny * (v + b)];
    };
    const hw = (u) => {
      u = clamp(u);
      const s = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 0.78) * (1 - 0.32 * sstep(0.7, 1, u));
      return (width / 2) * s;
    };
    const wave = (u, side) => 1 + 0.055 * Math.sin(TAU * 5 * u + ph + (side > 0 ? 0 : 1.9)) * sstep(0.05, 0.22, u) * (1 - sstep(0.86, 0.99, u));
    const N = 64;
    const upper = [], lower = [], mid = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      upper.push(at(u, hw(u) * wave(u, 1)));
      lower.push(at(u, -hw(u) * 0.94 * wave(u, -1)));
      mid.push(at(u, 0));
    }
    const outline = upper.concat(lower.slice(1, N).reverse());
    const halfA = upper.concat(mid.slice(1, N).reverse());
    const halfB = lower.concat(mid.slice(1, N).reverse());
    // the side whose normal points up-left faces the light
    const litSide = nx + ny < 0 ? 1 : -1;
    const r = LIB.rng(sd('leafv', key));
    const veins = [];
    for (let k = 0; k < 9; k++) {
      const u0 = 0.07 + k * 0.088 + r.range(-0.01, 0.01);
      for (const s of [1, -1]) {
        const k2 = s > 0 ? 1 : 0.94;
        const pts = [at(u0, 0)];
        const steps = [[0.05, 0.42], [0.12, 0.76], [0.2, 0.84], [0.27, 0.8]];
        for (const [du, f] of steps) {
          const u = Math.min(0.975, u0 + du);
          pts.push(at(u, s * hw(u) * f * k2));
        }
        veins.push({ s, u0, pts });
      }
    }
    const veinAng = (s) => {
      const a = at(0.42, 0), b = at(0.42 + 0.12, s * hw(0.54) * 0.76);
      return Math.atan2(b[1] - a[1], b[0] - a[0]);
    };
    const gloss = [];
    {
      const fw = [], bw = [];
      for (let i = 0; i <= 30; i++) {
        const u = 0.1 + (i / 30) * 0.74;
        const w = Math.sin((Math.PI * (u - 0.1)) / 0.74);
        fw.push(at(u, litSide * hw(u) * 0.07));
        bw.push(at(u, litSide * hw(u) * (0.08 + 0.3 * Math.pow(w, 0.8))));
      }
      gloss.push(...fw, ...bw.reverse());
    }
    const uvOf = (x, y) => {
      const dx = x - bx, dy = y - by;
      const u = (dx * ux + dy * uy - pet) / blade;
      const uc = clamp(u);
      const v = dx * nx + dy * ny - bend * 4 * uc * (1 - uc);
      return [u, v / Math.max(6, hw(uc))];
    };
    return {
      outline, halfA, halfB, mid, veins, gloss, litSide, key, uvOf, at, hw,
      stalk: [[bx, by], at(0, 0)], angA: veinAng(1), angB: veinAng(-1), bounds: bboxOf(outline, 8),
    };
  }

  function drawLeaf(ctx, Lf, o = {}) {
    const L = LIB;
    const k = Lf.key;
    const wScale = o.thin ? 0.8 : 1;
    // petiole
    ink(ctx, Lf.stalk, { width: 13 * wScale, color: C.ink, seed: sd('pet0', k), taper: [0, 5], swell: 0, wobble: 0.4 });
    ink(ctx, Lf.stalk, { width: 7 * wScale, color: C.leafLight, seed: sd('pet', k), taper: [0, 4], swell: 0, wobble: 0.4 });
    ink(ctx, Lf.outline, { closed: true, width: 3 * wScale, fill: C.leaf, seed: sd('leafline', k), wobble: 1.2 });
    const shadowHalf = Lf.litSide > 0 ? Lf.halfB : Lf.halfA;
    const litHalf = Lf.litSide > 0 ? Lf.halfA : Lf.halfB;
    const angShadow = Lf.litSide > 0 ? Lf.angB : Lf.angA;
    const angLit = Lf.litSide > 0 ? Lf.angA : Lf.angB;
    const B = Lf.bounds;
    // shadow half: hatch parallel to the side veins, darker toward the margin and tip
    hatchB(ctx, shadowHalf, {
      angle: angShadow, spacing: 5.5, width: 1.6, color: C.leafDeep, alpha: 0.9, length: [12, 34], bounds: B, seed: sd('lh', k),
      density: (x, y) => {
        const q = Lf.uvOf(x, y);
        return 0.5 + 0.5 * sstep(0.1, 0.75, Math.abs(q[1]));
      },
    });
    hatchB(ctx, shadowHalf, {
      angle: angShadow + 1.05, spacing: 7, width: 1.3, color: C.ink, alpha: 0.42, length: [10, 26], bounds: B, seed: sd('lh2', k),
      density: (x, y) => {
        const q = Lf.uvOf(x, y);
        return 0.95 * sstep(0.45, 0.95, Math.abs(q[1])) * (0.4 + 0.6 * sstep(0.3, 0.9, q[0]));
      },
    });
    // lit half: only a light shade near the margin and in the base
    hatchB(ctx, litHalf, {
      angle: angLit, spacing: 9, width: 1.3, color: C.leafDeep, alpha: 0.8, length: [10, 24], bounds: B, seed: sd('uh', k),
      density: (x, y) => {
        const q = Lf.uvOf(x, y);
        return 0.75 * sstep(0.72, 1.0, Math.abs(q[1])) + 0.6 * (1 - sstep(0.02, 0.16, q[0]));
      },
    });
    // gloss streak along the midrib on the lit side, with a few bright flicks
    fillPoly(ctx, Lf.gloss, C.leafSheen, 0.8);
    const flick = new Path2D();
    for (let i = 0; i < 5; i++) {
      const u0 = 0.2 + i * 0.12;
      const a = Lf.at(u0, Lf.litSide * Lf.hw(u0) * 0.16), b = Lf.at(u0 + 0.06, Lf.litSide * Lf.hw(u0 + 0.06) * 0.2);
      flick.moveTo(a[0], a[1]);
      flick.lineTo(b[0], b[1]);
    }
    strokeP(ctx, flick, C.sheenWhite, 0.9, 2.2);
    // sunken lateral veins and the midrib
    for (let i = 0; i < Lf.veins.length; i++) {
      ink(ctx, Lf.veins[i].pts, { width: 1.8, color: C.leafDeep, alpha: 0.95, seed: sd('lv', k, i), taper: [3, 14], wobble: 0.5, step: 3 });
    }
    ink(ctx, Lf.mid, { width: 4 * wScale, color: C.leafLight, seed: sd('mid', k), taper: [2, 70], wobble: 0.6 });
    ink(ctx, Lf.mid, { width: 1.2, color: C.leafInk, alpha: 0.6, seed: sd('mid2', k), taper: [10, 90], wobble: 0.6 });
  }


  // ---------------------------------------------------------------------------
  // Branch
  // ---------------------------------------------------------------------------
  function branchPts(x0, y0, x1, y1, half, sagAmp, n = 40) {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy);
    const ux = dx / l, uy = dy / l, nx = uy, ny = -ux;
    const top = [], bot = [], mid = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const g = sagAmp * Math.sin(Math.PI * s);
      const cx = x0 + dx * s - nx * g, cy = y0 + dy * s - ny * g;
      const h = half * (1 - 0.12 * s);
      mid.push([cx, cy]);
      top.push([cx + nx * h, cy + ny * h]);
      bot.push([cx - nx * h, cy - ny * h]);
    }
    return { top, bot, mid, poly: top.concat(bot.slice().reverse()), ux, uy, nx, ny };
  }

  function drawBranch(ctx, Bp, key, nodes, o = {}) {
    const L = LIB;
    const w = o.w || 3.5;
    fillPoly(ctx, Bp.poly, C.bark);
    // a pale lit strip along the top edge
    const strip = [];
    for (let i = 0; i < Bp.top.length; i++) {
      const t = Bp.top[i], m = Bp.mid[i];
      strip.push([lerp(t[0], m[0], 0.15), lerp(t[1], m[1], 0.15)]);
    }
    for (let i = Bp.top.length - 1; i >= 0; i--) {
      const t = Bp.top[i], m = Bp.mid[i];
      strip.push([lerp(t[0], m[0], 0.55), lerp(t[1], m[1], 0.55)]);
    }
    fillPoly(ctx, strip, C.barkLight, 0.7);
    // lengthwise bark hatching on the shadow (lower) half, plus contour strokes in the deepest band
    const ang = Math.atan2(Bp.uy, Bp.ux);
    const half = Math.hypot(Bp.top[0][0] - Bp.mid[0][0], Bp.top[0][1] - Bp.mid[0][1]);
    const vOf = (x, y) => ((x - Bp.mid[0][0]) * Bp.nx + (y - Bp.mid[0][1]) * Bp.ny);
    // distance below the (sagging) centreline, normalised
    const sOf = (x, y) => ((x - Bp.mid[0][0]) * Bp.ux + (y - Bp.mid[0][1]) * Bp.uy);
    const total = polyLen(Bp.mid);
    const below = (x, y) => {
      const s = clamp(sOf(x, y) / total);
      const m = Bp.mid[Math.round(s * (Bp.mid.length - 1))];
      return -((x - m[0]) * Bp.nx + (y - m[1]) * Bp.ny) / half;
    };
    hatchB(ctx, Bp.poly, { angle: ang + 0.04, spacing: 3.6, width: 1.4, color: C.barkDeep, alpha: 0.9, length: [16, 46], seed: sd('bh', key), density: (x, y) => sstep(-0.25, 0.55, below(x, y)) });
    hatchB(ctx, Bp.poly, { angle: ang + Math.PI / 2 + 0.25, spacing: 6, width: 1.3, color: C.ink, alpha: 0.5, length: [5, 10], seed: sd('bc', key), density: (x, y) => sstep(0.45, 0.9, below(x, y)) });
    // bark flecks and lenticels
    stippleB(ctx, Bp.poly, { spacing: 13, r: [1.0, 1.8], color: C.barkDeep, alpha: 0.75, seed: sd('len', key), density: (x, y) => 0.55 + 0.4 * sstep(-0.6, 0.4, below(x, y)) });
    void vOf;
    // node swellings: a slight ring where each leaf pair joins
    for (let i = 0; i < nodes.length; i++) {
      const [x, y] = nodes[i];
      const ring = [];
      for (let k = -1; k <= 1; k += 2) ring.push([x + Bp.ux * k * 6 + Bp.nx * (half + 2), y + Bp.uy * k * 6 + Bp.ny * (half + 2)]);
      const p1 = [x + Bp.nx * (half + 3), y + Bp.ny * (half + 3)], p2 = [x - Bp.nx * (half + 3), y - Bp.ny * (half + 3)];
      const c = [x + Bp.ux * 5, y + Bp.uy * 5];
      ink(ctx, L.smoothPts([p1, c, p2], false, 3), { width: 1.8, color: C.inkSoft, alpha: 0.9, seed: sd('nodering', key, i), taper: [4, 4], wobble: 0.3 });
    }
    ink(ctx, Bp.top, { width: w, seed: sd('btop', key), taper: [0, 0], wobble: 1.2 });
    ink(ctx, Bp.bot, { width: w + 0.5, seed: sd('bbot', key), taper: [0, 0], wobble: 1.2 });
  }

  // ---------------------------------------------------------------------------
  // Cherries
  // ---------------------------------------------------------------------------
  const NODE = [540, 700];
  // final colours: A overripe, B..E red, F, G yellow, H..K green (uneven on purpose)
  // y events: when it turns yellow; r: when it turns red; d: when it goes overripe
  const SCHED = {
    A: { y: 0.75, r: 1.5, d: B_DEEP },
    B: { y: 1.0, r: 1.75 },
    C: { y: 0.75, r: 1.5 },
    D: { y: 1.25, r: 1.75 },
    E: { y: 1.25, r: 2.0 },
    F: { y: 1.0 },
    G: { y: 1.5 },
    H: {}, I: {}, J: {}, K: {},
  };
  // front row hangs just under the branch, arched; back row peeks over it
  const FRONT = [
    { x: 300, r: 74, k: 'H', tilt: 0.2 },
    { x: 382, r: 80, k: 'B', tilt: 0.12 },
    { x: 462, r: 78, k: 'F', tilt: 0.06 },
    { x: 540, r: 85, k: 'C', tilt: -0.02 },
    { x: 620, r: 76, k: 'I', tilt: -0.08 },
    { x: 700, r: 82, k: 'D', tilt: -0.14 },
    { x: 780, r: 72, k: 'G', tilt: -0.2 },
  ].map((c, i) => Object.assign(c, { y: 774 + Math.pow((c.x - 540) / 240, 2) * 50, back: false, id: i }));
  const BACK = [
    { x: 392, y: 640, r: 72, k: 'E', tilt: -0.25 },
    { x: 488, y: 622, r: 70, k: 'J', tilt: -0.1 },
    { x: 600, y: 626, r: 74, k: 'A', tilt: 0.1 },
    { x: 694, y: 644, r: 70, k: 'K', tilt: 0.24 },
  ].map((c, i) => Object.assign(c, { back: true, id: 10 + i }));
  // young green cherries in the side axils (static, full grown but unripe)
  const SIDE = [
    { x: 196, y: 652, r: 40, tilt: -0.3, back: true, id: 30 },
    { x: 246, y: 648, r: 38, tilt: 0.25, back: true, id: 31 },
    { x: 836, y: 748, r: 42, tilt: 0.25, back: false, id: 32 },
    { x: 888, y: 744, r: 40, tilt: -0.2, back: false, id: 33 },
    { x: 862, y: 652, r: 38, tilt: 0.05, back: true, id: 34 },
  ];
  // swell order: pairs of cherries, one drawing (2 frames) apart
  const SWELL_ORDER = ['C', 'A', 'B', 'D', 'J', 'F', 'I', 'E', 'H', 'K', 'G'];

  function stageOf(k, t) {
    const s = SCHED[k];
    if (s.d != null && t >= s.d - 1e-6) return 'deep';
    if (s.r != null && t >= s.r - 1e-6) return 'red';
    if (s.y != null && t >= s.y - 1e-6) return 'yellow';
    return 'green';
  }

  function cherryPts(cx, cy, r, tilt, n = 56) {
    // slightly oval (h : w 1.1), a touch fuller on the lower half
    const out = [];
    const c = Math.cos(tilt), s = Math.sin(tilt);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const x = Math.cos(a) * r, y = Math.sin(a) * r * 1.1 * (Math.sin(a) > 0 ? 1.02 : 0.98);
      out.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return out;
  }

  function drawCherry(ctx, ch, cx, cy, r, stage, opts) {
    const L = LIB;
    const S = STAGE[stage];
    const pts = cherryPts(cx, cy, r, ch.tilt);
    const tipDir = ch.back ? -1 : 1; // the calyx end points away from the branch
    ink(ctx, pts, { closed: true, width: 4, fill: S.fill, seed: sd('ch', ch.id), wobble: 0.8, taper: [8, 16] });
    // shadow on the lower right: 45 degree hatch, then a cross layer in the deep crescent
    const lx = (x, y) => ((x - cx) * 0.7071 + (y - cy) * 0.7071) / r;
    hatchB(ctx, pts, {
      angle: -Math.PI / 4, spacing: 4.6, width: 1.5, color: S.shade, alpha: 0.9, length: [10, 28], inset: 2, overshoot: 0, seed: sd('chh', ch.id),
      density: (x, y) => sstep(-0.15, 0.55, lx(x, y)),
    });
    hatchB(ctx, pts, {
      angle: -Math.PI / 4 - Math.PI / 3, spacing: 6, width: 1.3, color: stage === 'green' ? C.leafDeep : C.ink, alpha: 0.5, length: [8, 20], inset: 2, overshoot: 0, seed: sd('chx', ch.id),
      density: (x, y) => sstep(0.45, 0.85, lx(x, y)),
    });
    if (stage === 'deep') {
      // wrinkles on the overripe skin
      for (let k = 0; k < 4; k++) {
        const a = -0.6 + k * 0.5;
        const p0 = [cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.2];
        const p1 = [cx + Math.cos(a + 0.2) * r * 0.55, cy + Math.sin(a + 0.25) * r * 0.5];
        const p2 = [cx + Math.cos(a + 0.1) * r * 0.78, cy + Math.sin(a + 0.1) * r * 0.75];
        ink(ctx, [p0, p1, p2], { width: 1.8, color: C.ink, alpha: 0.8, seed: sd('wr', ch.id, k), taper: [4, 8], wobble: 0.6 });
      }
    }
    // gloss crescent at the upper left (angles 200 to 250 degrees), and a bright dot
    const g = [];
    for (let i = 0; i <= 14; i++) {
      const a = (198 + (i / 14) * 56) * DEG;
      g.push([cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.78]);
    }
    for (let i = 14; i >= 0; i--) {
      const a = (198 + (i / 14) * 56) * DEG;
      const k = 0.72 - 0.16 * Math.sin((i / 14) * Math.PI);
      g.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * (k + 0.06)]);
    }
    ctx.save();
    ctx.fillStyle = S.gloss;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    for (let i = 0; i < g.length; i++) (i ? ctx.lineTo(g[i][0], g[i][1]) : ctx.moveTo(g[i][0], g[i][1]));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(cx - r * 0.34, cy - r * 0.48, Math.max(2.5, r * 0.07), 0, TAU);
    ctx.fill();
    ctx.restore();
    // calyx scar disc at the tip with its five-point mark
    const c = Math.cos(ch.tilt), s = Math.sin(ch.tilt);
    const tx = cx - s * r * 0.8 * tipDir, ty = cy + c * r * 0.8 * tipDir;
    const sr = r * 0.16;
    ink(ctx, LIB.ellipsePts(tx, ty, sr, sr * 0.72, 16, ch.tilt), { closed: true, width: 2, fill: stage === 'green' ? LIB.mix(S.shade, C.ink, 0.35) : LIB.mix(S.shade, C.ink, 0.5), seed: sd('scar', ch.id), wobble: 0.3, taper: [3, 5] });
    const st = new Path2D();
    for (let k = 0; k < 5; k++) {
      const a = ch.tilt + (k * TAU) / 5;
      st.moveTo(tx, ty);
      st.lineTo(tx + Math.cos(a) * sr * 0.75, ty + Math.sin(a) * sr * 0.55);
    }
    strokeP(ctx, st, C.ink, 0.8, 1.2);
    if (opts && opts.double) ink(ctx, pts.map((p) => [p[0] + 3, p[1] + 3]), { closed: true, width: 1.5, alpha: 0.35, seed: sd('chd', ch.id), wobble: 0.6 });
    return pts;
  }

  // the stub where a back cherry presses against the branch, or a front cherry hangs on it
  function drawStalkStub(ctx, ch, cx, cy, r) {
    const tipDir = ch.back ? -1 : 1;
    const c = Math.cos(ch.tilt), s = Math.sin(ch.tilt);
    const bx = cx + s * r * 0.95 * tipDir, by = cy - c * r * 0.95 * tipDir;
    let ex = lerp(bx, NODE[0] + (cx - NODE[0]) * 0.25, 0.6), ey = NODE[1] + (ch.back ? -6 : 8);
    // nearly stalkless: never longer than 18 px
    const dl = Math.hypot(ex - bx, ey - by);
    if (dl > 18) {
      ex = bx + ((ex - bx) / dl) * 18;
      ey = by + ((ey - by) / dl) * 18;
    }
    ink(ctx, [[bx, by], [ex, ey]], { width: 9, color: C.ink, seed: sd('stk0', ch.id), taper: [0, 2], swell: 0, wobble: 0.3 });
    ink(ctx, [[bx, by], [ex, ey]], { width: 5, color: C.leafLight, seed: sd('stk', ch.id), taper: [0, 2], swell: 0, wobble: 0.3 });
  }

  // ---------------------------------------------------------------------------
  // Memoised geometry and cached static layers
  // ---------------------------------------------------------------------------
  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const branch = branchPts(-40, 706, 1120, 694, 16, 5, 60);
    const leaves = [
      leafGeom(220 - 6, 686, -1.95, 430, 205, 'L0', 16),
      leafGeom(220 - 6, 716, 1.95, 430, 205, 'L1', -14),
      leafGeom(860 + 6, 684, -1.18, 430, 205, 'L2', -16),
      leafGeom(860 + 6, 714, 1.25, 430, 205, 'L3', 14),
      // an older pair beyond the frame edges, only their tips reach in
      leafGeom(-40, 712, 2.9, 380, 186, 'L4', 10),
      leafGeom(1120, 690, -0.35, 380, 186, 'L5', -10),
    ];
    // scenery: an upper branch at the top edge and a lower branch with its own mixed cluster
    const upper = branchPts(-40, 120, 760, -40, 12, 4, 40);
    const upperLeaves = [
      leafGeom(150, 96, 1.75, 380, 182, 'U0', 12),
      leafGeom(460, 36, 2.05, 380, 182, 'U1', -12),
      leafGeom(470, 30, 1.2, 360, 172, 'U2', 10),
    ];
    const lower = branchPts(-40, 1430, 1120, 1330, 14, 6, 50);
    const lowY = (x) => lerp(1430, 1330, (x + 40) / 1160) - 6 * Math.sin(Math.PI * ((x + 40) / 1160));
    const lowerLeaves = [
      leafGeom(320, lowY(320) - 12, -1.75, 400, 192, 'D0', -14),
      leafGeom(320, lowY(320) + 12, 1.65, 400, 192, 'D1', 12),
      leafGeom(830, lowY(830) - 12, -1.3, 400, 192, 'D2', 12),
      leafGeom(830, lowY(830) + 12, 1.35, 400, 192, 'D3', -14),
    ];
    // the lower cluster: a smaller axillary bunch, mostly green with a few turning (static)
    const lowCluster = [];
    {
      const r = LIB.rng(sd('lowcl'));
      const cols = ['green', 'yellow', 'green', 'red', 'green', 'green', 'yellow', 'green', 'red'];
      const n = cols.length;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.3;
        const back = Math.sin(a) < -0.2;
        const x = 575 + Math.cos(a) * 92, y = lowY(575) + Math.sin(a) * 50 + (back ? -4 : 34);
        lowCluster.push({ x, y, r: r.range(50, 58), tilt: r.range(-0.25, 0.25), back, id: 60 + i, col: cols[i] });
      }
      lowCluster.sort((p, q) => p.y - q.y);
    }
    GEO = { branch, leaves, upper, upperLeaves, lower, lowerLeaves, lowCluster, lowY };
    return GEO;
  }

  function staticLayer(L, name, bi, draw) {
    const S = FILM.S || 1;
    const b = ((bi % 4) + 4) % 4;
    return L.cached(ID + ':' + name + ':' + b + ':' + S, () => {
      const cv = FILM.makeCanvas(Math.round(1080 * S), Math.round(1920 * S));
      const ctx = cv.getContext('2d');
      ctx.setTransform(S, 0, 0, S, 0, 0);
      BOIL = b;
      try {
        draw(ctx);
      } finally {
        BOIL = null;
      }
      return cv;
    });
  }

  function overlayStroke(ctx, path, color, alpha, width) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalAlpha = alpha * 0.25;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = width + 3;
    ctx.stroke(path);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke(path);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Scene
  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib;
      const E = L.ease;
      const t = clamp(tIn, 0, info.dur);
      const tw = L.onTwos(t);
      const bi = L.boil(info.T);
      const G = geo();
      const drawing = (a) => Math.max(0, Math.floor((t - a) * 12 + 1e-4));

      // swell: 0.55 to 1.0, outBack over 6 frames, on twos; pairs one drawing apart
      const scaleOf = (k) => {
        const idx = SWELL_ORDER.indexOf(k);
        const st = B_SWELL + Math.floor(idx / 2) * 2 * FR;
        const u = clamp((tw - st) / (6 * FR) + 1 / 6);
        return tw < st - 1e-6 ? 0.55 : 0.55 + 0.45 * E.outBack(u);
      };
      // a cherry's centre eases toward the node while it is small, so the cluster stays packed
      const place = (ch, s) => [NODE[0] + (ch.x - NODE[0]) * (0.6 + 0.4 * s), NODE[1] + (ch.y - NODE[1]) * (0.45 + 0.55 * s)];

      // 1. stripes
      L.stripes(ctx, { colors: [L.pal.stripeCream, L.pal.stripeSpring], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') });

      // 2. camera
      const zoom = 1 + 0.05 * E.inOutSine(t / info.dur);
      const cam = { x: 540, y: 800 + 160 / zoom, zoom };

      const ringsToDraw = [];
      L.camera(ctx, cam, (ctx) => {
        // 3. leaves
        ctx.drawImage(staticLayer(L, 'leaves', bi, (c) => {
          // scenery branches first
          for (const Lf of G.upperLeaves) drawLeaf(c, Lf, { thin: true });
          drawBranch(c, G.upper, 'upper', [[150, 96], [465, 33]], { w: 3 });
          for (const Lf of G.lowerLeaves) drawLeaf(c, Lf);
          for (const ch of G.lowCluster) if (ch.back) drawCherry(c, ch, ch.x, ch.y, ch.r, ch.col);
          drawBranch(c, G.lower, 'lower', [[320, G.lowY(320)], [575, G.lowY(575)], [830, G.lowY(830)]], { w: 3.5 });
          for (const ch of G.lowCluster) if (!ch.back) drawCherry(c, ch, ch.x, ch.y, ch.r, ch.col);
          for (const Lf of G.leaves) drawLeaf(c, Lf);
        }), 0, 0, 1080, 1920);

        // 4. back row (and the young side cherries behind the branch)
        for (const ch of SIDE) if (ch.back) {
          drawStalkStub(ctx, ch, ch.x, ch.y, ch.r);
          drawCherry(ctx, ch, ch.x, ch.y, ch.r, 'green');
        }
        const backDrawn = [];
        for (const ch of BACK) {
          const s = scaleOf(ch.k);
          const [cx, cy] = place(ch, s);
          backDrawn.push(drawCherry(ctx, ch, cx, cy, ch.r * s, stageOf(ch.k, tw)));
        }

        // 5. branch, then its shadow on the back row's lower halves is implied by the hatch
        ctx.drawImage(staticLayer(L, 'branch', bi, (c) => drawBranch(c, G.branch, 'hero', [[220, 700], [540, 700], [860, 700]], { w: 4 })), 0, 0, 1080, 1920);
        // the branch casts a band of shadow onto the back cherries just above it
        {
          const band = [[300, 690], [800, 690], [800, 660], [300, 664]];
          ctx.save();
          const u = new Path2D();
          for (const p of backDrawn) {
            u.moveTo(p[0][0], p[0][1]);
            for (let i = 1; i < p.length; i++) u.lineTo(p[i][0], p[i][1]);
            u.closePath();
          }
          ctx.clip(u);
          L.hatch(ctx, band, { angle: -Math.PI / 4 - Math.PI / 3, spacing: 4, width: 1.3, color: C.ink, alpha: 0.4, length: [8, 18], seed: sd('brsh'), clip: false });
          ctx.restore();
        }

        // 6. side cherries in front, then the front row (outer ones first, the centre nearest the camera)
        for (const ch of SIDE) if (!ch.back) {
          drawStalkStub(ctx, ch, ch.x, ch.y, ch.r);
          drawCherry(ctx, ch, ch.x, ch.y, ch.r, 'green');
        }
        const order = FRONT.slice().sort((a, b) => Math.abs(b.x - 540) - Math.abs(a.x - 540) || a.x - b.x);
        const drawn = new Path2D();
        let any = false;
        for (const ch of order) {
          const s = scaleOf(ch.k);
          const [cx, cy] = place(ch, s);
          const r = ch.r * s;
          // cast shadow of this cherry on the cherries already drawn behind it (down and right)
          if (any) {
            const sh = cherryPts(cx + 12, cy + 14, r, ch.tilt, 40);
            ctx.save();
            ctx.clip(drawn);
            L.hatch(ctx, sh, { angle: -Math.PI / 4, spacing: 3.6, width: 1.3, color: C.ink, alpha: 0.5, length: [8, 20], seed: sd('csh', ch.id) });
            ctx.restore();
          }
          drawStalkStub(ctx, ch, cx, cy, r);
          const pts = drawCherry(ctx, ch, cx, cy, r, stageOf(ch.k, tw));
          drawn.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) drawn.lineTo(pts[i][0], pts[i][1]);
          drawn.closePath();
          any = true;
        }

        // 7. magenta change rings the moment a cherry turns red
        for (const ch of FRONT.concat(BACK)) {
          const sc = SCHED[ch.k];
          if (sc.r == null || t < sc.r - 1e-6) continue;
          const f = (t - sc.r) * 24;
          if (f >= 12) continue;
          const pr = E.outExpo(clamp((f + 1) / 8));
          const a = 1 - clamp((f - 4) / 8);
          const p = new Path2D();
          const rr = ch.r * 1.12 + 6 + 46 * pr;
          p.arc(ch.x, ch.y, rr, 0, TAU);
          ringsToDraw.push(p);
          overlayStroke(ctx, p, C.annMagenta, a, 3);
        }
        // an annYellow attention ring on the overripe cherry
        if (t >= B_DEEP - 1e-6) {
          const f = (t - B_DEEP) * 24;
          if (f < 12) {
            const ch = BACK[2];
            const pr = E.outExpo(clamp((f + 1) / 8));
            const p = new Path2D();
            p.arc(ch.x, ch.y, ch.r + 8 + 36 * pr, 0, TAU);
            for (let q = 0; q < 4; q++) {
              const a = Math.PI / 4 + (q * Math.PI) / 2;
              const rr = ch.r + 8 + 36 * pr;
              p.moveTo(ch.x + Math.cos(a) * (rr - 9), ch.y + Math.sin(a) * (rr - 9));
              p.lineTo(ch.x + Math.cos(a) * (rr + 9), ch.y + Math.sin(a) * (rr + 9));
            }
            overlayStroke(ctx, p, C.annYellow, 1 - clamp((f - 4) / 8), 3);
          }
        }
      });

      // 8a. annBlue growth ruler at x 160, y 780 to 940, reading the leftmost front cherry
      {
        const ch = FRONT[0];
        const s = scaleOf(ch.k);
        const [wx, wy] = place(ch, s);
        // world to screen through the camera
        const toS = (x, y) => [540 + (x - cam.x) * zoom, 960 + (y - cam.y) * zoom];
        const top = toS(wx, wy - ch.r * 1.1 * s), bot = toS(wx, wy + ch.r * 1.1 * s);
        const rx = 160;
        const rul = new Path2D();
        rul.moveTo(rx, 780);
        rul.lineTo(rx, 940);
        for (let y = 780, i = 0; y <= 940 + 1e-6; y += 10, i++) {
          const long = i % 5 === 0;
          rul.moveTo(rx, y);
          rul.lineTo(rx - (long ? 28 : 12), y);
        }
        overlayStroke(ctx, rul, C.annBlue, 1, 2);
        // leaders from the cherry's top and bottom to the ruler, with arrow marks
        const ld = new Path2D();
        for (const p of [top, bot]) {
          const y = clamp(p[1], 760, 960);
          ld.moveTo(p[0] - ch.r * s * 0.2, p[1]);
          ld.lineTo(rx + 8, y);
        }
        ctx.save();
        ctx.setLineDash([14, 10]);
        overlayStroke(ctx, ld, C.annBlue, 0.9, 2);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = C.annBlue;
        for (const p of [top, bot]) {
          const y = clamp(p[1], 760, 960);
          ctx.beginPath();
          ctx.moveTo(rx + 2, y);
          ctx.lineTo(rx + 16, y - 7);
          ctx.lineTo(rx + 16, y + 7);
          ctx.closePath();
          ctx.fill();
        }
        // the span between the marks, as a thicker bar on the ruler
        ctx.fillRect(rx - 3, clamp(top[1], 760, 960), 6, clamp(bot[1], 760, 960) - clamp(top[1], 760, 960));
        ctx.restore();
      }

      // 8b. annYellow month tally: nine dots on a ring at (840, 330), radius 70, one per 8th-triplet
      {
        const cx = 840, cy = 330, R = 70;
        const ring = new Path2D();
        ring.arc(cx, cy, R, 0, TAU);
        overlayStroke(ctx, ring, C.annYellow, 0.55, 2);
        let litN = 0;
        for (let k = 0; k < 9; k++) {
          const a0 = k * 0.25;
          const on = t >= a0 - 1e-6;
          if (on) litN = k + 1;
          const pop = on ? [1.35, 1.08, 1][Math.min(2, drawing(a0))] : 1;
          const a = -Math.PI / 2 + (k / 9) * TAU;
          const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
          ctx.save();
          ctx.lineWidth = 3;
          ctx.strokeStyle = C.annYellow;
          ctx.fillStyle = C.annYellow;
          ctx.beginPath();
          ctx.arc(x, y, 10 * pop, 0, TAU);
          if (on) ctx.fill();
          else {
            ctx.fillStyle = L.pal.stripeCream;
            ctx.fill();
          }
          ctx.stroke();
          ctx.restore();
        }
        // a hand pointing at the newest dot
        const ha = -Math.PI / 2 + ((litN - 1) / 9) * TAU;
        const hand = new Path2D();
        hand.moveTo(cx, cy);
        hand.lineTo(cx + Math.cos(ha) * (R - 22), cy + Math.sin(ha) * (R - 22));
        overlayStroke(ctx, hand, C.annYellow, 1, 3);
        ctx.save();
        ctx.fillStyle = C.annYellow;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      void ringsToDraw;
    },
  });
})();
