// 04 blossom : Five-pointed white stars. Illustrated, global T 6.00 to 8.25 (t 0 to 2.25).
// A mature lateral coffee branch runs diagonally from lower left (-40, 1250) to upper right (1120, 760).
// Three leaf nodes (x 260, 560, 860) each carry an opposite pair of glossy wavy leaves and a tight
// axillary cluster of white five-petalled flowers hugging the branch (5, 8, 6 flowers plus closed buds).
// The clusters burst open on T 6.00, 6.75 and 7.50; a honeybee loops in from the left and lands on the
// hero cluster on T 7.50; on T 7.875 the first petals of cluster 1 begin to fall.
//
// Layers, back to front:
//   1. stripes (stripeCream / stripeSpring), screen-fixed, drifting 6 px per beat
//   2. (camera push 1.00 to 1.04 about (560, 1010))
//   3. background branch low in the frame (scenery), its leaves and closed bud clusters
//   4. leaves of the three nodes (opposite pairs), petioles
//   5. back flowers and buds of each cluster (behind the branch)
//   6. the hero branch: bark fill, lengthwise hatching, lenticels, node swellings
//   7. front flowers and buds of each cluster
//   8. falling petals, the bee
//   9. overlays: annBlue dashed flight path, annYellow cluster rings, annMagenta landing ring
//  10. screen-fixed tally of three annYellow dots (x 120 to 200, y 300)
(function () {
  'use strict';

  const ID = 'blossom';
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

  // beats (shot-local seconds; global T in comments)
  const B_C1 = 0; // T 6.00 cluster 1 opens (the cut)
  const B_C2 = 0.75; // T 6.75 cluster 2 (hero)
  const B_C3 = 1.5; // T 7.50 cluster 3, bee lands
  const B_BEE0 = 0.375; // T 6.375 bee enters
  const B_FALL = 1.875; // T 7.875 petals fall
  const OPEN_AT = [B_C1, B_C2, B_C3];

  // hoisted colours (pal is a read-only proxy)
  const P0 = LIB.pal;
  const C = {
    ink: P0.ink, inkSoft: P0.inkSoft, inkFaint: P0.inkFaint,
    leaf: P0.leafCoffee, leafDeep: P0.leafDeep, leafLight: P0.leafLight, leafSheen: P0.leafSheen,
    bark: P0.bark, barkDeep: P0.barkDeep,
    petal: P0.flowerWhite, petalShade: P0.flowerShade, anther: P0.anther,
    petalHatch: LIB.mix(P0.flowerShade, P0.inkSoft, 0.38),
    white: P0.white, ochre: P0.ochre, tan: P0.tan,
    annYellow: P0.annYellow, annBlue: P0.annBlue, annMagenta: P0.annMagenta,
    leafInk: LIB.mix(P0.leafDeep, P0.ink, 0.45),
    barkLight: LIB.mix(P0.bark, P0.tan, 0.45),
    sheenWhite: LIB.mix(P0.leafSheen, P0.white, 0.55),
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
  function atFrac(pts, u) {
    const total = polyLen(pts);
    let want = clamp(u) * total;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (want <= l || i === pts.length - 1) {
        const f = l ? clamp(want / l) : 0;
        return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f), i];
      }
      want -= l;
    }
    const e = pts[pts.length - 1];
    return [e[0], e[1], pts.length - 1];
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
    L.inkPath(ctx, Lf.stalk, { width: 13 * wScale, color: C.ink, seed: sd('pet0', k), taper: [0, 5], swell: 0, wobble: 0.4 });
    L.inkPath(ctx, Lf.stalk, { width: 7 * wScale, color: C.leafLight, seed: sd('pet', k), taper: [0, 4], swell: 0, wobble: 0.4 });
    L.inkPath(ctx, Lf.outline, { closed: true, width: 3 * wScale, fill: C.leaf, seed: sd('leafline', k), wobble: 1.2 });
    const shadowHalf = Lf.litSide > 0 ? Lf.halfB : Lf.halfA;
    const litHalf = Lf.litSide > 0 ? Lf.halfA : Lf.halfB;
    const angShadow = Lf.litSide > 0 ? Lf.angB : Lf.angA;
    const angLit = Lf.litSide > 0 ? Lf.angA : Lf.angB;
    const B = Lf.bounds;
    // shadow half: hatch parallel to the side veins, darker toward the margin and tip
    L.hatch(ctx, shadowHalf, {
      angle: angShadow, spacing: 5.5, width: 1.6, color: C.leafDeep, alpha: 0.9, length: [12, 34], bounds: B, seed: sd('lh', k),
      density: (x, y) => {
        const q = Lf.uvOf(x, y);
        return 0.5 + 0.5 * sstep(0.1, 0.75, Math.abs(q[1]));
      },
    });
    L.hatch(ctx, shadowHalf, {
      angle: angShadow + 1.05, spacing: 7, width: 1.3, color: C.ink, alpha: 0.42, length: [10, 26], bounds: B, seed: sd('lh2', k),
      density: (x, y) => {
        const q = Lf.uvOf(x, y);
        return 0.95 * sstep(0.45, 0.95, Math.abs(q[1])) * (0.4 + 0.6 * sstep(0.3, 0.9, q[0]));
      },
    });
    // lit half: only a light shade near the margin and in the base
    L.hatch(ctx, litHalf, {
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
      L.inkPath(ctx, Lf.veins[i].pts, { width: 1.8, color: C.leafDeep, alpha: 0.95, seed: sd('lv', k, i), taper: [3, 14], wobble: 0.5, step: 3 });
    }
    L.inkPath(ctx, Lf.mid, { width: 4 * wScale, color: C.leafLight, seed: sd('mid', k), taper: [2, 70], wobble: 0.6 });
    L.inkPath(ctx, Lf.mid, { width: 1.2, color: C.leafInk, alpha: 0.6, seed: sd('mid2', k), taper: [10, 90], wobble: 0.6 });
  }

  // ---------------------------------------------------------------------------
  // Branch geometry
  // ---------------------------------------------------------------------------
  const BR = { x0: -40, y0: 1250, x1: 1120, y1: 760, half: 17 };
  const BDX = BR.x1 - BR.x0, BDY = BR.y1 - BR.y0;
  const BLEN = Math.hypot(BDX, BDY);
  const UX = BDX / BLEN, UY = BDY / BLEN; // along the branch, toward the upper right
  const NUX = UY, NUY = -UX; // normal pointing up-left (above the branch)
  const BANG = Math.atan2(BDY, BDX);
  const branchY = (x) => BR.y0 + (BDY * (x - BR.x0)) / BDX;
  const NODES = [260, 560, 860].map((x) => [x, branchY(x)]);
  // a 3 px sag in the middle of the branch keeps it from looking ruled
  const sag = (s) => 6 * Math.sin(Math.PI * s);

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

  // ---------------------------------------------------------------------------
  // Flowers
  // ---------------------------------------------------------------------------
  // lanceolate petal along +x from the tube edge: narrow, pointed
  function petalLocal(len, wid, r0) {
    const up = [], dn = [];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const w = wid * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.62)), 0.85) * Math.pow(1 - s, 0.25);
      up.push([r0 + s * len, w]);
      dn.push([r0 + s * len, -w * 0.92]);
    }
    return up.concat(dn.slice(1, n).reverse());
  }

  function makeXf(F) {
    const e = [Math.cos(F.phi), Math.sin(F.phi)];
    return (lx, ly) => {
      const d = lx * e[0] + ly * e[1];
      const k = d * (F.sq - 1);
      return [F.x + lx + e[0] * k, F.y + ly + e[1] * k];
    };
  }

  function rot(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
  }

  // signed shortest angle from a to b
  const angDiff = (a, b) => {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  };

  // Geometry of a flower at opening amount o (0 closed, 1 open, >1 overshoot)
  function flowerShape(F, o, skip) {
    const xf = makeXf(F);
    const R = F.R;
    const lenK = 0.62 + 0.38 * Math.min(o, 1.1);
    const widK = 0.55 + 0.45 * Math.min(o, 1);
    const petals = [];
    for (let k = 0; k < 5; k++) {
      if (skip && skip.has(k)) continue;
      const full = F.rho + k * 72 * DEG;
      const a = F.phi + angDiff(F.phi, full) * Math.min(o, 1) + (o > 1 ? (o - 1) * 0.5 * Math.sign(angDiff(F.phi, full)) : 0);
      const loc = petalLocal(R * lenK * (o > 1 ? o : 1), R * 0.235 * widK, 6);
      const pts = loc.map((p) => {
        const q = rot(p, a);
        return xf(q[0], q[1]);
      });
      const tip = rot([5 + R * lenK, 0], a);
      const midA = rot([5 + R * 0.25, 0], a), midB = rot([5 + R * lenK * 0.85, 0], a);
      petals.push({ k, pts, tip: xf(tip[0], tip[1]), vein: [xf(midA[0], midA[1]), xf(midB[0], midB[1])], a });
    }
    // draw the petal whose tip is highest first, so the lower ones overlap them (seen a little from above)
    petals.sort((p, q) => p.tip[1] - q.tip[1]);
    return { petals, xf };
  }

  function drawBud(ctx, b, P, scale = 1) {
    const L = LIB;
    const len = b.len * scale, w = b.w * scale;
    const ux = Math.cos(b.phi), uy = Math.sin(b.phi), nx = -uy, ny = ux;
    const up = [], dn = [];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const hw = w * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.66)), 0.8) * (0.5 + 0.5 * s);
      const cx = b.x + ux * s * len, cy = b.y + uy * s * len;
      up.push([cx + nx * hw, cy + ny * hw]);
      dn.push([cx - nx * hw * 0.95, cy - ny * hw * 0.95]);
    }
    const poly = up.concat(dn.slice(1, n).reverse());
    // little green calyx cup at the base
    L.inkPath(ctx, L.ellipsePts(b.x + ux * 4, b.y + uy * 4, 6 * scale, 4.5 * scale, 14, b.phi), { closed: true, width: 1.5, fill: C.leafLight, seed: sd('budcal', b.id), wobble: 0.3 });
    L.inkPath(ctx, poly, { closed: true, width: 2, fill: C.petal, seed: sd('bud', b.id), wobble: 0.5, taper: [4, 8] });
    // shadow side (lower right) hatch and the twisted petal seam
    const lit = nx + ny < 0 ? -1 : 1; // the side of dn faces down-right when lit = -1
    L.hatch(ctx, poly, {
      angle: b.phi + 1.2, spacing: 3.6, width: 1.1, color: C.petalHatch, alpha: 0.9, length: [4, 10], inset: 1, overshoot: 0, seed: sd('budh', b.id),
      density: (x, y) => {
        const v = ((x - b.x) * nx + (y - b.y) * ny) * lit;
        return sstep(-w * 0.1, w * 0.6, v);
      },
    });
    const seam = [];
    for (let i = 2; i <= 10; i++) {
      const s = i / 12;
      const hw = w * 0.35 * Math.sin(s * 5.5);
      seam.push([b.x + ux * s * len + nx * hw, b.y + uy * s * len + ny * hw]);
    }
    L.inkPath(ctx, seam, { width: 1.1, color: C.inkSoft, alpha: 0.6, seed: sd('seam', b.id), taper: [3, 6], wobble: 0.2 });
  }

  function drawFlower(ctx, F, o, skip) {
    const L = LIB;
    if (o <= 0) {
      drawBud(ctx, { x: F.x - Math.cos(F.phi) * F.R * 0.3, y: F.y - Math.sin(F.phi) * F.R * 0.3, phi: F.phi, len: F.R * 0.95, w: F.R * 0.17, id: F.id + 500 }, null);
      return;
    }
    const { petals, xf } = flowerShape(F, o, skip);
    const all = new Path2D();
    for (const pt of petals) trace(all, pt.pts, true);
    // fill all petals, ink each one
    ctx.save();
    ctx.fillStyle = C.petal;
    ctx.fill(all, 'nonzero');
    ctx.restore();
    // petal-base and shadow-side shade, clipped to the petals
    const bb = bboxOf(petals.flatMap((p) => p.pts), 2);
    ctx.save();
    ctx.clip(all, 'nonzero');
    L.hatch(ctx, null, {
      bounds: bb, angle: -Math.PI / 4, spacing: 3.8, width: 1.15, color: C.petalHatch, alpha: 0.85, length: [5, 12], seed: sd('fh', F.id),
      density: (x, y) => {
        const dx = x - F.x, dy = y - F.y;
        const d = Math.hypot(dx, dy) / F.R;
        const side = (dx * 0.7 + dy * 0.7) / F.R;
        return 0.95 * (1 - sstep(0.18, 0.42, d)) + 0.6 * sstep(0.15, 0.75, side) * sstep(0.3, 0.6, d);
      },
    });
    ctx.restore();
    for (const pt of petals) {
      L.inkPath(ctx, pt.pts, { closed: true, width: 2, color: C.ink, seed: sd('pet', F.id, pt.k), wobble: 0.5, tremble: 0.25, taper: [6, 10] });
      L.inkPath(ctx, pt.vein, { width: 1, color: C.petalHatch, alpha: 0.8, seed: sd('pv', F.id, pt.k), taper: [3, 8], wobble: 0.3, double: false });
    }
    // corolla tube centre
    const tube = L.ellipsePts(F.x, F.y, 7, 7 * F.sq, 16, F.phi);
    L.inkPath(ctx, tube, { closed: true, width: 1.4, fill: C.petalShade, seed: sd('tube', F.id), wobble: 0.2 });
    if (o > 0.6) {
      // five anthers on short filaments between the petals, and the forked style
      const a5 = new Path2D();
      const ant = [];
      for (let k = 0; k < 5; k++) {
        const a = F.rho + (k + 0.5) * 72 * DEG;
        const p1 = rot([F.R * 0.3, 0], a), p2 = rot([F.R * 0.44, 0], a);
        const q1 = xf(p1[0], p1[1]), q2 = xf(p2[0], p2[1]);
        a5.moveTo(F.x, F.y);
        a5.lineTo(q1[0], q1[1]);
        ant.push([q1, q2]);
      }
      strokeP(ctx, a5, C.petalHatch, 0.9, 1.4);
      for (const [q1, q2] of ant) {
        const mx = (q1[0] + q2[0]) / 2, my = (q1[1] + q2[1]) / 2;
        const ang = Math.atan2(q2[1] - q1[1], q2[0] - q1[0]);
        const len = Math.max(5, Math.hypot(q2[0] - q1[0], q2[1] - q1[1]) * 0.75);
        L.inkPath(ctx, L.ellipsePts(mx, my, len, 2.8, 12, ang), { closed: true, width: 1.1, fill: C.anther, seed: sd('ant', F.id, mx | 0), wobble: 0.15, taper: [2, 4] });
      }
      const sa = F.rho + 0.2;
      const s1 = rot([F.R * 0.42, 0], sa);
      const st = xf(s1[0], s1[1]);
      const f1 = rot([F.R * 0.52, F.R * 0.07], sa), f2 = rot([F.R * 0.52, -F.R * 0.07], sa);
      const ft1 = xf(f1[0], f1[1]), ft2 = xf(f2[0], f2[1]);
      const style = new Path2D();
      style.moveTo(F.x, F.y);
      style.lineTo(st[0], st[1]);
      style.moveTo(st[0], st[1]);
      style.lineTo(ft1[0], ft1[1]);
      style.moveTo(st[0], st[1]);
      style.lineTo(ft2[0], ft2[1]);
      strokeP(ctx, style, C.ink, 0.85, 2.6);
      strokeP(ctx, style, C.white, 1, 1.3);
    }
  }

  // ---------------------------------------------------------------------------
  // Memoised geometry
  // ---------------------------------------------------------------------------
  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const L = LIB;
    // leaf pairs: one above and one below the branch at each node, angles varied so pairs do not mirror
    const LEAFDEF = [
      { n: 0, side: 1, ang: -1.22, bend: 14 },
      { n: 0, side: -1, ang: 0.78, bend: -12 },
      { n: 1, side: 1, ang: -1.42, bend: -16 },
      { n: 1, side: -1, ang: 0.6, bend: 14 },
      { n: 2, side: 1, ang: -1.28, bend: 12 },
      { n: 2, side: -1, ang: 0.72, bend: -14 },
    ];
    const leaves = LEAFDEF.map((d, i) => {
      const [x, y] = NODES[d.n];
      const bx = x + NUX * 12 * d.side, by = y + NUY * 12 * d.side;
      return leafGeom(bx, by, d.ang, 360 + (i % 3) * 10, 172, 'L' + i, d.bend);
    });
    // background branch low in the frame (scenery): (-40, 1830) to (1120, 1470)
    const bg = branchPts(-40, 1830, 1120, 1470, 13, 8);
    const bgNodes = [0.3, 0.72].map((s) => [lerp(-40, 1120, s), lerp(1830, 1470, s) - 8 * Math.sin(Math.PI * s)]);
    const bgLeaves = [
      leafGeom(bgNodes[0][0] - 4, bgNodes[0][1] - 12, -1.5, 300, 146, 'B0', 12),
      leafGeom(bgNodes[0][0] + 4, bgNodes[0][1] + 12, 0.9, 300, 146, 'B1', -10),
      leafGeom(bgNodes[1][0] - 4, bgNodes[1][1] - 12, -1.3, 300, 146, 'B2', -12),
      leafGeom(bgNodes[1][0] + 4, bgNodes[1][1] + 12, 0.75, 300, 146, 'B3', 10),
    ];
    const top = branchPts(1120, 300, 470, -40, 12, -6);
    const topNodes = [0.32, 0.74].map((u) => [lerp(1120, 470, u), lerp(300, -40, u) + 6 * Math.sin(Math.PI * u)]);
    bgLeaves.push(
      leafGeom(topNodes[0][0] - 5, topNodes[0][1] + 10, 2.0, 310, 150, 'T0', 12),
      leafGeom(topNodes[0][0] + 5, topNodes[0][1] - 10, -1.2, 310, 150, 'T1', -10),
      leafGeom(topNodes[1][0] - 5, topNodes[1][1] + 10, 2.25, 300, 146, 'T2', -12),
      leafGeom(topNodes[1][0] + 5, topNodes[1][1] - 10, -0.95, 300, 146, 'T3', 10)
    );
    const bgBuds = [];
    bgNodes.concat(topNodes).forEach((nd, j) => {
      const r = L.rng(sd('bgbud', j));
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + r.range(-0.2, 0.2);
        bgBuds.push({ x: nd[0] + Math.cos(a) * 12, y: nd[1] + Math.sin(a) * 9, phi: a, len: r.range(34, 44), w: r.range(6.5, 8), id: 900 + j * 20 + i });
      }
    });

    // flower clusters
    const COUNTS = [5, 8, 6];
    const BUDS = [6, 9, 7];
    const clusters = COUNTS.map((n, c) => {
      const [nx0, ny0] = NODES[c];
      const r = L.rng(sd('cluster', c));
      const flowers = [];
      const ra = c === 1 ? 86 : 64, rb = c === 1 ? 72 : 56;
      const ringN = c === 1 ? n - 1 : n;
      const a0 = r.range(0, TAU);
      for (let j = 0; j < ringN; j++) {
        const th = a0 + (j / ringN) * TAU + r.range(-0.18, 0.18);
        const ca = Math.cos(th) * ra * r.range(0.85, 1.05), cb = Math.sin(th) * rb * r.range(0.85, 1.05);
        const x = nx0 + UX * ca + NUX * cb, y = ny0 + UY * ca + NUY * cb;
        const phi = Math.atan2(y - ny0, x - nx0);
        flowers.push({
          x, y, phi, R: c === 1 ? r.range(62, 67) : r.range(56, 62), sq: r.range(0.66, 0.92), rho: r.range(0, TAU),
          back: Math.sin(th) > 0.3, id: c * 100 + j,
        });
      }
      if (c === 1) {
        // the hero flower faces the camera in front of the node
        flowers.push({ x: nx0 + 6, y: ny0 + 12, phi: 0.6, R: 70, sq: 0.96, rho: -0.3, back: false, id: c * 100 + 99 });
      }
      // opening order: front flowers first, hero flower first in cluster 2
      const order = flowers.map((f, i) => i).sort((i, j) => (flowers[i].back - flowers[j].back) || (flowers[j].y - flowers[i].y));
      if (c === 1) {
        order.splice(order.indexOf(flowers.length - 1), 1);
        order.unshift(flowers.length - 1);
      }
      order.forEach((fi, k) => (flowers[fi].ord = k));
      const buds = [];
      for (let j = 0; j < BUDS[c]; j++) {
        const th = a0 + ((j + 0.5) / BUDS[c]) * TAU + r.range(-0.15, 0.15);
        const kr = r.range(0.45, 0.8);
        const ca = Math.cos(th) * ra * kr, cb = Math.sin(th) * rb * kr;
        const x = nx0 + UX * ca + NUX * cb, y = ny0 + UY * ca + NUY * cb;
        buds.push({ x, y, phi: Math.atan2(y - ny0, x - nx0) + r.range(-0.25, 0.25), len: r.range(48, 62), w: r.range(9, 11.5), back: Math.sin(th) > 0, id: c * 100 + 50 + j });
      }
      return { c, node: [nx0, ny0], flowers, buds };
    });

    // falling petals: three petals of cluster 1
    const falls = [
      { f: 0, k: 1, dx: -40, rot: 3.2 },
      { f: 2, k: 3, dx: 30, rot: -2.6 },
      { f: 3, k: 0, dx: -10, rot: 2.2 },
    ].map((d, i) => Object.assign(d, { i, fl: clusters[0].flowers[d.f % clusters[0].flowers.length] }));

    // bee flight path (world px): in from the left edge, a loop, down onto the hero cluster
    const hero = clusters[1].flowers[clusters[1].flowers.length - 1];
    const land = [hero.x + 4, hero.y - 8];
    const beePath = L.smoothPts([
      [-90, 640], [60, 560], [210, 520], [330, 560], [370, 650], [300, 720], [220, 680], [240, 590], [350, 560], [460, 640], [520, 780], [land[0] - 14, land[1] - 60], land,
    ], false, 4);

    const branch = branchPts(BR.x0, BR.y0, BR.x1, BR.y1, BR.half, 6, 60);
    GEO = { leaves, top, topNodes, bg, bgNodes, bgLeaves, bgBuds, clusters, falls, beePath, land, branch };
    return GEO;
  }

  // ---------------------------------------------------------------------------
  // Branch drawing
  // ---------------------------------------------------------------------------
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
    L.hatch(ctx, Bp.poly, { angle: ang + 0.04, spacing: 3.6, width: 1.4, color: C.barkDeep, alpha: 0.9, length: [16, 46], seed: sd('bh', key), density: (x, y) => sstep(-0.25, 0.55, below(x, y)) });
    L.hatch(ctx, Bp.poly, { angle: ang + Math.PI / 2 + 0.25, spacing: 6, width: 1.3, color: C.ink, alpha: 0.5, length: [5, 10], seed: sd('bc', key), density: (x, y) => sstep(0.45, 0.9, below(x, y)) });
    // bark flecks and lenticels
    L.stipple(ctx, Bp.poly, { spacing: 13, r: [1.0, 1.8], color: C.barkDeep, alpha: 0.75, seed: sd('len', key), density: (x, y) => 0.55 + 0.4 * sstep(-0.6, 0.4, below(x, y)) });
    void vOf;
    // node swellings: a slight ring where each leaf pair joins
    for (let i = 0; i < nodes.length; i++) {
      const [x, y] = nodes[i];
      const ring = [];
      for (let k = -1; k <= 1; k += 2) ring.push([x + Bp.ux * k * 6 + Bp.nx * (half + 2), y + Bp.uy * k * 6 + Bp.ny * (half + 2)]);
      const p1 = [x + Bp.nx * (half + 3), y + Bp.ny * (half + 3)], p2 = [x - Bp.nx * (half + 3), y - Bp.ny * (half + 3)];
      const c = [x + Bp.ux * 5, y + Bp.uy * 5];
      L.inkPath(ctx, L.smoothPts([p1, c, p2], false, 3), { width: 1.8, color: C.inkSoft, alpha: 0.9, seed: sd('nodering', key, i), taper: [4, 4], wobble: 0.3 });
    }
    L.inkPath(ctx, Bp.top, { width: w, seed: sd('btop', key), taper: [0, 0], wobble: 1.2 });
    L.inkPath(ctx, Bp.bot, { width: w + 0.5, seed: sd('bbot', key), taper: [0, 0], wobble: 1.2 });
  }

  // ---------------------------------------------------------------------------
  // Bee (dorsal view, about 60 px long), heading hd, wing angle wa
  // ---------------------------------------------------------------------------
  function drawBee(ctx, x, y, hd, wa, k) {
    const L = LIB;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(hd);
    // legs
    const legs = new Path2D();
    for (const s of [-1, 1]) {
      legs.moveTo(6, 6 * s); legs.lineTo(12, 14 * s); legs.lineTo(16, 16 * s);
      legs.moveTo(2, 7 * s); legs.lineTo(0, 16 * s); legs.lineTo(-3, 19 * s);
      legs.moveTo(-2, 6 * s); legs.lineTo(-10, 15 * s); legs.lineTo(-16, 17 * s);
    }
    strokeP(ctx, legs, C.ink, 0.9, 1.6);
    // abdomen with ochre and ink stripes
    const abd = L.ellipsePts(-16, 0, 17, 11.5, 28);
    L.inkPath(ctx, abd, { closed: true, width: 2.2, fill: C.ochre, seed: sd('abd', k & 1), wobble: 0.3, boil: k });
    ctx.save();
    ctx.beginPath();
    trace(ctx, abd, true);
    ctx.clip();
    ctx.fillStyle = C.ink;
    for (const sx of [-6, -15, -24]) {
      ctx.beginPath();
      ctx.moveTo(sx + 2.5, -14);
      ctx.quadraticCurveTo(sx - 1.5, 0, sx + 2.5, 14);
      ctx.lineTo(sx - 2.5, 14);
      ctx.quadraticCurveTo(sx - 6.5, 0, sx - 2.5, -14);
      ctx.closePath();
      ctx.fill();
    }
    L.hatch(ctx, abd, { angle: -Math.PI / 4 - hd, spacing: 3, width: 1, color: C.ink, alpha: 0.5, length: [3, 8], seed: sd('abdh'), density: (px, py) => sstep(0, 9, py) });
    ctx.restore();
    // thorax: fuzzy ochre-tan
    const th = L.ellipsePts(4, 0, 11, 10, 20);
    L.inkPath(ctx, th, { closed: true, width: 2, fill: L.mix(C.ochre, C.tan, 0.5), seed: sd('thx'), wobble: 0.3 });
    const fuzz = new Path2D();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      fuzz.moveTo(4 + Math.cos(a) * 9, Math.sin(a) * 8.5);
      fuzz.lineTo(4 + Math.cos(a) * 13.5, Math.sin(a) * 12.5);
    }
    strokeP(ctx, fuzz, C.inkSoft, 0.7, 1);
    // head and antennae
    L.inkPath(ctx, L.ellipsePts(19, 0, 7, 8, 16), { closed: true, width: 2, fill: C.ink, seed: sd('head'), wobble: 0.2 });
    const ant = new Path2D();
    ant.moveTo(24, -3); ant.lineTo(31, -8); ant.lineTo(35, -6);
    ant.moveTo(24, 3); ant.lineTo(31, 8); ant.lineTo(35, 6);
    strokeP(ctx, ant, C.ink, 1, 1.4);
    // wings: translucent white, veined
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(2, 4 * s);
      ctx.rotate(s * (Math.PI - wa));
      const wing = L.ellipsePts(16, 0, 18, 7.5, 20);
      ctx.globalAlpha = 0.6;
      fillPoly(ctx, wing, C.white);
      ctx.globalAlpha = 1;
      L.inkPath(ctx, wing, { closed: true, width: 1.3, color: C.ink, alpha: 0.85, seed: sd('wing', s), wobble: 0.2, taper: [3, 5] });
      const v = new Path2D();
      v.moveTo(2, 0); v.lineTo(26, -1.5);
      v.moveTo(12, -1); v.lineTo(20, 4);
      strokeP(ctx, v, C.inkSoft, 0.6, 0.9);
      ctx.restore();
    }
    ctx.restore();
  }

  // dashed polyline drawn on up to arc length fraction u
  function dashedPath(ctx, pts, u, color, width, dash) {
    if (u <= 0) return;
    const total = polyLen(pts);
    const want = total * clamp(u);
    const p = new Path2D();
    let acc = 0;
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + l >= want) {
        const f = l ? (want - acc) / l : 0;
        p.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
        break;
      }
      p.lineTo(pts[i][0], pts[i][1]);
      acc += l;
    }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'butt';
    ctx.setLineDash(dash);
    ctx.stroke(p);
    ctx.restore();
  }

  function ringPath(cx, cy, r, ticks) {
    const p = new Path2D();
    p.moveTo(cx + r, cy);
    p.arc(cx, cy, r, 0, TAU);
    if (ticks) {
      for (let q = 0; q < 4; q++) {
        const a = Math.PI / 4 + (q * Math.PI) / 2;
        p.moveTo(cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9));
        p.lineTo(cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9));
      }
    }
    return p;
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


  // The scenery and leaves do not move: render them once per boil drawing into an offscreen layer.
  function staticLayer(L, bi) {
    const S = FILM.S || 1;
    return L.cached(ID + ':static:' + bi + ':' + S, () => {
      const cv = FILM.makeCanvas(Math.round(1080 * S), Math.round(1920 * S));
      const ctx = cv.getContext('2d');
      ctx.setTransform(S, 0, 0, S, 0, 0);
      drawStatic(ctx, L);
      return cv;
    });
  }
  function drawStatic(ctx, L) {
    const G = geo();
    // 3. background branch (scenery)
    for (const Lf of G.bgLeaves) drawLeaf(ctx, Lf, { thin: true });
    drawBranch(ctx, G.bg, 'bg', G.bgNodes, { w: 3 });
    drawBranch(ctx, G.top, 'top', G.topNodes, { w: 3 });
    for (const b of G.bgBuds) drawBud(ctx, b, null, 1);

    // 4. leaves of the hero branch
    for (const Lf of G.leaves) drawLeaf(ctx, Lf);

    // a soft cast shadow of each cluster on the leaves below and right of it
    for (const cl of G.clusters) {
      const [x, y] = cl.node;
      const sh = L.ellipsePts(x + 26, y + 40, 120, 70, 32, BANG);
      for (const Lf of G.leaves) {
        ctx.save();
        ctx.clip(pathOf(Lf.outline));
        L.hatch(ctx, sh, { angle: -Math.PI / 4 + 1.05, spacing: 4.5, width: 1.3, color: C.ink, alpha: 0.4, length: [8, 22], seed: sd('csh', cl.c, Lf.key), bounds: bboxOf(sh), density: (px, py) => 1 - sstep(0.5, 1, Math.hypot((px - x - 26) / 120, (py - y - 40) / 70)) });
        ctx.restore();
      }
    }
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
      const G = geo();

      // timing helpers
      const drawing = (a) => Math.floor((t - a) * 12 + 1e-6);
      const hit = (a, frames, e, lead = 1) => (t < a - 1e-6 ? 0 : (e || ((u) => u))(clamp((t - a) / (frames * FR) + lead / frames)));
      const POP = [0.45, 1.08, 1];
      const openAmt = (a) => (t < a - 1e-6 ? 0 : POP[Math.min(2, drawing(a))]);
      const flowerOpenAt = (c, F) => OPEN_AT[c] + F.ord * 2 * FR;

      // 1. stripes
      L.stripes(ctx, { colors: [L.pal.stripeCream, L.pal.stripeSpring], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') });

      // 2. camera: push 1.00 to 1.04 keeping (560, 1010) on its screen spot
      const zoom = 1 + 0.04 * E.inOutSine(t / info.dur);
      const cam = { x: 560 - 20 / zoom, y: 1010 - 50 / zoom, zoom };

      // which petals of cluster 1 have dropped off
      const fallen = new Map();
      for (const f of G.falls) {
        const a = B_FALL + f.i * 2 * FR;
        if (t >= a - 1e-6) {
          if (!fallen.has(f.fl.id)) fallen.set(f.fl.id, new Set());
          fallen.get(f.fl.id).add(f.k);
        }
      }

      L.camera(ctx, cam, (ctx) => {
        // 3-4. static layer (scenery branches, all leaves, cluster shadows), cached per boil drawing
        ctx.drawImage(staticLayer(L, L.boil(info.T)), 0, 0, 1080, 1920);

        // 5. back flowers and buds
        for (const cl of G.clusters) {
          for (const b of cl.buds) if (b.back) drawBud(ctx, b, null, 1);
          for (const F of cl.flowers) if (F.back) drawFlower(ctx, F, openAmt(flowerOpenAt(cl.c, F)), fallen.get(F.id));
        }

        // 6. the hero branch
        drawBranch(ctx, G.branch, 'hero', NODES, { w: 4 });

        // 7. front buds and flowers (lowest first so the ones nearer the camera overlap)
        for (const cl of G.clusters) {
          for (const b of cl.buds) if (!b.back) drawBud(ctx, b, null, 1);
          const front = cl.flowers.filter((F) => !F.back).sort((a, b) => a.y - b.y);
          for (const F of front) drawFlower(ctx, F, openAmt(flowerOpenAt(cl.c, F)), fallen.get(F.id));
        }

        // 8a. falling petals (on twos)
        for (const f of G.falls) {
          const a = B_FALL + f.i * 2 * FR;
          if (tw < a - 1e-6) continue;
          const dt = tw - a + 1 / 12;
          const F = f.fl;
          const { petals } = flowerShape(F, 1, null);
          const pt = petals.find((p) => p.k === f.k);
          if (!pt) continue;
          let cx = 0, cy = 0;
          for (const q of pt.pts) {
            cx += q[0];
            cy += q[1];
          }
          cx /= pt.pts.length;
          cy /= pt.pts.length;
          const ox = f.dx * dt * 2 + 14 * Math.sin(dt * 9 + f.i), oy = 90 * dt + 620 * dt * dt;
          const ang = f.rot * dt;
          const moved = pt.pts.map((q) => {
            const r = rot([q[0] - cx, q[1] - cy], ang);
            return [cx + ox + r[0], cy + oy + r[1] * (0.8 + 0.2 * Math.cos(dt * 7))];
          });
          L.inkPath(ctx, moved, { closed: true, width: 2, fill: C.petal, seed: sd('fallp', f.i), wobble: 0.4, taper: [6, 10] });
          L.hatch(ctx, moved, { angle: -Math.PI / 4, spacing: 3.6, width: 1.1, color: C.petalHatch, alpha: 0.8, length: [4, 9], inset: 1, seed: sd('fallh', f.i), density: 0.45 });
        }

        // 9a. bee flight path (dashed, annBlue), drawing on behind the bee
        const flyT = clamp((t - B_BEE0) / (B_C3 - B_BEE0));
        const flyTw = clamp((tw - B_BEE0) / (B_C3 - B_BEE0));
        const sOf = (q) => E.inOutSine(q);
        const sNow = Math.min(sOf(flyT), sOf(flyTw));
        if (t >= B_BEE0 - 1e-6) dashedPath(ctx, G.beePath, Math.max(0.004, sNow - 0.02), C.annBlue, 2.5, [14, 10]);

        // 8b. bee (on twos), wings flick between two drawings
        if (tw >= B_BEE0 - 1e-6) {
          const s = sOf(flyTw);
          const p = atFrac(G.beePath, s);
          const q = atFrac(G.beePath, Math.min(1, s + 0.01));
          const pr = atFrac(G.beePath, Math.max(0, s - 0.01));
          let hd = Math.atan2(q[1] - pr[1], q[0] - pr[0]);
          const landed = flyTw >= 1;
          if (landed) hd = 0.9;
          const k = Math.floor(tw * 12 + 1e-6);
          const wa = k % 2 ? 0.55 : 1.05;
          ctx.save();
          ctx.translate(p[0], p[1]);
          ctx.scale(1.15, 1.15);
          drawBee(ctx, 0, 0, hd, wa, k);
          ctx.restore();
          if (!landed) {
            // buzz marks around the wings
            const bz = new Path2D();
            for (const sgn of [-1, 1]) {
              const a = hd + sgn * 1.9;
              bz.moveTo(p[0] + Math.cos(a) * 34, p[1] + Math.sin(a) * 34);
              bz.lineTo(p[0] + Math.cos(a) * 44, p[1] + Math.sin(a) * 44);
            }
            strokeP(ctx, bz, C.ink, 0.6, 1.6);
          }
        }

        // 9b. annYellow attention rings popping around each cluster as it opens
        for (let c = 0; c < 3; c++) {
          const a = OPEN_AT[c];
          if (t < a - 1e-6) continue;
          const f = (t - a) * 24;
          if (f > 13) continue;
          const pr = E.outExpo(clamp((f + 1) / 10));
          const alpha = 1 - clamp((f - 5) / 8);
          const [x, y] = G.clusters[c].node;
          overlayStroke(ctx, ringPath(x, y, 70 + 120 * pr, true), C.annYellow, alpha, 3);
          if (f >= 2) overlayStroke(ctx, ringPath(x, y, 50 + 90 * E.outExpo(clamp((f - 1) / 10)), false), C.annYellow, alpha * 0.8, 2);
        }
        // 9c. a small annMagenta ring where the bee touches down
        if (t >= B_C3 - 1e-6) {
          const f = (t - B_C3) * 24;
          if (f < 12) {
            const pr = E.outExpo(clamp((f + 1) / 8));
            overlayStroke(ctx, ringPath(G.land[0], G.land[1], 26 + 60 * pr, false), C.annMagenta, 1 - clamp((f - 4) / 8), 3);
          }
        }
      });

      // 10. tally: three annYellow dots, one filling per opened cluster
      for (let i = 0; i < 3; i++) {
        const x = 120 + i * 40, y = 300;
        const on = t >= OPEN_AT[i] - 1e-6;
        const pop = on ? [1.35, 1.08, 1][Math.min(2, drawing(OPEN_AT[i]))] : 1;
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = C.annYellow;
        ctx.fillStyle = C.annYellow;
        ctx.beginPath();
        ctx.arc(x, y, 11 * pop, 0, TAU);
        if (on) ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      // a thin baseline under the tally, like a ruler
      const tl = new Path2D();
      tl.moveTo(102, 326);
      tl.lineTo(218, 326);
      for (let i = 0; i < 3; i++) {
        tl.moveTo(120 + i * 40, 326);
        tl.lineTo(120 + i * 40, 316);
      }
      strokeP(ctx, tl, C.annYellow, 0.9, 2);
      void hit;
    },
  });
})();
