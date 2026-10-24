// 12 green-beans: "Green coffee into the sack". T 22.50 to 24.00, illustrated, hard cut.
// Frame 0 is the inked grey-green bean exactly on G1 (beanGreen, matte, beanGreenDeep crease,
// silverskin line), matching 11's last frame. Over one 8th (9 frames, inOutCubic, on twos) it shrinks
// to 0.12 and becomes one bean in a stream pouring from a steel scoop into a jute sack. On the beat at
// T 23.25 the scoop tips further and the pour thickens; at T 23.625 the filling sack slumps 3 percent.
//
// Layers, back to front:
//   1 stripes stripeCream / stripeSage, drifting 6 px per beat
//   2 two background sacks, left and right (scenery)
//   3 the sack (slides up in frames 2 to 8; squashes on T 23.625): body, weave, folds, emblem, rope,
//     back rim, the dark inside, the heap of green beans (cached texture) rising, front rim
//   4 the stream of green beans (40 to 60 px, on twos), behind the front rim once they drop in
//   5 the scoop (slides down in frames 2 to 8, tips on the beat)
//   6 the hero bean: G1 on frame 0, shrinking, then falling with the stream
//   7 overlays: annBlue dashed stream guide, annYellow bracket on the sack height
(function () {
  'use strict';

  const ID = 'green-beans';
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const FR = 1 / 24;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => {
    const u = clamp((x - a) / (b - a));
    return u * u * (3 - 2 * u);
  };
  const sd = (...k) => FILM.lib.hash(ID, ...k) & 0x7fffffff;

  // beats (shot-local seconds)
  const B_SHRUNK = 0.375; // T 22.875: the bean is one of the stream
  const B_TIP = 0.75; // T 23.25: the scoop tips further, more beans
  const B_SLUMP = 1.125; // T 23.625: the sack slumps

  // ---------------------------------------------------------------------------
  // G1: the bean, face-on (docs/storyboard.md, Shared geometry). Copied exactly.
  // ---------------------------------------------------------------------------
  const G1X = 540, G1Y = 900, G1ROT = -15 * DEG;
  const G1_CREASE = [[548, 682], [531, 750], [536, 826], [552, 900], [547, 976], [530, 1052], [538, 1118]];
  const G1_SILVER = [[546, 700], [538, 1100]];
  function g1Local(n) {
    const out = [];
    const e = 2 / 2.3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const c = Math.cos(a), s = Math.sin(a);
      let dx = 170 * Math.sign(c) * Math.pow(Math.abs(c), e);
      const dy = 240 * Math.sign(s) * Math.pow(Math.abs(s), e);
      dx *= 1 - (0.06 * (1 - dy / 240)) / 2;
      out.push([dx, dy]);
    }
    return out;
  }
  // local (pre-rotation, centred) points to screen at centre (cx, cy), scale s, rotation r
  function place(pts, cx, cy, s, r) {
    const c = Math.cos(r), sn = Math.sin(r);
    return pts.map(([x, y]) => [cx + s * (x * c - y * sn), cy + s * (x * sn + y * c)]);
  }

  // ---------------------------------------------------------------------------
  // layout
  // ---------------------------------------------------------------------------
  const LIP = [540, 398]; // where the beans leave the scoop
  const V0 = 200, GRAV = 1600; // stream: initial speed and gravity (px/s, px/s2)
  const MOUTH_X = 540, MOUTH_Y = 1180, MOUTH_RX = 300, MOUTH_RY = 70;
  const SACK_PIVOT = [540, 1920];
  const fallY = (tau) => LIP[1] + V0 * tau + 0.5 * GRAV * tau * tau;
  // time for the stream to fall from the lip to y
  const fallT = (y) => (-V0 + Math.sqrt(V0 * V0 + 2 * GRAV * (y - LIP[1]))) / GRAV;

  // ---------------------------------------------------------------------------
  // geometry (t-independent, built once)
  // ---------------------------------------------------------------------------
  let G = null;
  function geo(L) {
    if (G) return G;
    const g = {};
    g.loc = g1Local(96);
    g.small = g1Local(28);
    g.creaseLoc = L.smoothPts(G1_CREASE.map((p) => [p[0] - G1X, p[1] - G1Y]), false, 4);
    // silverskin: the crease trimmed to y 700..1100, ends pinned to the storyboard points
    const sv = g.creaseLoc.filter((p) => p[1] + G1Y >= 700 && p[1] + G1Y <= 1100);
    const a0 = sv[0], a1 = sv[sv.length - 1];
    g.silverLoc = sv.map((p, i) => {
      const u = i / (sv.length - 1);
      const dx = lerp(G1_SILVER[0][0] - G1X - a0[0], G1_SILVER[1][0] - G1X - a1[0], u);
      return [p[0] + dx * 0.5, p[1]];
    });
    g.creaseSmall = [[8, -200], [-8, -110], [10, 0], [-8, 110], [0, 200]];
    // the stream: two seeded sequences (the second only after the tip)
    g.stream = [];
    const r = L.rng(sd('stream'));
    for (let ts = -1.4, i = 0; ts < 1.6; ts += r.range(0.026, 0.04), i++) {
      g.stream.push({ ts, ox: r.range(-16, 16), drift: r.range(-34, 34), len: r.range(40, 60), rot: r() * TAU, spin: r.range(-9, 9), extra: false, flip: r() < 0.5 });
    }
    for (let ts = B_TIP - 0.2; ts < 1.6; ts += r.range(0.03, 0.045)) {
      g.stream.push({ ts, ox: r.range(-26, 26), drift: r.range(-50, 50), len: r.range(40, 58), rot: r() * TAU, spin: r.range(-10, 10), extra: true, flip: r() < 0.5 });
    }
    // the heap texture: packed small beans in rows, back to front
    g.heap = [];
    const rh = L.rng(sd('heap'));
    for (let y = 1060; y < 1320; y += rh.range(8, 10)) {
      for (let x = 200 + rh() * 12; x < 880; x += rh.range(17, 22)) {
        g.heap.push({ x, y: y + rh.range(-2, 2), s: rh.range(0.042, 0.054), rot: rh() * TAU, tone: rh() });
      }
    }
    // the sack outline (unsquashed): sides from the rim down past the frame bottom
    g.sackL = [[226, 1200], [214, 1290], [200, 1420], [190, 1560], [182, 1720], [176, 1980]];
    g.sackR = [[854, 1200], [868, 1290], [884, 1420], [892, 1560], [898, 1720], [904, 1980]];
    g.sackPoly = L.smoothPts(g.sackL, false, 10).concat(L.smoothPts(g.sackR, false, 10).reverse());
    G = g;
    return g;
  }

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------
  function canvas(w, h) {
    if (FILM.makeCanvas) return FILM.makeCanvas(w, h);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function addPoly(path, pts, closed) {
    pts.forEach((q, i) => (i ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1])));
    if (closed) path.closePath();
  }
  function strokeP(ctx, path, color, alpha, width, dash) {
    if (alpha <= 0.002) return;
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
  function fillP(ctx, path, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.fill(path);
    ctx.restore();
  }
  function ribbonPoly(pts, wFn) {
    const n = pts.length;
    const Lp = [], Rp = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const w = wFn(i / (n - 1)) / 2;
      Lp.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
      Rp.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    return Lp.concat(Rp.reverse());
  }

  // a small green bean (stream, heap): filled body, lower-right shadow crescent, outline, crease
  function smallBean(paths, g, x, y, s, rot, flip) {
    const body = place(g.small, x, y, s, rot);
    const lit = place(g.small.map(([a, b]) => [a * 0.84 - 14, b * 0.86 - 18]), x, y, s, rot);
    addPoly(paths.deep, body, true);
    addPoly(paths.body, lit, true);
    addPoly(paths.line, body, true);
    const cr = place(g.creaseSmall.map(([a, b]) => [flip ? -a : a, b]), x, y, s, rot);
    addPoly(paths.crease, cr, false);
  }
  function newBeanPaths() {
    return { deep: new Path2D(), body: new Path2D(), line: new Path2D(), crease: new Path2D() };
  }
  function flushBeans(ctx, P, paths, lineW, alpha = 1) {
    fillP(ctx, paths.deep, P.beanGreenDeep, alpha);
    fillP(ctx, paths.body, P.beanGreen, alpha);
    strokeP(ctx, paths.line, P.ink, 0.95 * alpha, lineW);
    strokeP(ctx, paths.crease, P.beanGreenDeep, alpha, lineW * 1.2);
    strokeP(ctx, paths.crease, P.ink, 0.6 * alpha, lineW * 0.5);
  }

  // the heap texture, cached once
  const HEAP_Y = 1040, HEAP_H = 300;
  function heapSprite(L, P, g) {
    const S = FILM.S || 1;
    return L.cached(['heap', ID, S].join('|'), () => {
      const c = canvas(Math.round(1080 * S), Math.round(HEAP_H * S));
      const x = c.getContext('2d');
      x.scale(S, S);
      x.translate(0, -HEAP_Y);
      x.fillStyle = L.mix(P.beanGreenDeep, P.ink, 0.45);
      x.fillRect(180, HEAP_Y, 720, HEAP_H);
      // rows back to front, flushed every few rows so nearer beans overlap
      let paths = newBeanPaths();
      let lastY = -1, rows = 0;
      for (const b of g.heap) {
        if (b.y > lastY + 6) {
          rows++;
          lastY = b.y;
          if (rows % 2 === 0) {
            flushBeans(x, P, paths, 1);
            paths = newBeanPaths();
          }
        }
        smallBean(paths, g, b.x, b.y, b.s, b.rot, b.tone < 0.5);
      }
      flushBeans(x, P, paths, 1);
      return c;
    });
  }

  // ---------------------------------------------------------------------------
  // layers
  // ---------------------------------------------------------------------------
  function drawBackSacks(ctx, L, P, bi) {
    const sacks = [
      { pts: [[-90, 1250], [40, 1210], [150, 1236], [190, 1400], [200, 1980], [-90, 1980]], seed: 1, tie: [40, 1210] },
      { pts: [[890, 1236], [1000, 1196], [1150, 1226], [1170, 1980], [880, 1980], [884, 1420]], seed: 2, tie: [1000, 1196] },
    ];
    for (const s of sacks) {
      L.inkPath(ctx, s.pts, { closed: true, fill: L.mix(P.jute, P.paper, 0.25), width: 3, seed: sd('bsack', s.seed), taper: [6, 10] });
      L.crossHatch(ctx, s.pts, { spacing: 7, crossSpacing: 7, angle: 0, turn: [Math.PI / 2], layers: 2, width: 1, color: P.juteDeep, alpha: 0.4, seed: sd('bweave', s.seed) });
      L.hatch(ctx, s.pts, { spacing: 5, width: 1.3, color: P.juteDeep, alpha: 0.75, seed: sd('bshade', s.seed), density: (x, y) => (s.seed === 1 ? sstep(60, 190, x) : sstep(1040, 1160, x)) });
      // the gathered top tied with twine
      const [tx, ty] = s.tie;
      L.inkPath(ctx, [[tx - 30, ty + 30], [tx, ty + 24], [tx + 30, ty + 30]], { width: 3.4, color: P.barkDeep, seed: sd('btie', s.seed) });
      L.inkPath(ctx, [[tx - 22, ty + 4], [tx - 8, ty - 26], [tx + 2, ty - 6], [tx + 14, ty - 30], [tx + 22, ty + 4]], { width: 2.4, seed: sd('btop', s.seed) });
    }
  }

  function drawSack(ctx, L, P, g, yh, bi) {
    // body
    const body = g.sackPoly;
    L.inkPath(ctx, body, { closed: true, fill: P.jute, width: 5, seed: sd('sack'), taper: [8, 14] });
    // jute weave: a grid of warp and weft, slightly bowed
    L.crossHatch(ctx, body, { spacing: 6, crossSpacing: 6, angle: 0.02, turn: [Math.PI / 2 - 0.04], layers: 2, width: 1.1, color: P.juteDeep, alpha: 0.45, length: [30, 90], gap: [1, 3], seed: sd('weave') });
    // shading: the right side and the underside of the rim, light from upper left
    L.crossHatch(ctx, body, { spacing: 6, crossSpacing: 7, width: 1.4, color: P.juteDeep, alpha: 0.85, tone: 0.7, seed: sd('sackshade'), density: (x, y) => clamp(sstep(640, 900, x) + 0.9 * sstep(1290, 1230, y) + 0.3 * sstep(260, 180, x)) });
    // folds: long soft creases down the body
    const folds = [
      [[330, 1300], [322, 1460], [300, 1640], [292, 1900]],
      [[612, 1310], [628, 1480], [640, 1700], [652, 1920]],
      [[760, 1300], [776, 1500], [800, 1760]],
    ];
    folds.forEach((f, i) => {
      L.inkPath(ctx, f, { width: 2, color: P.juteDeep, seed: sd('fold', i) });
      const off = f.map(([x, y]) => [x + 9, y]);
      L.hatch(ctx, ribbonPoly(off, () => 16), { spacing: 4, width: 1.1, color: P.juteDeep, alpha: 0.7, seed: sd('foldh', i), length: [10, 30] });
    });
    // stencilled emblem: an oval with its crease (no text)
    const em = place(g.small, 540, 1515, 0.3, -12 * DEG);
    L.inkPath(ctx, em, { closed: true, width: 7, color: P.juteDeep, alpha: 0.9, seed: sd('emblem'), taper: [4, 8], wobble: 1 });
    L.inkPath(ctx, place([[10, -190], [-12, -90], [10, 10], [-10, 110], [4, 190]], 540, 1515, 0.3, -12 * DEG), { width: 6, color: P.juteDeep, alpha: 0.9, seed: sd('emcrease') });
    // stencil bridges and a ring around the emblem
    L.inkPath(ctx, L.ellipsePts(540, 1515, 104, 104, 48), { closed: true, width: 3, color: P.juteDeep, alpha: 0.8, seed: sd('emring'), taper: [4, 8] });
    // rope tie round the neck: two twisted strands, a knot and hanging ends
    const rope = [];
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI * (i / 40);
      rope.push([540 + Math.cos(a) * 318, 1268 + Math.sin(a) * 66]);
    }
    rope.reverse();
    L.inkPath(ctx, ribbonPoly(rope, () => 15), { closed: true, fill: L.mix(P.jute, P.white, 0.25), width: 2.6, seed: sd('rope'), taper: [3, 6] });
    const twist = new Path2D();
    for (let i = 1; i < rope.length - 1; i++) {
      const [x, y] = rope[i];
      twist.moveTo(x - 6, y - 7);
      twist.lineTo(x + 4, y + 7);
    }
    strokeP(ctx, twist, P.juteDeep, 0.9, 1.6);
    const kx = 396, ky = 1326;
    L.inkPath(ctx, L.ellipsePts(kx, ky, 18, 14, 20), { closed: true, fill: L.mix(P.jute, P.white, 0.2), width: 2.6, seed: sd('knot'), taper: [3, 6] });
    L.inkPath(ctx, [[kx - 4, ky + 10], [kx - 14, ky + 60], [kx - 8, ky + 110]], { width: 6, color: P.juteDeep, seed: sd('end1') });
    L.inkPath(ctx, [[kx + 6, ky + 10], [kx + 18, ky + 54], [kx + 26, ky + 96]], { width: 6, color: P.juteDeep, seed: sd('end2') });
  }

  // the mouth: back rim, inside, heap (rising), front rim
  function mouthBack(ctx, L, P, g, yh, bi) {
    const inner = L.ellipsePts(MOUTH_X, MOUTH_Y, MOUTH_RX - 14, MOUTH_RY - 10, 72);
    // the dark inside
    L.inkPath(ctx, inner, { closed: true, fill: L.mix(P.juteDeep, P.ink, 0.45), width: 2, seed: sd('inside'), taper: [3, 6] });
    // heap: the cached bean texture below a domed surface line, clipped to the opening
    const dome = [];
    for (let x = MOUTH_X - MOUTH_RX; x <= MOUTH_X + MOUTH_RX; x += 12) {
      const u = (x - MOUTH_X) / (MOUTH_RX - 10);
      dome.push([x, yh + 44 * u * u + 3 * Math.sin(x * 0.07)]);
    }
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, inner, true);
    ctx.clip();
    ctx.beginPath();
    L.tracePath(ctx, dome.concat([[MOUTH_X + MOUTH_RX, 1400], [MOUTH_X - MOUTH_RX, 1400]]), true);
    ctx.clip();
    ctx.drawImage(heapSprite(L, P, g), 0, HEAP_Y, 1080, HEAP_H);
    // shade the heap toward the back wall and the right
    L.hatch(ctx, null, { bounds: [MOUTH_X - MOUTH_RX, MOUTH_Y - MOUTH_RY, MOUTH_RX * 2, MOUTH_RY * 2 + 20], spacing: 5, width: 1.2, color: P.ink, alpha: 0.55, length: [10, 30], seed: sd('heapshade'), density: (x, y) => 0.15 + 0.7 * sstep(700, 840, x) + 0.4 * sstep(1150, 1120, y) });
    ctx.restore();
    // the back half of the rolled rim
    const back = [];
    for (let i = 0; i <= 36; i++) {
      const a = Math.PI + Math.PI * (i / 36);
      back.push([MOUTH_X + Math.cos(a) * (MOUTH_RX + 6), MOUTH_Y + Math.sin(a) * (MOUTH_RY + 4)]);
    }
    L.inkPath(ctx, ribbonPoly(back, (u) => 20 + 6 * Math.sin(Math.PI * u)), { closed: true, fill: L.mix(P.jute, P.juteDeep, 0.3), width: 3, seed: sd('rimback'), taper: [4, 8] });
  }
  function mouthFront(ctx, L, P, bi) {
    const front = [];
    for (let i = 0; i <= 36; i++) {
      const a = Math.PI * (i / 36);
      front.push([MOUTH_X + Math.cos(a) * (MOUTH_RX + 8), MOUTH_Y + Math.sin(a) * (MOUTH_RY + 8)]);
    }
    front.reverse();
    const band = ribbonPoly(front, (u) => 30 + 10 * Math.sin(Math.PI * u));
    L.inkPath(ctx, band, { closed: true, fill: L.mix(P.jute, P.white, 0.12), width: 4, seed: sd('rimfront'), taper: [4, 8], double: true });
    // roll texture: curved strokes across the band, darker underneath
    const strokes = new Path2D();
    for (let i = 2; i < front.length - 2; i++) {
      const [x, y] = front[i];
      strokes.moveTo(x - 4, y - 12);
      strokes.quadraticCurveTo(x + 4, y, x - 2, y + 14);
    }
    strokeP(ctx, strokes, P.juteDeep, 0.75, 1.4);
    const under = [];
    for (let i = 0; i <= 36; i++) {
      const a = Math.PI * (i / 36);
      under.push([MOUTH_X + Math.cos(a) * (MOUTH_RX + 10), MOUTH_Y + 8 + Math.sin(a) * (MOUTH_RY + 16)]);
    }
    L.hatch(ctx, ribbonPoly(under.reverse(), () => 12), { spacing: 4, width: 1.2, color: P.juteDeep, alpha: 0.9, seed: sd('rimunder'), length: [10, 26] });
  }

  // the stream: beans in flight at time tw (on twos); landed beans vanish into the heap
  function drawStream(ctx, L, P, g, tw, yh, alpha, tipK) {
    if (alpha <= 0.01) return;
    const back = newBeanPaths(), front = newBeanPaths();
    for (const b of g.stream) {
      if (b.extra && tw < B_TIP) continue;
      const tau = tw - b.ts;
      if (tau < 0) continue;
      const y = fallY(tau);
      if (y > yh + 8) continue;
      const spread = (b.extra ? 1.3 : 1) * (0.7 + 0.6 * tipK);
      const x = LIP[0] + b.ox * Math.min(1, tau * 3) * spread + b.drift * tau * spread;
      const s = b.len / 480;
      smallBean(y > MOUTH_Y - 30 ? back : front, g, x, y, s, b.rot + b.spin * tau, b.flip);
    }
    flushBeans(ctx, P, back, 1.8, alpha);
    flushBeans(ctx, P, front, 1.8, alpha);
  }

  function drawScoop(ctx, L, P, tilt, slide, bi) {
    // local frame: the pouring point at the origin, the scoop body extending to the upper left
    ctx.save();
    ctx.translate(LIP[0], LIP[1] + slide);
    ctx.rotate(tilt);
    const outline = [[6, -4], [0, -52], [-70, -66], [-160, -78], [-250, -86], [-262, -40], [-258, 26], [-236, 52], [-160, 50], [-80, 40], [-20, 26]];
    const mouth = L.ellipsePts(-4, -26, 16, 30, 32);
    // handle out of frame to the upper left
    const handle = [[-250, -30], [-420, -60], [-760, -120]];
    L.inkPath(ctx, ribbonPoly(handle, (u) => lerp(18, 26, u)), { closed: true, fill: P.wood, width: 3.2, seed: sd('handle'), taper: [4, 8] });
    L.hatch(ctx, ribbonPoly(handle.map(([x, y]) => [x, y + 6]), (u) => lerp(8, 12, u)), { angle: Math.atan2(-90, -510), spacing: 3.5, width: 1.1, color: P.barkDeep, alpha: 0.85, length: [30, 90], seed: sd('handleh') });
    L.inkPath(ctx, outline, { closed: true, fill: P.steel, width: 4.5, seed: sd('scoop'), taper: [6, 10], double: true });
    // steel: contour hatching on the lower half (shadow), a long highlight on top
    L.hatch(ctx, outline, { angle: Math.PI / 2 - 0.15, spacing: 5, width: 1.3, color: P.steelDeep, alpha: 0.9, length: [10, 34], seed: sd('scooph'), density: (x, y) => sstep(-20, 30, y) });
    L.crossHatch(ctx, outline, { angle: Math.PI / 2 - 0.15, spacing: 5, width: 1.1, color: P.steelDeep, alpha: 0.7, tone: 0.5, seed: sd('scoopx'), density: (x, y) => sstep(20, 50, y) });
    L.inkPath(ctx, [[-30, -46], [-120, -62], [-220, -72]], { width: 4, color: P.white, alpha: 0.85, seed: sd('scoophi'), taper: [10, 14] });
    // the back cap seam and rivets
    L.inkPath(ctx, [[-232, -82], [-240, -30], [-236, 20], [-222, 48]], { width: 2, color: P.steelDeep, seed: sd('seam') });
    const rv = new Path2D();
    for (const [x, y] of [[-246, -54], [-250, -6], [-246, 34]]) {
      rv.moveTo(x + 4, y);
      rv.arc(x, y, 4, 0, TAU);
    }
    fillP(ctx, rv, P.steelDeep, 1);
    // the open mouth with green beans tumbling over its lip
    L.inkPath(ctx, mouth, { closed: true, fill: L.mix(P.steelDeep, P.ink, 0.4), width: 3, seed: sd('mouth'), taper: [4, 8] });
    const bp = newBeanPaths();
    const r = L.rng(sd('scoopbeans', Math.floor(L.onTwos(L.T) * 12) % 4));
    for (let i = 0; i < 9; i++) smallBean(bp, G, r.range(-14, 6), r.range(-48, -4), r.range(0.07, 0.09), r() * TAU, r() < 0.5);
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, mouth, true);
    ctx.clip();
    flushBeans(ctx, P, bp, 1.4);
    ctx.restore();
    ctx.restore();
  }

  // the hero bean in full detail at centre (cx, cy), scale s
  function drawHero(ctx, L, P, g, cx, cy, s, rot, bi) {
    const out = place(g.loc, cx, cy, s, rot);
    const shadeD = (x, y) => ((x - cx) * 0.6 + (y - cy) * 0.8) / (240 * s);
    L.inkPath(ctx, out, { closed: true, fill: P.beanGreen, width: Math.max(2.4, 5 * Math.sqrt(s)), seed: sd('hero'), taper: [10, 22] });
    if (s > 0.3) {
      // matte tone: hatching on the shadow side (light from the upper left), a cross layer deep down
      L.hatch(ctx, out, { spacing: 7 * Math.max(0.6, s), width: 1.5, color: P.beanGreenDeep, alpha: 0.85, length: [16, 60].map((v) => v * Math.max(0.5, s)), seed: sd('herohatch'), density: (x, y) => sstep(-0.15, 0.7, shadeD(x, y)) });
      L.hatch(ctx, out, { angle: -Math.PI / 4 - Math.PI / 3, spacing: 7 * Math.max(0.6, s), width: 1.3, color: P.beanGreenDeep, alpha: 0.8, length: [14, 44].map((v) => v * Math.max(0.5, s)), seed: sd('herox'), density: (x, y) => sstep(0.45, 0.95, shadeD(x, y)) });
      // dull surface: fine stipple all over, denser in shade
      L.stipple(ctx, out, { spacing: 9 * Math.max(0.6, s), r: [0.8, 1.6].map((v) => v * Math.max(0.6, s)), color: P.beanGreenDeep, alpha: 0.6, seed: sd('herostip'), density: (x, y) => 0.25 + 0.6 * sstep(-0.4, 0.6, shadeD(x, y)) });
      // a faint lit edge on the upper left (matte, not a gloss)
      const lit = place(g.loc.slice(50, 78).map(([x, y]) => [x * 0.9, y * 0.92]), cx, cy, s, rot);
      L.inkPath(ctx, lit, { width: 3 * s + 1, color: L.mix(P.beanGreen, P.white, 0.45), alpha: 0.8, seed: sd('herolit'), taper: [20 * s, 30 * s] });
    }
    // crease groove: beanGreenDeep, 12 px tapering to 3, an inked edge, the silverskin inside
    const cr = place(g.creaseLoc, cx, cy, s, rot);
    const gw = ribbonPoly(cr, (u) => s * (3 + 9 * Math.pow(Math.sin(Math.PI * u), 0.55)));
    L.inkPath(ctx, gw, { closed: true, fill: P.beanGreenDeep, width: Math.max(1, 1.8 * s), color: P.ink, alpha: 0.85, seed: sd('herogroove'), taper: [6, 10], wobble: 0.8 * s });
    L.inkPath(ctx, place(g.silverLoc, cx, cy, s, rot), { width: Math.max(0.8, 3 * s), color: P.silverskin, seed: sd('herosilver'), taper: [12 * s, 16 * s], wobble: 0.6 });
    if (s > 0.3) {
      // the doubled hero outline, occasional
      L.inkPath(ctx, out, { closed: true, width: 1.5, alpha: 0.4, seed: sd('herodbl'), taper: [10, 22], double: false, wobble: 2.4 });
    }
  }

  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal;
      const t = clamp(tIn, 0, info.dur);
      const g = geo(L);
      const bi = L.boil(info.T);
      const tw = L.onTwos(t);
      const f = Math.min(35, Math.floor(t * 24 + 1e-6));

      // 1 stripes
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeSage], width: 140, angle: -0.52, offset: (info.T / 0.75) * 6 });

      // entrances: sack up and scoop down over frames 2..8 (on twos); nothing but the bean on frame 0
      const enter = L.ease.outCubic(clamp((tw - 2 * FR) / (6 * FR)));
      const sackDY = (1 - enter) * 760;
      const scoopDY = -(1 - enter) * 520;
      const streamA = clamp((t - 4 * FR) / (5 * FR));

      // heap level: rises from the first landings, faster after the tip
      const heapU = clamp((tw - 0.55) / 0.95);
      let yh = lerp(1232, 1176, L.ease.outQuad(heapU));
      // sack slump (3 percent squash) on the 8th at T 23.625, outBack over 3 frames on its frame
      const slumpK = f >= 27 ? L.ease.outBack(clamp((f - 26) / 3)) : 0;
      const sy = 1 - 0.03 * slumpK, sx = 1 + 0.015 * slumpK;
      const yhScreen = SACK_PIVOT[1] - (SACK_PIVOT[1] - yh) * sy + sackDY;

      // 2-3 the sacks
      if (enter > 0) {
        ctx.save();
        ctx.translate(0, sackDY);
        drawBackSacks(ctx, L, P, bi);
        ctx.translate(SACK_PIVOT[0], SACK_PIVOT[1]);
        ctx.scale(sx, sy);
        ctx.translate(-SACK_PIVOT[0], -SACK_PIVOT[1]);
        drawSack(ctx, L, P, g, yh, bi);
        mouthBack(ctx, L, P, g, yh, bi);
        ctx.restore();
      }

      // 4 the stream (behind the front rim once the beans drop below the rim line)
      const tipK = f >= 18 ? L.ease.outBack(clamp((f - 17) / 3)) : 0;
      if (enter > 0 && streamA > 0) {
        ctx.save();
        // beans in flight are hidden by the front rim: clip out below the front rim curve
        ctx.beginPath();
        ctx.rect(0, 0, 1080, 1920);
        const frontY = (x) => SACK_PIVOT[1] - (SACK_PIVOT[1] - (MOUTH_Y + MOUTH_RY * Math.sqrt(Math.max(0, 1 - Math.pow((x - MOUTH_X) / MOUTH_RX, 2))) * 0.2)) * sy + sackDY;
        ctx.moveTo(MOUTH_X - MOUTH_RX, frontY(MOUTH_X - MOUTH_RX));
        for (let x = MOUTH_X - MOUTH_RX; x <= MOUTH_X + MOUTH_RX; x += 20) ctx.lineTo(x, frontY(x));
        ctx.lineTo(MOUTH_X + MOUTH_RX, 1920);
        ctx.lineTo(MOUTH_X - MOUTH_RX, 1920);
        ctx.closePath();
        ctx.clip('evenodd');
        drawStream(ctx, L, P, g, tw, yhScreen, streamA, tipK);
        ctx.restore();
      }
      if (enter > 0) {
        ctx.save();
        ctx.translate(0, sackDY);
        ctx.translate(SACK_PIVOT[0], SACK_PIVOT[1]);
        ctx.scale(sx, sy);
        ctx.translate(-SACK_PIVOT[0], -SACK_PIVOT[1]);
        mouthFront(ctx, L, P, bi);
        ctx.restore();
      }

      // 5 the scoop
      if (enter > 0) drawScoop(ctx, L, P, -(28 + 14 * tipK) * DEG * -1, scoopDY, bi);

      // 6 the hero bean: G1 on frame 0, shrinking about (540, 900), then falling with the stream
      const kS = L.ease.inOutCubic(clamp(tw / B_SHRUNK));
      const s = lerp(1, 0.12, kS);
      if (tw < B_SHRUNK) {
        drawHero(ctx, L, P, g, G1X, G1Y, s, G1ROT, bi);
      } else {
        const tau0 = fallT(G1Y);
        const tau = tau0 + (tw - B_SHRUNK);
        const y = fallY(tau);
        if (y < yhScreen + 8) {
          ctx.save();
          if (y > MOUTH_Y - 30) {
            ctx.beginPath();
            ctx.rect(0, 0, 1080, MOUTH_Y + 10 + sackDY);
            ctx.clip();
          }
          drawHero(ctx, L, P, g, G1X + 6 * (tw - B_SHRUNK), y, 0.12, G1ROT + 5 * (tw - B_SHRUNK), bi);
          ctx.restore();
        }
      }

      // 7 overlays
      if (f >= 9) {
        const prog = L.ease.outExpo((f - 8) / 6);
        const x = 640, y0 = LIP[1] + 40, y1 = yhScreen - 30;
        const ye = lerp(y0, y1, prog);
        ctx.save();
        ctx.strokeStyle = P.annBlue;
        ctx.fillStyle = P.annBlue;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.setLineDash([14, 10]);
        ctx.beginPath();
        ctx.moveTo(x - 30, y0);
        ctx.quadraticCurveTo(x, y0 + 60, x, Math.min(ye, y0 + 120));
        if (ye > y0 + 120) ctx.lineTo(x, ye);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x, ye + 8);
        ctx.lineTo(x - 9, ye - 10);
        ctx.lineTo(x, ye - 5);
        ctx.lineTo(x + 9, ye - 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // the sack height: an annYellow bracket from the heap surface down to the safe-area floor
        const bx = 930, by0 = yhScreen, by1 = 1536;
        L.bracket(ctx, bx, by0, bx, by1, { color: P.annYellow, alpha: 1, width: 2, cap: 16, p: prog });
        // a tick that rides the heap level
        ctx.save();
        ctx.strokeStyle = P.annYellow;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(MOUTH_X + 200, by0);
        ctx.lineTo(bx - 10, by0);
        ctx.stroke();
        ctx.restore();
      }
      // an annMagenta ring on the slump
      if (f >= 27 && f < 36) {
        const u = (f - 26) / 9;
        ctx.save();
        ctx.strokeStyle = P.annMagenta;
        ctx.globalAlpha = 1 - sstep(0.3, 1, u);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(MOUTH_X, yhScreen + 10, lerp(160, 330, L.ease.outExpo(u)), lerp(40, 90, L.ease.outExpo(u)), 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    },
  });
})();
