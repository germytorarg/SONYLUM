// 21 bean-loop : Back to the seed.  T 42.75 to 45.00 (54 frames), schematic, hard cut from 20.
// The finished blueprint of 02, fully drawn on frame 0, with all four progress arcs lit and the
// film's only text, the wordmark `café`. The network, measurement and lattice fade away on the last
// beat, leaving the G2 cherry oval around the G1 bean so the loop seam into 01 frame 0 (the inked
// cherry on G2) reads as a match cut.
//
// Layers, back to front:
//   1 blueprint plate (navy, 60 px grid, guide circles, diagonals)
//   2 construction: guide circle r 420 at (540, 900) with ticks, axis, registration crosses
//   3 G2 cherry guide oval (rx 260, ry 290) with calyx disc and gloss arc; brightens at the end
//   4 G1 bean: cell lattice (18 x 12 px bricks), double lavender outline, lineWhite crease
//   5 embryo glow at the bottom tip (pulses at T 44.25)
//   6 network: three curved leads to three node glyphs (endosperm hexes, seedling, water drop)
//   7 measurement: vertical bracket at x 790, tick scale at y 1230
//   8 progress glyph (allLit) and the wordmark
(function () {
  'use strict';

  const ID = 'bean-loop';
  const REF = 'bean-blueprint'; // the bean and oval wobble like 02's
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
  const sr = (...k) => LIB.hash(REF, ...k) & 0x7fffffff;

  // ---------------------------------------------------------------------------
  // Shared geometry (docs/storyboard.md): G1 bean, G2 cherry
  // ---------------------------------------------------------------------------

  const BC = [540, 900];
  const ROT = -15 * DEG; // top leans left
  const CR = Math.cos(ROT), SR = Math.sin(ROT);
  const rotP = (x, y) => {
    const dx = x - BC[0], dy = y - BC[1];
    return [BC[0] + dx * CR - dy * SR, BC[1] + dx * SR + dy * CR];
  };
  // bean-local (centre-relative, unrotated) to screen
  const beanToScreen = (dx, dy) => [BC[0] + dx * CR - dy * SR, BC[1] + dx * SR + dy * CR];

  function beanLocal(n) {
    const out = [];
    const e = 2 / 2.3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU - Math.PI / 2;
      const c = Math.cos(a), s = Math.sin(a);
      const dy = 240 * Math.sign(s) * Math.pow(Math.abs(s), e);
      let dx = 170 * Math.sign(c) * Math.pow(Math.abs(c), e);
      dx *= 1 - (0.06 * (1 - dy / 240)) / 2;
      out.push([dx, dy]);
    }
    return out;
  }

  function insetPoly(pts, d) {
    const n = pts.length;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      const tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      // points run clockwise on screen (y down), so the inward normal is (-ty, tx)
      out.push([pts[i][0] - (ty / tl) * d, pts[i][1] + (tx / tl) * d]);
    }
    return out;
  }

  const CREASE = [[548, 682], [531, 750], [536, 826], [552, 900], [547, 976], [530, 1052], [538, 1118]];
  const G2 = { cx: 540, cy: 900, rx: 260, ry: 290, calyx: [540, 1172], calyxR: 34 };
  // embryo glow near the bottom tip: (548, 1110) before rotation
  const EMB = rotP(548, 1110);

  const NODES = [
    { x: 180, y: 520, kind: 'cells', src: [-150, -120] },
    { x: 180, y: 1340, kind: 'seedling', src: null },
    { x: 880, y: 1340, kind: 'water', src: [150, 120] },
  ];

  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const L = LIB;
    const local = beanLocal(96);
    const localIn = insetPoly(local, 9);
    const outer = local.map((p) => beanToScreen(p[0], p[1]));
    const inner = localIn.map((p) => beanToScreen(p[0], p[1]));
    const creaseS = L.smoothPts(CREASE.map((p) => rotP(p[0], p[1])), false, 6);
    const creaseL = L.smoothPts(CREASE.map((p) => [p[0] - BC[0], p[1] - BC[1]]), false, 6);
    // tapered groove polygon: 12 px in the middle, 3 px at the ends
    const groove = [];
    const left = [], right = [];
    for (let i = 0; i < creaseS.length; i++) {
      const a = creaseS[Math.max(0, i - 1)], b = creaseS[Math.min(creaseS.length - 1, i + 1)];
      const tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      const u = i / (creaseS.length - 1);
      const w = (3 + 9 * Math.pow(Math.sin(Math.PI * u), 0.7)) / 2;
      left.push([creaseS[i][0] - (ty / tl) * w, creaseS[i][1] + (tx / tl) * w]);
      right.push([creaseS[i][0] + (ty / tl) * w, creaseS[i][1] - (tx / tl) * w]);
    }
    for (const p of left) groove.push(p);
    for (let i = right.length - 1; i >= 0; i--) groove.push(right[i]);
    // brick lattice in bean-local coordinates, then rotated to screen; walls skip the crease
    const r = L.rng(sd('lattice'));
    const rows = [];
    const crX = (y) => {
      for (let i = 1; i < creaseL.length; i++) {
        if (creaseL[i][1] >= y) {
          const a = creaseL[i - 1], b = creaseL[i];
          return lerp(a[0], b[0], (y - a[1]) / ((b[1] - a[1]) || 1));
        }
      }
      return creaseL[creaseL.length - 1][0];
    };
    const halfW = (y) => {
      // inner outline half width at local y (scan the inset polygon)
      let lo = 0, hi = 0;
      for (let i = 0; i < localIn.length; i++) {
        const a = localIn[i], b = localIn[(i + 1) % localIn.length];
        if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) {
          const x = lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1]));
          if (x < lo) lo = x;
          if (x > hi) hi = x;
        }
      }
      return [lo, hi];
    };
    const cellsH = [], cellsV = [], cellFill = [];
    let row = 0;
    for (let y = -228; y <= 228; y += 12, row++) {
      const [lo, hi] = halfW(y);
      if (hi - lo < 10) continue;
      const cx = crX(y);
      // horizontal wall, broken at the crease
      const segs = [[lo + 1, cx - 9], [cx + 9, hi - 1]];
      for (const [a, b] of segs) if (b - a > 4) cellsH.push([a, y, b, y]);
      const off = row % 2 ? 9 : 0;
      const [lo2, hi2] = halfW(y + 6);
      for (let x = -180 + off; x <= 180; x += 18) {
        const xx = x + (r() - 0.5) * 3;
        if (xx < lo2 + 3 || xx > hi2 - 3 || Math.abs(xx - crX(y + 6)) < 10) continue;
        cellsV.push([xx, y, xx, y + 12]);
        if (r() < 0.12) cellFill.push([xx + 1.5, y + 1.5, 15, 9, r.range(0.05, 0.12)]);
      }
    }
    GEO = { local, localIn, outer, inner, creaseS, groove, cellsH, cellsV, cellFill };
    return GEO;
  }

  // ---------------------------------------------------------------------------
  // Line helpers
  // ---------------------------------------------------------------------------

  function wobPts(L, pts, seed, amp, bi, closed) {
    const n = pts.length;
    const out = new Array(n);
    let s = 0;
    const sdd = (seed + bi * 7919) | 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (i > 0) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      const a = pts[i > 0 ? i - 1 : closed ? n - 1 : 0], b = pts[i < n - 1 ? i + 1 : closed ? 0 : n - 1];
      const tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      const d = amp * L.noise1(s * 0.018, sdd);
      out[i] = [p[0] - (ty / tl) * d, p[1] + (tx / tl) * d];
    }
    return out;
  }
  function addPoly(path, pts, closed) {
    if (pts.length < 2) return;
    path.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
    if (closed) path.closePath();
  }
  function wob(L, path, pts, seed, amp, bi, closed) {
    addPoly(path, wobPts(L, pts, seed, amp, bi, closed), closed);
  }
  function stroke(ctx, path, color, alpha, width, dash) {
    if (alpha <= 0.003) return;
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
  // Node glyphs (100 px across)
  // ---------------------------------------------------------------------------

  function nodeGlyph(ctx, L, P, n, alpha, bi, t, content) {
    if (alpha <= 0.003) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(n.x, n.y);
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, TAU);
    ctx.fillStyle = P.navyLight;
    ctx.globalAlpha = alpha * 0.94;
    ctx.fill();
    ctx.globalAlpha = alpha;
    const rp = new Path2D();
    wob(L, rp, L.ellipsePts(0, 0, 50, 50, 64), sd('node', n.kind), 0.4, bi, true);
    stroke(ctx, rp, P.lavender, 0.85, 2.5);
    const rp2 = new Path2D();
    rp2.arc(0, 0, 41, 0, TAU);
    stroke(ctx, rp2, P.lavender, 0.5, 1.5);
    L.ticks(ctx, 0, 0, { r: 52, n: 36, len: 5, major: 9, majorLen: 10, color: P.lavender, alpha: 0.4, width: 1, rot: 0.3 + t * 0.4 });
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, TAU);
    ctx.clip();
    content();
    ctx.restore();
  }

  function drawCells(ctx, L, P, bi) {
    L.hexLattice(ctx, null, { bounds: [-44, -44, 88, 88], r: 9, color: P.lavender, alpha: 0.55, width: 1, jitter: 0.8, seed: sd('nodehex'), dots: 1.2,
      cellFn: (cx, cy, i, j) => (L.h3(i, j, sd('nhf')) < 0.18 ? { fill: P.lavender, alpha: 0.18 } : true) });
  }

  function drawSeedling(ctx, L, P, bi) {
    const soil = new Path2D();
    soil.moveTo(-40, 16);
    soil.lineTo(40, 16);
    stroke(ctx, soil, P.lavender, 0.5, 1.5);
    const hatchS = new Path2D();
    for (let x = -40; x < 40; x += 7) {
      hatchS.moveTo(x, 22);
      hatchS.lineTo(x + 6, 16);
    }
    stroke(ctx, hatchS, P.lavender, 0.3, 1);
    const stem = new Path2D();
    wob(L, stem, [[0, 30], [1, 18], [0, 4], [-1, -8]], sd('stem'), 0.4, bi, false);
    stroke(ctx, stem, P.lineWhite, 0.85, 2);
    const root = new Path2D();
    wob(L, root, [[0, 18], [-3, 26], [-1, 34], [-6, 40]], sd('root'), 0.4, bi, false);
    root.moveTo(-1, 26);
    root.lineTo(6, 33);
    stroke(ctx, root, P.lavender, 0.6, 1.2);
    for (const sx of [-1, 1]) {
      const c = new Path2D();
      wob(L, c, L.ellipsePts(sx * 13, -16, 12, 10, 28, sx * 0.35), sd('cot', sx), 0.3, bi, true);
      stroke(ctx, c, P.lineWhite, 0.85, 1.8);
      const v = new Path2D();
      v.moveTo(0, -8);
      v.lineTo(sx * 19, -20);
      stroke(ctx, v, P.lavender, 0.5, 1);
    }
  }

  function drawDrop(ctx, L, P, bi) {
    const drop = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * TAU;
      // teardrop: tip at the top (a = 0), round belly at the bottom
      drop.push([Math.sin(a) * 18 * Math.pow(Math.abs(Math.sin(a / 2)), 1.2), -26 + (44 * (1 - Math.cos(a))) / 2]);
    }
    const dp = new Path2D();
    wob(L, dp, drop, sd('drop'), 0.3, bi, true);
    ctx.save();
    ctx.globalAlpha *= 0.12;
    ctx.fillStyle = P.schemWater;
    ctx.fill(dp);
    ctx.restore();
    stroke(ctx, dp, P.schemWater, 0.95, 2);
    const hi = new Path2D();
    hi.arc(-1, 6, 10, Math.PI * 1.05, Math.PI * 1.45);
    stroke(ctx, hi, P.lineWhite, 0.7, 1.5);
    const rip = new Path2D();
    for (const rr of [24, 32]) {
      rip.moveTo(-rr, 30);
      rip.quadraticCurveTo(0, 30 + rr * 0.22, rr, 30);
    }
    stroke(ctx, rip, P.schemWater, 0.5, 1.2);
  }

  // ---------------------------------------------------------------------------
  // Scene
  // ---------------------------------------------------------------------------

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, E = L.ease;
      const dur = info.dur;
      let t = clamp(tIn, 0, dur);
      const tf = Math.round(t * 24) / 24;
      if (Math.abs(t - tf) < 1e-4) t = tf + 1e-7;
      const bi = L.boil(info.T);
      const g = geo();
      const lav = P.lavender, white = P.lineWhite;

      // beats (shot-local)
      const B_WORD = 0.75; // T 43.50 wordmark fades in over 9 frames
      const B_PULSE = 1.5; // T 44.25 embryo pulse, network starts to fade
      const F_END = 2.125; // T 44.875 network gone (3 frames before the last frame)
      const hit = (a, frames, e, lead = 1) => {
        if (t < a) return 0;
        const u = clamp((t - a) / (frames * FR) + lead / frames);
        return e ? e(u) : u;
      };
      const fadeNet = 1 - E.inOutSine(clamp((t - B_PULSE) / (F_END - B_PULSE)));
      const fadeLate = 1 - E.inOutSine(clamp((t - 1.875) / (F_END - 1.875)));
      const endK = E.inOutSine(clamp((t - B_PULSE) / (F_END - B_PULSE))); // the cherry oval comes forward

      // ---- 1 blueprint ------------------------------------------------------------
      L.blueprint(ctx, { center: [540, 900], seed: sd('bp') & 0xffff });

      // ---- 2 construction ---------------------------------------------------------
      L.guideCircle(ctx, 540, 900, 420, { alpha: 0.15, width: 1.5 });
      ctx.save();
      ctx.translate(540, 900);
      ctx.rotate(2 * DEG * t);
      L.ticks(ctx, 0, 0, { r: 420, n: 120, len: 6, major: 10, majorLen: 15, inward: true, color: lav, alpha: 0.2, width: 1 });
      L.guideCircle(ctx, 0, 0, 470, { alpha: 0.08, width: 1, dash: [2, 9] });
      for (let k = 0; k < 4; k++) {
        const a = k * 90 * DEG + 28 * DEG;
        L.arcAnnotation(ctx, 0, 0, 436, a, a + 30 * DEG, { color: lav, alpha: 0.18 * fadeNet, width: 1.2, endTicks: 10 });
      }
      ctx.restore();
      {
        const axis = new Path2D();
        const a0 = beanToScreen(0, -330), a1 = beanToScreen(0, 330);
        axis.moveTo(a0[0], a0[1]);
        axis.lineTo(a1[0], a1[1]);
        const b0 = beanToScreen(-250, 0), b1 = beanToScreen(250, 0);
        axis.moveTo(b0[0], b0[1]);
        axis.lineTo(b1[0], b1[1]);
        stroke(ctx, axis, lav, 0.16, 1, [10, 8]);
        const reg = new Path2D();
        for (const [x, y] of [[540, 480], [540, 1320], [120, 900], [960, 900]]) {
          reg.moveTo(x - 9, y);
          reg.lineTo(x + 9, y);
          reg.moveTo(x, y - 9);
          reg.lineTo(x, y + 9);
        }
        stroke(ctx, reg, lav, 0.4, 1.2);
      }

      // ---- 3 G2 cherry guide oval -------------------------------------------------
      {
        const op = new Path2D();
        wob(L, op, L.ellipsePts(G2.cx, G2.cy, G2.rx, G2.ry, 120), sr('oval'), 0.5, bi, true);
        stroke(ctx, op, lav, lerp(0.3, 0.8, endK), lerp(1.5, 2.5, endK));
        if (endK > 0) {
          const op2 = new Path2D();
          wob(L, op2, L.ellipsePts(G2.cx, G2.cy, G2.rx - 9, G2.ry - 9, 120), sr('oval2'), 0.5, bi, true);
          stroke(ctx, op2, lav, 0.45 * endK, 1.5);
        }
        // calyx scar disc and the gloss crescent, faint construction that firms up for the seam
        const cal = new Path2D();
        cal.arc(G2.calyx[0], G2.calyx[1], G2.calyxR, 0, TAU);
        stroke(ctx, cal, lav, lerp(0.2, 0.6, endK), 1.5);
        const star = new Path2D();
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i * TAU) / 5;
          star.moveTo(G2.calyx[0], G2.calyx[1]);
          star.lineTo(G2.calyx[0] + Math.cos(a) * 18, G2.calyx[1] + Math.sin(a) * 12);
        }
        stroke(ctx, star, lav, lerp(0.15, 0.45, endK), 1.2);
        const gl = new Path2D();
        gl.ellipse(G2.cx, G2.cy, G2.rx - 40, G2.ry - 40, 0, 200 * DEG, 250 * DEG);
        stroke(ctx, gl, white, lerp(0.25, 0.6, endK), 2);
        const gl2 = new Path2D();
        gl2.ellipse(G2.cx, G2.cy, G2.rx - 52, G2.ry - 52, 0, 208 * DEG, 240 * DEG);
        stroke(ctx, gl2, white, lerp(0.12, 0.35, endK), 1.2);
      }

      // ---- 4 G1 bean --------------------------------------------------------------
      // lattice (bean-local, rotated), fades with the network
      if (fadeNet > 0) {
        ctx.save();
        ctx.translate(BC[0], BC[1]);
        ctx.rotate(ROT);
        ctx.beginPath();
        addPoly(ctx, g.localIn, true);
        ctx.clip();
        ctx.globalAlpha = fadeNet;
        ctx.fillStyle = lav;
        for (const [x, y, w, h, a] of g.cellFill) {
          ctx.globalAlpha = fadeNet * a;
          ctx.fillRect(x, y, w, h);
        }
        ctx.globalAlpha = 1;
        const lp = new Path2D();
        const j = (k, s) => (L.h3(k, bi, sd('lj', s)) - 0.5) * 0.7;
        g.cellsH.forEach((c, k) => {
          lp.moveTo(c[0], c[1] + j(k, 1));
          lp.lineTo(c[2], c[3] + j(k, 2));
        });
        g.cellsV.forEach((c, k) => {
          lp.moveTo(c[0] + j(k, 3), c[1]);
          lp.lineTo(c[2] + j(k, 4), c[3]);
        });
        stroke(ctx, lp, lav, 0.34 * fadeNet, 1);
        ctx.restore();
      }
      // dome shading: lavender stipple on the lower-right (shadow) side, and a dashed parchment
      // hull 16 px outside the bean; both belong to the diagram and fade with it
      if (fadeNet > 0) {
        ctx.save();
        ctx.globalAlpha = fadeNet;
        L.stipple(ctx, g.inner, {
          spacing: 6,
          r: [0.8, 1.5],
          color: lav,
          alpha: 0.5,
          seed: sd('domest'),
          density: (x, y) => {
            const dx = x - BC[0], dy = y - BC[1];
            return 0.75 * sstep(60, 230, dx * 0.7 + dy * 0.45);
          },
        });
        const hull = new Path2D();
        addPoly(hull, insetPoly(g.outer, -16), true);
        stroke(ctx, hull, lav, 0.28, 1, [6, 7]);
        ctx.restore();
      }
      // double outline
      {
        const o1 = new Path2D();
        wob(L, o1, g.outer, sr('bean-out'), 0.6, bi, true);
        stroke(ctx, o1, lav, 0.85, 2.5);
        const o2 = new Path2D();
        wob(L, o2, g.inner, sr('bean-in'), 0.5, bi, true);
        stroke(ctx, o2, lav, 0.5, 1.5);
      }
      // crease groove in lineWhite, with a faint silverskin centre line
      {
        const gp = new Path2D();
        wob(L, gp, g.groove, sr('crease'), 0.4, bi, true);
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = white;
        ctx.fill(gp);
        ctx.restore();
        const cl = new Path2D();
        const mid = g.creaseS.slice(3, g.creaseS.length - 3);
        wob(L, cl, mid, sr('silver'), 0.3, bi, false);
        stroke(ctx, cl, P.navy, 0.75, 2);
        const cl2 = new Path2D();
        wob(L, cl2, g.creaseS.map((p) => [p[0] + 14, p[1]]), sr('crease2'), 0.5, bi, false);
        stroke(ctx, cl2, lav, 0.3 * fadeNet, 1);
      }

      // ---- 5 embryo ------------------------------------------------------------------
      {
        const pulse = t >= B_PULSE ? Math.sin(Math.PI * clamp((t - B_PULSE) / (12 * FR))) : 0;
        const embA = 1 - E.inOutSine(clamp((t - (B_PULSE + 12 * FR)) / (F_END - B_PULSE - 12 * FR)));
        if (embA > 0.003) {
          ctx.save();
          ctx.globalAlpha = embA;
          const ring = new Path2D();
          ring.arc(EMB[0], EMB[1], 22, 0, TAU);
          stroke(ctx, ring, lav, 0.5, 1.2, [3, 4]);
          L.glowDot(ctx, EMB[0], EMB[1], 9 + pulse, { rays: 12, rayLen: 2.0, glow: 40 / 9, intensity: 1 + 0.4 * pulse, rot: 7 * DEG, seed: sd('emb') });
          ctx.restore();
        }
      }

      // ---- 6 network ------------------------------------------------------------------
      if (fadeNet > 0) {
        for (const n of NODES) {
          const s = n.src ? beanToScreen(n.src[0], n.src[1]) : EMB;
          const dx = n.x - s[0], dy = n.y - s[1], dl = Math.hypot(dx, dy);
          const ux = dx / dl, uy = dy / dl;
          const ax = s[0] + ux * (n.src ? 6 : 24), ay = s[1] + uy * (n.src ? 6 : 24);
          const bx = n.x - ux * 52, by = n.y - uy * 52;
          const bend = n.kind === 'water' ? -60 : 60;
          const mx = (ax + bx) / 2 + uy * bend, my = (ay + by) / 2 - ux * bend;
          const lead = [];
          for (let i = 0; i <= 28; i++) {
            const u = i / 28, v = 1 - u;
            lead.push([v * v * ax + 2 * v * u * mx + u * u * bx, v * v * ay + 2 * v * u * my + u * u * by]);
          }
          const lp = new Path2D();
          wob(L, lp, lead, sd('lead', n.kind), 0.5, bi, false);
          stroke(ctx, lp, lav, 0.55 * fadeNet, 1.2);
          if (n.src) {
            const sp = new Path2D();
            sp.arc(s[0], s[1], 5, 0, TAU);
            ctx.save();
            ctx.globalAlpha = 0.7 * fadeNet;
            ctx.fillStyle = lav;
            ctx.fill(sp);
            ctx.restore();
            const sr2 = new Path2D();
            sr2.arc(s[0], s[1], 14, 0, TAU);
            stroke(ctx, sr2, lav, 0.45 * fadeNet, 1, [3, 4]);
          }
          nodeGlyph(ctx, L, P, n, fadeNet, bi, t, () => {
            if (n.kind === 'cells') drawCells(ctx, L, P, bi);
            else if (n.kind === 'seedling') drawSeedling(ctx, L, P, bi);
            else drawDrop(ctx, L, P, bi);
          });
        }
      }

      // ---- 7 measurement ----------------------------------------------------------------
      if (fadeNet > 0) {
        ctx.save();
        ctx.globalAlpha = fadeNet;
        L.bracket(ctx, 790, 660, 790, 1140, { cap: 16, alpha: 0.6, width: 1.5 });
        L.ticks(ctx, 806, 660, { length: 480, angle: Math.PI / 2, n: 16, len: 10, major: 4, majorLen: 18, side: -1, baseline: false, color: lav, alpha: 0.5, width: 1.5 });
        L.ticks(ctx, 360, 1230, { length: 360, angle: 0, n: 18, len: 10, major: 6, majorLen: 20, side: 1, color: white, alpha: 0.6, width: 1.5 });
        const ext = new Path2D();
        for (const x of [370, 710]) {
          ext.moveTo(x, 1150);
          ext.lineTo(x, 1222);
        }
        stroke(ctx, ext, lav, 0.3, 1, [4, 5]);
        ctx.restore();
      }

      // ---- 8 progress glyph and wordmark ----------------------------------------------------
      if (fadeNet > 0) {
        ctx.save();
        ctx.globalAlpha = fadeNet;
        progressGlyph(ctx, L, 3, 1, info.T, true);
        ctx.restore();
      }
      const wA = hit(B_WORD, 9, E.inOutSine, 0) * fadeLate;
      if (wA > 0.003) {
        // canvas letter spacing trails the last glyph, so shift right by half of it to stay centred
        L.text(ctx, 'café', 540 + 0.06 * 44, 1470, { size: 44, weight: 300, tracking: '0.12em', color: lav, alpha: 0.85 * wA, align: 'center' });
      }
    },
  });
})();
