// 08 cherry-cutaway : Skin, pulp, honey, parchment.  T 14.25 to 16.50 (54 frames), schematic, hard cut.
// The shot opens on the exact G2 cherry outline (oval centred (540, 900), rx 260, ry 290, calyx scar
// disc r 34 at (540, 1172), gloss crescent at 200..250 degrees inset 40) as a double lavender line.
// T 14.625 (8th): a lineWhite section line slices down the middle with a magenta flash (12 frames).
// T 15.00 (beat): the halves part 60 px each side (outBack, 3 frames) and the layers draw on from the
// outside in, one per 8th-triplet: skin, pulp, mucilage, parchment, then silverskin and the two beans
// flat face to flat face (T 15.00, 15.25, 15.50, 15.75, 16.00). Each layer wires to its node glyph.
//
// Layers, back to front:
//   1 blueprint plate, guide circles, tick rings, diagonals, registration marks
//   2 measurement: height bracket, tick ruler, width bracket (after the split)
//   3 the two halves (clipped half-planes, each translated): section layers, then the outline
//   4 section line and the magenta slice flash
//   5 network: curved lines from layer anchors to five node glyphs with layer icons
//   6 progress glyph (stage 1 cosecha, u = p), copied verbatim from docs/storyboard.md
(function () {
  'use strict';

  const ID = 'cherry-cutaway';
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

  // G2 (storyboard, shared geometry)
  const CX = 540, CY = 900, RX = 260, RY = 290;
  const CALYX = [540, 1172], CALYX_R = 34;

  // beats (shot-local seconds)
  const B_SLICE = 0.375; // T 14.625
  const B_SPLIT = 0.75; // T 15.000
  const B_LAYER = [0.75, 1.0, 1.25, 1.5, 1.75]; // T 15.00 .. 16.00, one per 8th-triplet
  const PART = 60;

  // layer insets (px from the G2 outline)
  const D_SKIN = 9, D_PULP = 64, D_MUC = 78, D_PARCH = 86;

  // nodes: skin, pulp, mucilage on the left; parchment, bean on the right
  const NODES = [
    { x: 130, y: 620, side: -1 },
    { x: 130, y: 900, side: -1 },
    { x: 130, y: 1180, side: -1 },
    { x: 885, y: 760, side: 1 },
    { x: 885, y: 1080, side: 1 },
  ];

  // ---------------------------------------------------------------------------
  // geometry (t-independent, built once)
  // ---------------------------------------------------------------------------
  const oval = (d, n = 160) => LIB.ellipsePts(CX, CY, RX - d, RY - d, n);
  const ovalAt = (d, a) => [CX + Math.cos(a) * (RX - d), CY + Math.sin(a) * (RY - d)];

  let GEO = null;
  function geo(L) {
    if (GEO) return GEO;
    const outer = oval(0);
    const inner9 = oval(D_SKIN);
    const pulpIn = oval(D_PULP);
    const mucIn = oval(D_MUC);
    const parchIn = oval(D_PARCH);
    // the beans: half-ovals in the cavity, flat faces 10 px apart, a crease fold in each flat face
    const BR = { rx: RX - D_PARCH - 8, ry: RY - D_PARCH - 8 };
    const left = [];
    // flat face from the top down to the crease, the fold, then down to the bottom
    const xF = 535;
    const yTop = CY - BR.ry * Math.sqrt(1 - Math.pow((xF - CX) / BR.rx, 2)) + 10;
    const yBot = CY + BR.ry * Math.sqrt(1 - Math.pow((xF - CX) / BR.rx, 2)) - 10;
    // rounded back: oval points from the bottom (x just left of the face) round to the top
    const aB = Math.acos((xF - 10 - CX) / BR.rx);
    for (let i = 0; i <= 60; i++) {
      const a = aB + (i / 60) * (TAU - 2 * aB);
      left.push([CX + Math.cos(a) * BR.rx, CY + Math.sin(a) * BR.ry]);
    }
    // top corner, flat face, crease fold, flat face, bottom corner
    left.push([xF - 3, yTop + 6], [xF, yTop + 30], [xF, CY - 60], [xF, CY - 20]);
    left.push([xF - 14, CY - 16], [xF - 30, CY - 6], [xF - 34, CY + 10], [xF - 24, CY + 20], [xF - 14, CY + 14], [xF - 10, CY + 4], [xF - 4, CY + 14], [xF, CY + 26]);
    left.push([xF, CY + 70], [xF, yBot - 30], [xF - 3, yBot - 6]);
    const beanL = L.smoothPts(left, true, 4);
    const beanR = beanL.map(([x, y]) => [2 * CX - x, y]);
    // silverskin: a thin film 4 px outside each bean
    const grow = (pts, d) => {
      const n = pts.length;
      let cx = 0, cy = 0;
      for (const p of pts) { cx += p[0]; cy += p[1]; }
      cx /= n; cy /= n;
      return pts.map((p, i) => {
        const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n];
        let tx = b[0] - a[0], ty = b[1] - a[1];
        const tl = Math.hypot(tx, ty) || 1;
        let nx = ty / tl, ny = -tx / tl;
        if ((p[0] - cx) * nx + (p[1] - cy) * ny < 0) { nx = -nx; ny = -ny; }
        return [p[0] + nx * d, p[1] + ny * d];
      });
    };
    const silverL = grow(beanL, 4.5), silverR = grow(beanR, 4.5);
    // crease centreline in each flat face (for the white groove)
    const creaseL = L.smoothPts([[xF, CY - 20], [xF - 14, CY - 16], [xF - 30, CY - 6], [xF - 34, CY + 10], [xF - 24, CY + 20], [xF - 14, CY + 14]], false, 3);
    const creaseR = creaseL.map(([x, y]) => [2 * CX - x, y]);
    // gloss crescent at upper left between 200 and 250 degrees, inset 40
    const gloss = [];
    for (let i = 0; i <= 20; i++) gloss.push(ovalAt(40, (200 + i * 2.5) * DEG));
    for (let i = 20; i >= 0; i--) {
      const a = (200 + i * 2.5) * DEG;
      const w = 16 * Math.sin((i / 20) * Math.PI);
      gloss.push(ovalAt(40 + w, a));
    }
    // pulp lattice: rings and spokes (rectangular cells)
    const lat = new Path2D();
    for (const d of [26, 45]) LIB.tracePath(lat, oval(d, 120), true);
    for (let k = 0; k < 64; k++) {
      const a = (k / 64) * TAU + 0.02;
      const stag = k % 2 ? 0 : 1;
      const p0 = ovalAt(D_SKIN + 1, a), p1 = ovalAt(stag ? 26 : 45, a);
      const q0 = ovalAt(stag ? 26 : 45, a + TAU / 128), q1 = ovalAt(D_PULP - 1, a + TAU / 128);
      lat.moveTo(p0[0], p0[1]); lat.lineTo(p1[0], p1[1]);
      lat.moveTo(q0[0], q0[1]); lat.lineTo(q1[0], q1[1]);
    }
    // skin: fine radial ticks in the 9 px band
    const skinT = new Path2D();
    for (let k = 0; k < 180; k++) {
      const a = (k / 180) * TAU;
      const p0 = ovalAt(1.5, a), p1 = ovalAt(D_SKIN - 1.5, a);
      skinT.moveTo(p0[0], p0[1]); skinT.lineTo(p1[0], p1[1]);
    }
    // parchment fibres: short ties between the double line
    const fib = new Path2D();
    for (let k = 0; k < 120; k++) {
      const a = (k / 120) * TAU;
      const p0 = ovalAt(D_MUC + 1.5, a), p1 = ovalAt(D_PARCH - 1.5, a + 0.02);
      fib.moveTo(p0[0], p0[1]); fib.lineTo(p1[0], p1[1]);
    }
    GEO = { outer, inner9, pulpIn, mucIn, parchIn, beanL, beanR, silverL, silverR, creaseL, creaseR, gloss, lat, skinT, fib };
    return GEO;
  }

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------
  function stroke(ctx, path, color, alpha, width, dash) {
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
  // a polyline wobbled per boil drawing (schematic lines shimmer too)
  function wobPath(pts, closed, seed, amp, bi, dx = 0, path = new Path2D()) {
    for (let i = 0; i < pts.length; i++) {
      const j1 = (h3(i, bi, seed) - 0.5) * 2 * amp;
      const j2 = (h3(i, bi, seed + 1) - 0.5) * 2 * amp;
      const x = pts[i][0] + j1 + dx, y = pts[i][1] + j2;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    if (closed) path.closePath();
    return path;
  }
  // first fraction u of a polyline
  function partial(pts, u) {
    if (u >= 1) return pts;
    const n = Math.max(2, Math.ceil(pts.length * u));
    return pts.slice(0, n);
  }
  function bez(p0, p1, p2, p3, n = 40) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, m = 1 - t;
      out.push([
        m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
        m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
    return out;
  }
  // a wedge from the centre sweeping from 12 o'clock downward on one side, k 0..1
  function wedge(ctx, cx, cy, side, k) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const a0 = -Math.PI / 2;
    const n = 36;
    for (let i = 0; i <= n; i++) {
      const a = a0 - side * (i / n) * Math.PI * k * -1;
      ctx.lineTo(cx + Math.cos(a) * 460, cy + Math.sin(a) * 460);
    }
    ctx.closePath();
  }

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

  // node glyph with a tiny icon of its layer
  function nodeGlyph(ctx, L, P, i, x, y, k, bi) {
    if (k <= 0) return;
    const s = k;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = P.navyLight;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    const o = new Path2D();
    o.arc(0, 0, 48, 0, TAU);
    stroke(ctx, o, P.lavender, 0.85, 2.5);
    const o2 = new Path2D();
    o2.arc(0, 0, 39, 0, TAU);
    stroke(ctx, o2, P.lavender, 0.5, 1.5);
    L.ticks(ctx, 0, 0, { r: 48, n: 24, len: 5, color: P.lavender, alpha: 0.35, width: 1 });
    const ic = new Path2D();
    if (i === 0) {
      // skin: concentric arcs
      ic.arc(14, 14, 34, Math.PI * 1.05, Math.PI * 1.45);
      ic.moveTo(14 + Math.cos(Math.PI * 1.05) * 26, 14 + Math.sin(Math.PI * 1.05) * 26);
      ic.arc(14, 14, 26, Math.PI * 1.05, Math.PI * 1.45);
      stroke(ctx, ic, P.lineWhite, 0.9, 2);
      const tk = new Path2D();
      for (let a = 1.08; a < 1.44; a += 0.05) {
        tk.moveTo(14 + Math.cos(Math.PI * a) * 27.5, 14 + Math.sin(Math.PI * a) * 27.5);
        tk.lineTo(14 + Math.cos(Math.PI * a) * 32.5, 14 + Math.sin(Math.PI * a) * 32.5);
      }
      stroke(ctx, tk, P.lavender, 0.7, 1);
    } else if (i === 1) {
      // pulp: hatch patch in a rounded square
      ctx.save();
      ctx.beginPath();
      ctx.rect(-18, -18, 36, 36);
      ctx.clip();
      for (let d = -40; d < 40; d += 6) {
        ic.moveTo(d - 20, 20);
        ic.lineTo(d + 20, -20);
      }
      stroke(ctx, ic, P.lavender, 0.8, 1.3);
      ctx.restore();
      const sq = new Path2D();
      sq.rect(-18, -18, 36, 36);
      sq.moveTo(-18, 0); sq.lineTo(18, 0);
      sq.moveTo(0, -18); sq.lineTo(0, 18);
      stroke(ctx, sq, P.lineWhite, 0.85, 1.6);
    } else if (i === 2) {
      // mucilage: dots
      ctx.fillStyle = P.lineWhite;
      const r = L.rng(sd('mdots'));
      for (let k2 = 0; k2 < 16; k2++) {
        const a = r() * TAU, d = Math.sqrt(r()) * 22;
        ctx.globalAlpha = 0.6 + 0.4 * r();
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1.6 + r() * 1.6, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (i === 3) {
      // parchment: a double line
      ic.moveTo(-22, 10); ic.quadraticCurveTo(0, -18, 22, 10);
      ic.moveTo(-22, 20); ic.quadraticCurveTo(0, -8, 22, 20);
      stroke(ctx, ic, P.lineWhite, 0.9, 2);
      const tk = new Path2D();
      for (let x2 = -16; x2 <= 16; x2 += 6) {
        const yA = 10 - 28 * (1 - Math.pow(x2 / 22, 2)) * 0.5 + 1, yB = yA + 8;
        tk.moveTo(x2, yA); tk.lineTo(x2 + 1, yB);
      }
      stroke(ctx, tk, P.lavender, 0.6, 1);
    } else {
      // bean: a face-on bean with its crease
      const b = LIB.ellipsePts(0, 0, 16, 23, 28, -15 * DEG);
      LIB.tracePath(ic, b, true);
      stroke(ctx, ic, P.schemBean, 0.95, 2);
      const cr = new Path2D();
      cr.moveTo(3, -19); cr.bezierCurveTo(-6, -8, 6, 6, -3, 19);
      stroke(ctx, cr, P.lineWhite, 0.9, 1.8);
    }
    ctx.restore();
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
      const bi = L.boil(info.T);
      const G = geo(L);
      const lav = P.lavender, white = P.lineWhite, mag = P.magenta;

      const hit = (a, frames, e, lead = 1) => {
        if (t < a) return 0;
        const u = clamp((t - a) / (frames * FR) + lead / frames);
        return e ? e(u) : u;
      };

      // ---- 1 plate and guides --------------------------------------------------------
      L.blueprint(ctx, { center: [CX, CY], seed: sd('bp') % 1000 });
      {
        const rot = 4 * DEG * info.p;
        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(rot);
        L.guideCircle(ctx, 0, 0, 470, { alpha: 0.15 });
        L.ticks(ctx, 0, 0, { r: 470, n: 144, len: 6, major: 12, majorLen: 16, inward: true, color: lav, alpha: 0.24, width: 1 });
        L.guideCircle(ctx, 0, 0, 392, { alpha: 0.1, dash: [3, 9] });
        L.guideCircle(ctx, 0, 0, 620, { alpha: 0.08 });
        for (let k = 0; k < 4; k++) {
          const a = k * 90 * DEG + 24 * DEG;
          L.arcAnnotation(ctx, 0, 0, 488, a, a + 30 * DEG, { color: lav, alpha: 0.22, width: 1.2, endTicks: 10 });
        }
        ctx.restore();
        const cons = new Path2D();
        cons.moveTo(CX, 520); cons.lineTo(CX, 1290);
        cons.moveTo(200, CY); cons.lineTo(880, CY);
        stroke(ctx, cons, lav, 0.14, 1, [10, 8]);
        const reg = new Path2D();
        for (const [x, y] of [[CX, 1370], [70, CY], [1010, CY], [CX, 430]]) {
          reg.moveTo(x - 9, y); reg.lineTo(x + 9, y);
          reg.moveTo(x, y - 9); reg.lineTo(x, y + 9);
        }
        stroke(ctx, reg, lav, 0.4, 1.2);
      }

      // ---- 2 measurement --------------------------------------------------------------
      L.bracket(ctx, 1000, CY - RY, 1000, CY + RY, { alpha: 0.5, cap: 14 });
      L.ticks(ctx, 1000, CY - RY, { length: RY * 2, angle: Math.PI / 2, n: 12, len: 9, major: 3, majorLen: 18, side: -1, baseline: false, color: lav, alpha: 0.5, width: 1.2 });
      L.ticks(ctx, 40, 400, { length: 1100, angle: Math.PI / 2, n: 44, len: 8, major: 4, majorLen: 18, side: 1, color: lav, alpha: 0.35, width: 1.2 });
      const kSplit = hit(B_SPLIT, 3, E.outBack);
      const dx = PART * kSplit;
      if (kSplit > 0) {
        const kb = hit(B_SPLIT + 2 * FR, 6, E.outExpo);
        L.bracket(ctx, CX - RX - dx, 1290, CX + RX + dx, 1290, { alpha: 0.55, cap: 16, p: kb });
        L.bracket(ctx, CX - dx, 1240, CX + dx, 1240, { alpha: 0.45, cap: 10, p: kb, width: 1.2 });
        L.ticks(ctx, CX - RX - dx, 1318, { length: 2 * (RX + dx), angle: 0, n: 20, len: 8, major: 5, majorLen: 14, side: 1, baseline: false, color: lav, alpha: 0.4 * kb, width: 1 });
      }

      // layer progress (outside to in)
      const kL = B_LAYER.map((a) => hit(a, 6, E.outExpo, 1));
      const kExt = 1 - hit(B_SPLIT, 6, E.inOutSine); // exterior details fade as the section opens

      // ---- 3 the halves ------------------------------------------------------------------
      const drawHalf = (side) => {
        const ox = side * dx;
        ctx.save();
        ctx.beginPath();
        if (side < 0) ctx.rect(-10 + ox, 0, CX + 10, 1920);
        else ctx.rect(CX + ox, 0, 1100 - CX, 1920);
        ctx.clip();
        ctx.translate(ox, 0);

        // calm the grid inside the fruit
        ctx.save();
        ctx.beginPath();
        LIB.tracePath(ctx, G.outer, true);
        ctx.fillStyle = P.navy;
        ctx.globalAlpha = 0.55;
        ctx.fill();
        ctx.restore();

        const reveal = (k, fn) => {
          if (k <= 0) return;
          ctx.save();
          if (k < 1) {
            wedge(ctx, CX, CY, side, k);
            ctx.clip();
          }
          fn();
          ctx.restore();
        };
        // skin: fine radial ticks in the outer band, brighter
        reveal(kL[0], () => {
          stroke(ctx, G.skinT, white, 0.5, 1);
        });
        // pulp: lattice rectangles and 25 percent hatch
        reveal(kL[1], () => {
          L.hatch(ctx, [G.inner9, G.pulpIn], { color: lav, alpha: 0.25, spacing: 8, width: 1.2, length: [10, 30], seed: sd('pulph') });
          stroke(ctx, G.lat, lav, 0.32, 1);
          stroke(ctx, wobPath(G.pulpIn, true, sd('pin'), 0.5, bi), lav, 0.6, 1.5);
        });
        // mucilage: fine dots
        reveal(kL[2], () => {
          L.stipple(ctx, [G.pulpIn, G.mucIn], { color: lav, alpha: 0.75, spacing: 4.6, r: [0.7, 1.4], seed: sd('muc') });
          stroke(ctx, wobPath(G.mucIn, true, sd('min'), 0.5, bi), lav, 0.4, 1);
        });
        // parchment: a double line with fibres
        reveal(kL[3], () => {
          stroke(ctx, G.fib, lav, 0.4, 1);
          stroke(ctx, wobPath(G.mucIn, true, sd('pa'), 0.5, bi), white, 0.85, 1.8);
          stroke(ctx, wobPath(G.parchIn, true, sd('pb'), 0.5, bi), lav, 0.75, 1.5);
        });
        // silverskin and beans: hex lattice, double outline in the bean tint, crease groove, embryo
        reveal(kL[4], () => {
          const bean = side < 0 ? G.beanL : G.beanR;
          const silver = side < 0 ? G.silverL : G.silverR;
          const crease = side < 0 ? G.creaseL : G.creaseR;
          ctx.save();
          ctx.beginPath();
          LIB.tracePath(ctx, bean, true);
          ctx.fillStyle = P.navyLight;
          ctx.globalAlpha = 0.6;
          ctx.fill();
          ctx.restore();
          L.hexLattice(ctx, bean, { r: 9, alpha: 0.35, color: lav, seed: sd('hex', side) });
          stroke(ctx, wobPath(silver, true, sd('sv', side), 0.4, bi), P.paleBlue, 0.7, 1, [5, 4]);
          stroke(ctx, wobPath(bean, true, sd('bo', side), 0.6, bi), P.schemBean, 0.85, 2.5);
          // inner line of the double outline, 9 px in (scaled toward the bean centre)
          const bc = [side < 0 ? 455 : 625, CY];
          const inner = bean.map(([x, y]) => [lerp(x, bc[0], 9 / 80), lerp(y, bc[1], 9 / 200)]);
          stroke(ctx, wobPath(inner, true, sd('bi', side), 0.5, bi), P.schemBean, 0.45, 1.5);
          stroke(ctx, wobPath(crease, false, sd('cr', side), 0.4, bi), white, 0.9, 3);
          // embryo at the lower end, near the flat face
          L.glowDot(ctx, side < 0 ? 506 : 574, CY + 150, 6, { rays: 8, rayLen: 2.6, glow: 4, intensity: 0.8, seed: sd('emb', side) });
          // a hatched shade crescent on the lower right of each bean
          L.hatch(ctx, bean, { color: lav, alpha: 0.22, spacing: 6, width: 1, length: [8, 20], seed: sd('bsh', side), density: (x, y) => sstep(0.1, 0.9, ((x - bc[0]) / 80 + (y - CY) / 200) * 0.7) });
        });

        // the outline of the fruit: double lavender (outer 2.5 px 85 percent, inner 1.5 px 50 percent, 9 px in)
        stroke(ctx, wobPath(G.outer, true, sd('o1'), 0.6, bi), lav, 0.85, 2.5);
        stroke(ctx, wobPath(G.inner9, true, sd('o2'), 0.6, bi), lav, 0.5, 1.5);
        // exterior details: gloss crescent and calyx scar disc
        if (kExt > 0) {
          ctx.save();
          ctx.globalAlpha = kExt;
          stroke(ctx, wobPath(G.gloss, true, sd('gl'), 0.5, bi), white, 0.8, 1.5);
          L.hatch(ctx, G.gloss, { color: white, alpha: 0.35, spacing: 5, width: 1, length: [6, 14], seed: sd('glh') });
          const cd = new Path2D();
          cd.arc(CALYX[0], CALYX[1], CALYX_R, 0, TAU);
          stroke(ctx, cd, lav, 0.85, 2);
          const cs = new Path2D();
          for (let k = 0; k < 5; k++) {
            const a = -Math.PI / 2 + (k / 5) * TAU;
            cs.moveTo(CALYX[0], CALYX[1]);
            cs.lineTo(CALYX[0] + Math.cos(a) * 22, CALYX[1] + Math.sin(a) * 22);
          }
          cs.moveTo(CALYX[0] + 12, CALYX[1]);
          cs.arc(CALYX[0], CALYX[1], 12, 0, TAU);
          stroke(ctx, cs, lav, 0.55, 1.2);
          // wireframe of the sphere: meridians and latitudes (the fruit as a solid, before the cut)
          const wf = new Path2D();
          for (const th of [22, 44, 66]) {
            const rx = RX * Math.sin(th * DEG);
            wf.moveTo(CX + rx, CY);
            wf.ellipse(CX, CY, rx, RY, 0, 0, TAU);
          }
          for (const lat of [-56, -30, 0, 30, 56]) {
            const yc = CY + RY * Math.sin(lat * DEG) * 0.97, rx = RX * Math.cos(lat * DEG);
            wf.moveTo(CX + rx, yc);
            wf.ellipse(CX, yc, rx, rx * 0.16, 0, 0, Math.PI);
          }
          stroke(ctx, wf, lav, 0.2, 1);
          L.hexLattice(ctx, G.inner9, { r: 10, alpha: 0.07, color: lav, seed: sd('skinhex') });
          // shade ticks inside the fruit, lower right (form turning from the light)
          L.hatch(ctx, G.inner9, { color: lav, alpha: 0.14, spacing: 9, width: 1, length: [10, 26], seed: sd('osh'), density: (x, y) => sstep(0.35, 0.95, ((x - CX) / RX + (y - CY) / RY) * 0.7) });
          ctx.restore();
        }
        // the cut face edge, once the halves part
        if (kSplit > 0) {
          const yS = RY * Math.sqrt(1 - 0);
          const cut = new Path2D();
          cut.moveTo(CX, CY - yS);
          cut.lineTo(CX, CY + yS);
          stroke(ctx, cut, white, 0.9, 2);
        }
        ctx.restore();
      };
      drawHalf(-1);
      drawHalf(1);

      // ---- 4 section line and the magenta flash -------------------------------------
      if (t >= B_SLICE && kSplit <= 0) {
        const k = hit(B_SLICE, 9, E.outCubic);
        const y0 = CY - RY - 30, y1 = lerp(y0, CY + RY + 30, k);
        const cut = new Path2D();
        cut.moveTo(CX, y0);
        cut.lineTo(CX, y1);
        stroke(ctx, cut, white, 1, 2);
        L.glowDot(ctx, CX, y1, 5, { rays: 6, rayLen: 3, glow: 5, intensity: 0.9, seed: sd('blade') });
      }
      {
        // magenta: 12 frames from the slice beat, along the cut, fading
        const m = t >= B_SLICE ? clamp((t - B_SLICE) / (12 * FR) + 1 / 12) : 0;
        if (m > 0 && m < 1) {
          const k = hit(B_SLICE, 9, E.outCubic);
          const a = 1 - sstep(0.5, 1, m);
          const y0 = CY - RY - 30, y1 = lerp(y0, CY + RY + 30, k);
          for (const s of kSplit > 0 ? [-1, 1] : [0]) {
            const x = CX + s * dx;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createLinearGradient(x - 18, 0, x + 18, 0);
            g.addColorStop(0, L.rgba(mag, 0));
            g.addColorStop(0.5, L.rgba(mag, 0.45 * a));
            g.addColorStop(1, L.rgba(mag, 0));
            ctx.fillStyle = g;
            ctx.fillRect(x - 18, y0, 36, y1 - y0);
            ctx.restore();
            const ln = new Path2D();
            ln.moveTo(x + (s ? 0 : 0), y0);
            ln.lineTo(x, y1);
            stroke(ctx, ln, mag, a, 3);
          }
        }
      }

      // ---- 4b layer strip: the six layers as a core sample, each band drawing with its layer
      {
        const y0 = 1400, hgt = 46;
        const segs = [[200, 228], [228, 420], [420, 474], [474, 512], [512, 528], [528, 880]];
        const frame = new Path2D();
        frame.rect(200, y0, 680, hgt);
        stroke(ctx, frame, lav, 0.25 + 0.35 * kL[0], 1);
        for (let i = 0; i < 6; i++) {
          const k = kL[Math.min(4, i)];
          if (k <= 0) continue;
          const [x0, x1] = segs[i];
          const xe = lerp(x0, x1, k);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x0, y0, xe - x0, hgt);
          ctx.clip();
          if (i === 0) {
            const tk = new Path2D();
            for (let x = x0 + 3; x < x1; x += 4) { tk.moveTo(x, y0 + 4); tk.lineTo(x, y0 + hgt - 4); }
            stroke(ctx, tk, white, 0.55, 1);
          } else if (i === 1) {
            L.hatch(ctx, null, { bounds: [x0, y0, x1 - x0, hgt], color: lav, alpha: 0.3, spacing: 7, width: 1.1, length: [8, 24], seed: sd('sp') });
            const lt = new Path2D();
            for (let x = x0 + 24; x < x1; x += 24) { lt.moveTo(x, y0); lt.lineTo(x, y0 + hgt); }
            lt.moveTo(x0, y0 + hgt / 2); lt.lineTo(x1, y0 + hgt / 2);
            stroke(ctx, lt, lav, 0.35, 1);
          } else if (i === 2) {
            L.stipple(ctx, null, { bounds: [x0, y0, x1 - x0, hgt], color: lav, alpha: 0.8, spacing: 4.6, r: [0.7, 1.4], seed: sd('sm') });
          } else if (i === 3) {
            const dl = new Path2D();
            dl.moveTo(x0 + 9, y0); dl.lineTo(x0 + 9, y0 + hgt);
            dl.moveTo(x1 - 9, y0); dl.lineTo(x1 - 9, y0 + hgt);
            for (let y = y0 + 4; y < y0 + hgt; y += 6) { dl.moveTo(x0 + 10, y); dl.lineTo(x1 - 10, y + 2); }
            stroke(ctx, dl, white, 0.8, 1.4);
          } else if (i === 4) {
            const sv = new Path2D();
            sv.moveTo((x0 + x1) / 2, y0); sv.lineTo((x0 + x1) / 2, y0 + hgt);
            stroke(ctx, sv, P.paleBlue, 0.8, 1, [5, 4]);
          } else {
            L.hexLattice(ctx, null, { bounds: [x0, y0, x1 - x0, hgt], r: 9, alpha: 0.4, color: lav, seed: sd('sh') });
            const bo = new Path2D();
            bo.moveTo(x0, y0 + 2); bo.lineTo(x1 - 2, y0 + 2);
            bo.moveTo(x0, y0 + hgt - 2); bo.lineTo(x1 - 2, y0 + hgt - 2);
            stroke(ctx, bo, P.schemBean, 0.85, 2);
          }
          ctx.restore();
          const dv = new Path2D();
          dv.moveTo(x1, y0 - 8); dv.lineTo(x1, y0 + hgt + 8);
          stroke(ctx, dv, white, 0.6 * k, 1.5);
        }
        L.bracket(ctx, 200, y0 + hgt + 22, 880, y0 + hgt + 22, { alpha: 0.4 * kL[0], cap: 12, width: 1.2 });
        // a dashed lead from the section's equator down to the strip
        if (kL[0] > 0) {
          const ld = new Path2D();
          ld.moveTo(CX - RX - dx, CY); ld.lineTo(CX - RX - dx - 30, CY + 60); ld.lineTo(170, 1380); ld.lineTo(200, y0);
          stroke(ctx, ld, lav, 0.22 * kL[0], 1, [4, 6]);
        }
      }
      // ---- 4c inset: the whole fruit on its branch and where the cut runs
      {
        const ix = 190, iy = 340;
        L.guideCircle(ctx, ix, iy, 84, { alpha: 0.35, quadrants: 6 });
        L.guideCircle(ctx, ix, iy, 92, { alpha: 0.18, dash: [2, 6] });
        const br = new Path2D();
        br.moveTo(ix - 76, iy - 40); br.quadraticCurveTo(ix, iy - 52, ix + 76, iy - 36);
        stroke(ctx, br, lav, 0.6, 2);
        const lf = new Path2D();
        lf.moveTo(ix - 30, iy - 46); lf.quadraticCurveTo(ix - 60, iy - 80, ix - 40, iy - 74); lf.quadraticCurveTo(ix - 18, iy - 70, ix - 30, iy - 46);
        lf.moveTo(ix + 30, iy - 44); lf.quadraticCurveTo(ix + 64, iy - 74, ix + 46, iy - 72); lf.quadraticCurveTo(ix + 22, iy - 66, ix + 30, iy - 44);
        stroke(ctx, lf, lav, 0.5, 1.4);
        for (const [ox, oy, r] of [[-28, -12, 18], [28, -10, 18]]) {
          const c = new Path2D();
          c.ellipse(ix + ox, iy + oy, r, r * 1.1, 0, 0, TAU);
          stroke(ctx, c, lav, 0.45, 1.3);
        }
        const hc = new Path2D();
        hc.ellipse(ix, iy + 8, 26, 29, 0, 0, TAU);
        stroke(ctx, hc, white, 0.9, 2);
        const ct = new Path2D();
        ct.moveTo(ix, iy - 30); ct.lineTo(ix, iy + 46);
        stroke(ctx, ct, white, t >= B_SLICE ? 0.9 : 0.35, 1.4, [4, 4]);
        L.glowDot(ctx, ix, iy + 8, 3.5, { rays: 0, glow: 4, intensity: 0.7, seed: sd('ins') });
        // a dashed lead from the inset to the big fruit
        const ld = new Path2D();
        ld.moveTo(ix + 64, iy + 56); ld.quadraticCurveTo(330, 470, CX - 150, CY - RY + 40);
        stroke(ctx, ld, lav, 0.25, 1, [4, 6]);
      }

      // ---- 5 network: anchors, curved lines, nodes ------------------------------------
      {
        const anchors = [
          [ovalAt(4, 218 * DEG), -1],
          [ovalAt(36, 180 * DEG), -1],
          [ovalAt(71, 140 * DEG), -1],
          [ovalAt(82, -36 * DEG), 1],
          [[CX + 82, CY + 70], 1],
        ];
        for (let i = 0; i < 5; i++) {
          const k = kL[i];
          if (k <= 0) continue;
          const nd = NODES[i];
          const [ap, side] = anchors[i];
          const ax = ap[0] + side * dx, ay = ap[1];
          const ex = nd.x - nd.side * 50, ey = nd.y;
          const c1 = [ax + side * 70, ay];
          const c2 = [ex + side * 40, ey + (ay - ey) * 0.2];
          const pts = bez([ax, ay], c1, c2, [ex, ey], 40);
          const lp = wobPath(partial(pts, k), false, sd('net', i), 0.6, bi);
          stroke(ctx, lp, lav, 0.6, 1.5);
          L.glowDot(ctx, ax, ay, 4.5, { rays: 0, glow: 4, intensity: 0.75, seed: sd('ad', i) });
          const kn = hit(B_LAYER[i] + 2 * FR, 3, E.outBack);
          nodeGlyph(ctx, L, P, i, nd.x, nd.y, kn, bi);
        }
      }

      // ---- 6 progress glyph --------------------------------------------------------------
      progressGlyph(ctx, L, 1, info.p, info.T, false);
    },
  });
})();
