// 01 hero-cherries : Cold open, the ripe cherry (illustrated, global T 0.00 to 1.50)
//
// A macro of an arabica branch. The hero cherry sits on G2 (centre (540, 900), rx 260, ry 290) under a
// branch at y 600, with an unevenly ripening cluster (yellow, red, green, deep red) and an opposite pair
// of glossy wavy leaves rising from the node at x 540. Frame 0 is the film's thumbnail and the loop target.
//
// Layers, back to front:
//   1 stripes (stripeCream / stripeSpring), drifting 6 px per beat
//   2 (camera, push 1.00 to 1.06 about (540, 900)) construction lines in inkFaint
//   3 lower leaf pair (tips (60, 1500) and (1020, 1520)), half hidden
//   4 upper opposite leaf pair from the node at x 540 (tips near (90, 250) and (990, 230))
//   5 branch (40 px, bark, lengthwise hatch, lenticels, node with stipules)
//   6 back cherries: green (120, 1000), deep red (980, 1040); then yellow (230, 760), red (850, 760)
//   7 cast shadows of the front cherries on the ones behind
//   8 hero cherry on G2: cherryRed, cross-hatched cherryDeep shadow, gloss crescent, calyx scar, dew drop
//   9 overlays: annYellow attention ring r 330 (beat 2), annBlue ruler x 830 from y 610 to 1190 (T 1.125)
//
// Motion: cluster sways +-4 px on twos to T 0.75 (zero at T 0 so frame 0 is exactly on G2), the hero bobs
// 10 px on beat 2 (T 0.75) on twos, the ring draws on over 6 frames, the ruler at T 1.125 over 6 frames.
// The push keeps world (540, 900) on screen (540, 900), so the last frame shows G2 scaled 1.06 about its
// centre: 02 opens its guide oval at 1.06 to match.
(function () {
  'use strict';

  const ID = 'hero-cherries';
  const LIB = FILM.lib;
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const FR = 1 / 24;

  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => {
    const u = clamp((x - a) / (b - a));
    return u * u * (3 - 2 * u);
  };
  const sd = (...k) => LIB.hash(ID, ...k) & 0x7fffffff;

  // beats (shot-local seconds)
  const B_BOB = 0.75; // T 0.75, beat 2: hero bob + attention ring
  const B_RULER = 1.125; // T 1.125, 8th: ruler

  // ---------------------------------------------------------------------------
  // G2: the hero cherry (docs/storyboard.md, Shared geometry G2)
  // ---------------------------------------------------------------------------
  const G2 = { x: 540, y: 900, rx: 260, ry: 290, scarX: 540, scarY: 1172, scarR: 34 };

  // branch centreline: a gentle sag through (0, 590), (540, 605), (1080, 595)
  const BR_A = 27.5 / 540;
  const BR_B = -25 / 583200;
  const branchY = (x) => 590 + BR_A * x + BR_B * x * x;
  const branchHalf = (x) => lerp(22, 18, clamp((x + 40) / 1160));

  // ---------------------------------------------------------------------------
  // small geometry helpers
  // ---------------------------------------------------------------------------

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

  const offsetPts = (pts, dx, dy) => pts.map((p) => [p[0] + dx, p[1] + dy]);

  // oval rotated by rot about its centre, n points, starting at the top and running clockwise
  function ovalPts(cx, cy, rx, ry, rot, n) {
    const out = [];
    const c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * TAU;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      out.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // leaves: elliptic blade, drawn-out tip, wavy margin, 9 looping lateral vein pairs
  // ---------------------------------------------------------------------------

  function leafGeom(bx, by, tx, ty, width, key, o = {}) {
    const len = Math.hypot(tx - bx, ty - by);
    const ux = (tx - bx) / len, uy = (ty - by) / len;
    const nx = -uy, ny = ux; // side +1
    const pet = o.pet != null ? o.pet : 36;
    const blade = len - pet;
    const bend = o.bend != null ? o.bend : 18;
    const waves = o.waves || 5;
    const r = LIB.rng(sd('leaf', key));
    const ph1 = r.range(0, TAU), ph2 = r.range(0, TAU);
    // blade half-width profile: broad elliptic body, a drawn-out acuminate tip
    const shape = (u) => {
      u = clamp(u);
      const body = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.86)), 0.66);
      return body * (1 - 0.5 * sstep(0.7, 1, u));
    };
    const bendAt = (u) => bend * 4 * u * (1 - u);
    const at = (u, v) => {
      const a = pet + u * blade;
      const w = v + bendAt(u);
      return [bx + ux * a + nx * w, by + uy * a + ny * w];
    };
    const hwAt = (u) => (width / 2) * shape(u);
    const wave = (u, side) => {
      const env = sstep(0.04, 0.18, u) * (1 - sstep(0.82, 0.97, u));
      return 4.2 * env * Math.sin(u * waves * TAU + (side > 0 ? ph1 : ph2));
    };
    const N = 72;
    const up = [], lo = [], mid = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      up.push(at(u, hwAt(u) + wave(u, 1)));
      lo.push(at(u, -(hwAt(u) * 0.95 + wave(u, -1))));
      mid.push(at(u, 0));
    }
    const outline = up.concat(lo.slice(1, N).reverse());
    const half = { 1: up.concat(mid.slice(1, N).reverse()), [-1]: lo.concat(mid.slice(1, N).reverse()) };
    // the half whose outward normal faces the lower right is the shadow half (light from the upper left)
    const shadowSide = nx + ny > 0 ? 1 : -1;
    // nine lateral pairs leaving the midrib, curving toward the tip, looping before the margin
    const veins = [];
    for (let k = 0; k < 9; k++) {
      const u0 = 0.07 + k * 0.088 + r.range(-0.008, 0.008);
      for (const side of [1, -1]) {
        const sk = side > 0 ? 1 : 0.95;
        const h = (u) => hwAt(u) * sk;
        const p0 = at(u0, 0);
        const p1 = at(u0 + 0.05, side * h(u0 + 0.05) * 0.45);
        const p2 = at(u0 + 0.12, side * h(u0 + 0.12) * 0.78);
        const p3 = at(u0 + 0.19, side * h(u0 + 0.19) * 0.86);
        const p4 = at(u0 + 0.26, side * h(u0 + 0.26) * 0.84);
        const pts = LIB.smoothPts(u0 + 0.26 < 0.99 ? [p0, p1, p2, p3, p4] : [p0, p1, p2], false, 4);
        veins.push({ side, pts, u0 });
      }
    }
    const veinAngle = (side) => {
      const v = veins.find((q) => q.side === side && q.u0 > 0.3);
      const a = v.pts[0], b = v.pts[Math.min(v.pts.length - 1, 6)];
      return Math.atan2(b[1] - a[1], b[0] - a[0]);
    };
    // gloss streak along the lit side of the midrib
    const litSide = -shadowSide;
    const sheenA = [], sheenB = [];
    for (let i = 0; i <= 40; i++) {
      const u = 0.06 + (i / 40) * 0.76;
      const env = Math.sin(Math.PI * ((u - 0.06) / 0.76));
      sheenA.push(at(u, litSide * hwAt(u) * 0.1));
      sheenB.push(at(u, litSide * hwAt(u) * (0.1 + 0.26 * Math.pow(env, 0.7))));
    }
    const sheen = sheenA.concat(sheenB.reverse());
    return {
      outline, half, mid, veins, base: [bx, by], tip: [tx, ty], stalk: [[bx, by], at(0, 0)],
      ux, uy, nx, ny, width, blade, pet, bend, hwAt, shadowSide, litSide, sheen,
      angle: { 1: veinAngle(1), [-1]: veinAngle(-1) },
      // signed across-blade coordinate in half-widths (-1..1) and along-blade u
      uv(x, y) {
        const dx = x - bx, dy = y - by;
        const u = (dx * ux + dy * uy - pet) / blade;
        const cu = clamp(u);
        const v = (dx * nx + dy * ny - bendAt(cu)) / Math.max(6, hwAt(clamp(cu, 0.02, 0.98)));
        return [u, v];
      },
      path: null,
    };
  }

  // the upper pair grows from the node at x 540, the lower pair hangs half hidden at the edges
  const LEAVES = [
    { g: leafGeom(150, 1060, 60, 1500, 200, 'll', { bend: -22, pet: 30 }), key: 'll', w: 3 },
    { g: leafGeom(935, 1085, 1020, 1520, 205, 'lr', { bend: 20, pet: 30 }), key: 'lr', w: 3 },
    { g: leafGeom(528, 592, 90, 250, 240, 'ul', { bend: 26, pet: 38 }), key: 'ul', w: 3 },
    { g: leafGeom(552, 590, 990, 230, 240, 'ur', { bend: -24, pet: 38 }), key: 'ur', w: 3 },
  ];
  for (const Lf of LEAVES) Lf.g.path = pathOf(Lf.g.outline);

  function drawLeaf(ctx, P, Lf, COL, castShadows) {
    const L = CUR;
    const g = Lf.g, key = Lf.key;
    const sh = g.shadowSide, lit = g.litSide;
    // petiole
    L.inkPath(ctx, g.stalk, { width: 13, color: P.ink, seed: sd('pet0', key), taper: [0, 3], swell: 0, wobble: 0.4 });
    L.inkPath(ctx, g.stalk, { width: 8, color: P.leafLight, seed: sd('pet', key), taper: [0, 3], swell: 0, wobble: 0.4 });
    // flat glossy upper face
    fillPoly(ctx, g.outline, P.leafCoffee);
    // gloss streak (flat leafSheen) and a brighter core
    fillPoly(ctx, g.sheen, P.leafSheen, 0.5);
    // shadow half: hatch parallel to the laterals, deepening toward the margin
    L.hatch(ctx, g.half[sh], {
      angle: g.angle[sh], spacing: 6, width: 1.6, color: P.leafDeep, alpha: 0.85, length: [12, 34], seed: sd('lh', key),
      density: (x, y) => {
        const q = g.uv(x, y);
        return 0.45 + 0.55 * sstep(0.15, 0.8, Math.abs(q[1]));
      },
    });
    // darker cross layer at the shadow margin and the base
    L.hatch(ctx, g.half[sh], {
      angle: g.angle[sh] + 1.05, spacing: 7, width: 1.3, color: COL.leafInk, alpha: 0.55, length: [10, 24], seed: sd('lh2', key),
      density: (x, y) => {
        const q = g.uv(x, y);
        return 0.9 * sstep(0.55, 0.95, Math.abs(q[1])) + 0.7 * (1 - sstep(0.02, 0.16, q[0]));
      },
    });
    // lit half: light shade only out at the margin, flat elsewhere
    L.hatch(ctx, g.half[lit], {
      angle: g.angle[lit], spacing: 11, width: 1.4, color: P.leafDeep, alpha: 0.7, length: [10, 26], seed: sd('lit', key),
      density: (x, y) => {
        const q = g.uv(x, y);
        return 0.85 * sstep(0.7, 0.98, Math.abs(q[1])) + 0.6 * sstep(0.86, 1, q[0]);
      },
    });
    if (castShadows) castShadows(g);
    // sunken laterals in leafDeep, a pale lit lip along each on the lit half
    for (let k = 0; k < g.veins.length; k++) {
      const v = g.veins[k];
      L.inkPath(ctx, v.pts, { width: 1.8, color: P.leafDeep, alpha: 0.95, seed: sd('lv', key, k), taper: [2, 16], wobble: 0.5, step: 3 });
      if (v.side === lit && k % 2 === 0) {
        L.inkPath(ctx, offsetPts(v.pts.slice(0, Math.ceil(v.pts.length * 0.6)), -1.6, -1.6), {
          width: 1.1, color: P.leafSheen, alpha: 0.6, seed: sd('lvl', key, k), taper: [3, 10], wobble: 0.4, step: 3,
        });
      }
    }
    // midrib 2.5 px leafDeep, with a pale raised core
    L.inkPath(ctx, g.mid, { width: 4, color: P.leafLight, alpha: 0.8, seed: sd('midc', key), taper: [2, 70], wobble: 0.6 });
    L.inkPath(ctx, g.mid, { width: 2.5, color: P.leafDeep, seed: sd('mid', key), taper: [4, 90], wobble: 0.7 });
    // outline, 3 px ink with the wavy margin
    L.inkPath(ctx, g.outline, { closed: true, width: Lf.w, color: P.ink, seed: sd('lo', key), wobble: 1.2 });
  }

  // ---------------------------------------------------------------------------
  // cherries
  // ---------------------------------------------------------------------------

  // the node the cluster grows from
  const NODE = [540, 602];

  function cherryDef(x, y, r, kind, key) {
    const dx = x - NODE[0], dy = y - NODE[1];
    // the tip points away from the node, half way between hanging straight down and the radial direction
    const rot = 0.5 * (Math.atan2(dy, dx) - Math.PI / 2);
    return { x, y, rx: r, ry: r * 1.1, rot, kind, key };
  }

  const HERO_BASE = { x: 540, y: 900, rx: 260, ry: 290, rot: 0, kind: 'red', key: 'hero' };
  const BACK = [cherryDef(120, 1000, 110, 'green', 'cg'), cherryDef(980, 1040, 120, 'deep', 'cd')];
  const MIDC = [cherryDef(230, 760, 130, 'yellow', 'cy'), cherryDef(850, 760, 140, 'red', 'cr')];

  function cherryColours(P, kind) {
    switch (kind) {
      case 'green':
        return { base: P.cherryGreen, deep: LIB.mix(P.cherryGreen, P.leafDeep, 0.72), light: LIB.mix(P.cherryGreen, P.white, 0.55), ink: LIB.mix(P.leafDeep, P.ink, 0.4) };
      case 'yellow':
        return { base: P.cherryYellow, deep: LIB.mix(P.cherryYellow, P.ochre, 0.85), light: LIB.mix(P.cherryYellow, P.white, 0.6), ink: LIB.mix(P.ochre, P.ink, 0.45) };
      case 'deep':
        return { base: P.cherryDeep, deep: LIB.mix(P.cherryDeep, P.ink, 0.55), light: LIB.mix(P.cherryDeep, P.cherryLight, 0.55), ink: P.ink };
      default:
        return { base: P.cherryRed, deep: P.cherryDeep, light: P.cherryLight, ink: LIB.mix(P.cherryDeep, P.ink, 0.5) };
    }
  }

  // local frame of an oval cherry: (lx, ly) in radii, 0 at the centre
  function localOf(c, x, y) {
    const dx = x - c.x, dy = y - c.y;
    const cs = Math.cos(-c.rot), sn = Math.sin(-c.rot);
    return [(dx * cs - dy * sn) / c.rx, (dx * sn + dy * cs) / c.ry];
  }

  // shadow tone on a sphere lit from the upper left, with a pale reflected rim on the lower right
  function sphereTone(lx, ly) {
    const rr = Math.hypot(lx, ly);
    const d = lx * 0.62 + ly * 0.78;
    return sstep(-0.25, 0.75, d) * (1 - 0.45 * sstep(0.9, 1.0, rr));
  }

  function toLocalPt(c, lx, ly) {
    const cs = Math.cos(c.rot), sn = Math.sin(c.rot);
    const x = lx * c.rx, y = ly * c.ry;
    return [c.x + x * cs - y * sn, c.y + x * sn + y * cs];
  }

  function drawCherry(ctx, P, c, o) {
    const L = CUR;
    const col = cherryColours(P, c.kind);
    const hero = !!o.hero;
    const key = c.key;
    const pts = ovalPts(c.x, c.y, c.rx, c.ry, c.rot, hero ? 120 : 84);
    fillPoly(ctx, pts, col.base);
    // shadow side, lower right: 8 px then 5 px, a 105-degree cross layer in the deepest part
    const tone = (x, y) => {
      const q = localOf(c, x, y);
      return sphereTone(q[0], q[1]);
    };
    L.hatch(ctx, pts, { angle: -Math.PI / 4, spacing: 8, width: hero ? 2 : 1.7, color: col.deep, alpha: 0.95, length: hero ? [18, 60] : [12, 36], seed: sd('ch1', key), density: (x, y) => clamp(tone(x, y) * 2.4) });
    L.hatch(ctx, pts, { angle: -Math.PI / 4 + 0.06, spacing: 5, width: hero ? 1.8 : 1.5, color: col.deep, alpha: 0.95, length: hero ? [14, 44] : [10, 28], seed: sd('ch2', key), density: (x, y) => sstep(0.2, 0.6, tone(x, y)) });
    L.hatch(ctx, pts, { angle: -Math.PI / 4 - Math.PI / 3, spacing: 7, width: 1.5, color: col.deep, alpha: 0.9, length: hero ? [10, 30] : [8, 20], seed: sd('ch3', key), density: (x, y) => sstep(0.4, 0.75, tone(x, y)) });
    L.hatch(ctx, pts, { angle: -Math.PI / 4 + 0.3, spacing: 6, width: 1.3, color: col.ink, alpha: 0.55, length: hero ? [10, 26] : [6, 16], seed: sd('ch4', key), density: (x, y) => sstep(0.5, 0.85, tone(x, y)) });
    // contour strokes that follow the round form on the shadow half (curved, perpendicular to the axis)
    {
      const cp = new Path2D();
      const rows = hero ? 15 : 8;
      for (let k = 0; k < rows; k++) {
        const ly = -0.25 + (k / (rows - 1)) * 1.05;
        const w = Math.sqrt(Math.max(0, 1 - ly * ly));
        const a0 = 0.25 + 0.15 * L.h3(k, 3, sd('ct', key) & 0xffff);
        const s0 = toLocalPt(c, w * a0, ly);
        const s1 = toLocalPt(c, w * 0.66, ly + 0.06 * w);
        const s2 = toLocalPt(c, w * 0.9, ly + 0.02);
        cp.moveTo(s0[0], s0[1]);
        cp.quadraticCurveTo(s1[0], s1[1], s2[0], s2[1]);
      }
      ctx.save();
      ctx.clip(pathOf(pts));
      strokePath(ctx, cp, col.deep, 0.5, 1.3);
      ctx.restore();
    }
    // skin texture: sparse fine pores on the lit side
    L.stipple(ctx, pts, { spacing: hero ? 13 : 12, r: [1.0, 1.4], color: col.deep, alpha: 0.45, seed: sd('pore', key), density: (x, y) => 0.5 * (1 - tone(x, y)) });
    // gloss crescent between 200 and 250 degrees, inset (40 px on the hero)
    {
      const inset = hero ? 40 : 0.16 * c.rx;
      const A = [], B = [];
      const n = 24;
      const ca = Math.cos(c.rot), sa = Math.sin(c.rot);
      const local = (ang, d) => {
        const x = Math.cos(ang) * (c.rx - d), y = Math.sin(ang) * (c.ry - d);
        return [c.x + x * ca - y * sa, c.y + x * sa + y * ca];
      };
      const thick = hero ? 34 : 0.13 * c.rx;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const ang = (200 + 50 * u) * DEG;
        const w = Math.sin(Math.PI * u);
        A.push(local(ang, inset));
        B.push(local(ang, inset + thick * Math.pow(w, 0.8)));
      }
      const cres = A.concat(B.reverse());
      fillPoly(ctx, cres, col.light);
      // a white core streak and a pinpoint highlight
      const core = [];
      for (let i = 0; i <= 16; i++) {
        const u = 0.15 + (i / 16) * 0.6;
        core.push(local((200 + 50 * u) * DEG, inset + thick * 0.3));
      }
      L.inkPath(ctx, core, { width: hero ? 7 : 4, color: P.white, alpha: 0.9, seed: sd('core', key), taper: [10, 16], wobble: 0.5 });
      const dot = local(255 * DEG, inset + thick * 1.5);
      ctx.beginPath();
      ctx.arc(dot[0], dot[1], hero ? 7 : 4, 0, TAU);
      ctx.fillStyle = P.white;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
      L.inkPath(ctx, cres, { closed: true, width: 1.2, color: col.deep, alpha: 0.35, seed: sd('cresl', key), wobble: 0.5 });
    }
    // calyx scar at the tip: a dark disc with a five-point star scar and a raised rim
    {
      let sx, sy, sr;
      if (hero) {
        sx = G2.scarX - G2.x + c.x;
        sy = G2.scarY - G2.y + c.y;
        sr = G2.scarR;
      } else {
        const p = toLocalPt(c, 0, 0.9);
        sx = p[0];
        sy = p[1];
        sr = c.rx * 0.13;
      }
      const ry = sr * 0.72;
      const rimPts = ovalPts(sx, sy, sr + 6, ry + 5, hero ? 0 : c.rot, 36);
      fillPoly(ctx, rimPts, col.deep, 0.9);
      const disc = ovalPts(sx, sy, sr, ry, hero ? 0 : c.rot, 36);
      L.inkPath(ctx, disc, { closed: true, width: hero ? 2.4 : 1.8, color: P.ink, fill: LIB.mix(P.ink, col.deep, 0.25), seed: sd('scar', key), wobble: 0.4 });
      const star = new Path2D();
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k / 5) * TAU + (hero ? 0.2 : c.rot);
        star.moveTo(sx, sy);
        star.lineTo(sx + Math.cos(a) * sr * 0.72, sy + Math.sin(a) * ry * 0.72);
      }
      strokePath(ctx, star, col.deep, 1, hero ? 3 : 2);
      ctx.beginPath();
      ctx.arc(sx, sy, hero ? 5 : 3, 0, TAU);
      ctx.fillStyle = col.light;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // deep red: a few soft wrinkles of a cherry a day past ripe
    if (c.kind === 'deep') {
      for (let k = 0; k < 3; k++) {
        const a = toLocalPt(c, -0.3 + k * 0.25, -0.1 + k * 0.18), b = toLocalPt(c, 0.05 + k * 0.25, 0.1 + k * 0.2), m = toLocalPt(c, -0.1 + k * 0.25, 0.08 + k * 0.18);
        L.inkPath(ctx, [a, m, b], { width: 1.6, color: col.ink, alpha: 0.6, seed: sd('wr', k), taper: [6, 6], wobble: 0.5 });
      }
    }
    // outline
    L.inkPath(ctx, pts, { closed: true, width: hero ? 5 : 3.4, color: P.ink, seed: sd('co', key), wobble: hero ? 1.4 : 1, double: hero ? { alpha: 0.4, width: 0.3 } : false });
  }

  // ---------------------------------------------------------------------------
  // branch
  // ---------------------------------------------------------------------------

  const BRANCH = (() => {
    const top = [], bot = [], mid = [];
    for (let x = -60; x <= 1140; x += 12) {
      const y = branchY(x), h = branchHalf(x);
      // the node swells a little where the leaf pair leaves it
      const sw = 4 * Math.exp(-((x - 540) * (x - 540)) / (2 * 28 * 28));
      top.push([x, y - h - sw]);
      bot.push([x, y + h + sw]);
      mid.push([x, y]);
    }
    const outline = top.concat(bot.slice().reverse());
    const r = LIB.rng(sd('lent'));
    const lent = [];
    for (let i = 0; i < 34; i++) {
      const x = r.range(-20, 1100);
      if (Math.abs(x - 540) < 40) continue;
      const v = r.range(-0.75, 0.6);
      lent.push({ x, y: branchY(x) + v * branchHalf(x), w: r.range(3, 7), h: r.range(1.3, 2.2) });
    }
    // fine lengthwise bark streaks
    const streaks = [];
    for (let i = 0; i < 46; i++) {
      const x0 = r.range(-60, 1100), l = r.range(40, 140), v = r.range(-0.7, 0.85);
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const x = x0 + (k / 6) * l;
        pts.push([x, branchY(x) + v * branchHalf(x) + r.range(-0.6, 0.6)]);
      }
      streaks.push(pts);
    }
    return { top, bot, mid, outline, lent, streaks };
  })();

  function drawBranch(ctx, P) {
    const L = CUR;
    const B = BRANCH;
    fillPoly(ctx, B.outline, P.bark);
    // lengthwise hatching on the lower (shadow) half
    L.hatch(ctx, B.outline, {
      angle: -0.02, spacing: 4.5, width: 1.4, color: P.barkDeep, alpha: 0.9, length: [20, 70], gap: [3, 10], seed: sd('brh'),
      density: (x, y) => sstep(-0.15, 0.7, (y - branchY(x)) / branchHalf(x)),
    });
    L.hatch(ctx, B.outline, {
      angle: 0.02, spacing: 6, width: 1.2, color: P.ink, alpha: 0.55, length: [16, 50], gap: [4, 12], seed: sd('brh2'),
      density: (x, y) => sstep(0.45, 0.95, (y - branchY(x)) / branchHalf(x)),
    });
    for (let i = 0; i < B.streaks.length; i++) {
      L.inkPath(ctx, B.streaks[i], { width: 1.2, color: P.barkDeep, alpha: 0.75, seed: sd('bs', i), taper: [8, 12], wobble: 0.3 });
    }
    // lenticels: pale horizontal flecks with a soft rim
    const lp = new Path2D();
    for (const q of B.lent) {
      lp.moveTo(q.x + q.w, q.y);
      lp.ellipse(q.x, q.y, q.w, q.h, 0, 0, TAU);
    }
    ctx.fillStyle = P.tan;
    ctx.globalAlpha = 0.9;
    ctx.fill(lp);
    ctx.globalAlpha = 1;
    strokePath(ctx, lp, P.barkDeep, 0.7, 0.9);
    // a lit lip along the top edge
    L.inkPath(ctx, offsetPts(B.top, 0, 4), { width: 2, color: P.tan, alpha: 0.7, seed: sd('blip'), taper: [0, 0], wobble: 0.8, step: 4 });
    // node ring and the small triangular interpetiolar stipules above and below
    const ny = branchY(540);
    L.inkPath(ctx, [[524, ny - 25], [520, ny], [525, ny + 25]], { width: 2, color: P.barkDeep, seed: sd('nr1'), taper: [3, 3], wobble: 0.3 });
    L.inkPath(ctx, [[557, ny - 25], [561, ny], [556, ny + 25]], { width: 2, color: P.barkDeep, seed: sd('nr2'), taper: [3, 3], wobble: 0.3 });
    for (const s of [-1, 1]) {
      const st = [[528, ny + s * 22], [540, ny + s * 44], [552, ny + s * 22]];
      L.inkPath(ctx, st, { closed: true, width: 1.8, color: P.ink, fill: P.leafLight, seed: sd('stip', s), wobble: 0.3, taper: [2, 4] });
    }
    // outline: two edges, 3 px
    L.inkPath(ctx, B.top, { width: 3, color: P.ink, seed: sd('bt'), taper: [0, 0], wobble: 1.2, step: 4 });
    L.inkPath(ctx, B.bot, { width: 3.4, color: P.ink, seed: sd('bb'), taper: [0, 0], wobble: 1.2, step: 4 });
  }

  // short pedicel stubs from the branch into each cherry's shoulder
  function drawStalk(ctx, P, c, dx, dy, k) {
    const top = toLocalPt(c, 0, -0.92);
    const bx = lerp(top[0], NODE[0], 0.18), by = branchY(bx) + 12;
    const pts = [[bx, by], [lerp(bx, top[0] + dx, 0.5) + 3, lerp(by, top[1] + dy, 0.5)], [top[0] + dx, top[1] + dy]];
    LIB.inkPath(ctx, pts, { width: 11, color: P.ink, seed: sd('st0', k), taper: [2, 2], swell: 0, wobble: 0.3 });
    LIB.inkPath(ctx, pts, { width: 6.5, color: P.leafLight, seed: sd('st1', k), taper: [2, 2], swell: 0, wobble: 0.3 });
  }

  // ---------------------------------------------------------------------------
  // a lower lateral twig below the cluster (scenery, under the Shorts caption band): a leaf pair and a
  // young green cluster at its node, so the tall frame stays dense to the bottom edge
  // ---------------------------------------------------------------------------

  const twigY = (x) => 1790 - 0.16 * x + 0.00004 * (x - 540) * (x - 540);
  const TWIG = (() => {
    const top = [], bot = [];
    for (let x = -60; x <= 1140; x += 14) {
      const y = twigY(x), h = lerp(15, 11, clamp((x + 60) / 1200));
      top.push([x, y - h]);
      bot.push([x, y + h]);
    }
    return { top, bot, outline: top.concat(bot.slice().reverse()) };
  })();
  const TNODE = [620, twigY(620)];
  const TLEAVES = [
    { g: leafGeom(608, TNODE[1] - 6, 250, 1560, 190, 'tl', { bend: 18, pet: 28 }), key: 'tl', w: 2.6 },
    { g: leafGeom(632, TNODE[1] + 6, 990, 1890, 190, 'tr', { bend: -16, pet: 28 }), key: 'tr', w: 2.6 },
  ];
  for (const Lf of TLEAVES) Lf.g.path = pathOf(Lf.g.outline);
  const TCHER = [
    { x: 588, y: 1752, rx: 46, ry: 51, rot: 0.35, kind: 'green', key: 't1' },
    { x: 668, y: 1745, rx: 50, ry: 55, rot: -0.3, kind: 'green', key: 't2' },
    { x: 626, y: 1790, rx: 52, ry: 57, rot: 0.05, kind: 'yellow', key: 't3' },
  ];

  function drawTwig(ctx, P, COL) {
    const L = CUR;
    fillPoly(ctx, TWIG.outline, P.bark);
    L.hatch(ctx, TWIG.outline, {
      angle: -0.16, spacing: 4.5, width: 1.3, color: P.barkDeep, alpha: 0.9, length: [16, 50], gap: [3, 10], seed: sd('twh'),
      density: (x, y) => sstep(-0.3, 0.8, (y - twigY(x)) / 13),
    });
    L.inkPath(ctx, TWIG.top, { width: 2.6, color: P.ink, seed: sd('twt'), taper: [0, 0], wobble: 1, step: 4 });
    L.inkPath(ctx, TWIG.bot, { width: 3, color: P.ink, seed: sd('twb'), taper: [0, 0], wobble: 1, step: 4 });
    for (const Lf of TLEAVES) drawLeaf(ctx, P, Lf, COL, null);
    for (const c of TCHER) drawCherry(ctx, P, c, {});
  }

  // ---------------------------------------------------------------------------
  // the static plate: construction, twig, both leaf pairs and the branch. None of it moves, so it is
  // drawn once per boil phase (a three-drawing boil cycle, still re-wobbling every 1/12 s) into a canvas
  // at 1.06x so the push-in never upsamples it.
  // ---------------------------------------------------------------------------

  let CUR = LIB; // the lib the drawing helpers use: LIB, or a wrapper that pins the boil drawing
  function boilLib(b) {
    const o = {};
    for (const k of Object.keys(LIB)) o[k] = LIB[k];
    const pin = (fn) => (ctx, a, opts) => fn(ctx, a, Object.assign({}, opts, { boil: b }));
    o.inkPath = pin(LIB.inkPath);
    o.hatch = pin(LIB.hatch);
    o.crossHatch = pin(LIB.crossHatch);
    o.stipple = pin(LIB.stipple);
    return o;
  }

  function drawPlate(ctx, L, P, COL) {
    // ---- 2 construction lines --------------------------------------------------
    {
      const cons = { width: 1.5, color: P.inkFaint, alpha: 0.3, taper: [0, 0], wobble: 1.5, smooth: false, step: 8 };
      L.inkPath(ctx, [[540, -60], [540, 1980]], Object.assign({ seed: sd('axis') }, cons));
      L.inkPath(ctx, [[-40, 900], [1120, 900]], Object.assign({ seed: sd('hz') }, cons));
      L.guideCircle(ctx, 540, 900, 420, { color: P.inkFaint, alpha: 0.28, width: 1.5 });
      L.guideCircle(ctx, 540, 900, 560, { color: P.inkFaint, alpha: 0.18, width: 1.5, dash: [3, 8] });
      const deg = new Path2D();
      for (let a = 0; a < 360; a += 10) {
        const c = Math.cos(a * DEG), s = Math.sin(a * DEG);
        const l = a % 30 === 0 ? 16 : 8;
        deg.moveTo(540 + c * 420, 900 + s * 420);
        deg.lineTo(540 + c * (420 + l), 900 + s * (420 + l));
      }
      strokePath(ctx, deg, P.inkFaint, 0.45, 1.5);
      const marks = new Path2D();
      for (const [x, y] of [[230, 760], [850, 760], [120, 1000], [980, 1040], [540, 602], [540, 610], [540, 1190], [280, 900], [800, 900]]) {
        marks.moveTo(x - 9, y);
        marks.lineTo(x + 9, y);
        marks.moveTo(x, y - 9);
        marks.lineTo(x, y + 9);
      }
      strokePath(ctx, marks, P.inkFaint, 0.55, 1.5);
      // rays from the node through each cluster cherry
      const rays = new Path2D();
      for (const c of BACK.concat(MIDC)) {
        const a = Math.atan2(c.y - NODE[1], c.x - NODE[0]);
        rays.moveTo(NODE[0] + Math.cos(a) * 60, NODE[1] + Math.sin(a) * 60);
        rays.lineTo(NODE[0] + Math.cos(a) * 760, NODE[1] + Math.sin(a) * 760);
      }
      strokePath(ctx, rays, P.inkFaint, 0.22, 1.5, [10, 8]);
    }

    // ---- 2b the lower twig ---------------------------------------------------------
    drawTwig(ctx, P, COL);

    // ---- 3 lower leaf pair (behind the edge cherries) ---------------------------
    const backPos = BACK;

    const castOn = (g, list) => {
      // cherry shadows fall down and right onto the blade (light from the upper left)
      ctx.save();
      ctx.clip(g.path);
      for (const c of list) {
        const s = ovalPts(c.x + c.rx * 0.18, c.y + c.ry * 0.16, c.rx, c.ry, c.rot, 48);
        L.hatch(ctx, s, { angle: -Math.PI / 4 - Math.PI / 3, spacing: 5, width: 1.3, color: P.ink, alpha: 0.5, length: [10, 26], seed: sd('lcs', c.key, g.width) });
      }
      ctx.restore();
    };
    drawLeaf(ctx, P, LEAVES[0], COL, (g) => castOn(g, [backPos[0]]));
    drawLeaf(ctx, P, LEAVES[1], COL, (g) => castOn(g, [backPos[1]]));

    // ---- 4 upper opposite leaf pair ---------------------------------------------
    drawLeaf(ctx, P, LEAVES[2], COL, (g) => {
      // the branch casts a strip of shade across the leaf base
      ctx.save();
      ctx.clip(g.path);
      L.hatch(ctx, offsetPts(BRANCH.outline, 14, 18), { bounds: { x: 0, y: 560, w: 1080, h: 100 }, angle: -Math.PI / 4, spacing: 4.5, width: 1.3, color: P.ink, alpha: 0.5, length: [8, 20], seed: sd('brs', 'l') });
      ctx.restore();
    });
    drawLeaf(ctx, P, LEAVES[3], COL, (g) => {
      ctx.save();
      ctx.clip(g.path);
      L.hatch(ctx, offsetPts(BRANCH.outline, 14, 18), { bounds: { x: 0, y: 560, w: 1080, h: 100 }, angle: -Math.PI / 4, spacing: 4.5, width: 1.3, color: P.ink, alpha: 0.5, length: [8, 20], seed: sd('brs', 'r') });
      ctx.restore();
    });

    // ---- 5 branch ------------------------------------------------------------------
    drawBranch(ctx, P);
  }

  function plate(P, COL, b) {
    const S = FILM.S || 1;
    const k = 1.06 * S;
    return LIB.cached(['hero-cherries-plate', b, S].join('|'), () => {
      const w = Math.ceil(1080 * k), h = Math.ceil(1920 * k);
      let c;
      if (FILM.makeCanvas) c = FILM.makeCanvas(w, h);
      else {
        c = document.createElement('canvas');
        c.width = w;
        c.height = h;
      }
      const g = c.getContext('2d');
      g.scale(w / 1080, h / 1920);
      const prev = CUR;
      CUR = boilLib(b);
      try {
        drawPlate(g, CUR, P, COL);
      } finally {
        CUR = prev;
      }
      return c;
    });
  }

  // a cherry drawn once per boil phase into a sprite (1.06x), then placed at its swayed / bobbed offset
  function cherrySprite(P, c, hero, b) {
    const S = FILM.S || 1;
    const k = 1.06 * S;
    const m = 24;
    const ext = Math.max(c.rx, c.ry) + m + (hero ? 16 : 6);
    const x0 = c.x - ext, y0 = c.y - ext, side = ext * 2;
    const img = LIB.cached(['hero-cherries-cherry', c.key, b, S].join('|'), () => {
      const w = Math.ceil(side * k);
      let cv;
      if (FILM.makeCanvas) cv = FILM.makeCanvas(w, w);
      else {
        cv = document.createElement('canvas');
        cv.width = w;
        cv.height = w;
      }
      const g = cv.getContext('2d');
      g.scale(w / side, w / side);
      g.translate(-x0, -y0);
      const prev = CUR;
      CUR = boilLib(b);
      try {
        drawCherry(g, P, c, { hero });
      } finally {
        CUR = prev;
      }
      return cv;
    });
    return { img, x0, y0, side };
  }

  function placeCherry(ctx, P, base, pos, hero, b) {
    const sp = cherrySprite(P, base, hero, b);
    ctx.drawImage(sp.img, sp.x0 + (pos.x - base.x), sp.y0 + (pos.y - base.y), sp.side, sp.side);
  }

  // ---------------------------------------------------------------------------
  // scene
  // ---------------------------------------------------------------------------

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib;
      const P = L.pal;
      const E = L.ease;
      const dur = info.dur;
      let t = clamp(tIn, 0, dur);
      const tFrame = Math.round(t * 24) / 24;
      if (Math.abs(t - tFrame) < 1e-4) t = tFrame + 1e-7;
      const tw = L.onTwos(t);
      const bi = L.boil(info.T);

      const drawing = (a) => Math.floor((t - a) * 12 + 1e-6);
      const hit = (a, frames, e, lead = 1) => {
        if (t < a) return 0;
        const u = clamp((t - a) / (frames * FR) + lead / frames);
        return e ? e(u) : u;
      };

      const COL = { leafInk: L.mix(P.leafDeep, P.ink, 0.5) };

      // ---- motion (objects on twos) -------------------------------------------
      // cluster sway: +-4 px, zero at T 0 and back to zero by beat 2, so frame 0 and the end sit on G2
      const swayU = clamp(tw / B_BOB);
      const sway = (ph) => (tw < B_BOB ? 4 * Math.sin(TAU * swayU + ph) * Math.sin(Math.PI * swayU) : 0);
      // hero bob on beat 2: three drawings, drop 10 px, overshoot back, settle
      const bobK = t >= B_BOB ? drawing(B_BOB) : -1;
      const heroBob = bobK === 0 ? 10 : bobK === 1 ? -2 : 0;
      const sideBob = bobK === 1 ? 4 : bobK === 2 ? -1 : 0;
      const hx = sway(0), hy = heroBob + 0.4 * sway(1.3);

      // ---- 1 stripes ------------------------------------------------------------
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeSpring], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') });

      // camera: push-in 1.00 to 1.06 holding world (540, 900) on screen (540, 900)
      const zoom = 1 + 0.06 * E.inOutSine(t / dur);
      const cam = { x: 540, y: 900 + 60 / zoom, zoom };

      L.camera(ctx, cam, (ctx) => {
        // ---- 2 to 5 the static plate: construction, twig, leaves, branch ----------------
        const bp = ((bi % 3) + 3) % 3;
        ctx.drawImage(plate(P, COL, bp), 0, 0, 1080, 1920);

        const backPos = BACK.map((c, i) => Object.assign({}, c, { x: c.x + sway(2 + i), y: c.y + 0.5 * sway(3 + i) + (i ? sideBob : 0) }));
        const midPos = MIDC.map((c, i) => Object.assign({}, c, { x: c.x + sway(4 + i * 1.7), y: c.y + 0.5 * sway(5 + i) + sideBob }));
        const heroC = { x: G2.x + hx, y: G2.y + hy, rx: G2.rx, ry: G2.ry, rot: 0, kind: 'red', key: 'hero' };

        // ---- 6 back cherries, then the shoulder cherries -----------------------------
        for (let i = 0; i < BACK.length; i++) placeCherry(ctx, P, BACK[i], backPos[i], false, bp);
        // the shoulder cherries' shadows on the back ones
        {
          const backPath = new Path2D();
          for (const c of backPos) trace(backPath, ovalPts(c.x, c.y, c.rx, c.ry, c.rot, 48), true);
          ctx.save();
          ctx.clip(backPath);
          for (const c of midPos) {
            L.hatch(ctx, ovalPts(c.x + 26, c.y + 34, c.rx, c.ry, c.rot, 48), { angle: -Math.PI / 4, spacing: 4, width: 1.3, color: P.ink, alpha: 0.55, length: [8, 22], seed: sd('mcs', c.key) });
          }
          ctx.restore();
        }
        drawStalk(ctx, P, midPos[0], 0, 0, 0);
        drawStalk(ctx, P, midPos[1], 0, 0, 1);
        for (let i = 0; i < MIDC.length; i++) placeCherry(ctx, P, MIDC[i], midPos[i], false, bp);

        // ---- 7 the hero's cast shadow on the cherries behind it ----------------------
        {
          const behind = new Path2D();
          for (const c of midPos.concat(backPos)) trace(behind, ovalPts(c.x, c.y, c.rx, c.ry, c.rot, 48), true);
          ctx.save();
          ctx.clip(behind);
          L.crossHatch(ctx, ovalPts(heroC.x + 34, heroC.y + 40, G2.rx, G2.ry, 0, 72), { bounds: { x: 300, y: 600, w: 780, h: 700 }, spacing: 4.5, width: 1.3, color: P.ink, alpha: 0.55, layers: 2, length: [8, 24], seed: sd('hcs') });
          ctx.restore();
        }

        // ---- 8 hero cherry on G2 ---------------------------------------------------------
        placeCherry(ctx, P, HERO_BASE, heroC, true, bp);

        // dew drop at (650, 760), r 18: it trembles on twos
        {
          const j1 = (L.h3(drawing(0), 5, 77) - 0.5) * 2, j2 = (L.h3(drawing(0), 9, 78) - 0.5) * 2;
          const dx = 650 + hx + j1 * 0.9, dy = 760 + hy + j2 * 0.9, dr = 18 + j1 * 0.5;
          L.hatch(ctx, ovalPts(dx + 9, dy + 10, dr + 1, dr * 0.85, 0, 24), { angle: -Math.PI / 4, spacing: 3, width: 1.3, color: P.cherryDeep, alpha: 0.85, seed: sd('dewsh') });
          L.inkPath(ctx, ovalPts(dx, dy, dr, dr * 1.04, 0, 28), { closed: true, width: 2.2, color: P.ink, fill: P.white, seed: sd('dew'), wobble: 0.3 });
          // the drop refracts the red skin on its lower right
          L.hatch(ctx, ovalPts(dx, dy, dr - 2, dr - 2, 0, 24), { angle: -Math.PI / 4 + 1.05, spacing: 2.6, width: 1.1, color: P.cherryLight, alpha: 0.95, length: [4, 12], overshoot: 0, inset: 1, seed: sd('dewin'), density: (x, y) => sstep(-2, 9, (x - dx) * 0.7 + (y - dy) * 0.7) });
          ctx.beginPath();
          ctx.arc(dx - 1, dy - 1, dr - 6, Math.PI * 1.08, Math.PI * 1.5);
          ctx.strokeStyle = P.white;
          ctx.lineWidth = 3.2;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(dx - 6, dy - 7, 2.2, 0, TAU);
          ctx.fillStyle = P.ink;
          ctx.globalAlpha = 0.6;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // ---- 9 overlays (24 fps) -----------------------------------------------------------
        // annYellow attention ring around the hero, r 330, drawing on from 12 o'clock clockwise
        const kRing = hit(B_BOB, 6, E.outExpo);
        if (kRing > 0) {
          const cx = 540 + hx, cy = 900 + hy;
          const a0 = -Math.PI / 2, a1 = a0 + TAU * kRing;
          ctx.save();
          ctx.lineCap = 'round';
          ctx.strokeStyle = P.ink;
          ctx.globalAlpha = 0.22;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(cx, cy, 330, a0, a1);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = P.annYellow;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, 330, a0, a1);
          ctx.stroke();
          // four diagonal ticks on the ring once it closes
          const tk = new Path2D();
          for (let q = 0; q < 4; q++) {
            const a = Math.PI / 4 + (q * Math.PI) / 2;
            if (((a - a0 + TAU) % TAU) / TAU > kRing) continue;
            tk.moveTo(cx + Math.cos(a) * 320, cy + Math.sin(a) * 320);
            tk.lineTo(cx + Math.cos(a) * 342, cy + Math.sin(a) * 342);
          }
          ctx.stroke(tk);
          ctx.beginPath();
          ctx.arc(cx, cy - 330, 4.5, 0, TAU);
          ctx.fillStyle = P.annYellow;
          ctx.fill();
          ctx.restore();
        }
        // annBlue ruler at x 830 from y 610 to 1190 measuring the hero, long ticks at both ends
        const kRul = hit(B_RULER, 6, E.outExpo);
        if (kRul > 0) {
          const x = 830, y0 = 610, y1 = 1190;
          const ye = lerp(y0, y1, kRul);
          const p = new Path2D();
          p.moveTo(x, y0);
          p.lineTo(x, ye);
          for (let k = 0; k <= 20; k++) {
            const y = lerp(y0, y1, k / 20);
            if (y > ye + 0.5) break;
            const l = k === 0 || k === 20 ? 28 : k % 10 === 0 ? 20 : 12;
            p.moveTo(x, y);
            p.lineTo(x + l, y);
          }
          // dotted leaders from the cherry's top and bottom to the ruler ends
          const dots = new Path2D();
          for (const [yy, ok] of [[y0, true], [y1, kRul >= 1]]) {
            if (!ok) continue;
            for (let xx = 552; xx < x - 8; xx += 12) {
              dots.moveTo(xx + 1.5, yy);
              dots.arc(xx, yy, 1.5, 0, TAU);
            }
          }
          ctx.save();
          strokePath(ctx, p, P.ink, 0.2, 5);
          strokePath(ctx, p, P.annBlue, 1, 2);
          ctx.fillStyle = P.annBlue;
          ctx.globalAlpha = 0.9;
          ctx.fill(dots);
          ctx.restore();
        }
      });
    },
  });
})();
