// 07 picking : Only the red ones.  T 12.00 to 14.25 (54 frames), illustrated, hard cut. Act 2 opens.
// A coffee branch runs across the frame from (-40, 520) to (1120, 640) with three tight mixed clusters
// (x 260, 560, 860) and opposite leaf pairs. A picker's right hand enters from the lower right, its
// forearm in a rolled tealDeep sleeve, and visits the clusters right to left. Thumb and index pinch a
// red cherry on the beat, twist it 15 degrees over 3 frames and let go; the cherry falls into the
// woven jute basket at the bottom along a dashed annBlue trajectory and the heap rises 14 px.
// At T 13.125 the hand hovers over a green cherry and moves on: annMagenta X ring.
//
// Layers, back to front:
//   1 stripes (stripeCream / stripeSage, drifting 6 px per beat)
//   2 leaves (opposite pairs) and the back row of each cluster
//   3 branch, then the front row of each cluster
//   4 basket inside (back wall, heap of red cherries), landed cherries
//   5 basket front (weave, rim rope, waist cord)
//   6 falling cherries
//   7 forearm, sleeve and hand (pinching cherry held between thumb and index)
//   8 overlays: dashed annBlue trajectories, annYellow check rings, annMagenta X ring
(function () {
  'use strict';

  const ID = 'picking';
  const LIB = FILM.lib;
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const FR = 1 / 24;

  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => {
    const u = clamp((x - a) / (b - a));
    return u * u * (3 - 2 * u);
  };
  const sd = (...k) => LIB.hash(ID, ...k) & 0x7fffffff;
  const h3 = LIB.h3;

  // ---------------------------------------------------------------------------
  // beats (shot-local seconds)
  // ---------------------------------------------------------------------------
  // picks: T 12.00, 12.375 (cluster 3), 12.75 (cluster 2), 13.125 skip, 13.50, 13.875 (cluster 1)
  const EV = [
    { t: 0.0, cl: 2, ci: 4, pick: true, land: [470, 0] }, // T 12.000
    { t: 0.375, cl: 2, ci: 6, pick: true, land: [640, 0] }, // T 12.375
    { t: 0.75, cl: 1, ci: 5, pick: true, land: [555, 0] }, // T 12.750
    { t: 1.125, cl: 1, ci: 4, pick: false }, // T 13.125 skip (green)
    { t: 1.5, cl: 0, ci: 4, pick: true, land: [395, 0] }, // T 13.500
    { t: 1.875, cl: 0, ci: 5, pick: true, land: [700, 0] }, // T 13.875
  ];
  const TWIST = 3 * FR;
  const FALL = 6 * FR; // released at pick + 3 frames, lands 9 frames after the pick
  const HEAP_STEP = 14;
  const HAND_SCALE = 1.3; // the hand is drawn large: index finger about as wide as a cherry

  // ---------------------------------------------------------------------------
  // geometry
  // ---------------------------------------------------------------------------
  const BR0 = [-40, 520], BR1 = [1120, 640];
  const branchY = (x) => BR0[1] + ((x - BR0[0]) * (BR1[1] - BR0[1])) / (BR1[0] - BR0[0]) + 6 * Math.sin((x + 40) * 0.006);
  const CLX = [260, 560, 860];

  // cluster layouts: offsets from the node, colour (g, y, r), back row flag. Index 4..6 are front row.
  const CL_LAYOUT = [
    // cluster 1 (x 260)
    [
      [-62, -36, 'g', 1], [4, -44, 'r', 1], [62, -32, 'y', 1], [-78, 30, 'y', 0],
      [-22, 56, 'r', 0], [52, 46, 'r', 0], [100, 14, 'g', 0], [14, 22, 'g', 0],
    ],
    // cluster 2 (x 560)
    [
      [-58, -34, 'r', 1], [6, -42, 'y', 1], [66, -28, 'g', 1], [-92, 24, 'r', 0],
      [-36, 58, 'g', 0], [30, 56, 'r', 0], [88, 28, 'y', 0], [-4, 20, 'g', 0],
    ],
    // cluster 3 (x 860)
    [
      [-56, -34, 'g', 1], [10, -42, 'r', 1], [66, -28, 'y', 1], [-90, 28, 'g', 0],
      [-26, 58, 'r', 0], [40, 54, 'g', 0], [98, 26, 'r', 0], [8, 22, 'y', 0],
    ],
  ];

  // the heap's surface before any cherry lands: a low dome just under the back rim
  const heapSurf = (x) => 1330 - 44 * (1 - Math.pow(clamp(Math.abs(x - 540) / 380), 2));

  let GEO = null;
  function geo(L) {
    if (GEO) return GEO;
    const P = L.pal;
    const COLS = {
      g: { fill: P.cherryGreen, deep: L.mix(P.cherryGreen, P.leafDeep, 0.65), hi: L.mix(P.cherryGreen, P.white, 0.45) },
      y: { fill: P.cherryYellow, deep: L.mix(P.cherryYellow, P.ochre, 0.8), hi: L.mix(P.cherryYellow, P.white, 0.5) },
      r: { fill: P.cherryRed, deep: P.cherryDeep, hi: P.cherryLight },
    };
    // clusters
    const clusters = CLX.map((x, k) => {
      const ny = branchY(x);
      return CL_LAYOUT[k].map((o, i) => {
        const cx = x + o[0], cy = ny + o[1];
        const dx = o[0] * 0.6, dy = o[1] + (o[3] ? -10 : 10);
        const rot = Math.atan2(dy, dx) - Math.PI / 2;
        const r = 38 + 4 * h3(k, i, sd('cr'));
        return { x: cx, y: cy, r, rot, col: COLS[o[2]], kind: o[2], back: !!o[3], seed: sd('ch', k, i) };
      });
    });
    // branch outline: thicker at the left (toward the trunk)
    const spine = [];
    for (let i = 0; i <= 40; i++) {
      const x = lerp(BR0[0] - 20, BR1[0] + 20, i / 40);
      spine.push([x, branchY(x)]);
    }
    const halfW = (x) => lerp(17, 11, clamp((x + 40) / 1200));
    const top = spine.map(([x, y]) => [x, y - halfW(x)]);
    const bot = spine.map(([x, y]) => [x, y + halfW(x)]);
    const branchPoly = top.concat(bot.slice().reverse());

    // leaves: opposite pairs at four nodes
    const LEAVES = [
      [110, -122, 330, 1], [110, 108, 350, -1],
      [410, -68, 380, -1], [410, 116, 330, 1],
      [710, -104, 400, 1], [710, 70, 230, -1],
      [1010, -58, 330, -1], [1010, 108, 260, 1],
    ].map((d, i) => buildLeaf(L, d[0], branchY(d[0]), d[1] * DEG, d[2], d[3], sd('leaf', i)));

    // heap: cherries packed in a dome inside the basket mouth (centres below the heap surface)
    const heap = [];
    const rH = L.rng(sd('heap'));
    for (let row = 0; row < 10; row++) {
      const y = 1262 + row * 23;
      for (let i = 0; i < 15; i++) {
        const x = 540 + (i - 7) * 54 + rH.range(-12, 12) + (row % 2) * 27;
        const yy = y + rH.range(-6, 6);
        if (Math.abs(x - 540) > 350) continue;
        if (yy < heapSurf(x) + 6) continue;
        heap.push({ x, y: yy, r: rH.range(29, 35), rot: rH.range(-3, 3), seed: sd('hp', row, i), kind: rH() < 0.88 ? 'r' : 'd' });
      }
    }
    heap.sort((a, b) => a.y - b.y);

    // a lower lateral at the left, with unripe cherries left for a later pass
    const b2y = (x) => 1010 + (x + 40) * 0.13 + 5 * Math.sin(x * 0.01);
    const s2 = [];
    for (let i = 0; i <= 16; i++) {
      const x = lerp(-60, 330, i / 16);
      s2.push([x, b2y(x)]);
    }
    const hw2 = (x) => lerp(13, 5, clamp((x + 60) / 390));
    const top2 = s2.map(([x, y]) => [x, y - hw2(x)]);
    const bot2 = s2.map(([x, y]) => [x, y + hw2(x)]);
    const low = {
      poly: top2.concat(bot2.slice().reverse()), top: top2, bot: bot2, y: b2y,
      leaves: [[170, -100, 270, 1], [170, 96, 250, -1], [-10, 70, 230, 1]].map((d, i) => buildLeaf(L, d[0], b2y(d[0]), d[1] * DEG, d[2], d[3], sd('leaf2', i))),
      cherries: [[-46, -26, 'g'], [8, -32, 'g'], [-60, 26, 'y'], [-8, 40, 'g'], [44, 22, 'g'], [52, -18, 'y']].map((o, i) => {
        const x = 80 + o[0], y = b2y(80) + o[1];
        const rot = Math.atan2(o[1] + (o[1] < 0 ? -10 : 10), o[0] * 0.6) - Math.PI / 2;
        return { x, y, r: 34 + 3 * h3(i, 5, sd('lc')), rot, col: COLS[o[2]], back: o[1] < 0, seed: sd('lc', i) };
      }),
    };

    GEO = { clusters, branchPoly, top, bot, spine, LEAVES, heap, COLS, low };
    return GEO;
  }

  // a coffee leaf: elliptic blade, drawn-out tip, wavy margin, 9 looping lateral veins
  function buildLeaf(L, bx, by, ang, len, wid, seed) {
    const W = len * 0.48 * (wid > 0 ? 1 : 0.94);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const P2 = (u, v) => [bx + ca * u - sa * v, by + sa * u + ca * v];
    const pet = len * 0.09;
    const half = (u) => {
      // u 0..1 along the blade
      const s = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.85)), 0.9);
      const tip = u > 0.86 ? 1 - 0.55 * sstep(0.86, 1, u) : 1;
      return (W / 2) * s * tip;
    };
    const n = 46;
    const sideA = [], sideB = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const wav = 1 + 0.045 * Math.sin(u * TAU * 5 + (seed % 7)) * Math.sin(Math.PI * u);
      const wavB = 1 + 0.045 * Math.sin(u * TAU * 5 + 1.7 + (seed % 5)) * Math.sin(Math.PI * u);
      const bend = 0.06 * len * Math.sin(Math.PI * u);
      const uu = pet + u * (len - pet);
      sideA.push(P2(uu, -half(u) * wav + bend * 0.3));
      sideB.push(P2(uu, half(u) * wavB + bend * 0.3));
    }
    const outline = sideA.concat(sideB.slice().reverse());
    const mid = [];
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      mid.push(P2(pet + u * (len - pet), 0.06 * len * Math.sin(Math.PI * u) * 0.3));
    }
    const veins = [];
    for (let k = 1; k <= 9; k++) {
      const u0 = 0.06 + k * 0.088;
      for (const s of [-1, 1]) {
        const uu0 = pet + u0 * (len - pet);
        const u1 = Math.min(0.97, u0 + 0.14);
        const uu1 = pet + u1 * (len - pet);
        const hw = half(u1) * 0.82;
        const bend = 0.06 * len * Math.sin(Math.PI * u0) * 0.3;
        veins.push({ s, pts: [P2(uu0, bend), P2(lerp(uu0, uu1, 0.45), s * half(lerp(u0, u1, 0.45)) * 0.55 + bend), P2(uu1, s * hw + bend)] });
      }
    }
    const petiole = [[bx, by], P2(pet * 0.5, 2), P2(pet, 0)];
    // gloss streak on one side of the midrib
    const sheen = [];
    for (let i = 2; i <= 16; i++) {
      const u = i / 20;
      sheen.push(P2(pet + u * (len - pet), -half(u) * 0.18 - 3));
    }
    for (let i = 16; i >= 2; i--) {
      const u = i / 20;
      sheen.push(P2(pet + u * (len - pet), -half(u) * 0.42 - 3));
    }
    // shadow half: the half whose normal points further down-right
    const nA = [-sa * -1, ca * -1];
    const shadeSide = nA[0] + nA[1] > 0 ? -1 : 1; // -1 means side A is the shadow side
    const shadowPoly = (shadeSide < 0 ? sideA : sideB).concat(mid.slice().reverse());
    return { outline, mid, veins, petiole, sheen, shadowPoly, ang, seed };
  }

  // ---------------------------------------------------------------------------
  // drawing helpers
  // ---------------------------------------------------------------------------
  function strokePath(ctx, path, color, alpha, width, dash) {
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
  // a static layer rendered once per boil drawing into an offscreen canvas (y0..y0+h band)
  function sprite(ctx, L, key, y0, h, bi, drawFn) {
    const S = FILM.S || 1;
    const c = L.cached([ID, key, y0, h, S, bi].join('|'), () => {
      const cv = FILM.makeCanvas(Math.round(1080 * S), Math.round(h * S));
      const g = cv.getContext('2d');
      g.scale(S, S);
      g.translate(0, -y0);
      drawFn(g);
      return cv;
    });
    ctx.drawImage(c, 0, y0, 1080, h);
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

  function drawLeaf(ctx, L, P, lf, bi) {
    L.inkPath(ctx, lf.petiole, { width: 3, seed: lf.seed + 1, taper: [2, 8] });
    L.inkPath(ctx, lf.outline, { closed: true, width: 3, fill: P.leafCoffee, seed: lf.seed + 2 });
    fillPoly(ctx, lf.sheen, P.leafSheen, 0.55);
    L.hatch(ctx, lf.shadowPoly, {
      angle: lf.ang + (lf.ang > 0 ? -0.9 : 0.9), spacing: 6, width: 1.3, color: P.leafDeep, alpha: 0.85, length: [10, 34], seed: lf.seed + 3,
    });
    L.hatch(ctx, lf.outline, { angle: lf.ang - 0.9, spacing: 11, width: 1.2, color: P.leafDeep, alpha: 0.45, length: [8, 22], seed: lf.seed + 4, density: 0.5 });
    L.inkPath(ctx, lf.mid, { width: 2.2, color: P.leafDeep, seed: lf.seed + 5, taper: [4, 30] });
    const vp = new Path2D();
    for (let i = 0; i < lf.veins.length; i++) {
      const v = lf.veins[i].pts;
      const j = (k) => (h3(i * 3 + k, bi, lf.seed) - 0.5) * 1.4;
      vp.moveTo(v[0][0] + j(0), v[0][1] + j(1));
      vp.quadraticCurveTo(v[1][0] + j(2), v[1][1] + j(0), v[2][0] + j(1), v[2][1] + j(2));
    }
    strokePath(ctx, vp, P.leafDeep, 0.9, 1.7);
  }

  // a coffee cherry: slightly oval, flat colour, shadow hatching lower right, gloss, calyx scar at the tip
  function drawCherry(ctx, L, P, c, x, y, rot, o = {}) {
    const r = c.r * (o.scale || 1);
    const pts = L.ellipsePts(x, y, r, r * 1.1, 36, rot);
    L.inkPath(ctx, pts, { closed: true, width: o.width || 3.4, fill: c.col.fill, seed: c.seed, wobble: 1 });
    if (!o.cheap) {
      L.hatch(ctx, L.ellipsePts(x, y, r - 2, r * 1.1 - 2, 30, rot), {
        spacing: 5, width: 1.3, color: c.col.deep, alpha: 0.85, length: [8, 26], seed: c.seed + 1, inset: 1, overshoot: 0,
        density: (px, py) => sstep(-0.15, 0.75, ((px - x) * 0.7 + (py - y) * 0.7) / r),
      });
    }
    // gloss crescent upper left and a glint
    ctx.save();
    ctx.fillStyle = c.col.hi;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.36, y - r * 0.4, r * 0.34, r * 0.17, -0.75, 0, TAU);
    ctx.fill();
    ctx.fillStyle = P.white;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.42, y - r * 0.46, r * 0.13, r * 0.07, -0.75, 0, TAU);
    ctx.fill();
    ctx.restore();
    // calyx scar at the tip
    const tx = x - Math.sin(rot) * r * 0.86, ty = y + Math.cos(rot) * r * 0.86;
    ctx.save();
    ctx.fillStyle = P.cherryDeep === c.col.deep ? P.ink : L.mix(c.col.deep, P.ink, 0.5);
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(tx, ty, r * 0.17, r * 0.12, rot, 0, TAU);
    ctx.fill();
    ctx.restore();
    if (!o.cheap) {
      const st = new Path2D();
      for (let k = 0; k < 5; k++) {
        const a = rot + (k / 5) * TAU;
        st.moveTo(tx, ty);
        st.lineTo(tx + Math.cos(a) * r * 0.24, ty + Math.sin(a) * r * 0.18);
      }
      strokePath(ctx, st, P.ink, 0.7, 1.2);
    }
  }

  // a cherry deep in the heap: flat colour, a shadow crescent, outline, gloss (no hatching)
  function cheapCherry(ctx, P, x, y, r, col, rot) {
    ctx.save();
    ctx.fillStyle = col.deep;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.08, rot, 0, TAU);
    ctx.fill();
    ctx.fillStyle = col.fill;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.12, y - r * 0.14, r * 0.86, r * 0.92, rot, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.08, rot, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = col.hi;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.3, r * 0.15, -0.75, 0, TAU);
    ctx.fill();
    ctx.fillStyle = P.white;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.44, y - r * 0.47, r * 0.11, r * 0.06, -0.75, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // the hand: designed in a local frame with the pinched cherry at the origin, the wrist toward +x,
  // the back of the hand toward -y. Seen from the thumb side.
  // ---------------------------------------------------------------------------
  function limb(L, cl, radii, step = 4) {
    // centreline from tip to base, radius per knot; outline with round caps
    const n = cl.length;
    const sm = [];
    const rr = [];
    for (let i = 0; i < n - 1; i++) {
      const a = cl[i], b = cl[i + 1];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const k = Math.max(1, Math.ceil(d / step));
      for (let j = 0; j < k; j++) {
        const u = j / k;
        // gentle curve through the joint: quadratic blend with the neighbours
        sm.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
        rr.push(lerp(radii[i], radii[i + 1], u));
      }
    }
    sm.push(cl[n - 1].slice());
    rr.push(radii[n - 1]);
    // smooth the centreline a little (3 passes) keeping the ends
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 1; i < sm.length - 1; i++) {
        sm[i] = [(sm[i - 1][0] + sm[i][0] * 2 + sm[i + 1][0]) / 4, (sm[i - 1][1] + sm[i][1] * 2 + sm[i + 1][1]) / 4];
      }
    }
    const m = sm.length;
    const A = [], B = [], N = [];
    for (let i = 0; i < m; i++) {
      const p0 = sm[Math.max(0, i - 1)], p1 = sm[Math.min(m - 1, i + 1)];
      let tx = p1[0] - p0[0], ty = p1[1] - p0[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const nx = -ty, ny = tx;
      N.push([nx, ny, tx, ty]);
      A.push([sm[i][0] + nx * rr[i], sm[i][1] + ny * rr[i]]);
      B.push([sm[i][0] - nx * rr[i], sm[i][1] - ny * rr[i]]);
    }
    const cap = (c, r, a0, a1) => {
      const out = [];
      for (let k = 1; k < 10; k++) {
        const a = lerp(a0, a1, k / 10);
        out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
      }
      return out;
    };
    const aT = Math.atan2(N[0][1], N[0][0]);
    const aE = Math.atan2(N[m - 1][1], N[m - 1][0]);
    const outline = []
      .concat(A)
      .concat(cap(sm[m - 1], rr[m - 1], aE, aE - Math.PI))
      .concat(B.slice().reverse())
      .concat(cap(sm[0], rr[0], aT + Math.PI, aT));
    return { outline, sm, rr, N, A, B };
  }

  const rotP = (p, c, a) => {
    const ca = Math.cos(a), sa = Math.sin(a);
    const dx = p[0] - c[0], dy = p[1] - c[1];
    return [c[0] + dx * ca - dy * sa, c[1] + dx * sa + dy * ca];
  };

  // hand shapes for an opening amount `open` (0 pinch, 1 open). Pure function of open (quantised).
  const handCache = new Map();
  function handGeo(L, open) {
    const key = Math.round(open * 20);
    if (handCache.has(key)) return handCache.get(key);
    const op = key / 20;
    // index: tip, DIP, PIP, MCP. Opening lifts it about the MCP.
    const MCPi = [205, -96];
    let idx = [[16, -47], [60, -90], [122, -113], MCPi];
    idx = idx.map((p, i) => (i < 3 ? rotP(rotP(p, [122, -113], i < 2 ? 14 * DEG * op : 0), MCPi, 10 * DEG * op) : p));
    const index = limb(L, idx, [21, 23.5, 26, 29]);
    // thumb: tip, IP, MCP, CMC. Opening drops it about the CMC.
    const CMC = [238, 72];
    let th = [[27, 44], [86, 76], [152, 94], CMC];
    th = th.map((p, i) => (i < 3 ? rotP(p, CMC, -12 * DEG * op) : p));
    const thumb = limb(L, th, [22, 24.5, 30, 40]);
    // curled middle, ring and little fingers (seen past the index, curling into the palm)
    const mid = limb(L, [[134, 4], [112, -22], [138, -62], [218, -64]].map((p, i) => (i < 2 ? rotP(p, [138, -62], -10 * DEG * op) : p)), [19, 22, 25, 27]);
    const ring = limb(L, [[168, 30], [148, 6], [168, -26], [230, -32]].map((p, i) => (i < 2 ? rotP(p, [168, -26], -8 * DEG * op) : p)), [17, 20, 22.5, 25]);
    const pinky = limb(L, [[200, 50], [184, 30], [196, 4], [240, -2]], [15, 17, 19, 21]);
    // back of the hand and palm mass, joined to the wrist
    const palm = L.smoothPts([
      [196, -124], [232, -126], [280, -116], [336, -100], [392, -84],
      [404, -20], [410, 62], [352, 104], [290, 122], [232, 122], [190, 112],
      [182, 70], [186, 20], [180, -40], [182, -96],
    ], true, 5);
    // forearm in local coordinates, running out toward +x (off frame)
    const armTop = L.smoothPts([[386, -84], [480, -94], [600, -98], [760, -96], [1100, -92], [1500, -90]], false, 8);
    const armBot = L.smoothPts([[408, 64], [500, 84], [620, 98], [780, 104], [1100, 108], [1500, 110]], false, 8);
    const arm = armTop.concat(armBot.slice().reverse());
    // sleeve from x 610 on: rolled cuff 610..690, then the sleeve
    const sleeveY = (pts, x) => {
      for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) {
        const a = pts[i - 1], b = pts[i];
        return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1));
      }
      return pts[pts.length - 1][1];
    };
    const cuff = [];
    const sleeve = [];
    {
      const x0 = 612, x1 = 700;
      const yt0 = sleeveY(armTop, x0) - 12, yb0 = sleeveY(armBot, x0) + 12;
      const yt1 = sleeveY(armTop, x1) - 14, yb1 = sleeveY(armBot, x1) + 14;
      cuff.push([x0, yt0], [x0 - 8, (yt0 + yb0) / 2], [x0, yb0], [x1, yb1], [x1 + 6, (yt1 + yb1) / 2], [x1, yt1]);
      sleeve.push([x1 - 4, yt1 + 4], [x1 + 200, yt1 - 6], [1600, yt1 - 10], [1600, yb1 + 14], [x1 + 200, yb1 + 10], [x1 - 4, yb1 - 4]);
    }
    const g = { index, thumb, mid, ring, pinky, palm, arm, armTop, armBot, cuff, sleeve, idx, th };
    handCache.set(key, g);
    return g;
  }

  // wrinkles across a finger at knot position `at` (index into the limb's centreline), dorsal sign s
  function jointMarks(path, lb, at, s, rScale = 1) {
    const i = Math.max(1, Math.min(lb.sm.length - 2, at));
    const c = lb.sm[i], r = lb.rr[i] * rScale;
    const [nx, ny, tx, ty] = lb.N[i];
    for (let k = -1; k <= 1; k++) {
      const off = k * 5;
      const ax = c[0] + nx * s * r * 0.92 + tx * off, ay = c[1] + ny * s * r * 0.92 + ty * off;
      const bx = c[0] + nx * s * r * (0.5 - 0.1 * Math.abs(k)) + tx * (off + 3), by = c[1] + ny * s * r * (0.5 - 0.1 * Math.abs(k)) + ty * (off + 3);
      path.moveTo(ax, ay);
      path.quadraticCurveTo((ax + bx) / 2 + tx * 3, (ay + by) / 2 + ty * 3, bx, by);
    }
  }
  function nearestKnot(lb, p) {
    let bi = 0, bd = 1e9;
    for (let i = 0; i < lb.sm.length; i++) {
      const d = Math.hypot(lb.sm[i][0] - p[0], lb.sm[i][1] - p[1]);
      if (d < bd) { bd = d; bi = i; }
    }
    return bi;
  }

  function drawHand(ctx, L, P, H, bi, seedBase) {
    const skin = P.skin, deep = P.skinDeep;
    const S = (k) => seedBase + k * 131;
    const shadeLocal = (cx, cy, r) => (x, y) => sstep(-0.1, 0.8, ((y - cy) * 0.8 + (x - cx) * 0.25) / r);
    // forearm
    L.inkPath(ctx, H.arm, { closed: true, width: 4, fill: skin, seed: S(1), taper: [0, 0] });
    L.hatch(ctx, H.arm, { angle: Math.PI / 2 + 0.15, spacing: 7, width: 1.4, color: deep, alpha: 0.85, length: [10, 30], bend: 3, seed: S(2), density: (x, y) => sstep(10, 90, y) });
    L.hatch(ctx, H.arm, { angle: Math.PI / 2 - 0.3, spacing: 6, width: 1.2, color: deep, alpha: 0.7, length: [8, 20], seed: S(3), density: (x, y) => sstep(60, 105, y) });
    // arm hairs (stipple-like short dashes on the upper arm)
    {
      const hp = new Path2D();
      const r = L.rng(S(4));
      for (let i = 0; i < 70; i++) {
        const x = r.range(430, 610), y = r.range(-80, 40);
        hp.moveTo(x, y);
        hp.lineTo(x + 5 + r() * 3, y - 2 + r() * 2);
      }
      strokePath(ctx, hp, deep, 0.5, 1);
    }
    // sleeve and rolled cuff
    L.inkPath(ctx, H.sleeve, { closed: true, width: 4, fill: P.tealDeep, seed: S(5), taper: [0, 0] });
    L.hatch(ctx, H.sleeve, { angle: Math.PI / 2 + 0.25, spacing: 6, width: 1.4, color: P.ink, alpha: 0.6, length: [12, 40], seed: S(6), density: (x, y) => sstep(-20, 100, y) });
    {
      const fold = new Path2D();
      fold.moveTo(760, -90); fold.quadraticCurveTo(800, -20, 770, 100);
      fold.moveTo(880, -96); fold.quadraticCurveTo(900, 0, 860, 104);
      strokePath(ctx, fold, P.ink, 0.6, 1.8);
    }
    L.inkPath(ctx, H.cuff, { closed: true, width: 4, fill: L.mix(P.tealDeep, P.teal, 0.55), seed: S(7) });
    L.hatch(ctx, H.cuff, { angle: Math.PI / 2 + 0.1, spacing: 5, width: 1.3, color: P.tealDeep, alpha: 0.9, length: [8, 24], seed: S(8), density: (x, y) => sstep(-30, 70, y) });
    {
      const cl = new Path2D();
      cl.moveTo(640, -108); cl.quadraticCurveTo(628, 0, 640, 118);
      cl.moveTo(670, -110); cl.quadraticCurveTo(660, 0, 672, 120);
      strokePath(ctx, cl, P.tealDeep, 0.9, 2.2);
    }
    // wrist crease and the ulna bump shading
    {
      const wc = new Path2D();
      wc.moveTo(398, 40); wc.quadraticCurveTo(420, 10, 414, -30);
      strokePath(ctx, wc, P.inkSoft, 0.8, 1.8);
    }
    // little and ring fingers (behind), palm, middle finger
    for (const [lb, k] of [[H.pinky, 10], [H.ring, 11]]) {
      L.inkPath(ctx, lb.outline, { closed: true, width: 3, fill: L.mix(skin, deep, 0.25), seed: S(k) });
      L.hatch(ctx, lb.outline, { angle: 0.5, spacing: 5, width: 1.2, color: deep, alpha: 0.8, length: [6, 18], seed: S(k + 20), density: 0.7 });
    }
    L.inkPath(ctx, H.palm, { closed: true, width: 4, fill: skin, seed: S(12) });
    // back-of-hand tone: shadow toward the lower right in local space, tendons, knuckle bumps
    L.hatch(ctx, H.palm, { angle: 1.25, spacing: 7, width: 1.3, color: deep, alpha: 0.8, length: [10, 28], bend: 2, seed: S(13), density: shadeLocal(300, 0, 130) });
    L.hatch(ctx, H.palm, { angle: 0.2, spacing: 6, width: 1.2, color: deep, alpha: 0.7, length: [8, 20], seed: S(14), density: (x, y) => sstep(60, 115, y) * 0.9 });
    {
      const tn = new Path2D();
      tn.moveTo(232, -112); tn.quadraticCurveTo(300, -96, 380, -74);
      tn.moveTo(236, -88); tn.quadraticCurveTo(300, -70, 378, -50);
      tn.moveTo(250, -60); tn.quadraticCurveTo(310, -40, 376, -24);
      strokePath(ctx, tn, P.inkSoft, 0.45, 1.5);
      // knuckle bumps of middle and ring MCP on the back of the hand
      const kb = new Path2D();
      kb.moveTo(214, -118); kb.quadraticCurveTo(226, -126, 238, -118);
      kb.moveTo(228, -96); kb.quadraticCurveTo(240, -104, 252, -96);
      kb.moveTo(204, -110); kb.quadraticCurveTo(206, -100, 214, -96);
      strokePath(ctx, kb, P.ink, 0.75, 1.8);
      // a vein over the back of the hand
      const vn = new Path2D();
      vn.moveTo(268, -100); vn.bezierCurveTo(300, -80, 320, -96, 352, -66); vn.quadraticCurveTo(370, -50, 396, -56);
      strokePath(ctx, vn, deep, 0.6, 2);
    }
    // middle finger curled under the index: knuckle wrinkles and its nail at the curled tip
    L.inkPath(ctx, H.mid.outline, { closed: true, width: 3.4, fill: skin, seed: S(15) });
    L.hatch(ctx, H.mid.outline, { angle: 0.4, spacing: 5, width: 1.2, color: deep, alpha: 0.85, length: [6, 18], seed: S(16), density: (x, y) => sstep(-50, 0, y) * 0.6 + 0.25 });
    // index finger
    L.inkPath(ctx, H.index.outline, { closed: true, width: 4, fill: skin, seed: S(17) });
    {
      // contour hatching on the palm (lower) half, perpendicular to the finger
      const lb = H.index;
      const lower = lb.B.slice().concat(lb.sm.slice().reverse());
      const hp = new Path2D();
      for (let i = 2; i < lb.sm.length - 2; i += 2) {
        const c = lb.sm[i], r = lb.rr[i];
        const [nx, ny, tx, ty] = lb.N[i];
        const jj = h3(i, bi, S(18));
        const a = 0.05 + 0.25 * jj;
        hp.moveTo(c[0] - nx * r * a, c[1] - ny * r * a);
        hp.quadraticCurveTo(c[0] - nx * r * 0.6 + tx * 3, c[1] - ny * r * 0.6 + ty * 3, c[0] - nx * r * 0.92, c[1] - ny * r * 0.92);
      }
      strokePath(ctx, hp, deep, 0.8, 1.3);
      L.hatch(ctx, lower, { angle: 1.1, spacing: 6, width: 1.1, color: deep, alpha: 0.5, length: [6, 14], seed: S(19), density: 0.6 });
    }
    // thumb (front)
    L.inkPath(ctx, H.thumb.outline, { closed: true, width: 4, fill: skin, seed: S(21) });
    {
      const lb = H.thumb;
      const hp = new Path2D();
      for (let i = 2; i < lb.sm.length - 2; i += 2) {
        const c = lb.sm[i], r = lb.rr[i];
        const [nx, ny, tx, ty] = lb.N[i];
        const a = 0.0 + 0.3 * h3(i, bi, S(22));
        // shadow on the side away from the index (local +y)
        const sgn = ny > 0 ? 1 : -1;
        hp.moveTo(c[0] + nx * sgn * r * a, c[1] + ny * sgn * r * a);
        hp.quadraticCurveTo(c[0] + nx * sgn * r * 0.6 + tx * 3, c[1] + ny * sgn * r * 0.6 + ty * 3, c[0] + nx * sgn * r * 0.93, c[1] + ny * sgn * r * 0.93);
      }
      strokePath(ctx, hp, deep, 0.8, 1.3);
      // thenar mound crease
      const tc = new Path2D();
      tc.moveTo(190, 104); tc.bezierCurveTo(176, 70, 196, 40, 230, 30);
      strokePath(ctx, tc, P.inkSoft, 0.75, 1.8);
    }
    // joint wrinkles: index DIP and PIP (dorsal = side toward -y), palm creases; thumb IP
    {
      const wr = new Path2D();
      const iDIP = nearestKnot(H.index, H.idx[1]), iPIP = nearestKnot(H.index, H.idx[2]);
      const dorsI = H.index.N[iPIP][1] < 0 ? 1 : -1; // normal side pointing up
      jointMarks(wr, H.index, iDIP, dorsI, 1);
      jointMarks(wr, H.index, iPIP, dorsI, 1);
      jointMarks(wr, H.index, iDIP, -dorsI, 0.9);
      jointMarks(wr, H.index, iPIP, -dorsI, 0.9);
      const iIP = nearestKnot(H.thumb, H.th[1]);
      const dorsT = H.thumb.N[iIP][1] > 0 ? 1 : -1;
      jointMarks(wr, H.thumb, iIP, dorsT, 1);
      jointMarks(wr, H.thumb, iIP, -dorsT, 0.9);
      const iMid = nearestKnot(H.mid, [112, -22]);
      jointMarks(wr, H.mid, iMid, H.mid.N[iMid][0] < 0 ? 1 : -1, 1);
      strokePath(ctx, wr, P.inkSoft, 0.9, 1.6);
    }
    // nails: index (on the dorsal edge of the distal phalanx), thumb, middle finger
    const nail = (lb, tipIdx, s, len, wid, rot = 0, k = 30) => {
      const i = Math.min(lb.sm.length - 1, tipIdx);
      const c = lb.sm[i], r = lb.rr[i];
      const [nx, ny, tx, ty] = lb.N[i];
      const cx = c[0] + nx * s * r * 0.52, cy = c[1] + ny * s * r * 0.52;
      const ang = Math.atan2(ty, tx) + rot;
      const pts = L.ellipsePts(cx, cy, len / 2, wid / 2, 24, ang);
      L.inkPath(ctx, pts, { closed: true, width: 2.2, fill: L.mix(P.skin, P.white, 0.55), seed: S(k) });
      // lunula and free edge
      const ln = new Path2D();
      const ex = cx - Math.cos(ang) * len * 0.36, ey = cy - Math.sin(ang) * len * 0.36;
      ln.moveTo(ex - nx * wid * 0.3, ey - ny * wid * 0.3);
      ln.lineTo(ex + nx * wid * 0.3, ey + ny * wid * 0.3);
      strokePath(ctx, ln, P.white, 0.9, 2.4);
      const hl = new Path2D();
      hl.moveTo(cx + Math.cos(ang) * len * 0.1 - nx * s * wid * 0.15, cy + Math.sin(ang) * len * 0.1 - ny * s * wid * 0.15);
      hl.lineTo(cx + Math.cos(ang) * len * 0.35 - nx * s * wid * 0.15, cy + Math.sin(ang) * len * 0.35 - ny * s * wid * 0.15);
      strokePath(ctx, hl, P.white, 0.8, 1.6);
    };
    {
      const lb = H.index;
      const iT = 6;
      const dors = lb.N[iT][1] < 0 ? 1 : -1;
      nail(lb, iT, dors, 30, 15, 0, 31);
      const tb = H.thumb;
      const iTT = 7;
      const dT = tb.N[iTT][1] > 0 ? 1 : -1;
      nail(tb, iTT, dT, 34, 20, 0, 32);
      const md = H.mid;
      nail(md, 3, md.N[3][0] < 0 ? 1 : -1, 16, 9, 0, 33);
    }
  }

  function drawBranch(ctx, L, P, G) {
    fillPoly(ctx, G.branchPoly, P.bark);
    L.hatch(ctx, G.branchPoly, { angle: 0.1, spacing: 5, width: 1.3, color: P.barkDeep, alpha: 0.9, length: [14, 44], seed: sd('brh'), density: (x, y) => sstep(-2, 12, y - branchY(x)) });
    L.inkPath(ctx, G.top, { width: 3.6, seed: sd('brT'), taper: [0, 0] });
    L.inkPath(ctx, G.bot, { width: 4.4, seed: sd('brB'), taper: [0, 0] });
    // bark flecks and node rings
    const fl = new Path2D();
    const r = L.rng(sd('fleck'));
    for (let i = 0; i < 46; i++) {
      const x = r.range(-20, 1100), y = branchY(x) + r.range(-8, 4);
      fl.moveTo(x, y);
      fl.lineTo(x + r.range(6, 14), y + r.range(-1, 1));
    }
    strokePath(ctx, fl, P.barkDeep, 0.8, 1.4);
    for (const nx of [110, 260, 410, 560, 710, 860, 1010]) {
      const ny = branchY(nx);
      L.inkPath(ctx, [[nx - 4, ny - 14], [nx + 2, ny], [nx - 3, ny + 13]], { width: 2.2, color: P.barkDeep, seed: sd('node', nx), taper: [3, 3] });
    }
  }

  // ---------------------------------------------------------------------------
  // basket
  // ---------------------------------------------------------------------------
  const RIM = { cx: 540, cy: 1360, rx: 380, ry: 80 };
  function basketRX(y) {
    return lerp(RIM.rx, 330, clamp((y - RIM.cy) / 560));
  }
  function drawBasketBack(ctx, L, P, bi) {
    // inner back wall seen over the heap: the upper half of the rim ellipse, woven texture
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const a = Math.PI + (i / 48) * Math.PI;
      pts.push([RIM.cx + Math.cos(a) * RIM.rx, RIM.cy + Math.sin(a) * RIM.ry]);
    }
    const inner = pts.concat([[RIM.cx + RIM.rx, RIM.cy + 40], [RIM.cx - RIM.rx, RIM.cy + 40]]);
    fillPoly(ctx, inner, L.mix(P.juteDeep, P.ink, 0.25));
    L.hatch(ctx, inner, { angle: -0.3, spacing: 7, width: 1.3, color: P.jute, alpha: 0.55, length: [10, 26], seed: sd('bkw') });
    L.hatch(ctx, inner, { angle: 0.35, spacing: 9, width: 1.2, color: P.ink, alpha: 0.5, length: [10, 26], seed: sd('bkw2') });
    L.inkPath(ctx, pts, { width: 4, seed: sd('backrim'), taper: [6, 6] });
    // back rim rope
    const rope = new Path2D();
    for (let i = 0; i < 60; i++) {
      const a = Math.PI + ((i + 0.5) / 60) * Math.PI;
      const x = RIM.cx + Math.cos(a) * RIM.rx, y = RIM.cy + Math.sin(a) * RIM.ry;
      rope.moveTo(x - 6, y + 7);
      rope.lineTo(x + 6, y - 7);
    }
    strokePath(ctx, rope, P.juteDeep, 0.9, 2.2);
  }
  function drawBasketFront(ctx, L, P, bi) {
    // body outline: front rim (lower half of the ellipse) down to the bottom of the frame
    const front = [];
    for (let i = 0; i <= 48; i++) {
      const a = Math.PI - (i / 48) * Math.PI;
      front.push([RIM.cx + Math.cos(a) * RIM.rx, RIM.cy + Math.sin(a) * RIM.ry]);
    }
    const body = [[RIM.cx - basketRX(1940), 1940]].concat(front).concat([[RIM.cx + basketRX(1940), 1940]]);
    fillPoly(ctx, body, P.jute);
    // weave: rows of over-under lozenges wrapped round the cylinder
    ctx.save();
    ctx.beginPath();
    LIB.tracePath(ctx, body, true);
    ctx.clip();
    const cells = new Path2D();
    const shade = new Path2D();
    const NC = 18;
    for (let j = 0; j < 22; j++) {
      const yA = RIM.cy + 24 + j * 28, yB = yA + 28;
      const rxA = basketRX(yA), rxB = basketRX(yB);
      const ryA = RIM.ry * (rxA / RIM.rx), ryB = RIM.ry * (rxB / RIM.rx);
      for (let i = 0; i < NC; i++) {
        const off = (j % 2) * 0.5;
        const f0 = (i + off) / NC, f1 = (i + off + 1) / NC;
        if (f0 >= 1) continue;
        const a0 = Math.PI - f0 * Math.PI, a1 = Math.PI - Math.min(1, f1) * Math.PI;
        const q = (a, ry, rx, y) => [RIM.cx + Math.cos(a) * rx, y + Math.sin(a) * ry];
        const pA0 = q(a0, ryA, rxA, yA), pA1 = q(a1, ryA, rxA, yA), pB0 = q(a0, ryB, rxB, yB), pB1 = q(a1, ryB, rxB, yB);
        const ins = 3;
        const mx = (pA0[0] + pA1[0] + pB0[0] + pB1[0]) / 4, my = (pA0[1] + pA1[1] + pB0[1] + pB1[1]) / 4;
        const sh = (p) => [p[0] + (mx - p[0]) * 0.12, p[1] + (my - p[1]) * (ins / 14)];
        const a = sh(pA0), b = sh(pA1), c = sh(pB1), d = sh(pB0);
        cells.moveTo((a[0] + d[0]) / 2, (a[1] + d[1]) / 2);
        cells.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 2);
        cells.quadraticCurveTo(b[0], b[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2);
        cells.quadraticCurveTo(c[0], c[1], (c[0] + d[0]) / 2, (c[1] + d[1]) / 2 + 2);
        cells.quadraticCurveTo(d[0], d[1], (a[0] + d[0]) / 2, (a[1] + d[1]) / 2);
        // a shadow tick under each lozenge
        shade.moveTo(d[0] + 4, d[1] - 2);
        shade.lineTo(c[0] - 4, c[1] - 2);
      }
    }
    ctx.fillStyle = L.mix(P.jute, P.white, 0.12);
    ctx.fill(cells);
    strokePath(ctx, cells, P.juteDeep, 0.95, 1.8);
    strokePath(ctx, shade, P.ink, 0.35, 2.4);
    // vertical stakes peeking between the lozenges
    const stakes = new Path2D();
    for (let i = 1; i < NC * 2; i++) {
      const a = Math.PI - (i / (NC * 2)) * Math.PI;
      for (let y = RIM.cy + 30; y < 1930; y += 56) {
        const rx = basketRX(y), ry = RIM.ry * (rx / RIM.rx);
        const x = RIM.cx + Math.cos(a) * rx, yy = y + Math.sin(a) * ry;
        stakes.moveTo(x, yy + 2);
        stakes.lineTo(x, yy + 22);
      }
    }
    strokePath(ctx, stakes, P.juteDeep, 0.5, 1.4);
    ctx.restore();
    // form shading: the right side turns away from the light
    const rightSide = [[640, RIM.cy + 60], [RIM.cx + RIM.rx + 10, RIM.cy], [RIM.cx + basketRX(1940) + 10, 1940], [640, 1940]];
    ctx.save();
    ctx.beginPath();
    LIB.tracePath(ctx, body, true);
    ctx.clip();
    L.crossHatch(ctx, rightSide, {
      spacing: 7, width: 1.4, color: P.juteDeep, alpha: 0.75, length: [14, 40], seed: sd('bshade'), tone: 0.6, layers: 2,
      density: (x) => sstep(600, 900, x),
    });
    L.hatch(ctx, [[150, RIM.cy], [330, RIM.cy + 60], [330, 1940], [150, 1940]], { spacing: 10, width: 1.3, color: P.juteDeep, alpha: 0.5, length: [10, 30], seed: sd('bshadeL'), density: (x) => sstep(330, 170, x) * 0.7 });
    ctx.restore();
    // outline of the body sides
    L.inkPath(ctx, [[RIM.cx - RIM.rx, RIM.cy], [RIM.cx - basketRX(1700), 1700], [RIM.cx - basketRX(1950), 1950]], { width: 5, seed: sd('bodyL'), taper: [4, 0] });
    L.inkPath(ctx, [[RIM.cx + RIM.rx, RIM.cy], [RIM.cx + basketRX(1700), 1700], [RIM.cx + basketRX(1950), 1950]], { width: 5, seed: sd('bodyR'), taper: [4, 0] });
    // front rim: a thick twisted rope band
    const outer = front.map(([x, y]) => [x, y + 12]);
    const band = front.map(([x, y]) => [x, y - 12]).concat(outer.slice().reverse());
    fillPoly(ctx, band, P.jute);
    L.hatch(ctx, band, { spacing: 5, width: 1.3, color: P.juteDeep, alpha: 0.8, length: [6, 14], seed: sd('rimh'), density: (x) => 0.35 + 0.65 * sstep(500, 900, x) });
    const twist = new Path2D();
    for (let i = 0; i < 64; i++) {
      const a = Math.PI - ((i + 0.5) / 64) * Math.PI;
      const x = RIM.cx + Math.cos(a) * RIM.rx, y = RIM.cy + Math.sin(a) * RIM.ry;
      twist.moveTo(x - 7, y + 11);
      twist.quadraticCurveTo(x + 2, y + 2, x + 7, y - 11);
    }
    strokePath(ctx, twist, P.ink, 0.75, 2);
    L.inkPath(ctx, front.map(([x, y]) => [x, y - 12]), { width: 3.4, seed: sd('rimTop'), taper: [6, 6] });
    L.inkPath(ctx, outer, { width: 4.4, seed: sd('rimBot'), taper: [6, 6] });
    // waist cord: from the right of the rim up and out of frame toward the picker
    L.inkPath(ctx, [[RIM.cx + RIM.rx - 6, RIM.cy - 4], [980, 1320], [1040, 1300], [1110, 1290]], { width: 9, color: P.juteDeep, seed: sd('cordF'), taper: [0, 0] });
    L.inkPath(ctx, [[RIM.cx + RIM.rx - 6, RIM.cy - 10], [980, 1326], [1040, 1305], [1110, 1295]], { width: 2.4, seed: sd('cordI'), taper: [4, 0] });
    L.inkPath(ctx, [[RIM.cx + RIM.rx - 6, RIM.cy + 4], [980, 1336], [1040, 1316], [1110, 1306]], { width: 2.4, seed: sd('cordI2'), taper: [4, 0] });
  }

  // heap surface height (top of the mound) at x for a given lift
  const heapTopAt = (x, lift) => heapSurf(x) - lift;

  // ---------------------------------------------------------------------------
  // the scene
  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, E = L.ease;
      let t = clamp(tIn, 0, info.dur);
      const tF = Math.round(t * 24) / 24;
      if (Math.abs(t - tF) < 1e-4) t = tF + 1e-7;
      const tw = L.onTwos(t);
      const bi = L.boil(info.T);
      const G = geo(L);

      // ---- event state ---------------------------------------------------------
      // where each event's cherry sits on the branch
      const evPos = EV.map((e) => {
        const c = G.clusters[e.cl][e.ci];
        return [c.x, c.y];
      });
      // landing points on the heap: lift before each landing
      const landT = EV.map((e) => e.t + TWIST + FALL);
      const relT = EV.map((e) => e.t + TWIST);
      let landedBefore = 0;
      const landPt = EV.map((e) => {
        if (!e.pick) return null;
        const lift = landedBefore * HEAP_STEP;
        landedBefore++;
        return [e.land[0], heapTopAt(e.land[0], lift) + 6];
      });
      const landedNow = EV.filter((e, k) => e.pick && tw >= landT[k] - 1e-6).length;
      // heap lift: each landing raises the heap 14 px over two drawings
      let lift = 0;
      EV.forEach((e, k) => {
        if (!e.pick) return;
        const d = tw - landT[k];
        if (d >= -1e-6) lift += HEAP_STEP * (d < 1 / 12 - 1e-6 ? 0.6 : 1);
      });
      const picked = (k) => EV[k].pick && t >= EV[k].t - 1e-6;

      // ---- hand pose ------------------------------------------------------------
      // angle of the hand (local +x toward the wrist) as a function of target x
      const thetaAt = (x) => lerp(30, 70, clamp((x - 260) / 600)) * DEG;
      const pose = (() => {
        const tt = tw;
        // find the segment
        let k = 0;
        while (k < EV.length - 1 && tt >= EV[k + 1].t - 1e-6) k++;
        const e = EV[k];
        const p0 = evPos[k];
        const dt = tt - e.t;
        let x = p0[0], y = p0[1], th = thetaAt(p0[0]), twist = 0, open = e.pick ? 0 : 0.8;
        if (!e.pick) {
          // hover a little below and in front of the green cherry, fingers apart
          x += 10;
          y += 18;
        }
        if (dt < TWIST - 1e-6) {
          if (e.pick) twist = 15 * DEG * E.outCubic(clamp(dt / TWIST));
        } else {
          const next = k + 1 < EV.length ? EV[k + 1] : null;
          const tEnd = next ? next.t : info.dur;
          const u = clamp((dt - TWIST) / (tEnd - (e.t + TWIST)));
          const m = E.inOutCubic(u);
          twist = e.pick ? 15 * DEG * (1 - m) : 0;
          // fingers open on release, close as the next target arrives
          const openAmt = e.pick ? clamp((dt - TWIST + 1 / 12) / (2 / 12)) : 0.8;
          if (next) {
            const p1 = evPos[k + 1];
            let x1 = p1[0], y1 = p1[1];
            if (!next.pick) {
              x1 += 10;
              y1 += 18;
            }
            // arc a little downward between clusters (the hand drops back, then reaches)
            const far = Math.abs(x1 - x) > 150 ? 1 : 0.3;
            const sag = Math.sin(Math.PI * m) * 46 * far;
            const th1 = thetaAt(p1[0]);
            x = lerp(x, x1, m);
            y = lerp(y, y1, m) + sag;
            th = lerp(th, th1, m);
            const closeAmt = next.pick ? 1 - clamp((u - 0.55) / 0.4) : 0.8;
            open = Math.min(openAmt, closeAmt) * (next.pick ? 1 : 1);
            if (!next.pick) open = lerp(openAmt, 0.8, m);
          } else {
            // after the last pick: withdraw down-right
            x += 70 * m;
            y += 60 * m;
            open = openAmt;
          }
        }
        return { x, y, th: th + twist, open: clamp(open), k, dt };
      })();

      // ---- 1 stripes ---------------------------------------------------------------
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeSage], width: 140, angle: -0.52, offset: 8 * info.T });

      // ---- 2 leaves and back rows -------------------------------------------------
      const isEvent = (k, i) => EV.some((e) => e.cl === k && e.ci === i);
      const isHeld = (k, i) => EV.some((e, j) => e.cl === k && e.ci === i && e.pick && t >= e.t - 1e-6);
      // leaves, the untouched cherries and the branch never change: one sprite per boil drawing
      sprite(ctx, L, 'branch', 80, 1320, bi, (g) => {
        // the lower lateral first (further back)
        const lw = G.low;
        for (const lf of lw.leaves) drawLeaf(g, L, P, lf, bi);
        for (const c of lw.cherries) if (c.back) drawCherry(g, L, P, c, c.x, c.y, c.rot);
        fillPoly(g, lw.poly, P.bark);
        L.hatch(g, lw.poly, { angle: 0.1, spacing: 5, width: 1.2, color: P.barkDeep, alpha: 0.9, length: [12, 36], seed: sd('b2h'), density: (x, y) => sstep(-2, 8, y - lw.y(x)) });
        L.inkPath(g, lw.top, { width: 3, seed: sd('b2T'), taper: [0, 14] });
        L.inkPath(g, lw.bot, { width: 3.6, seed: sd('b2B'), taper: [0, 14] });
        for (const c of lw.cherries) if (!c.back) drawCherry(g, L, P, c, c.x, c.y, c.rot);
        for (const lf of G.LEAVES) drawLeaf(g, L, P, lf, bi);
        for (let k = 0; k < 3; k++) {
          G.clusters[k].forEach((c, i) => {
            if (c.back && !isEvent(k, i)) drawCherry(g, L, P, c, c.x, c.y, c.rot);
          });
        }
        drawBranch(g, L, P, G);
        for (let k = 0; k < 3; k++) {
          G.clusters[k].forEach((c, i) => {
            if (!c.back && !isEvent(k, i)) drawCherry(g, L, P, c, c.x, c.y, c.rot);
          });
        }
      });
      // the cherries the hand visits (all in the front rows)
      for (let k = 0; k < 3; k++) {
        G.clusters[k].forEach((c, i) => {
          if (isEvent(k, i) && !isHeld(k, i)) drawCherry(ctx, L, P, c, c.x, c.y, c.rot);
        });
      }

      // ---- 4 basket inside: back wall, heap, landed cherries ----------------------
      const liftQ = Math.round(lift * 10) / 10;
      sprite(ctx, L, 'heap' + liftQ, 1080, 420, bi, (g) => {
        const lift = liftQ;
        drawBasketBack(g, L, P, bi);
        {
          // clip: above the front rim curve and inside the basket mouth (the heap may rise over the back rim)
          g.save();
          g.beginPath();
          g.moveTo(RIM.cx - RIM.rx + 4, RIM.cy);
          for (let i = 0; i <= 40; i++) {
            const a = Math.PI - (i / 40) * Math.PI;
            g.lineTo(RIM.cx + Math.cos(a) * (RIM.rx - 4), RIM.cy + Math.sin(a) * (RIM.ry - 4));
          }
          g.lineTo(RIM.cx + RIM.rx - 30, 1150);
          g.lineTo(RIM.cx - RIM.rx + 30, 1150);
          g.closePath();
          g.clip();
          for (const h of G.heap) {
            const y = h.y - lift;
            const col = h.kind === 'r' ? G.COLS.r : { fill: P.cherryDeep, deep: P.ink, hi: P.cherryRed };
            if (h.y < heapSurf(h.x) + 30) drawCherry(g, L, P, { r: h.r, col, seed: h.seed }, h.x, y, h.rot, { width: 2.8 });
            else cheapCherry(g, P, h.x, y, h.r, col, h.rot);
          }
          // the heap darkens toward the basket wall on the right and deep inside
          L.hatch(g, null, {
            bounds: [160, 1180 - lift, 760, 300], spacing: 6, width: 1.3, color: P.cherryDeep, alpha: 0.7, length: [10, 28], seed: sd('heapsh'),
            density: (x, y) => (y > heapTopAt(x, lift) + 14 ? 0.8 * sstep(640, 900, x) + 0.5 * sstep(1360, 1440, y) : 0),
          });
          // shadow at the heap's lower right and deep in the basket
          g.restore();
        }
      });
      // landed cherries on top of the heap
      EV.forEach((e, k) => {
        if (!e.pick || tw < landT[k] - 1e-6) return;
        const c = G.clusters[e.cl][e.ci];
        const lp = landPt[k];
        // settle with a small bounce over two drawings
        const d = tw - landT[k];
        const bounce = d < 1 / 12 - 1e-6 ? -10 : 0;
        // later landings raise the heap under earlier cherries
        let under = 0;
        EV.forEach((e2, j) => {
          if (j > k && e2.pick && tw >= landT[j] - 1e-6) under += HEAP_STEP;
        });
        drawCherry(ctx, L, P, c, lp[0], lp[1] + bounce - under, c.rot + 2.2 + k);
      });

      // ---- 5 basket front ------------------------------------------------------------
      sprite(ctx, L, 'basket', 1200, 720, bi, (g) => drawBasketFront(g, L, P, bi));

      // ---- 6 falling cherries ------------------------------------------------------
      const fallPos = (k, tt) => {
        const p0 = evPos[k], p1 = landPt[k];
        const u = clamp((tt - relT[k]) / FALL);
        return [lerp(p0[0], p1[0], u), p0[1] + (p1[1] - p0[1]) * u * u, u];
      };
      EV.forEach((e, k) => {
        if (!e.pick) return;
        if (tw < relT[k] - 1e-6 || tw >= landT[k] - 1e-6) return;
        const c = G.clusters[e.cl][e.ci];
        const [x, y] = fallPos(k, tw);
        const spin = c.rot + 15 * DEG + (tw - relT[k]) * 9;
        drawCherry(ctx, L, P, c, x, y, spin);
      });

      // ---- 7 the hand ------------------------------------------------------------------
      {
        const H = handGeo(L, pose.open);
        // the held cherry turns with the hand during the twist
        const e = EV[pose.k];
        const holding = e.pick && pose.dt < TWIST - 1e-6;
        if (holding) {
          const c = G.clusters[e.cl][e.ci];
          drawCherry(ctx, L, P, c, pose.x, pose.y, c.rot + (pose.th - thetaAt(evPos[pose.k][0])));
          // the snapped stalk stub left on the branch
        }
        ctx.save();
        ctx.translate(pose.x, pose.y);
        ctx.rotate(pose.th);
        ctx.scale(HAND_SCALE, HAND_SCALE);
        drawHand(ctx, L, P, H, bi, sd('hand'));
        ctx.restore();
        if (holding) {
          // the index pad presses over the cherry's top: redraw a sliver of the fingertip outline on top
        }
      }

      // ---- 8 overlays -----------------------------------------------------------------
      // dashed annBlue trajectories: draw on behind each falling cherry, hold, then fade
      EV.forEach((e, k) => {
        if (!e.pick || t < relT[k] - 1e-6) return;
        const u = clamp((t - relT[k]) / FALL + 1 / 6);
        const fade = 1 - clamp((t - landT[k] - 8 * FR) / (8 * FR));
        if (fade <= 0) return;
        const path = new Path2D();
        const N = 24;
        for (let i = 0; i <= N; i++) {
          const uu = (i / N) * u;
          const p0 = evPos[k], p1 = landPt[k];
          const x = lerp(p0[0], p1[0], uu), y = p0[1] + (p1[1] - p0[1]) * uu * uu;
          if (i === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        }
        strokePath(ctx, path, P.annBlue, fade, 2.5, [14, 10]);
        if (u >= 1) {
          // a landing tick ring on the heap
          const lp = landPt[k];
          const lu = clamp((t - landT[k]) / (8 * FR) + 1 / 8);
          ctx.save();
          ctx.globalAlpha = fade * (1 - lu);
          ctx.strokeStyle = P.annBlue;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(lp[0], lp[1], 30 + 50 * E.outExpo(lu), 10 + 16 * E.outExpo(lu), 0, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
      });
      // annYellow snap marks round the pinch on each pick beat (6 frames)
      EV.forEach((e, k) => {
        if (!e.pick || t < e.t - 1e-6 || t > e.t + 6 * FR) return;
        const u = clamp((t - e.t) / (6 * FR) + 1 / 6);
        const [x, y] = evPos[k];
        const r0 = 50 + 26 * E.outExpo(u), r1 = r0 + 16 * (1 - u) + 6;
        const mk = new Path2D();
        for (let i = 0; i < 6; i++) {
          const a = (-150 + i * 22) * DEG;
          mk.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
          mk.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
        }
        strokePath(ctx, mk, P.annYellow, 1 - sstep(0.6, 1, u), 3);
      });
      // annYellow check rings on each picked cherry's former spot
      EV.forEach((e, k) => {
        if (!e.pick || t < relT[k] - 1e-6) return;
        const [x, y] = evPos[k];
        const u = clamp((t - relT[k]) / (3 * FR) + 1 / 3);
        const s = E.outBack(u);
        ctx.save();
        ctx.strokeStyle = P.annYellow;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.arc(x, y, 30 * s, 0, TAU);
        ctx.stroke();
        if (u >= 1) {
          ctx.beginPath();
          ctx.moveTo(x - 13, y + 1);
          ctx.lineTo(x - 4, y + 11);
          ctx.lineTo(x + 14, y - 11);
          ctx.stroke();
        }
        ctx.restore();
      });
      // annMagenta X ring over the skipped green cherry (T 13.125), 12 frames
      {
        const k = 3;
        const a = EV[k].t;
        if (t >= a - 1e-6) {
          const c = G.clusters[EV[k].cl][EV[k].ci];
          const u = clamp((t - a) / (12 * FR) + 1 / 12);
          const r = 34 + 22 * E.outExpo(clamp(u * 2));
          const alpha = 1 - sstep(0.6, 1, u);
          if (alpha > 0) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = P.annMagenta;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(c.x, c.y, r, 0, TAU);
            ctx.stroke();
            const d = r * 0.5;
            ctx.beginPath();
            ctx.moveTo(c.x - d, c.y - d);
            ctx.lineTo(c.x + d, c.y + d);
            ctx.moveTo(c.x + d, c.y - d);
            ctx.lineTo(c.x - d, c.y + d);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    },
  });
})();
