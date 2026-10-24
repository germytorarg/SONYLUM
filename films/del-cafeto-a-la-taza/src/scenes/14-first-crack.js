// 14 first-crack : "First crack" (schematic, global T 27.00 to 28.50)
//
// Layers, back to front:
//   1 lib.blueprint plate centred on the bean (540, 900)
//   2 guide geometry: turning guide circles with radial ticks, construction axis of the bean, the ghost of the
//     scale-1.00 outline (dashed) once the bean has grown
//   3 heat: wavy schemBean lines rising round the bean
//   4 the G1 bean (docs/storyboard.md Shared geometry G1), scaled about (540, 900) 1.00 -> 1.15 -> 1.25 -> 1.30:
//     curved rectangular cell lattice (18 x 12 local cells, so 24 x 16 at scale 1.30), CO2 glow dots,
//     double lavender outline, crease groove (12 px lineWhite, splitting to 26 px on the crack) with the
//     silverskin line and the schemBean crease glow
//   5 measurement: length bracket along the bean axis, thermometer scale x 900 y 620..1300 with its schemBean level
//     rising to the first-crack tick
//   6 network: vapour and CO2 node glyphs on the left, linked to the bean
//   7 events: magenta flash ring on the crack (12 frames), four chaff shards, two follow-up cracks, progress glyph
(function () {
  'use strict';

  const ID = 'first-crack';
  const L = FILM.lib;
  const P = L.pal;
  const E = L.ease;
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const FR = 1 / 24;

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => {
    const u = clamp((x - a) / (b - a));
    return u * u * (3 - 2 * u);
  };
  const sd = (...k) => L.hash(ID, ...k) & 0x7fffffff;

  const LAV = P.lavender, WHITE = P.lineWhite, MAG = P.magenta, BEAN = P.schemBean, PALE = P.paleBlue;
  const NAVY_D = P.navyDeep, NAVY_L = P.navyLight, GLOW = P.glow;

  // ---------------------------------------------------------------------------
  // Beats (shot-local; global T in comments)
  // ---------------------------------------------------------------------------
  const B_CRACK = 0.75; // T 27.75 first crack
  const B_POP2 = 1.125; // T 28.125 follow-up crack (8th)
  const B_POP3 = 1.25; // T 28.25 follow-up crack (8th-triplet)

  // ---------------------------------------------------------------------------
  // G1 (copied from docs/storyboard.md, Shared geometry)
  // ---------------------------------------------------------------------------
  const G1C = [540, 900];
  const G1_ROT = -15 * DEG; // top leans left
  const G1_A = 170, G1_B = 240, G1_EXP = 2.3, G1_N = 96;
  const CREASE = [[548, 682], [531, 750], [536, 826], [552, 900], [547, 976], [530, 1052], [538, 1118]];
  const SILVER = [[546, 700], [538, 1100]];
  // upright local outline (dx, dy about the centre), 96 points
  const OUT_LOCAL = (() => {
    const out = [];
    const e = 2 / G1_EXP;
    for (let i = 0; i < G1_N; i++) {
      const a = (i / G1_N) * TAU;
      const c = Math.cos(a), s = Math.sin(a);
      const dy = G1_B * Math.sign(s) * Math.pow(Math.abs(s), e);
      const dx = G1_A * Math.sign(c) * Math.pow(Math.abs(c), e) * (1 - (0.06 * (1 - dy / G1_B)) / 2);
      out.push([dx, dy]);
    }
    return out;
  })();
  // half-width of the upright outline at height dy (for the fitted lattice)
  function halfW(dy) {
    const v = clamp(Math.abs(dy) / G1_B, 0, 0.99999);
    const w = G1_A * Math.pow(1 - Math.pow(v, G1_EXP), 1 / G1_EXP);
    return w * (1 - (0.06 * (1 - dy / G1_B)) / 2);
  }
  // crease centre x (local) at height dy, by linear interpolation of the storyboard points
  const CRL = CREASE.map(([x, y]) => [x - 540, y - 900]);
  function creaseX(dy) {
    if (dy <= CRL[0][1]) return CRL[0][0];
    for (let i = 0; i < CRL.length - 1; i++) if (dy <= CRL[i + 1][1]) return lerp(CRL[i][0], CRL[i + 1][0], (dy - CRL[i][1]) / (CRL[i + 1][1] - CRL[i][1]));
    return CRL[CRL.length - 1][0];
  }
  const COS = Math.cos(G1_ROT), SIN = Math.sin(G1_ROT);
  // local (dx, dy) -> screen at scale s
  const tf = (dx, dy, s) => [G1C[0] + (dx * COS - dy * SIN) * s, G1C[1] + (dx * SIN + dy * COS) * s];
  const tfPts = (pts, s) => pts.map(([x, y]) => tf(x, y, s));

  // per-boil wobble along the normal of a closed or open polyline
  function wob(pts, seed, amp, bi, closed) {
    const n = pts.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      const pa = closed ? a : pts[Math.max(0, i - 1)], pb = closed ? b : pts[Math.min(n - 1, i + 1)];
      let tx = pb[0] - pa[0], ty = pb[1] - pa[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      const d = amp * L.noise1(i * 0.21 + bi * 1.7, seed);
      out[i] = [pts[i][0] - ty * d, pts[i][1] + tx * d];
    }
    return out;
  }
  function insetPoly(pts, d) {
    // offset a closed counter-clockwise-or-not polygon toward its centroid side by d
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; }
    cx /= n; cy /= n;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      let nx = -ty / tl, ny = tx / tl;
      if ((pts[i][0] - cx) * nx + (pts[i][1] - cy) * ny > 0) { nx = -nx; ny = -ny; }
      out.push([pts[i][0] + nx * d, pts[i][1] + ny * d]);
    }
    return out;
  }
  const strokePts = (ctx, pts, closed, color, alpha, width, dash) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha *= alpha;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    L.tracePath(ctx, pts, closed);
    ctx.stroke();
    ctx.restore();
  };
  function ribbon(cl, wFn) {
    const n = cl.length;
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      const w = wFn(i / (n - 1)) / 2;
      left.push([cl[i][0] - ty * w, cl[i][1] + tx * w]);
      right.push([cl[i][0] + ty * w, cl[i][1] - tx * w]);
    }
    return { left, right, poly: left.concat(right.slice().reverse()) };
  }

  // ---------------------------------------------------------------------------
  // Progress glyph: canonical, copied verbatim from docs/storyboard.md.
  // ---------------------------------------------------------------------------
  // Progress glyph: canonical, copied verbatim from docs/storyboard.md.
  function progressGlyph(ctx, L, stage, u, T, allLit) {
    const P = L.pal, cx = 900, cy = 300, r = 46, gap = 6 * Math.PI / 180;
    const q = Math.PI / 2, pop = L.clamp(u * 6);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.5; ctx.strokeStyle = P.lavender; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a0 = -q + i * q + gap / 2, a1 = a0 + q - gap;
      const past = allLit || i < stage, cur = !allLit && i === stage;
      ctx.globalAlpha = past ? 0.6 : 0.18;
      ctx.strokeStyle = P.lavender; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
      if (cur || allLit) {
        const k = allLit ? 1 : L.clamp(u);
        const ae = a0 + (a1 - a0) * k;
        ctx.globalAlpha = 1; ctx.strokeStyle = P.lineWhite; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, r, a0, ae); ctx.stroke();
        if (cur) L.glowDot(ctx, cx + Math.cos(ae) * r, cy + Math.sin(ae) * r, 4 + 2 * pop, { rays: 0, glow: 3.5, intensity: 0.8 });
      }
    }
    ctx.globalAlpha = 0.7; ctx.fillStyle = P.lineWhite;
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Geometry tables (t-independent)
  // ---------------------------------------------------------------------------
  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const g = {};
    g.crease = L.smoothPts(CRL, false, 4);
    g.silver = L.smoothPts(SILVER.map(([x, y]) => [x - 540, y - 900]), false, 6).map(([x, y]) => [creaseX(y) - 1, y]);
    // fitted lattice: 19 columns across, 40 rows along; cells are 18 x 12 at the bean's waist
    g.cells = [];
    const rows = 40, cols = 19;
    for (let j = 0; j < rows; j++) {
      const v0 = -1 + (2 * j) / rows, v1 = -1 + (2 * (j + 1)) / rows;
      const dy0 = v0 * (G1_B - 16), dy1 = v1 * (G1_B - 16);
      for (let i = 0; i < cols; i++) {
        const u0 = -1 + (2 * i) / cols, u1 = -1 + (2 * (i + 1)) / cols;
        const corner = (u, dy) => [u * (halfW(dy) - 14), dy];
        const c = [corner(u0, dy0), corner(u1, dy0), corner(u1, dy1), corner(u0, dy1)];
        const mx = (c[0][0] + c[1][0] + c[2][0] + c[3][0]) / 4, my = (dy0 + dy1) / 2;
        const w = Math.abs(c[1][0] - c[0][0]);
        if (w < 4) continue;
        if (Math.abs(mx - creaseX(my)) < 14 + w * 0.5) continue;
        g.cells.push({ c, mx, my, k: L.h3(i, j, sd('cell') & 0xffff), side: mx < creaseX(my) ? -1 : 1 });
      }
    }
    // CO2 glow dots in the cells
    const r = L.rng(sd('co2'));
    g.co2 = [];
    let guard = 0;
    while (g.co2.length < 9 && guard++ < 4000) {
      const dy = r.range(-190, 190);
      const dx = r.range(-1, 1) * (halfW(dy) - 40);
      if (Math.abs(dx - creaseX(dy)) < 40) continue;
      if (g.co2.some((q) => Math.hypot(q.dx - dx, q.dy - dy) < 70)) continue;
      g.co2.push({ dx, dy, t0: r.range(-0.2, 0.7), ph: r.range(0, TAU) });
    }
    // heat lines round the bean
    const h = L.rng(sd('heat'));
    g.heat = [];
    const xs = [150, 205, 262, 318, 772, 826, 884, 940, 400, 470, 610, 680];
    for (let i = 0; i < xs.length; i++) {
      const low = i >= 8;
      g.heat.push({ x: xs[i] + h.range(-14, 14), y0: low ? h.range(1300, 1420) : h.range(1180, 1480), len: low ? h.range(120, 200) : h.range(300, 520), spd: h.range(180, 320), ph: h.range(0, 1), amp: h.range(6, 12), k: h.range(0.025, 0.04) });
    }
    // chaff shards from the crease (u along the crease, side)
    g.shards = [[0.24, 1], [0.42, -1], [0.6, 1], [0.8, -1]].map(([u, side], i) => ({ u, side, dist: 150 + 40 * L.h3(i, 1, 5), spin: (L.h3(i, 2, 5) - 0.5) * 9, w: 16 + 6 * L.h3(i, 3, 5) }));
    // follow-up crack sites on the outline (indices into the 96-point outline)
    g.pops = [{ i: 18, t: B_POP2 }, { i: 70, t: B_POP3 }];
    GEO = g;
    return g;
  }

  // ---------------------------------------------------------------------------
  // Timing
  // ---------------------------------------------------------------------------
  const hit = (t, a, frames, e, lead = 1) => (t < a ? 0 : (e || ((u) => u))(clamp((t - a) / (frames * FR) + lead / frames)));
  function scaleAt(t) {
    const tw = L.onTwos(t);
    let s = 1 + 0.15 * E.inOutSine(clamp(tw / B_CRACK));
    s += 0.1 * hit(t, B_CRACK, 3, E.outBack);
    s += 0.03 * hit(t, B_POP2, 3, E.outBack);
    s += 0.02 * hit(t, B_POP3, 3, E.outBack);
    return s;
  }

  // ---------------------------------------------------------------------------
  // Layers
  // ---------------------------------------------------------------------------
  function drawGuides(ctx, t, s) {
    const rot = t * 4 * DEG;
    L.guideCircle(ctx, G1C[0], G1C[1], 430, { alpha: 0.16, cross: 0 });
    L.guideCircle(ctx, G1C[0], G1C[1], 372, { alpha: 0.12, dash: [4, 10] });
    L.ticks(ctx, G1C[0], G1C[1], { r: 430, n: 72, len: 10, major: 6, majorLen: 20, rot, alpha: 0.35 });
    // bean axis
    const a = tf(0, -300, 1), b = tf(0, 300, 1);
    strokePts(ctx, [a, b], false, LAV, 0.14, 1, [10, 8]);
    const c = tf(-230, 0, 1), d = tf(230, 0, 1);
    strokePts(ctx, [c, d], false, LAV, 0.12, 1, [10, 8]);
    // quadrant marks
    ctx.save();
    ctx.strokeStyle = LAV;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) {
      const an = rot * 2 + (k * Math.PI) / 2 + G1_ROT;
      ctx.beginPath();
      ctx.arc(G1C[0], G1C[1], 470, an - 0.08, an + 0.08);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHeat(ctx, t, G, bi) {
    ctx.save();
    ctx.strokeStyle = BEAN;
    ctx.lineCap = 'round';
    const heat = 0.55 + 0.45 * sstep(0, B_CRACK, t);
    for (let i = 0; i < G.heat.length; i++) {
      const h = G.heat[i];
      const u = (t * h.spd / h.len + h.ph) % 1;
      const yb = h.y0 - u * h.len * 0.9;
      const len = h.len * 0.55;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 * heat * Math.sin(Math.PI * u);
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const y = yb - (k / 30) * len;
        const x = h.x + Math.sin(y * h.k + t * 7 + i + bi * 0.6) * h.amp * (0.6 + 0.4 * (k / 30));
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLattice(ctx, t, s, G, bi) {
    const path = new Path2D();
    const lit = new Path2D();
    const heat = sstep(0.1, B_CRACK, t);
    const jit = (x, y, k) => [x + (L.h3(Math.round(x), Math.round(y), bi + k) - 0.5) * 0.8, y + (L.h3(Math.round(y), Math.round(x), bi + k + 9) - 0.5) * 0.8];
    for (const cell of G.cells) {
      // inset each cell by 1.5 px (screen) toward its centre
      const pts = cell.c.map(([x, y]) => {
        const dx = x - cell.mx, dy = y - cell.my;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.max(0, 1 - 1.5 / s / d);
        return tf(cell.mx + dx * k, cell.my + dy * k, s);
      });
      const q = pts.map((p, i) => jit(p[0], p[1], i));
      path.moveTo(q[0][0], q[0][1]);
      for (let i = 1; i < 4; i++) path.lineTo(q[i][0], q[i][1]);
      path.closePath();
      if (cell.k < heat * 0.32) {
        lit.moveTo(q[0][0], q[0][1]);
        for (let i = 1; i < 4; i++) lit.lineTo(q[i][0], q[i][1]);
        lit.closePath();
      }
    }
    ctx.save();
    ctx.fillStyle = LAV;
    ctx.globalAlpha = 0.07;
    ctx.fill(lit);
    ctx.strokeStyle = LAV;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.36;
    ctx.stroke(path);
    ctx.restore();
  }

  function drawCO2(ctx, t, s, G) {
    const crackK = hit(t, B_CRACK, 12, (u) => 1 - u);
    for (let i = 0; i < G.co2.length; i++) {
      const c = G.co2[i];
      const on = sstep(c.t0, c.t0 + 0.3, t);
      if (on <= 0) continue;
      const [x, y] = tf(c.dx, c.dy, s);
      const r = (3 + 2.5 * on + 2 * (t >= B_CRACK ? 1 : 0)) * (1 + 0.15 * Math.sin(t * 9 + c.ph));
      L.glowDot(ctx, x, y, r, { rays: t >= B_CRACK ? 8 : 0, rayLen: 2.6, glow: 4, intensity: 0.55 * on + 0.45 * crackK, seed: sd('co2', i) });
    }
  }

  function drawBean(ctx, t, s, G, bi) {
    const out = tfPts(OUT_LOCAL, s);
    const outer = wob(out, sd('outer'), 1.1, bi, true);
    const inner = wob(insetPoly(out, 9), sd('inner'), 0.9, bi, true);
    // panel tint inside the outline so the lattice reads as a body
    ctx.save();
    ctx.fillStyle = NAVY_L;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    L.tracePath(ctx, out, true);
    ctx.fill();
    ctx.restore();
    // lattice clipped to the inner outline
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, inner, true);
    ctx.clip();
    drawLattice(ctx, t, s, G, bi);
    ctx.restore();
    drawCO2(ctx, t, s, G);
    strokePts(ctx, outer, true, LAV, 0.85, 2.5);
    strokePts(ctx, inner, true, LAV, 0.5, 1.5);
    // rim ticks along the outer outline (shell structure)
    const rt = new Path2D();
    for (let i = 0; i < G1_N; i += 2) {
      const p = out[i], q = out[(i + 1) % G1_N];
      let tx = q[0] - p[0], ty = q[1] - p[1];
      const tl = Math.hypot(tx, ty) || 1;
      const nx = -ty / tl, ny = tx / tl;
      const sgn = (G1C[0] - p[0]) * nx + (G1C[1] - p[1]) * ny > 0 ? 1 : -1;
      rt.moveTo(p[0] + nx * sgn * 2, p[1] + ny * sgn * 2);
      rt.lineTo(p[0] + nx * sgn * 7, p[1] + ny * sgn * 7);
    }
    ctx.save();
    ctx.strokeStyle = LAV;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.stroke(rt);
    ctx.restore();
    drawCrease(ctx, t, s, G, bi);
    // follow-up crack scars on the outline
    for (const pp of G.pops) {
      if (t + FR < pp.t) continue;
      const k = hit(t, pp.t, 3, E.outBack);
      const p = out[pp.i];
      const dir = Math.atan2(p[1] - G1C[1], p[0] - G1C[0]) + Math.PI;
      const z = [];
      for (let m = 0; m <= 4; m++) {
        const d = m * 9 * k;
        const off = (m % 2 ? 4 : -4) * k;
        z.push([p[0] + Math.cos(dir) * d - Math.sin(dir) * off, p[1] + Math.sin(dir) * d + Math.cos(dir) * off]);
      }
      strokePts(ctx, z, false, WHITE, 0.85, 1.5);
    }
  }

  function drawCrease(ctx, t, s, G, bi) {
    const cl = wob(tfPts(G.crease, s), sd('crease'), 0.8, bi, false);
    const open = hit(t, B_CRACK, 3, E.outBack);
    const W = 12 + 14 * open;
    const rb = ribbon(cl, (u) => 3 + (W - 3) * Math.pow(Math.sin(Math.PI * u), 0.6));
    const glow = sstep(0.3, B_CRACK, t) * 0.5 + 0.5 * open;
    // crease glow (schemBean), soft and additive
    if (glow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = BEAN;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [w, a] of [[34, 0.06], [20, 0.1], [10, 0.16]]) {
        ctx.globalAlpha = a * glow;
        ctx.lineWidth = w + W * 0.6;
        ctx.beginPath();
        L.tracePath(ctx, cl, false);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (open <= 0) {
      // closed groove: a 12 px lineWhite groove tapering to 3 px
      ctx.save();
      ctx.fillStyle = WHITE;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      L.tracePath(ctx, rb.poly, true);
      ctx.fill();
      ctx.restore();
    } else {
      // split open: dark gap with white lips
      ctx.save();
      ctx.fillStyle = NAVY_D;
      ctx.beginPath();
      L.tracePath(ctx, rb.poly, true);
      ctx.fill();
      ctx.restore();
      strokePts(ctx, rb.left, false, WHITE, 0.9, 2.5);
      strokePts(ctx, rb.right, false, WHITE, 0.9, 2.5);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      strokePts(ctx, cl.slice(4, cl.length - 4), false, BEAN, 0.8 * glow, 3);
      ctx.restore();
      // torn fibres across the gap
      const fib = new Path2D();
      for (let i = 6; i < rb.left.length - 6; i += 5) {
        const a = rb.left[i], b = rb.right[i];
        const j = L.h3(i, bi, 3) - 0.5;
        fib.moveTo(a[0], a[1]);
        fib.lineTo(lerp(a[0], b[0], 0.35 + j * 0.2), lerp(a[1], b[1], 0.35 + j * 0.2));
      }
      ctx.save();
      ctx.strokeStyle = LAV;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      ctx.stroke(fib);
      ctx.restore();
    }
    // silverskin line inside the groove
    const sv = wob(tfPts(G.silver, s), sd('silver'), 0.6, bi, false);
    strokePts(ctx, sv, false, PALE, open > 0 ? 0.9 : 0.75, 3);
  }

  function drawGhost(ctx, t, s, bi) {
    const g = sstep(0.15, 0.45, t);
    if (g <= 0) return;
    const pts = wob(tfPts(OUT_LOCAL, 1), sd('ghost'), 0.8, bi, true);
    strokePts(ctx, pts, true, LAV, 0.3 * g, 1.5, [8, 9]);
  }

  function drawLengthBracket(ctx, t, s) {
    // dimension bracket along the bean's axis, to its left, measuring the swelling length
    const top = tf(0, -G1_B, s), bot = tf(0, G1_B, s);
    const off = -(G1_A * s + 46);
    const nx = COS, ny = SIN; // local +x direction on screen
    const a = [top[0] + nx * off, top[1] + ny * off], b = [bot[0] + nx * off, bot[1] + ny * off];
    L.bracket(ctx, a[0], a[1], b[0], b[1], { style: 'dim', cap: 16, alpha: 0.6, width: 1.5, p: E.outExpo(clamp(t / (6 * FR) + 1 / 6)) });
    // ghost length (scale 1.00) as a faint second bracket
    const top1 = tf(0, -G1_B, 1), bot1 = tf(0, G1_B, 1);
    const off1 = off - 26;
    L.bracket(ctx, top1[0] + nx * off1, top1[1] + ny * off1, bot1[0] + nx * off1, bot1[1] + ny * off1, { style: 'square', cap: 10, alpha: 0.28, width: 1 });
    // width bracket below
    const l = tf(-halfW(0), 0, s), r = tf(halfW(0), 0, s);
    const dn = G1_B * s * 0 + 0;
    const ux = -SIN, uy = COS; // local +y direction
    const o2 = G1_B * s + 40;
    const pa = [G1C[0] + (l[0] - G1C[0]) + ux * o2, G1C[1] + (l[1] - G1C[1]) + uy * o2];
    const pb = [G1C[0] + (r[0] - G1C[0]) + ux * o2, G1C[1] + (r[1] - G1C[1]) + uy * o2];
    L.bracket(ctx, pa[0] + dn, pa[1], pb[0], pb[1], { style: 'dim', cap: 14, alpha: 0.5, width: 1.5 });
  }

  // thermometer: x 900, y 620..1300, level rising to the first-crack tick
  const TH_X = 900, TH_TOP = 620, TH_BOT = 1300, TH_MARK = 760;
  function drawThermo(ctx, t, bi) {
    L.ticks(ctx, TH_X - 6, TH_BOT, { kind: 'linear', length: TH_BOT - TH_TOP, angle: -Math.PI / 2, n: 34, len: 10, major: 5, majorLen: 18, side: -1, alpha: 0.6, baseline: false });
    L.bracket(ctx, TH_X + 22, TH_TOP, TH_X + 22, TH_BOT, { style: 'square', cap: 16, offset: 0, alpha: 0.6 });
    // tube
    strokePts(ctx, [[TH_X - 7, TH_BOT + 6], [TH_X - 7, TH_TOP - 6]], false, LAV, 0.5, 1.5);
    strokePts(ctx, [[TH_X + 7, TH_BOT + 6], [TH_X + 7, TH_TOP - 6]], false, LAV, 0.5, 1.5);
    ctx.save();
    ctx.strokeStyle = LAV;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(TH_X, TH_BOT + 26, 20, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(TH_X, TH_BOT + 26, 13, 0, TAU);
    ctx.stroke();
    ctx.restore();
    // level: rises on twos to the mark by the crack, creeps on after
    const tw = L.onTwos(t);
    const yl = tw < B_CRACK ? lerp(1236, TH_MARK, E.inOutSine(tw / B_CRACK)) : lerp(TH_MARK, 712, E.outQuad((tw - B_CRACK) / 0.75));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = BEAN;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(TH_X, TH_BOT + 10);
    ctx.lineTo(TH_X, yl);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    L.glowDot(ctx, TH_X, TH_BOT + 26, 8, { color: BEAN, core: GLOW, rays: 0, glow: 2.6, intensity: 0.8, seed: sd('bulb') });
    L.glowDot(ctx, TH_X, yl, 3.5, { color: BEAN, rays: 0, glow: 3, intensity: 0.9, seed: sd('meniscus') });
    // the first-crack mark: a long tick with a pointer
    const flash = t >= B_CRACK - FR ? 1 - hit(t, B_CRACK, 12) : 0;
    const mc = flash > 0 ? MAG : WHITE;
    ctx.save();
    ctx.strokeStyle = mc;
    ctx.fillStyle = mc;
    ctx.globalAlpha = flash > 0 ? 1 : 0.85;
    ctx.lineWidth = flash > 0 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(TH_X - 40, TH_MARK);
    ctx.lineTo(TH_X + 14, TH_MARK);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(TH_X - 52, TH_MARK);
    ctx.lineTo(TH_X - 64, TH_MARK - 8);
    ctx.lineTo(TH_X - 64, TH_MARK + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (flash > 0) {
      ctx.save();
      ctx.strokeStyle = MAG;
      ctx.globalAlpha = flash;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(TH_X, TH_MARK, 12 + 30 * E.outExpo(1 - flash), 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  // network nodes: vapour leaving (upper left) and CO2 building (lower left)
  function drawNodes(ctx, t, s, bi) {
    const nodes = [
      { x: 162, y: 520, r: 54, from: [-150, -140], kind: 'vapour' },
      { x: 162, y: 1350, r: 54, from: [-120, 150], kind: 'co2' },
    ];
    for (const n of nodes) {
      const src = tf(n.from[0], n.from[1], s);
      // curved link
      const mx = (src[0] + n.x) / 2 - 20, my = (src[1] + n.y) / 2;
      ctx.save();
      ctx.strokeStyle = LAV;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(src[0], src[1]);
      ctx.quadraticCurveTo(mx - 40, my, n.x + (src[0] > n.x ? n.r : -n.r) * 0.7, n.y + (src[1] > n.y ? n.r : -n.r) * 0.7);
      ctx.stroke();
      // travelling pulse along the link
      const u = (t * 0.9 + (n.kind === 'co2' ? 0.5 : 0)) % 1;
      const ex = n.x + (src[0] > n.x ? n.r : -n.r) * 0.7, ey = n.y + (src[1] > n.y ? n.r : -n.r) * 0.7;
      const v = 1 - u;
      const px = v * v * src[0] + 2 * v * u * (mx - 40) + u * u * ex;
      const py = v * v * src[1] + 2 * v * u * my + u * u * ey;
      ctx.restore();
      L.glowDot(ctx, px, py, 2.6, { rays: 0, glow: 3, intensity: 0.7, seed: sd('pulse', n.kind) });
      ctx.save();
      ctx.fillStyle = LAV;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(src[0], src[1], 3.5, 0, TAU);
      ctx.fill();
      ctx.restore();
      // node glyph: double ring
      ctx.save();
      ctx.fillStyle = NAVY_L;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, TAU);
      ctx.fill();
      ctx.restore();
      strokePts(ctx, wob(L.ellipsePts(n.x, n.y, n.r, n.r, 48), sd('node', n.kind), 0.7, bi, true), true, LAV, 0.85, 2.5);
      strokePts(ctx, L.ellipsePts(n.x, n.y, n.r - 9, n.r - 9, 40), true, LAV, 0.5, 1.5);
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r - 11, 0, TAU);
      ctx.clip();
      if (n.kind === 'vapour') {
        // three rising wavy strands leaving the node
        ctx.strokeStyle = LAV;
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.5;
        for (let k = -1; k <= 1; k++) {
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          for (let m = 0; m <= 16; m++) {
            const yy = n.y + 30 - m * 4;
            const xx = n.x + k * 13 + Math.sin(m * 0.7 + t * 8 + k) * 4;
            if (m === 0) ctx.moveTo(xx, yy);
            else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        }
      } else {
        // gas bubbles gathering: ring outlines growing with the heat
        const g = 0.4 + 0.6 * sstep(0, B_CRACK, t);
        ctx.strokeStyle = LAV;
        ctx.lineWidth = 1.3;
        ctx.globalAlpha = 0.8;
        for (let k = 0; k < 9; k++) {
          const a = k * 2.4 + 0.3;
          const rr = 8 + (k % 3) * 9;
          const bx = n.x + Math.cos(a) * rr, by = n.y + Math.sin(a) * rr;
          ctx.beginPath();
          ctx.arc(bx, by, (3 + (k % 4)) * g, 0, TAU);
          ctx.stroke();
        }
      }
      ctx.restore();
      L.ticks(ctx, n.x, n.y, { r: n.r + 6, n: 16, len: 6, alpha: 0.4, rot: t * 0.3 });
    }
  }


  // magnified inset of three cells swelling (18 x 12 -> 24 x 16), linked to the bean's lower end
  function drawInset(ctx, t, s, bi) {
    const x = 540, y = 1436, r = 66;
    const src = tf(40, 200, s);
    ctx.save();
    ctx.strokeStyle = LAV;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(src[0], src[1]);
    ctx.lineTo(x, y - r);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = NAVY_L;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = LAV;
    ctx.beginPath();
    ctx.arc(src[0], src[1], 14, 0, TAU);
    ctx.stroke();
    ctx.restore();
    strokePts(ctx, wob(L.ellipsePts(x, y, r, r, 48), sd('inset'), 0.7, bi, true), true, LAV, 0.85, 2.5);
    strokePts(ctx, L.ellipsePts(x, y, r - 9, r - 9, 40), true, LAV, 0.5, 1.5);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r - 11, 0, TAU);
    ctx.clip();
    // 3 x 3 cells at 2.2x magnification; walls thin as they stretch
    const k = 2.2 * s;
    const cw = 18 * k * 0.62, ch = 12 * k * 0.62;
    const p = new Path2D();
    for (let j = -2; j <= 2; j++) {
      for (let i = -2; i <= 2; i++) {
        const cx = x + i * cw, cy = y + j * ch + (i % 2 ? ch * 0.5 : 0);
        const ins = 2.2;
        p.moveTo(cx - cw / 2 + ins, cy - ch / 2 + ins);
        p.lineTo(cx + cw / 2 - ins, cy - ch / 2 + ins);
        p.lineTo(cx + cw / 2 - ins, cy + ch / 2 - ins);
        p.lineTo(cx - cw / 2 + ins, cy + ch / 2 - ins);
        p.closePath();
      }
    }
    ctx.strokeStyle = LAV;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    ctx.stroke(p);
    // gas inside the centre cells
    const g = sstep(0, B_CRACK, t);
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.2;
    for (let m = 0; m < 5; m++) {
      const a = m * 1.9 + 0.4;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 6, 2 + 3 * g * ((m % 2) + 0.5), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    // scale ticks under the inset: before (faint) and now
    L.bracket(ctx, x - (18 * 2.2 * 0.62) / 2, y + r + 18, x + (18 * 2.2 * 0.62) / 2, y + r + 18, { style: 'square', cap: 8, alpha: 0.3, width: 1 });
    L.bracket(ctx, x - cw / 2, y + r + 30, x + cw / 2, y + r + 30, { style: 'dim', cap: 10, alpha: 0.6 });
  }

  // the heat source below the frame's safe area: schematic burner glyphs and rising arrows (schemBean)
  function drawBurner(ctx, t, bi) {
    ctx.save();
    ctx.strokeStyle = LAV;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(150, 1650);
    ctx.lineTo(930, 1650);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 9; i++) {
      const x = 180 + i * 90;
      const f = 0.85 + 0.15 * Math.sin(bi * 1.3 + i * 2.1);
      const pts = [];
      for (let m = 0; m <= 16; m++) {
        const a = (m / 16) * TAU;
        const top = (1 + Math.cos(a)) / 2;
        pts.push([x + 13 * Math.sin(a) * (0.55 + 0.45 * (1 - top)), 1640 - 46 * f * top]);
      }
      strokePts(ctx, pts, true, LAV, 0.6, 1.5);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      strokePts(ctx, pts.map(([px, py]) => [x + (px - x) * 0.45, 1640 - (1640 - py) * 0.55]), true, BEAN, 0.7, 1.5);
      ctx.restore();
      // rising heat arrow
      const u = (t * 1.6 + i * 0.37) % 1;
      const y0 = 1580 - u * 70;
      ctx.save();
      ctx.strokeStyle = BEAN;
      ctx.globalAlpha = 0.7 * Math.sin(Math.PI * u);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y0 - 30);
      ctx.moveTo(x - 7, y0 - 22);
      ctx.lineTo(x, y0 - 30);
      ctx.lineTo(x + 7, y0 - 22);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEvents(ctx, t, s, G) {
    const mid = tf(552 - 540, 0, s);
    // the flash ring: 40 -> 260 px over 12 frames
    if (t >= B_CRACK - FR && t < B_CRACK + 12 * FR) {
      const u = hit(t, B_CRACK, 12);
      ctx.save();
      ctx.strokeStyle = MAG;
      ctx.globalAlpha = 1 - u;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(mid[0], mid[1], 40 + 220 * E.outExpo(u), 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = (1 - u) * 0.6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mid[0], mid[1], 30 + 120 * E.outExpo(u), 0, TAU);
      ctx.stroke();
      // radial burst ticks
      ctx.globalAlpha = 1 - u;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * TAU + 0.13;
        const r0 = 60 + 150 * E.outExpo(u), r1 = r0 + 26 * (1 - u);
        ctx.beginPath();
        ctx.moveTo(mid[0] + Math.cos(a) * r0, mid[1] + Math.sin(a) * r0);
        ctx.lineTo(mid[0] + Math.cos(a) * r1, mid[1] + Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.restore();
    }
    // four chaff shards fly out of the crease, then drift and fade
    if (t >= B_CRACK - FR) {
      const cl = tfPts(G.crease, s);
      const k = hit(t, B_CRACK, 12, E.outCubic);
      const drift = Math.max(0, t - B_CRACK - 0.5);
      for (const sh of G.shards) {
        const i = Math.round(sh.u * (cl.length - 1));
        const a = cl[Math.max(0, i - 1)], b = cl[Math.min(cl.length - 1, i + 1)];
        let tx = b[0] - a[0], ty = b[1] - a[1];
        const tl = Math.hypot(tx, ty) || 1;
        const nx = (-ty / tl) * sh.side, ny = (tx / tl) * sh.side;
        const d = sh.dist * k + 40 * drift;
        const x = cl[i][0] + nx * d, y = cl[i][1] + ny * d - 30 * drift;
        const rot = sh.spin * (k + drift);
        const w = sh.w, h = w * 0.45;
        const pts = [[-w / 2, 0], [-w * 0.1, -h], [w / 2, -h * 0.2], [w * 0.15, h * 0.7]].map(([px, py]) => [x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)]);
        const fade = 1 - sstep(0.9, 1.5, t);
        strokePts(ctx, pts, true, WHITE, 0.9 * fade + 0.25, 1.5);
        ctx.save();
        ctx.fillStyle = LAV;
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        L.tracePath(ctx, pts, true);
        ctx.fill();
        ctx.restore();
        // short motion trail while flying
        if (k < 1) strokePts(ctx, [[cl[i][0] + nx * d * 0.5, cl[i][1] + ny * d * 0.5], [x, y]], false, LAV, 0.5 * (1 - k), 1);
      }
    }
    // follow-up cracks: small magenta rings at outline sites (8 frames each)
    const out = tfPts(OUT_LOCAL, s);
    for (const pp of G.pops) {
      if (t < pp.t - FR || t > pp.t + 8 * FR) continue;
      const u = hit(t, pp.t, 8);
      const p = out[pp.i];
      ctx.save();
      ctx.strokeStyle = MAG;
      ctx.globalAlpha = 1 - u;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 10 + 60 * E.outExpo(u), 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const t = clamp(tIn, 0, info.dur);
      const bi = L.boil(info.T);
      const G = geo();
      const s = scaleAt(t);

      L.blueprint(ctx, { center: [540, 900], circles: 4, diagonals: 5, seed: sd('plate') & 0xffff });
      drawGuides(ctx, t, s);
      drawBurner(ctx, t, bi);
      drawHeat(ctx, t, G, bi);
      drawGhost(ctx, t, s, bi);
      drawBean(ctx, t, s, G, bi);
      drawLengthBracket(ctx, t, s);
      drawThermo(ctx, t, bi);
      drawNodes(ctx, t, s, bi);
      drawInset(ctx, t, s, bi);
      drawEvents(ctx, t, s, G);
      progressGlyph(ctx, L, 2, info.p, info.T, false);
    },
  });
})();
