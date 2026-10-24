// 03 seedling : Soldier, then butterfly (illustrated, global T 3.75 to 6.00)
//
// The G1 bean, inked and still in its parchment, sits on the exact G1 pixels of 02's last frame, then drops
// into a soil cutaway. The root goes down first; the hypocotyl arches up as a hook, breaks the surface on the
// beat and straightens, lifting the seed (parchment on) to the top of the stem: the "soldier" stage. On the
// next beat the parchment cracks along the crease and falls off to the right, and two round cotyledons open
// flat: the "butterfly" stage, with the first pair of true leaves just showing between them.
//
// Layers, back to front:
//   1 stripes stripeCream / stripeSpring (top 60 percent, the soil covers the rest)
//   2 construction lines in inkFaint: the stem axis, the soldier height, a height scale on the left
//   3 soil cutaway y 1180 to 1920: soil, soilDeep hatching, stones, crumbs, organic flecks, surface line
//   4 root (3 px to 1 px) with 14 root hairs and three late laterals
//   5 stem, 22 px, leafLight with a pale base, contour hatched on its shadow half
//   6 the seed: the inked G1 bean in parchment; after the split, two tumbling parchment halves and the
//     cotyledons (closed, then opening flat) with the first true-leaf pair
//   7 overlays: annBlue dashed drop line (fall) and dashed lift trajectory, annMagenta ring at the split,
//     annYellow arc annotation across the cotyledon span
//
// Beats: T 3.75 fall (9 frames, inOutCubic), T 4.125 root (outExpo, 9 frames), T 4.50 the hook breaks the
// surface, T 4.50 to 5.25 the stem rises on twos, T 5.25 parchment split + magenta ring, halves fall 9 frames,
// T 5.625 cotyledons open (popTwos), then hold with a slight sway.
(function () {
  'use strict';

  const ID = 'seedling';
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

  // ===========================================================================
  // G1 BEAN CONSTRUCTION — canonical, copied verbatim from 02-bean-blueprint.js
  // (docs/storyboard.md, Shared geometry G1).
  // ===========================================================================
  const G1 = { cx: 540, cy: 900, a: 170, b: 240, n: 2.3, taper: 0.06, rot: -15 * Math.PI / 180, N: 96 };
  const G1_COS = Math.cos(G1.rot), G1_SIN = Math.sin(G1.rot);
  function g1Rot(x, y) {
    const dx = x - G1.cx, dy = y - G1.cy;
    return [G1.cx + dx * G1_COS - dy * G1_SIN, G1.cy + dx * G1_SIN + dy * G1_COS];
  }
  function g1Unrot(x, y) {
    const dx = x - G1.cx, dy = y - G1.cy;
    return [G1.cx + dx * G1_COS + dy * G1_SIN, G1.cy - dx * G1_SIN + dy * G1_COS];
  }
  // half-width of the upright bean at height dy (pre-rotation, dy in -240..240), with the top taper
  function g1HalfWidth(dy, inset) {
    const a = G1.a - (inset || 0), b = G1.b - (inset || 0);
    const v = Math.min(1, Math.abs(dy) / b);
    const w = a * Math.pow(Math.max(0, 1 - Math.pow(v, G1.n)), 1 / G1.n);
    return w * (1 - (G1.taper * (1 - dy / G1.b)) / 2);
  }
  function g1Outline(inset, scale) {
    const a = G1.a - (inset || 0), b = G1.b - (inset || 0), s = scale || 1, e = 2 / G1.n;
    const out = [];
    for (let i = 0; i < G1.N; i++) {
      const th = -Math.PI / 2 + (i / G1.N) * Math.PI * 2;
      const c = Math.cos(th), sn = Math.sin(th);
      let dx = a * Math.sign(c) * Math.pow(Math.abs(c), e);
      const dy = b * Math.sign(sn) * Math.pow(Math.abs(sn), e);
      dx *= 1 - (G1.taper * (1 - dy / G1.b)) / 2;
      const p = g1Rot(G1.cx + dx * s, G1.cy + dy * s);
      out.push(p);
    }
    return out;
  }
  const G1_CREASE_RAW = [[548, 682], [531, 750], [536, 826], [552, 900], [547, 976], [530, 1052], [538, 1118]];
  function g1Crease() {
    return LIB.smoothPts(G1_CREASE_RAW.map((p) => g1Rot(p[0], p[1])), false, 5);
  }
  const g1CreaseWidth = (u) => 3 + 9 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.55);
  function g1Silverskin() {
    // the crease centreline between y 700 and 1100 (pre-rotation), nudged to the listed end points
    const raw = LIB.smoothPts(G1_CREASE_RAW, false, 5).filter((p) => p[1] >= 700 && p[1] <= 1100);
    raw[0] = [546, 700];
    raw[raw.length - 1] = [538, 1100];
    return raw.map((p) => g1Rot(p[0], p[1]));
  }
  const G1_EMBRYO = g1Rot(548, 1110);
  // ===================== end of the G1 construction block =====================

  // beats (shot-local seconds; the shot starts at T 3.75)
  const B_FALL = 0; // T 3.75
  const B_ROOT = 0.375; // T 4.125
  const B_HOOK = 0.5; // T 4.25: the hook forms in the soil
  const B_RISE = 0.75; // T 4.50: the hook breaks the surface
  const B_SPLIT = 1.5; // T 5.25
  const B_OPEN = 1.875; // T 5.625

  const SURF = 1180; // soil surface
  const BURY = [540, 1350]; // buried seed centre
  const S_SEED = 0.35; // seed scale once buried
  const HALF_LEN = G1.b * S_SEED; // 84 px from the seed centre to either end
  // root / shoot junction: the seed's lower tip at rest
  const J = [BURY[0] + HALF_LEN * Math.sin(15 * DEG), BURY[1] + HALF_LEN * Math.cos(15 * DEG)];
  const R_HOOK = 44;
  const LS_HOOK = J[1] - SURF - R_HOOK; // straight length when the hook apex reaches the surface
  const R_STRAIGHT = 213; // the arc radius once the stem is nearly straight (no kink under the seed)
const LS_END = J[1] - 781 - R_STRAIGHT * Math.sin(15 * DEG); // straight length at the soldier stage (seed centre (540, 700))
  const STEM_W = 22;

  // ---------------------------------------------------------------------------
  // helpers
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

  function ovalPts(cx, cy, rx, ry, rot, n) {
    const out = [];
    const c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      out.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return out;
  }

  function cum(pts) {
    const c = [0];
    for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return c;
  }

  function slicePts(pts, frac) {
    const c = cum(pts);
    const want = c[c.length - 1] * clamp(frac);
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (c[i] <= want) out.push(pts[i]);
      else {
        const u = (want - c[i - 1]) / (c[i] - c[i - 1] || 1);
        out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]);
        break;
      }
    }
    return out;
  }

  // local bean shape (upright, centred at 0,0, pre-rotation), taken from the canonical G1 outline
  const BEAN_LOCAL = (() => {
    const outline = g1Outline(0, 1).map((p) => {
      const q = g1Unrot(p[0], p[1]);
      return [q[0] - G1.cx, q[1] - G1.cy];
    });
    const crease = g1Crease().map((p) => {
      const q = g1Unrot(p[0], p[1]);
      return [q[0] - G1.cx, q[1] - G1.cy];
    });
    const silver = g1Silverskin().map((p) => {
      const q = g1Unrot(p[0], p[1]);
      return [q[0] - G1.cx, q[1] - G1.cy];
    });
    // parchment halves split along the crease: right = outline top->bottom + crease bottom->top
    const n = outline.length;
    const right = outline.slice(0, n / 2 + 1).concat(crease.slice().reverse());
    const left = outline.slice(n / 2).concat([outline[0]]).concat(crease.slice());
    // papery fibres running along the hull
    const r = LIB.rng(sd('fibres'));
    const fibres = [];
    for (let i = 0; i < 26; i++) {
      const u = r.range(-0.85, 0.85);
      const y0 = r.range(-200, 60), l = r.range(70, 170);
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const y = Math.min(225, y0 + (k / 6) * l);
        pts.push([u * g1HalfWidth(y, 14), y]);
      }
      fibres.push(pts);
    }
    return { outline, crease, silver, right, left, fibres, ccum: cum(crease) };
  })();

  function xf(pts, cx, cy, s, rot) {
    const c = Math.cos(rot), sn = Math.sin(rot);
    return pts.map((p) => [cx + (p[0] * c - p[1] * sn) * s, cy + (p[0] * sn + p[1] * c) * s]);
  }

  // ---------------------------------------------------------------------------
  // pose of the seed and stem at a drawing time tw (on twos)
  // ---------------------------------------------------------------------------

  function pose(tw, E) {
    if (tw < B_ROOT) {
      const u = E.inOutCubic(clamp((tw - B_FALL) / (B_ROOT - B_FALL)));
      return { c: [lerp(G1.cx, BURY[0], u), lerp(G1.cy, BURY[1], u)], s: lerp(1, S_SEED, u), rot: G1.rot, stem: null };
    }
    let Ls = 0, phi = -15 * DEG;
    if (tw < B_HOOK) return { c: BURY.slice(), s: S_SEED, rot: G1.rot, stem: null };
    if (tw < B_RISE) {
      const u = (tw - B_HOOK) / (B_RISE - B_HOOK);
      Ls = LS_HOOK * E.outQuad(u);
      phi = lerp(-15, 180, E.inOutQuad(u)) * DEG;
    } else {
      const u = clamp((tw - B_RISE) / (B_SPLIT - B_RISE));
      Ls = lerp(LS_HOOK, LS_END, E.outCubic(u));
      phi = lerp(180, -15, E.inOutCubic(sstep(0.15, 1, u))) * DEG;
    }
    const st = stemLine(Ls, phi);
    const hd = -Math.PI / 2 + phi;
    const end = st.pts[st.pts.length - 1];
    return { c: [end[0] + Math.cos(hd) * HALF_LEN, end[1] + Math.sin(hd) * HALF_LEN], s: S_SEED, rot: phi, stem: st, end, hd };
  }

  // stem centreline from J: straight up Ls, then an arc turning by phi (right = positive). The arc is tight
  // (R 44) while hooked and opens to R 213 as the stem straightens; the straight part leans right by the
  // arc's sideways drift so the seed lands centred on x 540.
  function stemLine(Ls, phi) {
    const R = R_HOOK + (R_STRAIGHT - R_HOOK) * (1 - sstep(0, 60 * DEG, Math.abs(phi)));
    const lean = phi < 0 ? R * (1 - Math.cos(phi)) * clamp((R - R_HOOK) / (R_STRAIGHT - R_HOOK)) : 0;
    const pts = [];
    const nS = Math.max(2, Math.ceil(Ls / 8));
    for (let i = 0; i <= nS; i++) pts.push([J[0] + (lean * i) / nS, J[1] - (Ls * i) / nS]);
    const top = pts[pts.length - 1];
    const n = Math.max(2, Math.ceil((Math.abs(phi) * R) / 6));
    for (let i = 1; i <= n; i++) {
      const a = (phi * i) / n;
      if (phi >= 0) pts.push([top[0] + R - R * Math.cos(a), top[1] - R * Math.sin(a)]);
      else pts.push([top[0] - R + R * Math.cos(a), top[1] + R * Math.sin(a)]);
    }
    return { pts };
  }

  // ---------------------------------------------------------------------------
  // geometry, built once (t-independent)
  // ---------------------------------------------------------------------------

  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const r = LIB.rng(sd('soil'));
    // soil surface: a soft irregular line
    const surf = [];
    for (let x = -40; x <= 1120; x += 10) surf.push([x, SURF + 3 * LIB.noise1(x * 0.02, sd('surf')) + 1.5 * LIB.noise1(x * 0.09, sd('surf2'))]);
    const soilPoly = surf.concat([[1120, 1960], [-40, 1960]]);
    // stones
    const stones = [];
    const spots = [[150, 1300, 46, 30], [880, 1260, 38, 26], [300, 1640, 58, 36], [820, 1580, 50, 34], [700, 1760, 34, 24], [110, 1820, 44, 30], [960, 1840, 40, 28], [420, 1270, 22, 15]];
    for (const [x, y, rx, ry] of spots) {
      const pts = [];
      const rot = r.range(-0.5, 0.5);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        const k = 1 + 0.12 * LIB.noise1(i * 0.7, sd('stone', x));
        pts.push([x + Math.cos(a + rot) * rx * k, y + Math.sin(a + rot) * ry * k]);
      }
      stones.push({ pts, x, y, rx, ry, key: x * 7 + y });
    }
    // crumbs and organic flecks
    const crumbs = [];
    for (let i = 0; i < 90; i++) crumbs.push({ x: r.range(0, 1080), y: r.range(SURF + 20, 1910), r: r.range(2, 5), pale: r() < 0.5 });
    const flecks = [];
    for (let i = 0; i < 26; i++) {
      const x = r.range(20, 1060), y = r.range(SURF + 40, 1900), a = r.range(0, TAU), l = r.range(14, 36);
      flecks.push([[x, y], [x + Math.cos(a) * l * 0.5 + r.range(-4, 4), y + Math.sin(a) * l * 0.5 + r.range(-4, 4)], [x + Math.cos(a) * l, y + Math.sin(a) * l]]);
    }
    // surface crumbs above the line
    const top = [];
    for (let i = 0; i < 40; i++) top.push({ x: r.range(0, 1080), y: SURF - r.range(1, 6), r: r.range(1.5, 3.5) });
    // strata dashes
    const strata = [];
    for (let k = 0; k < 5; k++) {
      const y0 = 1330 + k * 120 + r.range(-20, 20);
      const pts = [];
      for (let x = -20; x <= 1100; x += 40) pts.push([x, y0 + 6 * LIB.noise1(x * 0.01, sd('strata', k))]);
      strata.push(pts);
    }
    // the root: from J down to about (548, 1800), wandering
    const root = [];
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      root.push([J[0] + (548 - J[0]) * u + 12 * LIB.noise1(u * 3.2, sd('root')) * Math.sin(Math.PI * u), lerp(J[1], 1800, u)]);
    }
    const rootS = LIB.smoothPts(root, false, 4);
    const rc = cum(rootS);
    const hairs = [];
    for (let i = 0; i < 14; i++) {
      const u = 0.12 + (i / 14) * 0.8;
      const k = Math.min(rootS.length - 2, Math.floor(u * (rootS.length - 1)));
      const p = rootS[k], q = rootS[k + 1];
      const da = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const side = i % 2 ? 1 : -1;
      const a = da + side * r.range(0.9, 1.3);
      const l = r.range(14, 28) * (1 - 0.4 * u);
      hairs.push({ u, pts: [p, [p[0] + Math.cos(a) * l * 0.55, p[1] + Math.sin(a) * l * 0.55 + 2], [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l + 5]] });
    }
    const laterals = [];
    for (const [u, side, l] of [[0.3, -1, 80], [0.48, 1, 95], [0.66, -1, 70]]) {
      const k = Math.floor(u * (rootS.length - 1));
      const p = rootS[k];
      const pts = [p];
      for (let j = 1; j <= 5; j++) {
        const v = j / 5;
        pts.push([p[0] + side * l * v, p[1] + l * 0.55 * v + 8 * Math.sin(v * 3 + u * 9)]);
      }
      laterals.push({ u, pts: LIB.smoothPts(pts, false, 4) });
    }
    GEO = { surf, soilPoly, stones, crumbs, flecks, top, strata, rootS, rc, hairs, laterals };
    return GEO;
  }

  // ---------------------------------------------------------------------------
  // drawing pieces
  // ---------------------------------------------------------------------------

  function drawSoil(ctx, L, P, g, bi) {
    fillPoly(ctx, g.soilPoly, P.soil);
    // soilDeep hatching, denser with depth
    L.hatch(ctx, g.soilPoly, {
      angle: -Math.PI / 4, spacing: 7, width: 1.5, color: P.soilDeep, alpha: 0.85, length: [12, 36], seed: sd('sh1'),
      density: (x, y) => 0.35 + 0.65 * sstep(SURF, 1900, y),
    });
    L.hatch(ctx, g.soilPoly, {
      angle: -Math.PI / 4 - Math.PI / 3, spacing: 7, width: 1.3, color: P.soilDeep, alpha: 0.75, length: [10, 26], seed: sd('sh2'),
      density: (x, y) => sstep(1450, 1900, y),
    });
    // a darker band just under the surface (the lip of the cut)
    L.hatch(ctx, [[-40, SURF], [1120, SURF], [1120, SURF + 26], [-40, SURF + 26]], { angle: -0.05, spacing: 4, width: 1.3, color: P.soilDeep, alpha: 0.9, length: [20, 60], seed: sd('lip') });
    for (let k = 0; k < g.strata.length; k++) L.inkPath(ctx, g.strata[k], { width: 1.4, color: P.soilDeep, alpha: 0.7, seed: sd('str', k), taper: [30, 30], wobble: 1.5 });
    // grains
    L.stipple(ctx, g.soilPoly, { spacing: 12, r: [1.0, 2.0], color: P.tan, alpha: 0.55, seed: sd('grain'), density: 0.6 });
    L.stipple(ctx, g.soilPoly, { spacing: 10, r: [1.0, 1.8], color: P.soilDeep, alpha: 0.8, seed: sd('grain2'), density: (x, y) => 0.4 + 0.6 * sstep(SURF, 1800, y) });
    // crumbs
    const cp = new Path2D(), cd = new Path2D();
    for (const c of g.crumbs) {
      const p = c.pale ? cp : cd;
      p.moveTo(c.x + c.r, c.y);
      p.arc(c.x, c.y, c.r, 0, TAU);
    }
    ctx.fillStyle = P.tan;
    ctx.globalAlpha = 0.7;
    ctx.fill(cp);
    ctx.fillStyle = P.soilDeep;
    ctx.globalAlpha = 0.9;
    ctx.fill(cd);
    ctx.globalAlpha = 1;
    strokePath(ctx, cp, P.ink, 0.35, 0.8);
    for (let i = 0; i < g.flecks.length; i++) L.inkPath(ctx, g.flecks[i], { width: 1.8, color: P.tan, alpha: 0.75, seed: sd('fl', i), taper: [3, 5], wobble: 0.4 });
    // stones
    for (const s of g.stones) {
      fillPoly(ctx, s.pts, L.mix(P.paperDeep, P.tan, 0.4));
      L.hatch(ctx, s.pts, { angle: -Math.PI / 4, spacing: 4.5, width: 1.2, color: P.inkSoft, alpha: 0.8, length: [6, 18], seed: sd('stoneh', s.key), density: (x, y) => sstep(-0.2, 0.7, ((x - s.x) / s.rx) * 0.6 + ((y - s.y) / s.ry) * 0.8) });
      L.inkPath(ctx, s.pts, { closed: true, width: 2.4, color: P.ink, seed: sd('stone', s.key), wobble: 0.6 });
      L.inkPath(ctx, [[s.x - s.rx * 0.5, s.y - s.ry * 0.45], [s.x - s.rx * 0.1, s.y - s.ry * 0.62]], { width: 1.6, color: P.white, alpha: 0.7, seed: sd('stl', s.key), taper: [3, 3], wobble: 0.2 });
    }
    // surface line with crumbs on top
    const tp = new Path2D();
    for (const c of g.top) {
      tp.moveTo(c.x + c.r, c.y);
      tp.arc(c.x, c.y, c.r, 0, TAU);
    }
    ctx.fillStyle = P.soil;
    ctx.fill(tp);
    strokePath(ctx, tp, P.ink, 0.6, 1);
    L.inkPath(ctx, g.surf, { width: 3.4, color: P.ink, seed: sd('surfline'), taper: [0, 0], wobble: 1, step: 4 });
  }

  // a 22 px stem ribbon along a centreline, contour hatched on its shadow half
  function drawStem(ctx, L, P, pts, bi, extra) {
    if (pts.length < 2) return;
    const C = L.smoothPts(pts, false, 5);
    const n = C.length;
    if (n < 2) return;
    const left = [], right = [], nrm = [];
    for (let i = 0; i < n; i++) {
      const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const u = i / (n - 1);
      const w = (STEM_W / 2) * (1 - 0.18 * sstep(0.85, 1, u)) * (extra && extra.thin ? 0.85 : 1);
      left.push([C[i][0] + ty * w, C[i][1] - tx * w]);
      right.push([C[i][0] - ty * w, C[i][1] + tx * w]);
      nrm.push([-ty, tx]);
    }
    const poly = left.concat(right.slice().reverse());
    // the buried part is pale, yellow-green toward the base; above ground leafLight
    fillPoly(ctx, poly, P.leafLight);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-10, SURF + 2, 1100, 800);
    ctx.clip();
    fillPoly(ctx, poly, L.mix(P.leafLight, P.flowerWhite, 0.55));
    ctx.restore();
    // contour hatching across the shadow half (the side facing lower right), 7 px apart, slightly curved
    const hp = new Path2D();
    const c = cum(C);
    let next = 4;
    for (let i = 1; i < n - 1; i++) {
      if (c[i] < next) continue;
      next = c[i] + 7.5 + 1.2 * L.h3(i, 3, sd('stemh') & 0xffff);
      const nx = nrm[i][0], ny = nrm[i][1];
      const s = nx * 0.7 + ny * 0.7 >= 0 ? 1 : -1;
      const w = Math.hypot(left[i][0] - C[i][0], left[i][1] - C[i][1]);
      const j = (L.h3(i, bi, 9) - 0.5) * 0.8;
      const a0 = [C[i][0] + nx * s * (1 + j), C[i][1] + ny * s * (1 + j)];
      const a1 = [C[i][0] + nx * s * (w - 1), C[i][1] + ny * s * (w - 1)];
      const tx = C[i + 1][0] - C[i - 1][0], ty = C[i + 1][1] - C[i - 1][1], tl = Math.hypot(tx, ty) || 1;
      hp.moveTo(a0[0], a0[1]);
      hp.quadraticCurveTo((a0[0] + a1[0]) / 2 + (tx / tl) * 2.5, (a0[1] + a1[1]) / 2 + (ty / tl) * 2.5, a1[0], a1[1]);
    }
    strokePath(ctx, hp, P.leafDeep, 0.65, 1.3);
    // a pale lit stripe on the other side
    const lit = [];
    for (let i = 0; i < n; i++) {
      const nx = nrm[i][0], ny = nrm[i][1];
      const s = nx * 0.7 + ny * 0.7 >= 0 ? -1 : 1;
      lit.push([C[i][0] + nx * s * 5, C[i][1] + ny * s * 5]);
    }
    L.inkPath(ctx, lit, { width: 2.2, color: P.white, alpha: 0.5, seed: sd('stemlit'), taper: [20, 20], wobble: 0.4 });
    L.inkPath(ctx, left, { width: 3, color: P.ink, seed: sd('stemL'), taper: [0, 4], wobble: 0.7 });
    L.inkPath(ctx, right, { width: 3, color: P.ink, seed: sd('stemR'), taper: [0, 4], wobble: 0.7 });
  }

  // the seed in its parchment hull, inked: centre c, scale s, rotation rot (G1 exactly at (540, 900), 1, -15 deg)
  function drawBean(ctx, L, P, c, s, rot, key) {
    const B = BEAN_LOCAL;
    const out = xf(B.outline, c[0], c[1], s, rot);
    fillPoly(ctx, out, P.parchment);
    // tone: lower right of the dome
    const cr = Math.cos(-rot), sr = Math.sin(-rot);
    const tone = (x, y) => {
      const dx = (x - c[0]) / s, dy = (y - c[1]) / s;
      const lx = (dx * cr - dy * sr) / G1.a, ly = (dx * sr + dy * cr) / G1.b;
      // light from the upper left in frame space: rotate back
      const fx = lx * Math.cos(rot) - ly * Math.sin(rot), fy = lx * Math.sin(rot) + ly * Math.cos(rot);
      const rr = Math.hypot(lx, ly);
      return sstep(-0.2, 0.8, fx * 0.62 + fy * 0.78) * (1 - 0.4 * sstep(0.88, 1, rr));
    };
    const sp = Math.max(0.45, s);
    L.hatch(ctx, out, { angle: -Math.PI / 4, spacing: 8 * Math.max(0.7, sp), width: 1.6 * Math.max(0.75, sp), color: P.parchmentDeep, alpha: 0.95, length: [10 * sp + 4, 40 * sp + 6], seed: sd('bh1', key), density: (x, y) => clamp(tone(x, y) * 2.6) });
    L.hatch(ctx, out, { angle: -Math.PI / 4 + 0.05, spacing: 5 * Math.max(0.8, sp), width: 1.4 * Math.max(0.8, sp), color: P.parchmentDeep, alpha: 0.95, length: [8 * sp + 4, 26 * sp + 6], seed: sd('bh2', key), density: (x, y) => sstep(0.25, 0.65, tone(x, y)) });
    L.hatch(ctx, out, { angle: -Math.PI / 4 - Math.PI / 3, spacing: 7 * Math.max(0.8, sp), width: 1.2, color: P.inkSoft, alpha: 0.6, length: [6 * sp + 4, 20 * sp + 4], seed: sd('bh3', key), density: (x, y) => sstep(0.6, 0.95, tone(x, y)) });
    // papery fibres
    for (let i = 0; i < B.fibres.length; i += s < 0.6 ? 2 : 1) {
      L.inkPath(ctx, xf(B.fibres[i], c[0], c[1], s, rot), { width: 1.1 * Math.max(0.8, sp), color: P.parchmentDeep, alpha: 0.75, seed: sd('fib', i, key), taper: [10 * sp, 14 * sp], wobble: 0.4 });
    }
    // crease: a 12 px groove (beanGreenDeep through the hull) with the silverskin line inside
    const crease = xf(B.crease, c[0], c[1], s, rot);
    const groove = L.mix(P.beanGreenDeep, P.ink, 0.25);
    const n = crease.length;
    const tot = B.ccum[n - 1];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = groove;
    for (let i = 1; i < n; i++) {
      ctx.lineWidth = g1CreaseWidth(B.ccum[i] / tot) * s;
      ctx.beginPath();
      ctx.moveTo(crease[i - 1][0], crease[i - 1][1]);
      ctx.lineTo(crease[i][0], crease[i][1]);
      ctx.stroke();
    }
    ctx.restore();
    L.inkPath(ctx, xf(B.silver, c[0], c[1], s, rot), { width: Math.max(1.2, 3 * s), color: P.silverskin, alpha: 0.95, seed: sd('silv', key), taper: [10 * s, 10 * s], wobble: 0.3 });
    // inked lips of the groove: the shadow lip heavier
    L.inkPath(ctx, crease.map((p) => [p[0] - 6 * s * Math.cos(rot), p[1] - 6 * s * Math.sin(rot)]), { width: Math.max(1.2, 2.2 * s), color: P.ink, alpha: 0.9, seed: sd('lipL', key), taper: [20 * s, 20 * s], wobble: 0.5 });
    L.inkPath(ctx, crease.map((p) => [p[0] + 6 * s * Math.cos(rot), p[1] + 6 * s * Math.sin(rot)]), { width: Math.max(0.9, 1.4 * s), color: P.inkSoft, alpha: 0.8, seed: sd('lipR', key), taper: [20 * s, 20 * s], wobble: 0.5 });
    // a lit sheen on the upper left of the hull
    const sh = [];
    for (let i = 0; i <= 12; i++) {
      const a = (205 + (i / 12) * 50) * DEG;
      sh.push([Math.cos(a) * (G1.a - 34), Math.sin(a) * (G1.b - 40)]);
    }
    L.inkPath(ctx, xf(sh, c[0], c[1], s, rot), { width: Math.max(2, 6 * s), color: P.white, alpha: 0.75, seed: sd('bsh', key), taper: [14 * s, 18 * s], wobble: 0.4 });
    // outline: 5 px hero line at full size
    L.inkPath(ctx, out, { closed: true, width: Math.max(3, 5 * s), color: P.ink, seed: sd('bo', key), wobble: 1.2 * Math.max(0.5, s), double: s > 0.8 ? { alpha: 0.4, width: 0.3 } : false });
  }

  function drawHalf(ctx, L, P, pts, c, s, rot, key) {
    const out = xf(pts, c[0], c[1], s, rot);
    fillPoly(ctx, out, P.parchment);
    L.hatch(ctx, out, { angle: -Math.PI / 4, spacing: 4.5, width: 1.3, color: P.parchmentDeep, alpha: 0.95, length: [6, 18], seed: sd('hh', key), density: 0.55 });
    L.inkPath(ctx, out, { closed: true, width: 2.8, color: P.ink, seed: sd('ho', key), wobble: 0.6 });
  }

  // a round, kidney-shaped cotyledon in its own frame: the petiole end at (0, 0), the blade along +x
  const COTY = (() => {
    const pts = [];
    const n = 64;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      // round blade 230 x 186 centred 128 px out; a notch where it meets the petiole
      let rx = 115, ry = 93;
      const notch = 22 * Math.exp(-Math.pow(((a - Math.PI + TAU) % TAU) - Math.PI, 2) / 0.09);
      const x = 128 + Math.cos(a) * rx + notch * -Math.cos(a) * 0 + (Math.cos(a) < 0 ? notch : 0);
      const y = Math.sin(a) * ry * (1 - 0.06 * Math.cos(a));
      pts.push([x, y]);
    }
    const mid = [[14, 0], [60, -1], [120, -3], [190, -2], [236, 0]];
    const veins = [];
    for (const [u, side] of [[60, -1], [60, 1], [110, -1], [110, 1], [160, -1], [160, 1]]) {
      veins.push([[u, side * 1], [u + 26, side * 34], [u + 52, side * 58]]);
    }
    return { pts, mid, veins };
  })();

  function cotyXf(pts, node, ang, ls, ws) {
    const c = Math.cos(ang), s = Math.sin(ang);
    return pts.map((p) => [node[0] + (p[0] * ls) * c - (p[1] * ws) * s, node[1] + (p[0] * ls) * s + (p[1] * ws) * c]);
  }

  function drawCotyledon(ctx, L, P, node, ang, ls, ws, key, mirror) {
    const blade = cotyXf(COTY.pts.map((p) => [p[0], mirror ? -p[1] : p[1]]), node, ang, ls, ws);
    // petiole
    const pe = cotyXf([[0, 0], [16, 0]], node, ang, ls, ws);
    L.inkPath(ctx, pe, { width: 9, color: P.ink, seed: sd('cpe0', key), taper: [0, 0], swell: 0 });
    L.inkPath(ctx, pe, { width: 5, color: P.leafLight, seed: sd('cpe', key), taper: [0, 0], swell: 0 });
    fillPoly(ctx, blade, P.leafLight);
    // shade on the lower right of the blade
    let cx = 0, cy = 0;
    for (const p of blade) {
      cx += p[0];
      cy += p[1];
    }
    cx /= blade.length;
    cy /= blade.length;
    const R = 115 * Math.max(ls, ws);
    L.hatch(ctx, blade, { angle: -Math.PI / 4, spacing: 7, width: 1.5, color: P.leafDeep, alpha: 0.85, length: [10, 28], seed: sd('ch', key), density: (x, y) => sstep(-0.15, 0.75, ((x - cx) * 0.62 + (y - cy) * 0.78) / R) });
    L.hatch(ctx, blade, { angle: -Math.PI / 4 - Math.PI / 3, spacing: 7, width: 1.2, color: P.leafDeep, alpha: 0.7, length: [8, 20], seed: sd('ch2', key), density: (x, y) => sstep(0.45, 0.95, ((x - cx) * 0.62 + (y - cy) * 0.78) / R) });
    L.stipple(ctx, blade, { spacing: 12, r: [1, 1.4], color: P.leafDeep, alpha: 0.4, seed: sd('cst', key), density: 0.5 });
    // veins: the midline in leafDeep, faint side veins
    for (let k = 0; k < COTY.veins.length; k++) {
      L.inkPath(ctx, cotyXf(COTY.veins[k].map((p) => [p[0], mirror ? -p[1] : p[1]]), node, ang, ls, ws), { width: 1.3, color: P.leafDeep, alpha: 0.6, seed: sd('cv', key, k), taper: [2, 8], wobble: 0.3 });
    }
    L.inkPath(ctx, cotyXf(COTY.mid, node, ang, ls, ws), { width: 2, color: P.leafDeep, seed: sd('cm', key), taper: [3, 30], wobble: 0.4 });
    // gloss on the upper-left lobe
    const gl = cotyXf([[80, -54], [120, -66], [170, -60]].map((p) => [p[0], mirror ? -p[1] : p[1]]), node, ang, ls, ws);
    L.inkPath(ctx, gl, { width: 3, color: P.leafSheen, alpha: 0.85, seed: sd('cg', key), taper: [6, 8], wobble: 0.3 });
    L.inkPath(ctx, blade, { closed: true, width: 3, color: P.ink, seed: sd('co', key), wobble: 0.9 });
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
      const g = geo();

      const drawing = (a) => Math.floor((t - a) * 12 + 1e-6);
      const hit = (a, frames, e, lead = 1) => {
        if (t < a) return 0;
        const u = clamp((t - a) / (frames * FR) + lead / frames);
        return e ? e(u) : u;
      };
      const popTwos = (a) => (t < a ? 0 : [0.72, 1.08, 1][Math.min(2, drawing(a))]);

      const ps = pose(tw, E);
      const split = t >= B_SPLIT;

      // ---- 1 stripes -----------------------------------------------------------------
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeSpring], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') });

      // ---- 2 construction lines ---------------------------------------------------------
      {
        const cons = { width: 1.5, color: P.inkFaint, alpha: 0.3, taper: [0, 0], wobble: 1.5, smooth: false, step: 8 };
        L.inkPath(ctx, [[540, -40], [540, SURF]], Object.assign({ seed: sd('axis') }, cons));
        L.inkPath(ctx, [[60, 700], [1020, 700]], Object.assign({ seed: sd('h700') }, cons));
        L.inkPath(ctx, [[60, 900], [1020, 900]], Object.assign({ seed: sd('h900'), alpha: 0.18 }, cons));
        L.guideCircle(ctx, 540, 700, 330, { color: P.inkFaint, alpha: 0.22, width: 1.5, dash: [3, 8] });
        // a height scale on the left, surface up to the soldier height
        const sc = new Path2D();
        sc.moveTo(110, SURF);
        sc.lineTo(110, 640);
        for (let k = 0; k <= 27; k++) {
          const y = SURF - k * 20;
          if (y < 640) break;
          sc.moveTo(110, y);
          sc.lineTo(110 + (k % 5 === 0 ? 22 : 10), y);
        }
        strokePath(ctx, sc, P.inkFaint, 0.5, 1.5);
        const marks = new Path2D();
        for (const [x, y] of [[540, 700], [540, 900], [540, 1350], [420, 640], [660, 640], [540, 1800]]) {
          marks.moveTo(x - 9, y);
          marks.lineTo(x + 9, y);
          marks.moveTo(x, y - 9);
          marks.lineTo(x, y + 9);
        }
        strokePath(ctx, marks, P.inkFaint, 0.5, 1.5);
      }

      // ---- 3 soil -------------------------------------------------------------------------
      drawSoil(ctx, L, P, g, bi);

      // ---- 4 root -------------------------------------------------------------------------
      const kRoot = hit(B_ROOT, 9, E.outExpo);
      if (kRoot > 0) {
        const rpts = slicePts(g.rootS, kRoot);
        L.inkPath(ctx, rpts, { width: 13, color: P.ink, seed: sd('root0'), taper: [0, 50], swell: 0, pressure: (u) => lerp(1, 0.3, u), wobble: 0.6 });
        L.inkPath(ctx, rpts, { width: 7.5, color: L.mix(P.flowerWhite, P.tan, 0.35), seed: sd('root1'), taper: [0, 50], swell: 0, pressure: (u) => lerp(1, 0.25, u), wobble: 0.6 });
        for (let i = 0; i < g.hairs.length; i++) {
          const h = g.hairs[i];
          const a = clamp((kRoot - h.u) / 0.08);
          if (a <= 0) continue;
          L.inkPath(ctx, slicePts(h.pts, a), { width: 1.6, color: P.white, alpha: 0.9, seed: sd('hair', i), taper: [1, 6], swell: 0, wobble: 0.3 });
        }
        // laterals branch off once the stem is rising
        const kLat = hit(B_RISE + 4 * FR, 12, E.outCubic);
        if (kLat > 0) {
          for (let i = 0; i < g.laterals.length; i++) {
            const la = clamp(kLat * 1.4 - i * 0.2);
            if (la <= 0) continue;
            L.inkPath(ctx, slicePts(g.laterals[i].pts, la), { width: 3.2, color: P.ink, seed: sd('lat', i), taper: [0, 20], swell: 0, pressure: (u) => lerp(1, 0.4, u), wobble: 0.4 });
          }
        }
      }

      // ---- 5 stem ------------------------------------------------------------------------
      let node = null;
      if (ps.stem) {
        const pts = ps.stem.pts.slice();
        if (split) {
          // with the parchment gone the stem shows up to the cotyledon node
          const e = ps.end;
          node = [e[0] + Math.cos(ps.hd) * 90, e[1] + Math.sin(ps.hd) * 90];
          pts.push([e[0] + Math.cos(ps.hd) * 45, e[1] + Math.sin(ps.hd) * 45], node);
        }
        drawStem(ctx, L, P, pts, bi);
        // a little mound of broken crust where the stem comes through
        if (tw >= B_RISE) {
          const sx = J[0];
          const mound = [];
          for (let k = 0; k <= 12; k++) {
            const u = k / 12;
            const x = sx - 70 + u * 140;
            mound.push([x, SURF - 10 * Math.sin(Math.PI * u) * (Math.abs(x - sx) > 14 ? 1 : 0.3)]);
          }
          L.inkPath(ctx, mound.slice(0, 5), { width: 2.4, color: P.ink, seed: sd('mL'), taper: [4, 2], wobble: 0.6 });
          L.inkPath(ctx, mound.slice(8), { width: 2.4, color: P.ink, seed: sd('mR'), taper: [2, 4], wobble: 0.6 });
          const cr = new Path2D();
          for (const [x, y, r] of [[sx - 44, SURF - 9, 4], [sx + 40, SURF - 10, 5], [sx - 26, SURF - 16, 3], [sx + 58, SURF - 6, 3]]) {
            cr.moveTo(x + r, y);
            cr.arc(x, y, r, 0, TAU);
          }
          ctx.fillStyle = P.soil;
          ctx.fill(cr);
          strokePath(ctx, cr, P.ink, 0.8, 1.2);
        }
      }

      // ---- 6 the seed --------------------------------------------------------------------------
      if (!split) {
        drawBean(ctx, L, P, ps.c, ps.s, ps.rot, 'seed');
      } else {
        const kOpen = popTwos(B_OPEN);
        const swayK = t >= B_OPEN ? drawing(B_OPEN) : 0;
        const sway = t >= B_OPEN + 3 * FR ? 2 * DEG * Math.sin(swayK * 1.3) : 0;
        // cotyledons: closed (folded up) until T 5.625, then they open flat
        const flatR = Math.atan2(640 - node[1], 660 - node[0]);
        const flatL = Math.atan2(640 - node[1], 420 - node[0]);
        const closedR = -84 * DEG, closedL = -96 * DEG;
        const ls = lerp(0.52, 1, kOpen), ws = lerp(0.42, 1, kOpen);
        const dR = Math.hypot(660 - node[0], 640 - node[1]) / 128;
        const dL = Math.hypot(420 - node[0], 640 - node[1]) / 128;
        // first true-leaf pair, tiny, between the cotyledons
        if (kOpen > 0) {
          const kt = clamp(hit(B_OPEN + 2 * FR, 8, E.outCubic));
          for (const s of [-1, 1]) {
            const a = (-90 + s * 28) * DEG;
            const len = 40 * kt;
            if (len < 2) continue;
            const base = node;
            const tip = [base[0] + Math.cos(a) * len, base[1] + Math.sin(a) * len];
            const nx = -Math.sin(a), ny = Math.cos(a);
            const lf = [base, [lerp(base[0], tip[0], 0.45) + nx * 10 * kt, lerp(base[1], tip[1], 0.45) + ny * 10 * kt], tip, [lerp(base[0], tip[0], 0.45) - nx * 10 * kt, lerp(base[1], tip[1], 0.45) - ny * 10 * kt]];
            L.inkPath(ctx, LIB.smoothPts(lf, true, 3), { closed: true, width: 2, color: P.ink, fill: P.leafCoffee, seed: sd('tl', s), wobble: 0.3 });
          }
        }
        drawCotyledon(ctx, L, P, node, lerp(closedL, flatL, kOpen) - sway, ls * dL, ws, 'cl', true);
        drawCotyledon(ctx, L, P, node, lerp(closedR, flatR, kOpen) + sway, ls * dR, ws, 'cr', false);
        // the parchment halves crack apart along the crease and tumble off to the right
        const uF = E.inQuad(clamp((tw - B_SPLIT) / (9 * FR)));
        const c0 = ps.c;
        const halves = [
          { pts: BEAN_LOCAL.left, key: 'hl', dx: 130, dy: 1162 - c0[1], rot: 105 * DEG, kick: -10 },
          { pts: BEAN_LOCAL.right, key: 'hr', dx: 215, dy: 1164 - c0[1], rot: -75 * DEG, kick: 12 },
        ];
        for (const h of halves) {
          const ux = E.outQuad(clamp((tw - B_SPLIT) / (9 * FR)));
          const cx = c0[0] + h.kick * (1 - ux) * (tw > B_SPLIT ? 1 : 0) + h.dx * ux;
          const cy = c0[1] + h.dy * uF;
          drawHalf(ctx, L, P, h.pts, [cx, cy], S_SEED, ps.rot + h.rot * ux, h.key);
        }
        // crack ticks on the split drawing
        if (drawing(B_SPLIT) < 2) {
          const ck = new Path2D();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * TAU + 0.3;
            ck.moveTo(c0[0] + Math.cos(a) * 70, c0[1] + Math.sin(a) * 80);
            ck.lineTo(c0[0] + Math.cos(a) * 100, c0[1] + Math.sin(a) * 112);
          }
          strokePath(ctx, ck, P.ink, 1, 2.4);
        }
      }

      // ---- 7 overlays ---------------------------------------------------------------------------
      // the drop: a dashed annBlue line from G1 down to the burial point while the seed falls
      {
        const kD = hit(B_FALL, 9, E.outExpo);
        const fade = 1 - clamp((t - B_ROOT) / (9 * FR));
        if (fade > 0) {
          const p = new Path2D();
          p.moveTo(540, 900);
          p.lineTo(540, lerp(900, 1350, kD));
          strokePath(ctx, p, P.annBlue, fade, 2.5, [14, 10]);
          if (kD >= 1) {
            const ar = new Path2D();
            ar.moveTo(526, 1328);
            ar.lineTo(540, 1350);
            ar.lineTo(554, 1328);
            strokePath(ctx, ar, P.annBlue, fade, 2.5);
          }
        }
      }
      // the lift: a dashed annBlue trajectory of the seed's centre, drawing on behind it
      if (tw >= B_RISE) {
        const trail = [];
        const f0 = Math.round(B_RISE * 24), f1 = Math.round(Math.min(t, B_SPLIT) * 24);
        for (let f = f0; f <= f1; f += 2) trail.push(pose(L.onTwos(f / 24 + 1e-6), E).c);
        if (t < B_SPLIT) trail.push(ps.c);
        if (trail.length > 1) {
          const tp = new Path2D();
          trace(tp, LIB.smoothPts(trail, false, 6), false);
          strokePath(ctx, tp, P.annBlue, 0.9, 2.5, [14, 10]);
          const o = trail[0];
          ctx.beginPath();
          ctx.arc(o[0], o[1], 5, 0, TAU);
          ctx.fillStyle = P.annBlue;
          ctx.fill();
        }
      }
      // annMagenta change ring at the parchment split
      if (split) {
        const f = (t - B_SPLIT) / FR;
        if (f < 12) {
          const u = hit(B_SPLIT, 10, E.outExpo);
          const r = lerp(50, 230, u);
          const ring = new Path2D();
          ring.arc(ps.c[0], ps.c[1], r, 0, TAU);
          const a = 1 - clamp((f - 2) / 10);
          strokePath(ctx, ring, P.ink, 0.25 * a, 6);
          strokePath(ctx, ring, P.annMagenta, a, 3);
        }
      }
      // annYellow arc annotation across the cotyledon span, radius 260 around (540, 700)
      const kArc = hit(B_OPEN, 6, E.outExpo);
      if (kArc > 0) {
        L.arcAnnotation(ctx, 540, 700, 260, 200 * DEG, 340 * DEG, { color: P.ink, alpha: 0.22, width: 5, p: kArc, endTicks: 0 });
        L.arcAnnotation(ctx, 540, 700, 260, 200 * DEG, 340 * DEG, { color: P.annYellow, width: 2.5, p: kArc, endTicks: 10, dot: 4 });
      }
    },
  });
})();
