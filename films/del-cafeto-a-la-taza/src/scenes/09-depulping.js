// 09 depulping : Washed.  T 16.50 to 18.00 (36 frames), illustrated, hard cut.
// A toothed depulper drum (steel, 300 px across, axis horizontal, seen end-on, centred (540, 640))
// turns clockwise under a hopper of ripe cherries. Each cherry (on 8ths) drops into the gap between
// the drum and the breast plate and pops: its red skin flies out to the right onto the pulp heap, its
// two wet beans in parchment ride down the drum, slide down a chute and drop into the washing channel
// (surface y 980), where they sink with a slight sway and drift with the flow onto the bed of beans.
// Two green unripe floaters bob at the surface (260, 975) and (820, 975). T 17.25: a big splash.
//
// Layers, back to front:
//   1 stripes (stripeCream / stripeSage) in the top part
//   2 static plate (sprite per boil drawing): back wall lip, channel water and floor, ground, depulper
//     housing and stand, pulley and belt, hopper and its cherries, breast plate, chute, bean bed, pulp heap
//   3 the drum (rotating at 24 fps): rim teeth, end plate, spokes, hub
//   4 falling cherries, flying skins, beans on the drum, on the chute and sinking in the water
//   5 floaters, water surface line and ripples, splash
//   6 overlays: annBlue flow arrows, annYellow ring on a floater, annMagenta change ring at the gap
(function () {
  'use strict';

  const ID = 'depulping';
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
  // layout
  // ---------------------------------------------------------------------------
  const DRUM = { x: 540, y: 640, r: 150 };
  const SURF = 980; // water surface
  const LIP = 860; // top of the back wall
  const FLOOR = 1560; // channel floor
  const GAP_A = -16 * DEG; // where a cherry is squeezed (on the drum, right side)
  const gapPt = [DRUM.x + Math.cos(GAP_A) * 162, DRUM.y + Math.sin(GAP_A) * 162];
  const THROAT = [648, 486];
  const CHUTE0 = [626, 792], CHUTE1 = [372, 956];
  const HEAP = { x0: 790, x1: 1090 };
  const FLOAT = [[260, 975], [820, 975]];
  const STEP = 0.375; // an 8th
  const B_SPLASH = 0.75; // T 17.25

  // events: a cherry pops at the gap at te = k * 0.375 (k = -4 .. 3); k = 1 is a double batch whose
  // beans hit the water on the T 17.25 beat
  const EVENTS = [];
  for (let k = -4; k <= 3; k++) {
    const nb = k === 1 ? 5 : 3;
    EVENTS.push({ k, te: k * STEP, nb });
  }

  // bean timing relative to its event
  const T_DRUM = 3 * FR; // gap to the chute head along the drum
  const T_CHUTE = 4 * FR; // down the chute; a 2-frame drop, so it enters the water 9 frames (one 8th) after the pop
  const T_SINK = 1.25;

  let GEO = null;
  function geo(L) {
    if (GEO) return GEO;
    const r = L.rng(sd('geo'));
    // bean bed on the channel floor, thicker downstream (right)
    const bed = [];
    for (let i = 0; i < 150; i++) {
      const x = r.range(-20, 1100);
      const hgt = lerp(26, 70, sstep(100, 1000, x));
      const y = FLOOR - 14 - r() * hgt;
      bed.push({ x, y, rot: r.range(-1.2, 1.2), s: r.range(0.85, 1.05), seed: sd('bed', i) });
    }
    bed.sort((a, b) => a.y - b.y);
    // pulp heap: crumpled skins piled on the lip at the right
    const pulp = [];
    for (let i = 0; i < 46; i++) {
      const x = r.range(HEAP.x0 + 10, HEAP.x1);
      const top = LIP - 62 * Math.sin(Math.PI * clamp((x - HEAP.x0) / (HEAP.x1 - HEAP.x0 + 60)));
      const y = lerp(top + 8, LIP - 6, Math.pow(r(), 1.4));
      pulp.push({ x, y, rot: r() * TAU, s: r.range(0.8, 1.15), seed: sd('pulp', i) });
    }
    pulp.sort((a, b) => a.y - b.y);
    // hopper cherries
    const hop = [];
    for (let i = 0; i < 40; i++) {
      const y = r.range(318, 470);
      const u = (y - 300) / 180;
      const xl = lerp(490, 618, u), xr = lerp(810, 680, u);
      if (xr - xl < 30) continue;
      hop.push({ x: r.range(xl + 18, xr - 18), y, rr: r.range(24, 28), rot: r.range(-0.5, 0.5), seed: sd('hop', i), kind: r() < 0.9 ? 'r' : 'y' });
    }
    hop.sort((a, b) => a.y - b.y);
    GEO = { bed, pulp, hop };
    return GEO;
  }

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------
  function strokePath(ctx, path, color, alpha, width, dash, offset) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha *= alpha;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash) {
      ctx.setLineDash(dash);
      if (offset) ctx.lineDashOffset = offset;
    }
    ctx.stroke(path);
    ctx.restore();
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

  // a cherry: inked oval, flat colour, hatched shade, gloss, calyx scar
  function cherry(ctx, L, P, x, y, r, rot, kind, seed, o = {}) {
    const fill = kind === 'g' ? P.cherryGreen : kind === 'y' ? P.cherryYellow : P.cherryRed;
    const deep = kind === 'g' ? L.mix(P.cherryGreen, P.leafDeep, 0.65) : kind === 'y' ? L.mix(P.cherryYellow, P.ochre, 0.8) : P.cherryDeep;
    const hi = kind === 'g' ? L.mix(P.cherryGreen, P.white, 0.45) : kind === 'y' ? L.mix(P.cherryYellow, P.white, 0.5) : P.cherryLight;
    if (o.cheap) {
      ctx.save();
      ctx.fillStyle = deep;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 1.08, rot, 0, TAU);
      ctx.fill();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(x - r * 0.12, y - r * 0.14, r * 0.86, r * 0.92, rot, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 1.08, rot, 0, TAU);
      ctx.stroke();
      ctx.restore();
    } else {
      const pts = L.ellipsePts(x, y, r, r * 1.1, 32, rot);
      L.inkPath(ctx, pts, { closed: true, width: 3, fill, seed, wobble: 0.8 });
      L.hatch(ctx, L.ellipsePts(x, y, r - 2, r * 1.1 - 2, 28, rot), {
        spacing: 4.5, width: 1.2, color: deep, alpha: 0.85, length: [6, 18], seed: seed + 1, inset: 1, overshoot: 0,
        density: (px, py) => sstep(-0.15, 0.75, ((px - x) * 0.7 + (py - y) * 0.7) / r),
      });
    }
    ctx.save();
    ctx.fillStyle = hi;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.36, y - r * 0.4, r * 0.32, r * 0.16, -0.75, 0, TAU);
    ctx.fill();
    ctx.fillStyle = P.white;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.42, y - r * 0.46, r * 0.12, r * 0.07, -0.75, 0, TAU);
    ctx.fill();
    const tx = x - Math.sin(rot) * r * 0.86, ty = y + Math.cos(rot) * r * 0.86;
    ctx.fillStyle = P.ink;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(tx, ty, r * 0.17, r * 0.12, rot, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // a wet bean in parchment: 46 x 32 oval, mucilage fill, groove, glint
  function bean(ctx, L, P, x, y, rot, s, seed, o = {}) {
    const rx = 23 * s, ry = 16 * s;
    const fill = o.under ? L.mix(P.mucilage, P.water, 0.28) : P.mucilage;
    const shade = o.under ? L.mix(P.parchmentDeep, P.waterDeep, 0.3) : P.parchmentDeep;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(-rx * 0.08, -ry * 0.14, rx * 0.9, ry * 0.82, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = o.thin ? 1.8 : 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.stroke();
    // the groove of the flat face showing through the parchment
    ctx.strokeStyle = P.inkSoft;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.62, ry * 0.05);
    ctx.bezierCurveTo(-rx * 0.2, -ry * 0.25, rx * 0.2, ry * 0.3, rx * 0.62, -ry * 0.05);
    ctx.stroke();
    // wet glint
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.white;
    ctx.beginPath();
    ctx.ellipse(-rx * 0.42, -ry * 0.42, rx * 0.22, ry * 0.14, -0.3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // a crumpled red skin: a ragged crescent with the pulp side showing
  function skin(ctx, L, P, x, y, rot, s, seed) {
    const pts = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * 0.1 + (i / n) * Math.PI * 1.25;
      const rr = (26 + 5 * (h3(i, 1, seed) - 0.5)) * s;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    for (let i = n; i >= 0; i--) {
      const a = Math.PI * 0.1 + (i / n) * Math.PI * 1.25;
      const rr = (12 + 7 * h3(i, 2, seed)) * s;
      pts.push([Math.cos(a) * rr + 5 * s, Math.sin(a) * rr - 2 * s]);
    }
    const ca = Math.cos(rot), sa = Math.sin(rot);
    const W = pts.map(([px, py]) => [x + px * ca - py * sa, y + px * sa + py * ca]);
    ctx.save();
    ctx.fillStyle = P.cherryRed;
    ctx.beginPath();
    LIB.tracePath(ctx, W, true);
    ctx.fill();
    // pulp side: the inner edge in pulp colour
    ctx.strokeStyle = P.pulp;
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    LIB.tracePath(ctx, W.slice(n + 1), false);
    ctx.stroke();
    ctx.strokeStyle = P.cherryDeep;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 3; i < n - 2; i += 3) {
      const p = W[i], q = W[2 * n + 1 - i];
      ctx.moveTo(p[0] * 0.7 + q[0] * 0.3, p[1] * 0.7 + q[1] * 0.3);
      ctx.lineTo(p[0] * 0.35 + q[0] * 0.65, p[1] * 0.35 + q[1] * 0.65);
    }
    ctx.stroke();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    LIB.tracePath(ctx, W, true);
    ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // static plate
  // ---------------------------------------------------------------------------
  function drawPlate(ctx, L, P, G, bi) {
    // ground below the channel
    fillPoly(ctx, [[0, FLOOR + 80], [1080, FLOOR + 80], [1080, 1920], [0, 1920]], P.soil);
    L.crossHatch(ctx, [[0, FLOOR + 80], [1080, FLOOR + 80], [1080, 1920], [0, 1920]], { spacing: 7, width: 1.3, color: P.soilDeep, alpha: 0.85, length: [12, 36], seed: sd('soil'), tone: 0.55 });
    L.stipple(ctx, [[0, FLOOR + 90], [1080, FLOOR + 90], [1080, 1920], [0, 1920]], { spacing: 11, color: P.soilDeep, alpha: 0.7, seed: sd('soilst') });
    // pebbles in the ground
    for (let i = 0; i < 26; i++) {
      const x = 30 + i * 41 + 20 * h3(i, 1, sd('peb')), y = FLOOR + 140 + 230 * h3(i, 2, sd('peb'));
      const rx = 10 + 12 * h3(i, 3, sd('peb')), ry = rx * (0.55 + 0.2 * h3(i, 4, sd('peb')));
      const pp = L.ellipsePts(x, y, rx, ry, 16, h3(i, 5, sd('peb')) - 0.5);
      L.inkPath(ctx, pp, { closed: true, width: 2.2, fill: L.mix(P.tan, P.soil, 0.3), seed: sd('pebi', i), wobble: 0.6 });
      L.hatch(ctx, pp, { spacing: 3.5, width: 1, color: P.soilDeep, alpha: 0.8, length: [4, 10], seed: sd('pebh', i), density: (px, py) => sstep(-0.2, 0.6, ((px - x) / rx + (py - y) / ry) * 0.7) });
    }
    // channel floor slab (concrete)
    const slab = [[0, FLOOR], [1080, FLOOR], [1080, FLOOR + 80], [0, FLOOR + 80]];
    fillPoly(ctx, slab, P.paperDeep);
    L.hatch(ctx, slab, { spacing: 6, width: 1.3, color: P.inkSoft, alpha: 0.7, length: [12, 40], seed: sd('slab'), density: (x, y) => sstep(FLOOR + 10, FLOOR + 75, y) });
    L.stipple(ctx, slab, { spacing: 9, color: P.inkSoft, alpha: 0.6, seed: sd('slabst') });
    L.inkLine(ctx, -10, FLOOR + 80, 1090, FLOOR + 80, { width: 4, seed: sd('slabB'), taper: 0 });
    // the water body
    const water = [[0, SURF], [1080, SURF], [1080, FLOOR], [0, FLOOR]];
    fillPoly(ctx, water, P.water);
    L.hatch(ctx, water, { angle: 0, spacing: 9, width: 1.4, color: P.waterDeep, alpha: 0.8, length: [20, 70], gap: [6, 18], seed: sd('wat'), density: (x, y) => 0.25 + 0.75 * sstep(SURF + 20, FLOOR - 40, y) });
    L.hatch(ctx, [[0, FLOOR - 160], [1080, FLOOR - 160], [1080, FLOOR], [0, FLOOR]], { angle: 0, spacing: 5, width: 1.2, color: P.tealDeep, alpha: 0.6, length: [14, 50], seed: sd('wat2'), density: (x, y) => sstep(FLOOR - 160, FLOOR - 20, y) });
    // bean bed on the floor (tinted by the water)
    for (const b of G.bed) bean(ctx, L, P, b.x, b.y, b.rot, b.s, b.seed, { under: true, thin: true });
    L.hatch(ctx, [[0, FLOOR - 80], [1080, FLOOR - 80], [1080, FLOOR], [0, FLOOR]], { angle: 0, spacing: 6, width: 1.2, color: P.waterDeep, alpha: 0.55, length: [14, 40], seed: sd('bedsh'), density: (x, y) => sstep(FLOOR - 70, FLOOR, y) * 0.8 });
    L.inkLine(ctx, -10, FLOOR, 1090, FLOOR, { width: 3.4, seed: sd('floor'), taper: 0 });
    // back wall lip: the concrete band above the water
    const wall = [[0, LIP], [1080, LIP], [1080, SURF], [0, SURF]];
    fillPoly(ctx, wall, P.paperDeep);
    L.hatch(ctx, wall, { spacing: 7, width: 1.3, color: P.inkSoft, alpha: 0.75, length: [10, 36], seed: sd('wall'), density: (x, y) => 0.25 + 0.6 * sstep(LIP + 20, SURF, y) });
    L.stipple(ctx, wall, { spacing: 10, color: P.inkSoft, alpha: 0.55, seed: sd('wallst') });
    const joints = new Path2D();
    for (const x of [150, 420, 700, 960]) {
      joints.moveTo(x, LIP + 4);
      joints.lineTo(x + 2, SURF - 2);
    }
    // a wet line just above the water and algae stain
    joints.moveTo(0, SURF - 14);
    for (let x = 0; x <= 1080; x += 30) joints.lineTo(x, SURF - 14 + 3 * Math.sin(x * 0.05));
    strokePath(ctx, joints, P.inkSoft, 0.7, 1.8);
    L.hatch(ctx, [[0, SURF - 14], [1080, SURF - 14], [1080, SURF], [0, SURF]], { angle: 0.15, spacing: 4, width: 1.2, color: P.leafDeep, alpha: 0.6, length: [6, 18], seed: sd('alg') });
    L.inkLine(ctx, -10, LIP, 1090, LIP, { width: 4.4, seed: sd('lip'), taper: 0 });
    L.inkLine(ctx, -10, LIP + 14, 1090, LIP + 14, { width: 1.8, color: P.inkSoft, seed: sd('lip2'), taper: 0 });

    // stand: two legs from the housing to the lip
    for (const x of [400, 690]) {
      const leg = [[x - 12, 800], [x + 12, 800], [x + 16, LIP], [x - 16, LIP]];
      L.inkPath(ctx, leg, { closed: true, width: 3, fill: P.steelDeep, seed: sd('leg', x), smooth: false });
      L.hatch(ctx, leg, { angle: Math.PI / 2 - 0.1, spacing: 4, width: 1.2, color: P.ink, alpha: 0.7, length: [10, 30], seed: sd('legh', x), density: (px) => sstep(x - 6, x + 14, px) });
      const ft = L.rrectPts(x - 34, LIP - 14, 68, 14, 4, 10);
      L.inkPath(ctx, ft, { closed: true, width: 2.6, fill: P.steel, seed: sd('foot', x) });
    }
    // housing behind the drum (sheet steel box)
    const hb = L.rrectPts(350, 455, 400, 360, 26, 18);
    L.inkPath(ctx, hb, { closed: true, width: 4, fill: L.mix(P.steelDeep, P.steel, 0.35), seed: sd('housing') });
    L.hatch(ctx, hb, { spacing: 6, width: 1.3, color: P.ink, alpha: 0.65, length: [14, 40], seed: sd('hh'), density: (x, y) => 0.3 + 0.7 * sstep(520, 780, x + (y - 455) * 0.3) });
    const rv = new Path2D();
    for (const [x, y] of [[372, 478], [728, 478], [372, 792], [728, 792], [550, 470], [372, 635], [728, 635]]) {
      rv.moveTo(x + 4, y);
      rv.arc(x, y, 4, 0, TAU);
    }
    ctx.save();
    ctx.fillStyle = P.steel;
    ctx.fill(rv);
    ctx.restore();
    strokePath(ctx, rv, P.ink, 0.9, 1.6);
    // hopper (cutaway: we see the cherries inside), on a short column
    const hop = [[476, 290], [824, 290], [690, 482], [608, 482]];
    fillPoly(ctx, hop, L.mix(P.steelDeep, P.ink, 0.35));
    ctx.save();
    ctx.beginPath();
    LIB.tracePath(ctx, hop, true);
    ctx.clip();
    for (const c of G.hop) cherry(ctx, L, P, c.x, c.y, c.rr, c.rot, c.kind, c.seed, { cheap: c.y > 400 });
    ctx.restore();
    // hopper walls (thick bands with contour hatching) and rim
    const wallL = [[462, 284], [488, 284], [618, 486], [598, 486]];
    const wallR = [[812, 284], [838, 284], [700, 486], [680, 486]];
    for (const [w, k] of [[wallL, 1], [wallR, 2]]) {
      L.inkPath(ctx, w, { closed: true, width: 3.4, fill: P.steel, seed: sd('hw', k), smooth: false });
      L.hatch(ctx, w, { angle: 0.4, spacing: 4, width: 1.1, color: P.steelDeep, alpha: 0.9, length: [6, 16], seed: sd('hwh', k), density: k === 2 ? 1 : 0.4 });
    }
    L.inkPath(ctx, L.rrectPts(452, 270, 396, 20, 6, 14), { closed: true, width: 3.4, fill: P.steel, seed: sd('hrim') });
    L.hatch(ctx, L.rrectPts(452, 270, 396, 20, 6, 14), { angle: 0, spacing: 4, width: 1.1, color: P.steelDeep, alpha: 0.8, length: [10, 30], seed: sd('hrimh'), density: (x) => sstep(560, 840, x) });
    // throat collar
    L.inkPath(ctx, L.rrectPts(596, 480, 106, 18, 4, 10), { closed: true, width: 3, fill: P.steelDeep, seed: sd('collar') });
    // breast plate on the right of the drum: a thick curved plate with bolts and an adjusting screw
    const bp = [];
    for (let i = 0; i <= 24; i++) {
      const a = lerp(-48, 52, i / 24) * DEG;
      bp.push([DRUM.x + Math.cos(a) * 170, DRUM.y + Math.sin(a) * 170]);
    }
    for (let i = 24; i >= 0; i--) {
      const a = lerp(-48, 52, i / 24) * DEG;
      bp.push([DRUM.x + Math.cos(a) * 196, DRUM.y + Math.sin(a) * 196]);
    }
    L.inkPath(ctx, bp, { closed: true, width: 4, fill: P.steel, seed: sd('bp') });
    L.hatch(ctx, bp, { angle: 0.2, spacing: 4.5, width: 1.2, color: P.steelDeep, alpha: 0.9, length: [8, 22], seed: sd('bph'), density: (x, y) => 0.35 + 0.65 * sstep(560, 720, y) });
    const bolts = new Path2D();
    for (const a of [-36, 0, 38]) {
      const x = DRUM.x + Math.cos(a * DEG) * 183, y = DRUM.y + Math.sin(a * DEG) * 183;
      bolts.moveTo(x + 5, y);
      bolts.arc(x, y, 5, 0, TAU);
    }
    strokePath(ctx, bolts, P.ink, 0.9, 1.8);
    L.inkPath(ctx, [[732, 640], [790, 640]], { width: 7, color: P.steelDeep, seed: sd('screw'), taper: 0 });
    L.inkPath(ctx, L.rrectPts(788, 618, 16, 44, 4, 8), { closed: true, width: 2.6, fill: P.steel, seed: sd('screwh') });
    // skin spout: a short guide plate throwing skins out to the right
    const sp = [[722, 588], [800, 600], [800, 612], [726, 612]];
    L.inkPath(ctx, sp, { closed: true, width: 3, fill: P.steelDeep, seed: sd('spout'), smooth: false });
    // the bean chute: an inclined trough from under the drum to the water
    const dxC = CHUTE1[0] - CHUTE0[0], dyC = CHUTE1[1] - CHUTE0[1];
    const lc = Math.hypot(dxC, dyC), nx = -dyC / lc, ny = dxC / lc;
    const ch = [[CHUTE0[0] + nx * 4, CHUTE0[1] + ny * 4], [CHUTE1[0] + nx * 4, CHUTE1[1] + ny * 4], [CHUTE1[0] + nx * 26, CHUTE1[1] + ny * 26], [CHUTE0[0] + nx * 26, CHUTE0[1] + ny * 26]];
    L.inkPath(ctx, ch, { closed: true, width: 3.6, fill: P.steel, seed: sd('chute'), smooth: false });
    L.hatch(ctx, ch, { angle: Math.atan2(dyC, dxC) + 1.3, spacing: 5, width: 1.2, color: P.steelDeep, alpha: 0.85, length: [6, 16], seed: sd('chh') });
    L.inkPath(ctx, [[CHUTE0[0] - nx * 6, CHUTE0[1] - ny * 6], [CHUTE1[0] - nx * 6, CHUTE1[1] - ny * 6]], { width: 2.4, seed: sd('chlip'), taper: 0 });
    // chute struts down to the lip
    L.inkPath(ctx, [[540, 862], [520, 846], [505, 800 + 40]], { width: 3, seed: sd('strut'), smooth: false });
    // pulp heap of skins on the lip at the right
    for (const p of G.pulp) skin(ctx, L, P, p.x, p.y, p.rot, p.s, p.seed);
    L.hatch(ctx, [[HEAP.x0, LIP], [HEAP.x1, LIP], [HEAP.x1, LIP - 70], [HEAP.x0 + 120, LIP - 70]], { spacing: 5, width: 1.2, color: P.cherryDeep, alpha: 0.55, length: [8, 22], seed: sd('pulpsh'), density: (x, y) => sstep(LIP - 40, LIP, y) * 0.8 });
  }

  // the drum, end-on, rotated by phi (clockwise)
  function drawDrum(ctx, L, P, phi, bi) {
    const { x, y, r } = DRUM;
    // rim teeth (rotating)
    const teeth = [];
    const NT = 44;
    for (let i = 0; i < NT; i++) {
      const a0 = phi + (i / NT) * TAU;
      const a1 = a0 + (0.45 / NT) * TAU, a2 = a0 + (0.75 / NT) * TAU, a3 = a0 + (1 / NT) * TAU;
      teeth.push([x + Math.cos(a0) * r, y + Math.sin(a0) * r], [x + Math.cos(a1) * (r + 9), y + Math.sin(a1) * (r + 9)], [x + Math.cos(a2) * (r + 7), y + Math.sin(a2) * (r + 7)], [x + Math.cos(a3) * r, y + Math.sin(a3) * r]);
    }
    L.inkPath(ctx, teeth, { closed: true, width: 3.4, fill: P.steel, seed: sd('teeth'), smooth: false, wobble: 0.6 });
    // shade on the lower right of the drum
    L.hatch(ctx, L.ellipsePts(x, y, r - 2, r - 2, 48), { spacing: 5, width: 1.3, color: P.steelDeep, alpha: 0.85, length: [10, 30], seed: sd('dsh'), density: (px, py) => sstep(-0.1, 0.8, ((px - x) + (py - y)) / (r * 1.3)) });
    L.crossHatch(ctx, L.ellipsePts(x, y, r - 2, r - 2, 48), { spacing: 5, width: 1.2, color: P.ink, alpha: 0.5, length: [8, 22], seed: sd('dsh2'), layers: 2, density: (px, py) => sstep(0.5, 1.1, ((px - x) + (py - y)) / (r * 1.3)) });
    // end plate ring and rotating spokes, hub
    L.inkCircle(ctx, x, y, r - 18, { width: 2.4, color: P.inkSoft, seed: sd('ring') });
    const sp = new Path2D();
    for (let i = 0; i < 6; i++) {
      const a = phi * 1 + (i / 6) * TAU;
      const ca = Math.cos(a), sa = Math.sin(a);
      const px = -sa, py = ca;
      sp.moveTo(x + ca * 28 + px * 7, y + sa * 28 + py * 7);
      sp.lineTo(x + ca * (r - 22) + px * 10, y + sa * (r - 22) + py * 10);
      sp.lineTo(x + ca * (r - 22) - px * 10, y + sa * (r - 22) - py * 10);
      sp.lineTo(x + ca * 28 - px * 7, y + sa * 28 - py * 7);
      sp.closePath();
    }
    ctx.save();
    ctx.fillStyle = L.mix(P.steel, P.white, 0.25);
    ctx.fill(sp);
    ctx.restore();
    strokePath(ctx, sp, P.ink, 0.9, 2.2);
    // punched tooth rows on the drum skin, seen as dashes between the spokes (rotate with it)
    const dots = new Path2D();
    for (let i = 0; i < 60; i++) {
      const a = phi + (i / 60) * TAU;
      for (const rr of [r - 8]) {
        dots.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        dots.lineTo(x + Math.cos(a + 0.04) * rr, y + Math.sin(a + 0.04) * rr);
      }
    }
    strokePath(ctx, dots, P.ink, 0.7, 2);
    L.inkCircle(ctx, x, y, 30, { width: 3, fill: P.steelDeep, seed: sd('hub') });
    const bl = new Path2D();
    for (let i = 0; i < 6; i++) {
      const a = phi + (i / 6) * TAU + 0.5;
      const bx = x + Math.cos(a) * 19, by = y + Math.sin(a) * 19;
      bl.moveTo(bx + 3, by);
      bl.arc(bx, by, 3, 0, TAU);
    }
    ctx.save();
    ctx.fillStyle = P.steel;
    ctx.fill(bl);
    ctx.restore();
    // the crank arm turns with the drum
    {
      const ca = Math.cos(phi + 0.9), sa = Math.sin(phi + 0.9);
      const ex = x + ca * 104, ey = y + sa * 104;
      const arm = [[x - sa * 11, y + ca * 11], [ex - sa * 8, ey + ca * 8], [ex + sa * 8, ey - ca * 8], [x + sa * 11, y - ca * 11]];
      L.inkPath(ctx, arm, { closed: true, width: 3, fill: P.steelDeep, seed: sd('crank'), smooth: false });
      L.inkCircle(ctx, ex, ey, 17, { width: 3, fill: P.wood, seed: sd('knob') });
      const kh = new Path2D();
      kh.arc(ex, ey, 11, -0.2, 1.6);
      strokePath(ctx, kh, P.barkDeep, 0.9, 2);
      L.inkCircle(ctx, ex - 5, ey - 5, 3.5, { width: 1.2, fill: P.white, seed: sd('knobhl') });
    }
    L.inkCircle(ctx, x, y, 9, { width: 2.4, fill: P.ink, seed: sd('axle') });
    // a highlight arc on the upper left of the rim
    const hl = new Path2D();
    hl.arc(x, y, r - 7, 200 * DEG, 250 * DEG);
    strokePath(ctx, hl, P.white, 0.85, 3);
  }

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

      // ---- 1 stripes -------------------------------------------------------------------
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeSage], width: 140, angle: -0.52, offset: 8 * info.T, bounds: [0, 0, 1080, LIP + 10] });

      // ---- 2 static plate -------------------------------------------------------------
      sprite(ctx, L, 'plate', 250, 1670, bi, (g) => drawPlate(g, L, P, G, bi));

      // ---- 3 drum (24 fps) ------------------------------------------------------------
      const phi = 2.6 * (info.T - 16.5);
      drawDrum(ctx, L, P, phi, bi);

      // ---- 4 cherries, skins, beans ------------------------------------------------------
      // falling cherries: from the throat into the gap over the 6 frames before each pop
      for (const ev of EVENTS) {
        const d = tw - (ev.te - 6 * FR);
        if (d < 0 || tw >= ev.te - 1e-6) continue;
        const u = clamp(d / (6 * FR));
        const x = lerp(THROAT[0], gapPt[0] - 6, u), y = lerp(THROAT[1] - 6, gapPt[1] - 4, u * u);
        cherry(ctx, L, P, x, y, 27, ev.k * 0.7 + u * 1.2, 'r', sd('fc', ev.k));
        if (ev.nb > 2) cherry(ctx, L, P, x - 30, y - 34, 27, ev.k + u, 'r', sd('fc2', ev.k));
      }
      // skins flying out right onto the heap
      for (const ev of EVENTS) {
        const d = tw - ev.te;
        const T_FLY = 0.42;
        const nSk = ev.nb > 2 ? 2 : 1;
        for (let j = 0; j < nSk; j++) {
          const tx = lerp(HEAP.x0 + 40, HEAP.x1 - 60, h3(ev.k + 9, j, sd('sk')));
          const ty = LIP - 40 * Math.sin(Math.PI * clamp((tx - HEAP.x0) / (HEAP.x1 - HEAP.x0 + 60))) - 6;
          if (d < 0) continue;
          if (d >= T_FLY) {
            // landed: rests on the heap
            skin(ctx, L, P, tx, ty, ev.k * 1.9 + j, 1, sd('skr', ev.k, j));
            continue;
          }
          const u = d / T_FLY;
          const x0 = gapPt[0] + 30, y0 = gapPt[1] + 10;
          const x = lerp(x0, tx, u);
          const y = lerp(y0, ty, u) - Math.sin(Math.PI * u) * 120;
          skin(ctx, L, P, x, y, ev.k * 1.9 + j + u * 7, 1, sd('skr', ev.k, j));
        }
      }
      // beans: along the drum, down the chute, into the water, sinking with sway
      const beanState = (ev, j, tt) => {
        const d = tt - ev.te;
        if (d < 0) return null;
        const lag = j * FR * 0.5;
        const dd = d - lag;
        if (dd < 0) return { x: gapPt[0] - 4, y: gapPt[1] + 4, rot: 0.4, stage: 0 };
        if (dd < T_DRUM) {
          const a = lerp(GAP_A, 64 * DEG, dd / T_DRUM);
          return { x: DRUM.x + Math.cos(a) * 166, y: DRUM.y + Math.sin(a) * 166, rot: a + Math.PI / 2, stage: 1 };
        }
        if (dd < T_DRUM + T_CHUTE) {
          const u = (dd - T_DRUM) / T_CHUTE;
          const off = (j % 2 ? 14 : -4);
          return { x: lerp(CHUTE0[0], CHUTE1[0], u) + off * 0.3, y: lerp(CHUTE0[1], CHUTE1[1], u) - 14 + off * 0.2, rot: Math.atan2(CHUTE1[1] - CHUTE0[1], CHUTE1[0] - CHUTE0[0]) + Math.PI, stage: 2 };
        }
        const ds = dd - T_DRUM - T_CHUTE;
        const x0 = CHUTE1[0] - 22 - j * 9;
        const u = clamp(ds / T_SINK);
        // a short drop to the surface, then a slowing sink, drifting right with the flow
        const settle = FLOOR - 26 - 34 * h3(ev.k + 20, j, sd('settle'));
        const y = ds < 2 * FR ? lerp(CHUTE1[1], SURF + 10, ds / (2 * FR)) : lerp(SURF + 10, settle, E.outQuad(clamp((ds - 2 * FR) / (T_SINK - 2 * FR))));
        const sway = Math.sin(ds * 9 + j * 1.7 + ev.k) * 12 * (1 - u);
        const x = x0 + 120 * E.outQuad(u) + sway + j * 16;
        return { x, y, rot: 0.6 + ds * 2.5 * (1 - u) + j, stage: 3, under: y > SURF + 12, u };
      };
      for (const ev of EVENTS) {
        for (let j = 0; j < ev.nb; j++) {
          const s = beanState(ev, j, tw);
          if (!s) continue;
          if (s.stage === 3 && s.under && s.u < 0.7) {
            const bb = new Path2D();
            for (let q = 1; q <= 4; q++) {
              const by = s.y - 18 - q * 24 - (tw * 60) % 24;
              if (by < SURF + 8) continue;
              const bx = s.x + 6 * Math.sin(q * 1.7 + tw * 6 + j) + 4;
              const br = 2.5 + q * 0.9;
              bb.moveTo(bx + br, by);
              bb.arc(bx, by, br, 0, TAU);
            }
            ctx.save();
            ctx.fillStyle = L.rgba(P.white, 0.45);
            ctx.fill(bb);
            ctx.restore();
            strokePath(ctx, bb, P.white, (1 - s.u) * 0.9, 1.6);
          }
          bean(ctx, L, P, s.x, s.y, s.rot, 1, sd('bn', ev.k, j), { under: s.under });
        }
      }

      // ---- 5 floaters, surface, splash -------------------------------------------------
      for (let i = 0; i < 2; i++) {
        const [fx, fy] = FLOAT[i];
        const bob = 5 * Math.sin(TAU * (tw / 0.75) + i * 2.1);
        const roll = 0.25 * Math.sin(TAU * (tw / 1.5) + i);
        cherry(ctx, L, P, fx + 3 * Math.sin(tw * 3 + i), fy + bob, 30, roll + (i ? 0.4 : -0.3), 'g', sd('fl', i));
        // the part under the surface reads through the water
        ctx.save();
        ctx.beginPath();
        ctx.rect(fx - 50, SURF + 2, 100, 60);
        ctx.clip();
        ctx.fillStyle = P.water;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(fx - 50, SURF + 2, 100, 60);
        const wh = new Path2D();
        for (let y = SURF + 8; y < SURF + 60; y += 7) {
          wh.moveTo(fx - 40, y);
          wh.lineTo(fx + 40, y);
        }
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(fx, fy + bob, 31, 34, 0, 0, TAU);
        ctx.clip();
        strokePath(ctx, wh, P.waterDeep, 0.6, 1.3);
        ctx.restore();
      }
      // the surface line with travelling ripples
      {
        const pts = [];
        for (let x = -20; x <= 1100; x += 12) {
          let y = SURF + 2.5 * Math.sin(x * 0.025 - info.T * 5) + 1.5 * Math.sin(x * 0.061 + info.T * 3);
          // rings round the floaters
          for (const [fx] of FLOAT) {
            const d = Math.abs(x - fx);
            if (d < 90) y += 3 * Math.cos(d * 0.12 - info.T * 9) * (1 - d / 90);
          }
          pts.push([x, y]);
        }
        L.inkPath(ctx, pts, { width: 3.4, seed: sd('surf'), taper: 0 });
        const hl = new Path2D();
        for (let i = 0; i < 22; i++) {
          const x = (i * 53 + ((info.T * 40) % 53) + 20 * h3(i, 0, sd('hl'))) % 1100;
          const y = SURF + 10 + 30 * h3(i, 1, sd('hl'));
          hl.moveTo(x, y);
          hl.lineTo(x + 14 + 10 * h3(i, 2, sd('hl')), y);
        }
        strokePath(ctx, hl, P.white, 0.75, 2);
      }
      // entry plips for every bean group, and the big splash on the beat
      for (const ev of EVENTS) {
        const tEnter = ev.te + T_DRUM + T_CHUTE + 2 * FR;
        const d = t - tEnter;
        const big = ev.nb > 2;
        const dur = big ? 14 * FR : 8 * FR;
        if (d < -FR || d > dur) continue;
        const u = clamp((d + FR) / dur);
        const cx = CHUTE1[0] - 10;
        const rr = (big ? 130 : 50) * E.outExpo(u);
        ctx.save();
        ctx.globalAlpha = 1 - u;
        ctx.strokeStyle = P.white;
        ctx.lineWidth = big ? 4 : 2.5;
        ctx.beginPath();
        ctx.ellipse(cx, SURF + 2, rr, rr * 0.18, 0, 0, TAU);
        ctx.stroke();
        if (big) {
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, SURF + 2, rr * 0.7, rr * 0.12, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
        // droplets thrown up on twos
        const ud = clamp((L.onTwos(t) - tEnter + FR) / (big ? 12 * FR : 6 * FR));
        if (ud > 0 && ud < 1) {
          const n = big ? 14 : 5;
          for (let i = 0; i < n; i++) {
            const a = lerp(-160, -20, (i + 0.5) / n) * DEG;
            const sp = (big ? 260 : 120) * (0.6 + 0.6 * h3(i, ev.k, sd('drop')));
            const x = cx + Math.cos(a) * sp * ud;
            const y = SURF + Math.sin(a) * sp * ud + 0.5 * 900 * ud * ud * (big ? 0.5 : 0.25);
            const r = (big ? 7 : 4.5) * (1 - 0.4 * ud);
            ctx.save();
            ctx.fillStyle = P.white;
            ctx.strokeStyle = P.ink;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.ellipse(x, y, r * 0.8, r, a + Math.PI / 2, 0, TAU);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          if (big) {
            // a crown of water at the entry point
            const cr = new Path2D();
            const hgt = 90 * Math.sin(Math.PI * ud);
            for (let i = 0; i < 7; i++) {
              const xx = cx - 60 + i * 20;
              cr.moveTo(xx, SURF);
              cr.quadraticCurveTo(xx + (i - 3) * 4, SURF - hgt * (0.6 + 0.4 * h3(i, 3, sd('crown'))), xx + (i - 3) * 9, SURF - hgt * (0.9 + 0.2 * h3(i, 4, sd('crown'))));
            }
            strokePath(ctx, cr, P.white, 0.95, 4);
            strokePath(ctx, cr, P.ink, 0.7, 1.4);
          }
        }
      }

      // ---- 6 overlays --------------------------------------------------------------------
      // annBlue flow arrows along the channel (water flowing right), dashes travelling
      for (let i = 0; i < 3; i++) {
        const y0 = 1120 + i * 135;
        const x0 = 90 + (i % 2) * 140, x1 = x0 + 560;
        const path = new Path2D();
        const pts = [];
        for (let k = 0; k <= 30; k++) {
          const x = lerp(x0, x1, k / 30);
          pts.push([x, y0 + 16 * Math.sin((k / 30) * Math.PI * 1.6 + i)]);
        }
        pts.forEach((p, k) => (k ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
        strokePath(ctx, path, P.annBlue, 0.95, 2.5, [14, 10], -info.T * 70);
        const e = pts[pts.length - 1], q = pts[pts.length - 3];
        const a = Math.atan2(e[1] - q[1], e[0] - q[0]);
        const ah = new Path2D();
        ah.moveTo(e[0] + Math.cos(a) * 6, e[1] + Math.sin(a) * 6);
        ah.lineTo(e[0] - Math.cos(a - 0.5) * 16, e[1] - Math.sin(a - 0.5) * 16);
        ah.lineTo(e[0] - Math.cos(a + 0.5) * 16, e[1] - Math.sin(a + 0.5) * 16);
        ah.closePath();
        ctx.save();
        ctx.fillStyle = P.annBlue;
        ctx.fill(ah);
        ctx.restore();
      }
      // a dashed annBlue path for the beans: drum, chute, water
      {
        const p = new Path2D();
        p.arc(DRUM.x, DRUM.y, 166, GAP_A, 64 * DEG);
        p.lineTo(CHUTE1[0], CHUTE1[1] - 14);
        p.quadraticCurveTo(CHUTE1[0] - 40, SURF + 40, CHUTE1[0] + 20, SURF + 200);
        strokePath(ctx, p, P.annBlue, 0.55, 2, [8, 9], -info.T * 50);
      }
      // annYellow ring round the left floater (unripe floats)
      {
        const [fx, fy] = FLOAT[0];
        const bob = 5 * Math.sin(TAU * (tw / 0.75));
        const pulse = 1 + 0.04 * Math.sin(TAU * (t / 0.75));
        ctx.save();
        ctx.strokeStyle = P.annYellow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx, fy + bob, 58 * pulse, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([6, 8]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx, fy + bob, 72 * pulse, -2.4, -0.7);
        ctx.stroke();
        ctx.restore();
      }
      // annMagenta change ring where skin meets bean at the gap, on each pop (8 frames)
      for (const ev of EVENTS) {
        const d = t - ev.te;
        if (d < 0 || d > 8 * FR) continue;
        const u = clamp(d / (8 * FR) + 1 / 8);
        ctx.save();
        ctx.globalAlpha = 1 - sstep(0.5, 1, u);
        ctx.strokeStyle = P.annMagenta;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gapPt[0], gapPt[1], 22 + 40 * E.outExpo(u), 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    },
  });
})();
