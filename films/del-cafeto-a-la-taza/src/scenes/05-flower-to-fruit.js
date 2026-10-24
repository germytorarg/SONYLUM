// 05 flower-to-fruit : Nine months in a flower. Schematic, global T 8.25 to 9.75 (t 0 to 1.5).
// A blueprint section of one coffee flower at the top (centre (540, 560), 320 px across): five petals in
// double lavender outline on a narrow corolla tube, the inferior ovary below them holding two ovules
// (the two future beans). The petals fall away over 9 frames from the cut and the ovary glows.
// Below, a growth ladder at y 1150 draws on one fruit per 8th-triplet (T 8.625 to 9.625), a nine-tick
// month scale lighting in step, and the ripe fifth fruit flashes magenta on T 9.625.
//
// Layers, back to front:
//   1. blueprint plate (navy, 60 px grid, guide circles, diagonals)
//   2. guide circle and radial ticks around the flower, stipple haze, construction lines
//   3. ghost (dashed) outlines of the five ladder fruits, the growth envelope, the bracket
//   4. the flower: branch stub, ovary with hex lattice and two ovules, calyx, tube, petals, stamens, style
//   5. network line from the ovary down to the first fruit, links between fruits
//   6. the ladder fruits drawing on (double outlines, schemLeaf dots, two seeds each, calyx scar)
//   7. the month tick scale
//   8. glow dots (ovary, fruit cores), the magenta ripe ring
//   9. progress glyph (stage 0, u = p)
(function () {
  'use strict';

  const ID = 'flower-to-fruit';
  const L = FILM.lib;
  const P = L.pal;
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const FR = 1 / 24;

  const LAV = P.lavender, WHITE = P.lineWhite, MAG = P.magenta, LEAFT = P.schemLeaf, NAVYL = P.navyLight, GLOW = P.glow;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
  const sstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const sd = (...k) => L.hash(ID, ...k) & 0x7fffffff;

  // beats (shot-local; global T in comments)
  const B_PETALS = 0; // T 8.25 petals start to fall (9 frames)
  const FRUIT_T = [0.375, 0.625, 0.875, 1.125, 1.375]; // T 8.625, 8.875, 9.125, 9.375, 9.625
  const B_RIPE = 1.375; // T 9.625 magenta ring on the ripe fruit

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
  // helpers
  // ---------------------------------------------------------------------------
  function trace(ctx, pts, closed = true) {
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
      else ctx.lineTo(pts[i][0], pts[i][1]);
    }
    if (closed) ctx.closePath();
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
  function fillP(ctx, p, color, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.fill(p);
    ctx.restore();
  }
  function pathOf(pts, closed = true) {
    const p = new Path2D();
    trace(p, pts, closed);
    return p;
  }
  function area(pts) {
    let a = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
    return a / 2;
  }
  // inward offset of a closed polygon by d px (vertex normals from neighbours)
  function inset(pts, d) {
    const n = pts.length;
    const s = area(pts) > 0 ? 1 : -1;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1;
      tx /= l;
      ty /= l;
      // inward normal for the polygon's winding
      out.push([pts[i][0] - ty * d * s, pts[i][1] + tx * d * s]);
    }
    return out;
  }
  const COMMON = { color: LAV, wobble: 0.7, tremble: 0.15, boilAmp: 0.55, widthJitter: 0.12, rough: 0.12 };
  const lav = (o) => Object.assign({}, COMMON, o);

  // double lavender outline: outer 2.5 px at 85 percent, inner 1.5 px at 50 percent, gap px inside
  function dbl(ctx, pts, seed, o = {}) {
    const a = o.alpha != null ? o.alpha : 1;
    const p = o.p != null ? o.p : 1;
    if (p <= 0 || a <= 0.003) return;
    const gap = o.gap != null ? o.gap : 9;
    const col = o.color || LAV;
    if (p < 1) {
      const n = Math.max(2, Math.floor(pts.length * p));
      L.inkPath(ctx, pts.slice(0, n), lav({ color: col, width: o.w || 2.5, alpha: 0.9 * a, seed, taper: [3, 8] }));
      if (gap > 0) {
        const inn = inset(pts, gap);
        L.inkPath(ctx, inn.slice(0, n), lav({ color: col, width: 1.5, alpha: 0.5 * a, seed: seed + 17, taper: [3, 8] }));
      }
      return;
    }
    L.inkPath(ctx, pts, lav({ color: col, closed: true, width: o.w || 2.5, alpha: 0.85 * a, seed, taper: [6, 12] }));
    if (gap > 0) L.inkPath(ctx, inset(pts, gap), lav({ color: col, closed: true, width: 1.5, alpha: 0.5 * a, seed: seed + 17, taper: [6, 12] }));
  }

  // ---------------------------------------------------------------------------
  // Flower geometry (side section): petals fan from the tube mouth at (540, 540)
  // ---------------------------------------------------------------------------
  const MOUTH = [540, 532];
  const OVARY = { x: 540, y: 694, rx: 66, ry: 52 };
  function petalPts(ang, len, wid, fore) {
    // lanceolate petal from the mouth toward angle ang; fore < 1 foreshortens it
    const up = [], dn = [];
    const n = 16;
    const c = Math.cos(ang), s = Math.sin(ang);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const w = wid * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.6)), 0.85) * Math.pow(1 - u, 0.22);
      const x = 10 + u * len * fore;
      up.push([MOUTH[0] + c * x - s * w, MOUTH[1] + s * x + c * w]);
      dn.push([MOUTH[0] + c * x + s * w, MOUTH[1] + s * x - c * w]);
    }
    return up.concat(dn.slice(1, n).reverse());
  }
  const PETALS = [
    { ang: 188 * DEG, len: 162, wid: 24, fore: 1 },
    { ang: 228 * DEG, len: 150, wid: 22, fore: 0.72 },
    { ang: 268 * DEG, len: 150, wid: 22, fore: 0.55 },
    { ang: 312 * DEG, len: 150, wid: 22, fore: 0.72 },
    { ang: 352 * DEG, len: 162, wid: 24, fore: 1 },
  ].map((p, i) => Object.assign(p, { i, pts: petalPts(p.ang, p.len, p.wid, p.fore) }));

  const TUBE = (() => {
    const l = [], r = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const y = lerp(MOUTH[1] + 4, 646, u);
      const w = lerp(15, 11, Math.pow(u, 0.7));
      l.push([540 - w, y]);
      r.push([540 + w, y]);
    }
    return l.concat(r.reverse());
  })();

  const OVARY_PTS = (() => {
    const out = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU;
      // slightly flattened top under the calyx, rounder bottom
      const ry = Math.sin(a) < 0 ? OVARY.ry * 0.9 : OVARY.ry;
      out.push([OVARY.x + Math.cos(a) * OVARY.rx, OVARY.y + Math.sin(a) * ry]);
    }
    return out;
  })();

  // two ovules facing flat side to flat side (the two future beans)
  function seedPts(cx, cy, w, h, side) {
    // D shape: flat face toward the partition at cx - side * w
    const out = [];
    const n = 36;
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI;
      out.push([cx - side * w * 0.12 + side * Math.cos(a) * w, cy + Math.sin(a) * h]);
    }
    out.push([cx - side * w * 0.12, cy + h * 0.85]);
    out.push([cx - side * w * 0.12, cy - h * 0.85]);
    return out;
  }

  // ---------------------------------------------------------------------------
  // Ladder
  // ---------------------------------------------------------------------------
  const LADDER_Y = 1150;
  const FRUITS = [
    { x: 170, r: 24 },
    { x: 320, r: 44 },
    { x: 490, r: 62 },
    { x: 680, r: 78 },
    { x: 880, r: 92 },
  ].map((f, i) => Object.assign(f, { i, y: LADDER_Y, ry: f.r * 1.1, pts: L.ellipsePts(f.x, LADDER_Y, f.r, f.r * 1.1, 72) }));
  const SCALE = { x0: 120, x1: 960, y: 1320 };
  const TICK_X = Array.from({ length: 9 }, (_, i) => SCALE.x0 + 46 + i * ((SCALE.x1 - SCALE.x0 - 92) / 8));
  const LIT_AFTER = [2, 4, 6, 8, 9];

  // ---------------------------------------------------------------------------
  // Scene
  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const t = clamp(tIn, 0, info.dur);
      const E = L.ease;
      const f24 = t * 24;
      const hit = (a, frames, e, lead = 1) => (t < a - 1e-6 ? 0 : (e || ((u) => u))(clamp((t - a) / (frames * FR) + lead / frames)));

      // 1. plate
      L.blueprint(ctx, { center: [540, 600], circles: 3, diagonals: 3, seed: 405 });

      // 2. guides around the flower
      const haze = (x, y) => {
        const d = Math.hypot(x - 540, y - 600) / 250;
        return d < 1 ? 0.22 * (1 - d * 0.5) : 0;
      };
      L.stipple(ctx, null, { bounds: [280, 340, 520, 520], spacing: 7.5, density: haze, r: [0.8, 1.5], color: LAV, alpha: 0.3, seed: sd('haze') });
      L.guideCircle(ctx, 540, 600, 250, { alpha: 0.17, width: 1.5, cross: 22 });
      L.guideCircle(ctx, 540, 600, 212, { alpha: 0.09, width: 1, dash: [2, 8] });
      L.ticks(ctx, 540, 600, { r: 250, n: 120, len: 7, major: 10, majorLen: 16, inward: true, alpha: 0.24, width: 1, color: LAV });
      // horizontal and vertical construction lines through the mouth and the ovary
      {
        const c = new Path2D();
        c.moveTo(250, MOUTH[1]);
        c.lineTo(830, MOUTH[1]);
        c.moveTo(250, OVARY.y);
        c.lineTo(830, OVARY.y);
        c.moveTo(540, 320);
        c.lineTo(540, 880);
        strokeP(ctx, c, LAV, 0.16, 1, [14, 4, 2, 4]);
      }
      // span bracket of the open flower (320 px), fading with the petals
      const petalA = 1 - clamp((f24 + 1) / 9); // petals gone after 9 frames
      if (petalA > 0) L.bracket(ctx, 380, 380, 700, 380, { style: 'dim', cap: 14, alpha: 0.5 * petalA, width: 1.5 });
      // ovary bracket stays
      L.bracket(ctx, OVARY.x - OVARY.rx, 790, OVARY.x + OVARY.rx, 790, { style: 'dim', cap: 12, alpha: 0.5, width: 1.5 });

      // 3. ghost outlines of the ladder fruits, the envelope and the bracket
      for (const F of FRUITS) {
        strokeP(ctx, pathOf(F.pts), LAV, 0.28, 1, [6, 6]);
        const c = new Path2D();
        c.moveTo(F.x - F.r - 14, F.y);
        c.lineTo(F.x + F.r + 14, F.y);
        c.moveTo(F.x, F.y - F.ry - 14);
        c.lineTo(F.x, F.y + F.ry + 14);
        strokeP(ctx, c, LAV, 0.16, 1, [10, 4, 2, 4]);
      }
      {
        const env = L.smoothPts([[110, LADDER_Y - 6], ...FRUITS.map((F) => [F.x, F.y - F.ry - 12]), [990, LADDER_Y - 128]], false, 6);
        strokeP(ctx, pathOf(env, false), LAV, 0.32, 1.2, [6, 8]);
        const envB = L.smoothPts([[110, LADDER_Y + 6], ...FRUITS.map((F) => [F.x, F.y + F.ry + 12]), [990, LADDER_Y + 128]], false, 6);
        strokeP(ctx, pathOf(envB, false), LAV, 0.18, 1, [6, 8]);
      }
      const ladderP = clamp((t - FRUIT_T[0]) / (FRUIT_T[4] + 0.125 - FRUIT_T[0]));
      L.bracket(ctx, FRUITS[0].x - FRUITS[0].r, 1268, FRUITS[4].x + FRUITS[4].r, 1268, { style: 'square', cap: 16, alpha: 0.25, width: 1.5 });
      if (ladderP > 0) L.bracket(ctx, FRUITS[0].x - FRUITS[0].r, 1268, FRUITS[4].x + FRUITS[4].r, 1268, { style: 'square', cap: 16, alpha: 0.6, width: 1.5, p: ladderP });

      // 4. the flower
      // branch stub and the short pedicel under the ovary
      {
        const br = L.rrectPts(360, 760, 360, 26, 13, 12);
        dbl(ctx, br, sd('branch'), { gap: 6, alpha: 0.9 });
        L.hexLattice(ctx, br, { r: 7, alpha: 0.18, width: 1, seed: sd('brlat') });
        const ped = [[530, OVARY.y + OVARY.ry - 4], [530, 762], [550, 762], [550, OVARY.y + OVARY.ry - 4]];
        L.inkPath(ctx, ped, lav({ width: 1.5, alpha: 0.6, seed: sd('ped'), smooth: false }));
      }
      // ovary: navy-light fill, lattice, double outline, partition and two ovules
      const glowK = 0.55 + 0.45 * clamp((f24 + 1) / 9);
      {
        fillP(ctx, pathOf(OVARY_PTS), NAVYL, 0.85);
        L.hexLattice(ctx, OVARY_PTS, { r: 8, alpha: 0.38, width: 1, seed: sd('ovlat'), color: LAV });
        dbl(ctx, OVARY_PTS, sd('ovary'), { gap: 9 });
        const part = new Path2D();
        part.moveTo(540, OVARY.y - OVARY.ry + 10);
        part.lineTo(540, OVARY.y + OVARY.ry - 10);
        strokeP(ctx, part, LAV, 0.6, 1.5);
        for (const side of [-1, 1]) {
          const sp = seedPts(540 + side * 25, OVARY.y + 2, 20, 29, side);
          fillP(ctx, pathOf(sp), NAVYL, 1);
          L.inkPath(ctx, sp, lav({ closed: true, width: 1.8, color: WHITE, alpha: 0.75, seed: sd('ovule', side) }));
          L.stipple(ctx, sp, { spacing: 5, r: [0.8, 1.4], color: LEAFT, alpha: 0.7 * glowK, seed: sd('ovdots', side) });
        }
        // calyx rim: small lobes across the top of the ovary
        const cal = [];
        for (let i = 0; i <= 24; i++) {
          const u = i / 24;
          const x = lerp(478, 602, u);
          cal.push([x, OVARY.y - OVARY.ry * 0.9 - 6 - 6 * Math.abs(Math.sin(u * Math.PI * 4))]);
        }
        L.inkPath(ctx, cal, lav({ width: 1.8, alpha: 0.75, seed: sd('calyx') }));
      }
      // petals, tube, stamens and style fall away over 9 frames
      if (petalA > 0.003) {
        const drop = (1 - petalA) * 26;
        ctx.save();
        ctx.globalAlpha = petalA;
        for (const pt of PETALS) {
          const out = Math.cos(pt.ang) * drop * 0.8;
          const pts = pt.pts.map((q) => [q[0] + out, q[1] + drop]);
          fillP(ctx, pathOf(pts), NAVYL, 0.55);
          L.hexLattice(ctx, pts, { r: 7, alpha: 0.2, width: 1, seed: sd('plat', pt.i) });
          dbl(ctx, pts, sd('petal', pt.i), { gap: Math.min(7, pt.wid * 0.3) });
          // midrib
          const c = Math.cos(pt.ang), s = Math.sin(pt.ang);
          const m = new Path2D();
          m.moveTo(MOUTH[0] + c * 18 + out, MOUTH[1] + s * 18 + drop);
          m.lineTo(MOUTH[0] + c * pt.len * pt.fore * 0.86 + out, MOUTH[1] + s * pt.len * pt.fore * 0.86 + drop);
          strokeP(ctx, m, WHITE, 0.5, 1);
        }
        const tube = TUBE.map((q) => [q[0], q[1] + drop * 0.5]);
        fillP(ctx, pathOf(tube), NAVYL, 1);
        dbl(ctx, tube, sd('tube'), { gap: 4 });
        // five stamens with linear anthers at the mouth
        const st = new Path2D();
        const an = new Path2D();
        for (let k = 0; k < 5; k++) {
          const a = (205 + k * 32.5) * DEG;
          const x0 = MOUTH[0] + Math.cos(a) * 6, y0 = MOUTH[1] + drop;
          const x1 = MOUTH[0] + Math.cos(a) * 52, y1 = MOUTH[1] + Math.sin(a) * 52 + drop;
          st.moveTo(x0, y0);
          st.lineTo(x1, y1);
          an.moveTo(x1 + Math.cos(a) * 14, y1 + Math.sin(a) * 14);
          an.ellipse(x1 + Math.cos(a) * 7, y1 + Math.sin(a) * 7, 10, 3.2, a, 0, TAU);
        }
        strokeP(ctx, st, LAV, 0.7, 1.4);
        strokeP(ctx, an, WHITE, 0.9, 1.4);
        // the style runs from the ovary up through the tube to a forked stigma
        const sy = new Path2D();
        sy.moveTo(540, OVARY.y - 20);
        sy.lineTo(540, MOUTH[1] - 74 + drop);
        sy.moveTo(540, MOUTH[1] - 74 + drop);
        sy.lineTo(530, MOUTH[1] - 96 + drop);
        sy.moveTo(540, MOUTH[1] - 74 + drop);
        sy.lineTo(551, MOUTH[1] - 95 + drop);
        strokeP(ctx, sy, WHITE, 0.85, 1.6);
        ctx.restore();
        // the falling petals are a change: a brief magenta tick on each petal tip in the first frames
        if (f24 < 6) {
          const tk = new Path2D();
          for (const pt of PETALS) {
            const c = Math.cos(pt.ang), s = Math.sin(pt.ang);
            const r = pt.len * pt.fore + 22;
            tk.moveTo(MOUTH[0] + c * r, MOUTH[1] + s * r + drop);
            tk.lineTo(MOUTH[0] + c * (r + 14), MOUTH[1] + s * (r + 14) + drop);
          }
          strokeP(ctx, tk, MAG, 1 - f24 / 6, 3);
        }
      }

      // 5. network: the ovary feeds the ladder
      const netP = 1; // the network is part of the plate from frame 0
      {
        const src = [OVARY.x - 30, OVARY.y + OVARY.ry - 6];
        const dst = [FRUITS[0].x + 6, FRUITS[0].y - FRUITS[0].ry - 10];
        const pts = L.smoothPts([src, [430, 900], [250, 960], [190, 1060], dst], false, 6);
        const n = Math.max(2, Math.floor(pts.length * netP));
        strokeP(ctx, pathOf(pts.slice(0, n), false), LAV, 0.6, 1.5);
        // node glyph at the junction on the left curve
        const nd = pts[Math.floor(pts.length * 0.45)];
        if (netP > 0.45) {
          const g = new Path2D();
          g.arc(nd[0], nd[1], 8, 0, TAU);
          strokeP(ctx, g, WHITE, 0.7, 1.5);
        }
        if (netP >= 0.99) {
          const a = pts[pts.length - 1], b = pts[pts.length - 4];
          const ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
          const ah = new Path2D();
          ah.moveTo(a[0] - Math.cos(ang - 0.45) * 12, a[1] - Math.sin(ang - 0.45) * 12);
          ah.lineTo(a[0], a[1]);
          ah.lineTo(a[0] - Math.cos(ang + 0.45) * 12, a[1] - Math.sin(ang + 0.45) * 12);
          strokeP(ctx, ah, WHITE, 0.8, 1.5);
        }
      }

      // 5b. network nodes: sunlight feeds the ovary; nine months of time feed the ripe fruit
      {
        const np = 1;
        // sun node, upper left
        const S = [165, 560];
        const ring = new Path2D();
        ring.arc(S[0], S[1], 50, 0, TAU);
        strokeP(ctx, ring, LAV, 0.6 * np, 1.5);
        const ring2 = new Path2D();
        ring2.arc(S[0], S[1], 41, 0, TAU);
        strokeP(ctx, ring2, LAV, 0.25 * np, 1, [3, 5]);
        const rays = new Path2D();
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * TAU;
          const r0 = 20, r1 = k % 2 ? 30 : 36;
          rays.moveTo(S[0] + Math.cos(a) * r0, S[1] + Math.sin(a) * r0);
          rays.lineTo(S[0] + Math.cos(a) * r1, S[1] + Math.sin(a) * r1);
        }
        strokeP(ctx, rays, WHITE, 0.6 * np, 1.5);
        L.glowDot(ctx, S[0], S[1], 9, { rays: 0, glow: 3, intensity: 0.7 * np, seed: sd('sun') });
        const s1 = L.smoothPts([[S[0] + 44, S[1] + 24], [300, 640], [420, 690], [OVARY.x - OVARY.rx - 12, OVARY.y]], false, 6);
        strokeP(ctx, pathOf(s1.slice(0, Math.max(2, Math.floor(s1.length * np))), false), LAV, 0.5, 1.3);
        // time node, right: nine segments light with the month scale
        const M = [890, 640];
        let litN = 0;
        for (let i = 0; i < 5; i++) if (t >= FRUIT_T[i] - 1e-6) litN = LIT_AFTER[i];
        const mr = new Path2D();
        mr.arc(M[0], M[1], 50, 0, TAU);
        strokeP(ctx, mr, LAV, 0.6 * np, 1.5);
        for (let k = 0; k < 9; k++) {
          const a0 = -Math.PI / 2 + (k / 9) * TAU + 0.06, a1 = -Math.PI / 2 + ((k + 1) / 9) * TAU - 0.06;
          const seg = new Path2D();
          seg.arc(M[0], M[1], 36, a0, a1);
          if (k < litN) strokeP(ctx, seg, WHITE, 0.95, 3);
          else strokeP(ctx, seg, LAV, 0.3 * np, 2);
        }
        const hand = new Path2D();
        const ha = -Math.PI / 2 + (litN / 9) * TAU;
        hand.moveTo(M[0], M[1]);
        hand.lineTo(M[0] + Math.cos(ha) * 26, M[1] + Math.sin(ha) * 26);
        strokeP(ctx, hand, WHITE, 0.8 * np, 1.5);
        const dotc = new Path2D();
        dotc.arc(M[0], M[1], 3, 0, TAU);
        fillP(ctx, dotc, WHITE, 0.8 * np);
        const m1 = L.smoothPts([[M[0] - 6, M[1] + 50], [905, 760], [930, 900], [FRUITS[4].x + 40, FRUITS[4].y - FRUITS[4].ry - 6]], false, 6);
        strokeP(ctx, pathOf(m1.slice(0, Math.max(2, Math.floor(m1.length * np))), false), LAV, 0.5, 1.3);
        const m2 = L.smoothPts([[M[0] - 50, M[1] - 4], [760, 630], [OVARY.x + OVARY.rx + 12, OVARY.y]], false, 6);
        strokeP(ctx, pathOf(m2.slice(0, Math.max(2, Math.floor(m2.length * np))), false), LAV, 0.3, 1, [4, 6]);
      }

      // 6. ladder fruits
      for (let i = 0; i < 5; i++) {
        const F = FRUITS[i];
        const p = hit(FRUIT_T[i], i === 4 ? 3 : 6, E.outExpo);
        if (p <= 0) continue;
        // link from the previous fruit: a straight dashed arrow along the ladder axis
        if (i > 0) {
          const A = FRUITS[i - 1];
          const x0 = A.x + A.r + 30, x1 = F.x - F.r - 10;
          const xe = lerp(x0, x1, p);
          const lk = new Path2D();
          lk.moveTo(x0, F.y);
          lk.lineTo(xe, F.y);
          strokeP(ctx, lk, LAV, 0.55, 1.2, [5, 5]);
          if (p >= 1) {
            const ah = new Path2D();
            ah.moveTo(x1 - 9, F.y - 6);
            ah.lineTo(x1, F.y);
            ah.lineTo(x1 - 9, F.y + 6);
            strokeP(ctx, ah, WHITE, 0.75, 1.5);
          }
        }
        const fp = pathOf(F.pts);
        if (p >= 1) fillP(ctx, fp, NAVYL, 0.7);
        dbl(ctx, F.pts, sd('fruit', i), { p, gap: Math.min(9, F.r * 0.2) });
        if (p < 1) continue;
        // inner structure: lattice skin band, two seeds flat face to flat face, schemLeaf dots
        const inner = L.ellipsePts(F.x, F.y, F.r * 0.62, F.ry * 0.62, 48);
        if (F.r > 30) {
          const band = [F.pts, inner.slice().reverse()];
          L.hexLattice(ctx, band, { r: Math.max(5, F.r * 0.09), alpha: 0.22, width: 1, seed: sd('flat', i) });
        }
        L.stipple(ctx, F.pts, { spacing: Math.max(5, F.r * 0.12), r: [0.9, 1.7], color: LEAFT, alpha: 0.75, seed: sd('fdots', i), density: (x, y) => 0.4 + 0.6 * sstep(0.4, 1, Math.hypot((x - F.x) / F.r, (y - F.y) / F.ry)) });
        if (F.r > 30) {
          for (const side of [-1, 1]) {
            const sp = seedPts(F.x + side * F.r * 0.27, F.y, F.r * 0.27, F.ry * 0.42, side);
            fillP(ctx, pathOf(sp), NAVYL, 1);
            L.inkPath(ctx, sp, lav({ closed: true, width: 1.5, color: WHITE, alpha: 0.7, seed: sd('fseed', i, side) }));
            // the crease down each flat face
            const cr = new Path2D();
            const cx = F.x + side * F.r * 0.12;
            cr.moveTo(cx, F.y - F.ry * 0.3);
            cr.quadraticCurveTo(cx + side * 4, F.y, cx, F.y + F.ry * 0.3);
            strokeP(ctx, cr, LAV, 0.55, 1);
          }
        } else {
          const g = new Path2D();
          g.arc(F.x, F.y, 4, 0, TAU);
          strokeP(ctx, g, WHITE, 0.7, 1.2);
        }
        // calyx scar at the tip (bottom) and the stalk stub at the top
        const cs = new Path2D();
        const sr = Math.max(4, F.r * 0.14);
        cs.arc(F.x, F.y + F.ry - sr - 3, sr, 0, TAU);
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k * TAU) / 5;
          cs.moveTo(F.x, F.y + F.ry - sr - 3);
          cs.lineTo(F.x + Math.cos(a) * sr, F.y + F.ry - sr - 3 + Math.sin(a) * sr);
        }
        strokeP(ctx, cs, WHITE, 0.7, 1.2);
        const stub = new Path2D();
        stub.moveTo(F.x - 4, F.y - F.ry);
        stub.lineTo(F.x - 4, F.y - F.ry - 10);
        stub.moveTo(F.x + 4, F.y - F.ry);
        stub.lineTo(F.x + 4, F.y - F.ry - 10);
        strokeP(ctx, stub, LAV, 0.6, 1.5);
        // a small vertical size bracket beside each fruit
        L.bracket(ctx, F.x + F.r + 16, F.y - F.ry, F.x + F.r + 16, F.y + F.ry, { style: 'square', cap: 8, alpha: 0.4, width: 1.2 });
      }

      // 7. month scale: 9 long ticks, minor ticks between, lit in step with the fruits
      {
        let lit = 0;
        for (let i = 0; i < 5; i++) if (t >= FRUIT_T[i] - 1e-6) lit = LIT_AFTER[i];
        const base = new Path2D();
        base.moveTo(SCALE.x0, SCALE.y);
        base.lineTo(SCALE.x1, SCALE.y);
        strokeP(ctx, base, LAV, 0.55, 1.5);
        const minor = new Path2D();
        for (let i = 0; i < 8; i++) {
          for (let k = 1; k < 4; k++) {
            const x = lerp(TICK_X[i], TICK_X[i + 1], k / 4);
            minor.moveTo(x, SCALE.y);
            minor.lineTo(x, SCALE.y + 8);
          }
        }
        strokeP(ctx, minor, LAV, 0.35, 1);
        const dim = new Path2D(), on = new Path2D();
        for (let i = 0; i < 9; i++) {
          const p = i < lit ? on : dim;
          p.moveTo(TICK_X[i], SCALE.y - 4);
          p.lineTo(TICK_X[i], SCALE.y + (i < lit ? 26 : 20));
        }
        strokeP(ctx, dim, LAV, 0.35, 1.5);
        strokeP(ctx, on, WHITE, 1, 2);
        // end caps
        const caps = new Path2D();
        caps.moveTo(SCALE.x0, SCALE.y - 10);
        caps.lineTo(SCALE.x0, SCALE.y + 10);
        caps.moveTo(SCALE.x1, SCALE.y - 10);
        caps.lineTo(SCALE.x1, SCALE.y + 10);
        strokeP(ctx, caps, LAV, 0.6, 1.5);
        if (lit > 0) {
          const lx = TICK_X[lit - 1];
          const lt = new Path2D();
          lt.moveTo(TICK_X[0], SCALE.y + 34);
          lt.lineTo(lx, SCALE.y + 34);
          strokeP(ctx, lt, WHITE, 0.7, 1.5);
          L.glowDot(ctx, lx, SCALE.y + 34, 4, { rays: 0, glow: 4, intensity: 0.8, seed: sd('scaledot') });
        }
        // projections from each drawn fruit down to its months
        const pr = new Path2D();
        for (let i = 0; i < 5; i++) {
          if (t < FRUIT_T[i] - 1e-6) continue;
          const F = FRUITS[i];
          const tx = TICK_X[LIT_AFTER[i] - 1];
          pr.moveTo(F.x, F.y + F.ry + 22);
          pr.lineTo(tx, SCALE.y - 10);
        }
        strokeP(ctx, pr, LAV, 0.22, 1, [2, 6]);
      }

      // 8. glow: the ovary core, the fruit cores, the magenta ripe ring
      L.glowDot(ctx, OVARY.x, OVARY.y - 34, 8, { rays: 12, rayLen: 2.4, glow: 5, intensity: glowK, seed: sd('ovglow') });
      for (let i = 0; i < 5; i++) {
        const p = hit(FRUIT_T[i], 3);
        if (p <= 0) continue;
        const fade = 1 - 0.6 * clamp((t - FRUIT_T[i]) / 0.25);
        L.glowDot(ctx, FRUITS[i].x, FRUITS[i].y - FRUITS[i].ry - 22, 4, { rays: 0, glow: 4, intensity: 0.8 * fade, seed: sd('fglow', i) });
      }
      if (t >= B_RIPE - 1e-6) {
        const f = (t - B_RIPE) * 24;
        if (f < 12) {
          const F = FRUITS[4];
          const pr = E.outExpo(clamp((f + 1) / 6));
          const g = new Path2D();
          const r = F.ry + 12 + 34 * pr;
          g.arc(F.x, F.y, r, 0, TAU);
          strokeP(ctx, g, MAG, 1 - clamp((f - 3) / 9), 3);
          dbl(ctx, F.pts, sd('fruit-mag'), { color: MAG, alpha: 1 - clamp((f - 2) / 10), gap: 9 });
        }
      }

      // 9. progress glyph
      progressGlyph(ctx, L, 0, info.p, info.T, false);
    },
  });
})();
