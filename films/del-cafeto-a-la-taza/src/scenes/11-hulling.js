// 11 hulling: "Dry to eleven percent, then hulled". T 21.00 to 22.50, schematic, hard cut.
// The G1 bean inside its parchment hull loses its water as a moisture gauge falls to 18 percent of
// its height; on the beat at T 21.75 the hull cracks (magenta) and its two halves fly off left and
// right; at T 22.125 the bare G1 bean pulses once: green coffee. The last frame is the bare G1 bean,
// which 12 opens on, inked, on the same pixels.
//
// Layers, back to front:
//   1 blueprint plate (navy, grid, guide circles, diagonals), guide circle r 330 on the bean
//   2 measurement: length bracket along the bean axis, width bracket across, construction lines
//   3 moisture gauge at x 150 (tube, tick scale, schemWater level, drop bracket, target tick)
//   4 the G1 bean: hex lattice, stipple form, crease groove, silverskin line, double outline
//   5 water droplets (schemWater glow dots) drifting out and fading on twos
//   6 the parchment hull: double outline 22 px outside G1 with rectangular cells; crack and halves
//   7 inset node (hull section) with its network line
//   8 magenta crack, the bean pulse, the progress glyph (stage 1, u = p)
(function () {
  'use strict';

  const ID = 'hulling';
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
  const B_CRACK = 0.75; // T 21.75, beat: the hull cracks
  const B_PULSE = 1.125; // T 22.125, 8th: the bare bean pulses

  // ---------------------------------------------------------------------------
  // G1: the bean, face-on (docs/storyboard.md, Shared geometry). Copied exactly.
  // ---------------------------------------------------------------------------
  const G1X = 540, G1Y = 900, G1ROT = -15 * DEG;
  const G1_CREASE = [[548, 682], [531, 750], [536, 826], [552, 900], [547, 976], [530, 1052], [538, 1118]];
  const G1_SILVER = [[546, 700], [538, 1100]];
  const CR = Math.cos(G1ROT), SR = Math.sin(G1ROT);
  const rot = (dx, dy) => [G1X + dx * CR - dy * SR, G1Y + dx * SR + dy * CR];
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
  // offset a closed local outline along its outward normals
  function offsetLocal(pts, d) {
    const n = pts.length;
    return pts.map((p, i) => {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      // the outline runs clockwise on screen (y down), so the outward normal is (ty, -tx)
      return [p[0] + (ty / tl) * d, p[1] - (tx / tl) * d];
    });
  }
  const toWorld = (pts) => pts.map((p) => rot(p[0], p[1]));

  // ---------------------------------------------------------------------------
  // layout
  // ---------------------------------------------------------------------------
  const GAUGE_X = 150, GAUGE_Y0 = 600, GAUGE_Y1 = 1300, GAUGE_W = 44, GAUGE_END = 0.18;
  const NODE_X = 832, NODE_Y = 1430, NODE_R = 74;

  // ---------------------------------------------------------------------------
  // geometry (t-independent, built once)
  // ---------------------------------------------------------------------------
  let G = null;
  function geo(L) {
    if (G) return G;
    const g = {};
    const loc = g1Local(96);
    g.loc = loc;
    g.bean = toWorld(loc);
    g.inner = toWorld(offsetLocal(loc, -9));
    g.lattice = toWorld(offsetLocal(loc, -14));
    const hullLoc = offsetLocal(loc, 22);
    const hullInLoc = offsetLocal(loc, 13);
    g.hull = toWorld(hullLoc);
    g.hullIn = toWorld(hullInLoc);
    g.hullRing = [g.hull, toWorld(offsetLocal(loc, 3)).reverse()];
    // the halves: split at the top and bottom tips (local x = 0); each an open arc, top to bottom
    const half = (sign) => {
      const arc = (P) => {
        const pts = [];
        // indices from the top (a = -90 deg, i = 72) round to the bottom (i = 24) on the chosen side
        if (sign < 0) for (let i = 72; i >= 24; i--) pts.push(P[i % 96]);
        else for (let i = 72; i <= 120; i++) pts.push(P[i % 96]);
        return pts;
      };
      const o = arc(toWorld(hullLoc)), m = arc(toWorld(hullInLoc)), b = arc(toWorld(offsetLocal(loc, 3)));
      // rectangular cells: radial walls across the band every 4th sample
      const walls = [];
      for (let i = 2; i < o.length - 2; i += 3) walls.push([b[i], o[i]]);
      // jagged crack edges at the two tips
      const r = L.rng(sd('jag', sign));
      const jag = (p, q) => {
        const pts = [];
        for (let k = 0; k <= 4; k++) {
          const u = k / 4;
          pts.push([lerp(p[0], q[0], u) + (k % 2 ? sign * r.range(2, 6) : 0), lerp(p[1], q[1], u) + r.range(-1.5, 1.5)]);
        }
        return pts;
      };
      return { o, m, b, walls, jt: jag(b[0], o[0]), jb: jag(b[b.length - 1], o[o.length - 1]) };
    };
    g.halfL = half(-1);
    g.halfR = half(1);
    // crease and silverskin, rotated with the bean
    const cr = G1_CREASE.map((p) => rot(p[0] - G1X, p[1] - G1Y));
    g.crease = L.smoothPts(cr, false, 4);
    g.groove = groove(g.crease, 12, 3);
    // silverskin: the crease curve trimmed to y 700..1100 (pre-rotation), ends pinned to the given points
    const sv = [];
    const crLocal = L.smoothPts(G1_CREASE, false, 4);
    for (const p of crLocal) if (p[1] >= 700 && p[1] <= 1100) sv.push(p);
    const a0 = sv[0], a1 = sv[sv.length - 1];
    g.silver = sv.map((p, i) => {
      const u = i / (sv.length - 1);
      const dx = lerp(G1_SILVER[0][0] - a0[0], G1_SILVER[1][0] - a1[0], u);
      return rot(p[0] + dx * 0.5 - G1X, p[1] - G1Y);
    });
    // droplets: seeded inside the bean (local), drifting outward
    const r = L.rng(sd('drops'));
    g.drops = [];
    while (g.drops.length < 52) {
      const x = r.range(-150, 150), y = r.range(-215, 215);
      if (Math.pow(Math.abs(x / 150), 2.3) + Math.pow(Math.abs(y / 215), 2.3) > 1) continue;
      const ang = Math.atan2(y, x) + r.range(-0.4, 0.4);
      g.drops.push({
        p: rot(x, y),
        dir: [Math.cos(ang + G1ROT), Math.sin(ang + G1ROT)],
        dist: r.range(110, 230),
        t0: r.range(0, 0.42),
        dur: r.range(0.22, 0.34),
        keep: g.drops.length < 9, // about 18 percent of the water stays
        r: r.range(3.2, 4.8),
      });
    }
    // axis vectors on screen
    g.up = [SR, -CR]; // toward the narrow top tip
    g.across = [CR, SR];
    G = g;
    return g;
  }

  // a tapered groove polygon around the crease centreline
  function groove(pts, wMax, wEnd) {
    const n = pts.length;
    const Lp = [], Rp = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const u = i / (n - 1);
      const w = (wEnd + (wMax - wEnd) * Math.pow(Math.sin(Math.PI * u), 0.55)) / 2;
      Lp.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
      Rp.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    return Lp.concat(Rp.reverse());
  }

  // ---------------------------------------------------------------------------
  // drawing helpers
  // ---------------------------------------------------------------------------
  function wobPts(L, pts, seed, amp, bi) {
    const n = pts.length;
    const out = new Array(n);
    let s = 0;
    const sdd = (seed + bi * 7919) | 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (i > 0) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      const a = pts[i > 0 ? i - 1 : 0], b = pts[i < n - 1 ? i + 1 : n - 1];
      const tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      const d = amp * L.noise1(s * 0.018, sdd);
      out[i] = [p[0] - (ty / tl) * d, p[1] + (tx / tl) * d];
    }
    return out;
  }
  function addPoly(path, pts, closed, dx = 0, dy = 0) {
    if (pts.length < 2) return;
    path.moveTo(pts[0][0] + dx, pts[0][1] + dy);
    for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0] + dx, pts[i][1] + dy);
    if (closed) path.closePath();
  }
  function wob(L, path, pts, seed, amp, bi, closed, dx = 0, dy = 0) {
    addPoly(path, wobPts(L, pts, seed, amp, bi), closed, dx, dy);
  }
  function stroke(ctx, path, color, alpha, width, dash) {
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
  function glowStroke(ctx, path, color, k) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    stroke(ctx, path, color, 0.05 * k, 16);
    stroke(ctx, path, color, 0.08 * k, 7);
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
  // layers
  // ---------------------------------------------------------------------------
  function drawMeasure(ctx, L, P, g, bi) {
    const lav = P.lavender;
    // construction: the bean axis and the cross axis, long and faint
    const ax = new Path2D();
    const top = [G1X + g.up[0] * 330, G1Y + g.up[1] * 330], bot = [G1X - g.up[0] * 330, G1Y - g.up[1] * 330];
    ax.moveTo(top[0], top[1]);
    ax.lineTo(bot[0], bot[1]);
    ax.moveTo(G1X - g.across[0] * 300, G1Y - g.across[1] * 300);
    ax.lineTo(G1X + g.across[0] * 300, G1Y + g.across[1] * 300);
    stroke(ctx, ax, lav, 0.16, 1, [10, 8]);
    L.guideCircle(ctx, G1X, G1Y, 330, { alpha: 0.16, quadrants: 10, cross: 14 });
    L.guideCircle(ctx, G1X, G1Y, 268, { alpha: 0.1, dash: [3, 9] });
    L.ticks(ctx, G1X, G1Y, { r: 330, n: 72, len: 6, major: 6, majorLen: 14, alpha: 0.28 });
    // length bracket along the axis, to the right of the hull
    const off = 236;
    const a = [G1X + g.up[0] * 240 + g.across[0] * off, G1Y + g.up[1] * 240 + g.across[1] * off];
    const b = [G1X - g.up[0] * 240 + g.across[0] * off, G1Y - g.up[1] * 240 + g.across[1] * off];
    L.bracket(ctx, a[0], a[1], b[0], b[1], { color: lav, alpha: 0.6, cap: 16 });
    L.ticks(ctx, a[0] + g.across[0] * 18, a[1] + g.across[1] * 18, { length: 480, angle: Math.atan2(-g.up[1], -g.up[0]), n: 16, len: 8, major: 4, majorLen: 14, alpha: 0.45, side: -1, baseline: false });
    // width bracket across, below the bean
    const c = [G1X - g.across[0] * 170 - g.up[0] * 300, G1Y - g.across[1] * 170 - g.up[1] * 300];
    const d = [G1X + g.across[0] * 170 - g.up[0] * 300, G1Y + g.across[1] * 170 - g.up[1] * 300];
    L.bracket(ctx, c[0], c[1], d[0], d[1], { color: lav, alpha: 0.6, cap: 16 });
    // extension lines from the bean tips and sides to the brackets
    const ex = new Path2D();
    const tipT = rot(0, -240), tipB = rot(0, 240), sL = rot(-170, 0), sRr = rot(170, 0);
    ex.moveTo(tipT[0] + g.across[0] * 30, tipT[1] + g.across[1] * 30);
    ex.lineTo(a[0] + g.across[0] * 10, a[1] + g.across[1] * 10);
    ex.moveTo(tipB[0] + g.across[0] * 30, tipB[1] + g.across[1] * 30);
    ex.lineTo(b[0] + g.across[0] * 10, b[1] + g.across[1] * 10);
    ex.moveTo(sL[0] - g.up[0] * 40, sL[1] - g.up[1] * 40);
    ex.lineTo(c[0] - g.up[0] * 10, c[1] - g.up[1] * 10);
    ex.moveTo(sRr[0] - g.up[0] * 40, sRr[1] - g.up[1] * 40);
    ex.lineTo(d[0] - g.up[0] * 10, d[1] - g.up[1] * 10);
    stroke(ctx, ex, lav, 0.22, 1, [4, 6]);
  }

  function drawGauge(ctx, L, P, t, bi) {
    const lav = P.lavender, water = P.schemWater;
    const lvl = lerp(1, GAUGE_END, L.ease.inOutSine(t / B_CRACK));
    const x0 = GAUGE_X - GAUGE_W / 2, x1 = GAUGE_X + GAUGE_W / 2;
    const tube = L.rrectPts(x0, GAUGE_Y0, GAUGE_W, GAUGE_Y1 - GAUGE_Y0, GAUGE_W / 2, 12);
    const tubeIn = L.rrectPts(x0 + 8, GAUGE_Y0 + 8, GAUGE_W - 16, GAUGE_Y1 - GAUGE_Y0 - 16, (GAUGE_W - 16) / 2, 12);
    const po = new Path2D(), pi = new Path2D();
    wob(L, po, tube, sd('tube'), 0.5, bi, true);
    wob(L, pi, tubeIn, sd('tubein'), 0.4, bi, true);
    glowStroke(ctx, po, lav, 1);
    stroke(ctx, po, lav, 0.85, 2.5);
    stroke(ctx, pi, lav, 0.5, 1.5);
    // the water column: horizontal schemWater lines (lines, never a fill) up to the level
    const ly = lerp(GAUGE_Y1 - 10, GAUGE_Y0 + 10, lvl);
    const col = new Path2D();
    for (let y = GAUGE_Y1 - 14; y > ly; y -= 6) {
      col.moveTo(x0 + 11, y);
      col.lineTo(x1 - 11, y);
    }
    stroke(ctx, col, water, 0.5, 1.2);
    const surf = new Path2D();
    surf.moveTo(x0 + 9, ly);
    surf.quadraticCurveTo(GAUGE_X, ly + 4, x1 - 9, ly);
    stroke(ctx, surf, water, 1, 2.5);
    L.glowDot(ctx, GAUGE_X, ly, 5, { color: water, rays: 0, glow: 4, intensity: 0.8, seed: sd('lvl') });
    // tick scale on the right of the tube
    L.ticks(ctx, x1 + 10, GAUGE_Y1, { length: GAUGE_Y1 - GAUGE_Y0, angle: -Math.PI / 2, n: 20, len: 10, major: 5, majorLen: 20, alpha: 0.6, side: -1 });
    // the target: 18 percent of the height (11 percent moisture)
    const ty = GAUGE_Y1 - (GAUGE_Y1 - GAUGE_Y0) * GAUGE_END;
    const tg = new Path2D();
    tg.moveTo(x1 + 40, ty);
    tg.lineTo(x1 + 56, ty - 9);
    tg.lineTo(x1 + 56, ty + 9);
    tg.closePath();
    ctx.save();
    ctx.fillStyle = P.lineWhite;
    ctx.globalAlpha = 0.8;
    ctx.fill(tg);
    ctx.restore();
    const tl = new Path2D();
    tl.moveTo(x0 - 6, ty);
    tl.lineTo(x1 + 36, ty);
    stroke(ctx, tl, P.lineWhite, 0.7, 1.5, [5, 4]);
    // drop bracket on the left: from the full mark to the current level
    if (lvl < 0.985) L.bracket(ctx, x0 - 26, GAUGE_Y0 + 10, x0 - 26, ly, { color: lav, alpha: 0.6, cap: 14 });
    // water leaving: three droplets rising out of the tube's top while it falls
    if (t < B_CRACK + 2 * FR) {
      const tw = L.onTwos(t);
      for (let k = 0; k < 3; k++) {
        const u = ((tw * 2.2 + k / 3) % 1);
        L.glowDot(ctx, GAUGE_X + (k - 1) * 9, GAUGE_Y0 - 14 - u * 60, 3, { color: water, rays: 0, glow: 3, intensity: (1 - u) * 0.9, seed: sd('gd', k) });
      }
    }
  }

  function drawBean(ctx, L, P, g, bi, pulse, tDry) {
    const lav = P.lavender, white = P.lineWhite;
    // hex lattice inside
    L.hexLattice(ctx, g.lattice, { r: 15, alpha: 0.3, width: 1, seed: sd('hex'), cellFn: (cx, cy) => {
      const d = Math.hypot(cx - G1X, cy - G1Y);
      return d < 120 ? { fill: lav, alpha: 0.03 + 0.03 * (1 - d / 120) } : true;
    } });
    // form: stipple on the lower right (shadow side), a faint lift upper left
    L.stipple(ctx, g.inner, { spacing: 7, r: [0.8, 1.5], color: lav, alpha: 0.5, seed: sd('stip'), density: (x, y) => 0.08 + 0.75 * sstep(-40, 160, (x - G1X) * 0.6 + (y - G1Y) * 0.8) });
    // drying front: two dashed schemWater isolines contracting toward the centre as the water leaves
    {
      const e = L.ease.inOutSine(clamp(tDry / B_CRACK));
      for (let j = 0; j < 2; j++) {
        const k = lerp(0.9 - j * 0.24, 0.32 - j * 0.14, e);
        const a = lerp(0.6, 0.22, e);
        const iso = new Path2D();
        wob(L, iso, g.inner.map((p) => [G1X + (p[0] - G1X) * k, G1Y + (p[1] - G1Y) * k]), sd('iso', j), 0.8, bi, true);
        stroke(ctx, iso, P.schemWater, a, 1.3, [8, 7]);
      }
    }
    // the embryo at the bottom end: a small rosette of cells
    const emb = rot(-6, 196);
    const ep = new Path2D();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + G1ROT;
      ep.moveTo(emb[0] + Math.cos(a) * 9 + 7, emb[1] + Math.sin(a) * 9);
      ep.arc(emb[0] + Math.cos(a) * 9, emb[1] + Math.sin(a) * 9, 7, 0, TAU);
    }
    stroke(ctx, ep, lav, 0.6, 1.2);
    // crease groove: lineWhite, 12 px tapering to 3
    const gp = new Path2D();
    wob(L, gp, g.groove, sd('groove'), 0.4, bi, true);
    ctx.save();
    ctx.fillStyle = white;
    ctx.globalAlpha = 0.42;
    ctx.fill(gp);
    ctx.restore();
    stroke(ctx, gp, white, 0.9, 1.4);
    const sv = new Path2D();
    wob(L, sv, g.silver, sd('silver'), 0.3, bi, false);
    stroke(ctx, sv, P.paleBlue, 0.85, 1.6, [7, 5]);
    // double outline: the outer line sits on G1
    const po = new Path2D(), pi = new Path2D();
    wob(L, po, g.bean, sd('out'), 0.6, bi, true);
    wob(L, pi, g.inner, sd('in'), 0.5, bi, true);
    glowStroke(ctx, po, lav, 1 + pulse * 5);
    if (pulse > 0) glowStroke(ctx, po, white, pulse * 4);
    stroke(ctx, po, pulse > 0 ? L.mix(lav, white, pulse) : lav, 0.85 + 0.15 * pulse, 2.5 + pulse * 1.5);
    stroke(ctx, pi, lav, 0.5, 1.5);
  }

  function dropAt(d, t) {
    const tw = L_onTwos(t);
    if (d.keep) return { x: d.p[0], y: d.p[1], a: 0.65 };
    const u = clamp((tw - d.t0) / d.dur);
    const e = 1 - (1 - u) * (1 - u);
    return { x: d.p[0] + d.dir[0] * d.dist * e, y: d.p[1] + d.dir[1] * d.dist * e, a: 1 - sstep(0.35, 1, u) };
  }
  const L_onTwos = (t) => Math.floor(t * 12 + 1e-6) / 12;

  function drawDrops(ctx, L, P, g, t) {
    const water = P.schemWater;
    const trails = new Path2D();
    g.drops.forEach((d, i) => {
      const q = dropAt(d, t);
      if (q.a <= 0.01) return;
      if (!d.keep && (q.x !== d.p[0] || q.y !== d.p[1])) {
        // a short trail behind a moving drop
        trails.moveTo(q.x - d.dir[0] * 26, q.y - d.dir[1] * 26);
        trails.lineTo(q.x - d.dir[0] * 6, q.y - d.dir[1] * 6);
      }
      L.glowDot(ctx, q.x, q.y, d.r, { color: water, rays: 0, glow: 3.6, intensity: 0.85 * q.a, seed: sd('drop', i) });
    });
    stroke(ctx, trails, water, 0.45, 1.2);
  }

  function drawHalf(ctx, L, P, h, sign, dx, dy, ang, alpha, bi) {
    if (alpha <= 0.01) return;
    const lav = P.lavender;
    ctx.save();
    ctx.globalAlpha *= alpha;
    // rotate the half about the bean centre, then shift it
    ctx.translate(G1X + dx, G1Y + dy);
    ctx.rotate(ang);
    ctx.translate(-G1X, -G1Y);
    const po = new Path2D(), pm = new Path2D(), pb = new Path2D(), pw = new Path2D(), pj = new Path2D();
    wob(L, po, h.o, sd('ho', sign), 0.6, bi, false);
    wob(L, pm, h.m, sd('hm', sign), 0.5, bi, false);
    wob(L, pb, h.b, sd('hb', sign), 0.4, bi, false);
    for (const [a, b] of h.walls) {
      pw.moveTo(a[0], a[1]);
      pw.lineTo(b[0], b[1]);
    }
    addPoly(pj, h.jt, false);
    addPoly(pj, h.jb, false);
    glowStroke(ctx, po, lav, 1);
    stroke(ctx, po, lav, 0.85, 2.5);
    stroke(ctx, pm, lav, 0.5, 1.5);
    stroke(ctx, pb, lav, 0.4, 1);
    stroke(ctx, pw, lav, 0.35, 1);
    stroke(ctx, pj, lav, 0.7, 1.5);
    ctx.restore();
  }

  function drawWholeHull(ctx, L, P, g, bi) {
    const lav = P.lavender;
    // the band between the hull and the bean: rectangular cells and a fine stipple (parchment fibre)
    L.stipple(ctx, g.hullRing, { spacing: 6, r: [0.7, 1.2], color: lav, alpha: 0.35, seed: sd('hullstip') });
    for (const [h, sign] of [[g.halfL, -1], [g.halfR, 1]]) {
      const pw = new Path2D(), pb = new Path2D();
      for (const [a, b] of h.walls) {
        pw.moveTo(a[0], a[1]);
        pw.lineTo(b[0], b[1]);
      }
      wob(L, pb, h.b, sd('hb', sign), 0.4, bi, false);
      stroke(ctx, pw, lav, 0.35, 1);
      stroke(ctx, pb, lav, 0.4, 1);
    }
    const po = new Path2D(), pm = new Path2D();
    wob(L, po, g.hull, sd('hull'), 0.6, bi, true);
    wob(L, pm, g.hullIn, sd('hullin'), 0.5, bi, true);
    glowStroke(ctx, po, lav, 1);
    stroke(ctx, po, lav, 0.85, 2.5);
    stroke(ctx, pm, lav, 0.5, 1.5);
  }

  function drawCrack(ctx, L, P, g, f) {
    // magenta: a jagged crack line runs round the hull from the top tip down both sides (3 frames),
    // then fades; 10 frames in all
    const k = f - 18;
    if (k < 0 || k >= 10) return;
    const prog = clamp((k + 1) / 2);
    const fade = 1 - sstep(3, 10, k + 1);
    const r = L.rng(sd('crack'));
    const p = new Path2D();
    const n = 48;
    for (const side of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= Math.round(n * prog); i++) {
        const idx = (72 + side * i + 96) % 96;
        const q = g.hull[idx];
        const m = g.hullIn[idx];
        const u = i % 2 ? 0.25 : 0.75;
        pts.push([lerp(q[0], m[0], u) + r.range(-2, 2), lerp(q[1], m[1], u) + r.range(-2, 2)]);
      }
      addPoly(p, pts, false);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    stroke(ctx, p, P.magenta, 0.25 * fade, 10);
    ctx.restore();
    stroke(ctx, p, P.magenta, fade, 3);
    // sparks at the two tips
    for (const idx of [72, 24]) {
      const q = g.hull[idx];
      L.glowDot(ctx, q[0], q[1], 7, { color: P.magenta, rays: 10, rayLen: 3.2, intensity: fade, rot: k * 0.3, seed: sd('tip', idx) });
    }
  }

  function drawNode(ctx, L, P, g, t, f, bi) {
    const lav = P.lavender, water = P.schemWater;
    // network line from the hull's lower right to the node
    const src = g.bean[8];
    const line = new Path2D();
    line.moveTo(src[0], src[1]);
    line.bezierCurveTo(src[0] + 120, src[1] + 40, NODE_X - 40, NODE_Y - 170, NODE_X - 20, NODE_Y - NODE_R);
    stroke(ctx, line, lav, 0.5, 1.2);
    const sdot = new Path2D();
    sdot.arc(src[0], src[1], 4, 0, TAU);
    ctx.save();
    ctx.fillStyle = lav;
    ctx.globalAlpha = 0.8;
    ctx.fill(sdot);
    ctx.restore();
    // node: a magnified section through hull and bean
    const circ = L.ellipsePts(NODE_X, NODE_Y, NODE_R, NODE_R, 64);
    ctx.save();
    ctx.fillStyle = L.rgba(P.navyLight, 0.9);
    ctx.beginPath();
    L.tracePath(ctx, circ, true);
    ctx.fill();
    ctx.clip();
    const split = f >= 19 ? (f < 21 ? L.ease.outBack((f - 18) / 3) : 1 + (L_onTwos(t) - 21 * FR) * 1.4) : 0;
    const lift = Math.min(1.6, split) * 34;
    // bean below: hex cells
    L.hexLattice(ctx, null, { bounds: [NODE_X - NODE_R, NODE_Y - 4, NODE_R * 2, NODE_R + 4], r: 11, alpha: 0.4, seed: sd('nodehex'), clip: false });
    const bl = new Path2D();
    bl.moveTo(NODE_X - NODE_R, NODE_Y - 4);
    bl.lineTo(NODE_X + NODE_R, NODE_Y - 4);
    stroke(ctx, bl, lav, 0.85, 2.5);
    // parchment above: rectangular cells, lifting off after the crack
    const hy0 = NODE_Y - 34 - lift, hy1 = NODE_Y - 6 - lift;
    const hp = new Path2D();
    hp.moveTo(NODE_X - NODE_R, hy0);
    hp.lineTo(NODE_X + NODE_R, hy0);
    hp.moveTo(NODE_X - NODE_R, hy1);
    hp.lineTo(NODE_X + NODE_R, hy1);
    const cells = new Path2D();
    for (let x = NODE_X - NODE_R; x < NODE_X + NODE_R; x += 14) {
      cells.moveTo(x, hy0);
      cells.lineTo(x, hy1);
    }
    cells.moveTo(NODE_X - NODE_R, (hy0 + hy1) / 2);
    cells.lineTo(NODE_X + NODE_R, (hy0 + hy1) / 2);
    const hullA = f >= 21 ? clamp(1 - (f - 21) / 9) : 1;
    stroke(ctx, hp, lav, 0.85 * hullA, 2.5);
    stroke(ctx, cells, lav, 0.4 * hullA, 1);
    // water dots in the section, leaving through the parchment
    const tw = L_onTwos(t);
    for (let i = 0; i < 9; i++) {
      const r = L.rng(sd('nodedrop', i));
      const x = NODE_X + r.range(-50, 50), y0 = NODE_Y + r.range(6, 50);
      const t0 = r.range(0, 0.45), keep = i < 2;
      const u = keep ? 0 : clamp((tw - t0) / 0.3);
      const a = keep ? 0.7 : 1 - sstep(0.4, 1, u);
      if (a > 0.01) L.glowDot(ctx, x, y0 - u * 110, 3.2, { color: water, rays: 0, glow: 3, intensity: a * 0.9, seed: sd('nd', i) });
    }
    ctx.restore();
    const ring = new Path2D(), ring2 = new Path2D();
    wob(L, ring, circ, sd('node'), 0.5, bi, true);
    wob(L, ring2, L.ellipsePts(NODE_X, NODE_Y, NODE_R - 9, NODE_R - 9, 64), sd('node2'), 0.4, bi, true);
    glowStroke(ctx, ring, lav, 1);
    stroke(ctx, ring, lav, 0.85, 2.5);
    stroke(ctx, ring2, lav, 0.5, 1.5);
    L.ticks(ctx, NODE_X, NODE_Y, { r: NODE_R + 6, n: 24, len: 6, major: 6, majorLen: 12, alpha: 0.45 });
  }

  // a second node, upper left: vapour leaving the bean (rising schemWater wisps and drops)
  const VX = 252, VY = 428, VR = 66;
  function drawVapourNode(ctx, L, P, g, t, bi) {
    const lav = P.lavender, water = P.schemWater;
    const src = g.bean[60];
    const line = new Path2D();
    line.moveTo(src[0], src[1]);
    line.bezierCurveTo(src[0] - 60, src[1] - 120, VX + 90, VY + 90, VX + VR * 0.7, VY + VR * 0.7);
    stroke(ctx, line, lav, 0.5, 1.2);
    ctx.save();
    ctx.fillStyle = lav;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(src[0], src[1], 4, 0, TAU);
    ctx.fill();
    ctx.restore();
    const circ = L.ellipsePts(VX, VY, VR, VR, 64);
    ctx.save();
    ctx.fillStyle = L.rgba(P.navyLight, 0.9);
    ctx.beginPath();
    L.tracePath(ctx, circ, true);
    ctx.fill();
    ctx.clip();
    // a surface line at the bottom, wisps rising from it; they thin out as the bean dries
    const k = 1 - 0.75 * L.ease.inOutSine(clamp(t / B_CRACK));
    const tw = L.onTwos(t);
    const base = new Path2D();
    base.moveTo(VX - VR, VY + 34);
    base.lineTo(VX + VR, VY + 34);
    stroke(ctx, base, lav, 0.8, 2);
    L.hatch(ctx, null, { bounds: [VX - VR, VY + 36, VR * 2, 30], angle: 0, spacing: 6, width: 1, color: lav, alpha: 0.35, length: [10, 30], seed: sd('vbase'), boil: bi });
    const wp = new Path2D();
    for (let i = 0; i < 4; i++) {
      const x0 = VX - 36 + i * 24;
      for (let j = 0; j <= 12; j++) {
        const u = j / 12;
        const x = x0 + Math.sin(u * 6 + i + tw * 9) * 6 * u;
        const y = VY + 30 - u * 84;
        if (j) wp.lineTo(x, y);
        else wp.moveTo(x, y);
      }
    }
    stroke(ctx, wp, water, 0.75 * k, 1.5, [6, 5]);
    for (let i = 0; i < 6; i++) {
      const u = (tw * 1.8 + i / 6) % 1;
      const x = VX - 40 + ((i * 37) % 80);
      L.glowDot(ctx, x, VY + 30 - u * 90, 3, { color: water, rays: 0, glow: 3, intensity: k * (1 - u) * 0.9, seed: sd('vd', i) });
    }
    ctx.restore();
    const ring = new Path2D(), ring2 = new Path2D();
    wob(L, ring, circ, sd('vnode'), 0.5, bi, true);
    wob(L, ring2, L.ellipsePts(VX, VY, VR - 9, VR - 9, 64), sd('vnode2'), 0.4, bi, true);
    glowStroke(ctx, ring, lav, 1);
    stroke(ctx, ring, lav, 0.85, 2.5);
    stroke(ctx, ring2, lav, 0.5, 1.5);
    L.ticks(ctx, VX, VY, { r: VR + 6, n: 24, len: 6, major: 6, majorLen: 12, alpha: 0.45 });
  }

  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal;
      const t = clamp(tIn, 0, info.dur);
      const g = geo(L);
      const bi = L.boil(info.T);
      const f = Math.min(35, Math.floor(t * 24 + 1e-6));
      const tw = L.onTwos(t);

      // 1 plate
      L.blueprint(ctx, { center: [G1X, G1Y] });

      // 2 measurement and construction
      drawMeasure(ctx, L, P, g, bi);

      // 3 gauge
      drawGauge(ctx, L, P, t, bi);

      // 4 the bean (pulse on the 8th at T 22.125: 8 frames)
      const pf = f - Math.round(B_PULSE * 24);
      const pulse = pf >= 0 && pf < 8 ? Math.sin(Math.PI * ((pf + 1) / 8)) : 0;
      drawBean(ctx, L, P, g, bi, pulse, t);
      if (pf >= 0 && pf < 9) {
        // a lavender ring expands off the outline with the pulse
        const u = (pf + 1) / 9;
        const ring = new Path2D();
        const k = 1 + 0.18 * L.ease.outExpo(u);
        addPoly(ring, g.bean.map((p) => [G1X + (p[0] - G1X) * k, G1Y + (p[1] - G1Y) * k]), true);
        stroke(ctx, ring, P.lineWhite, 0.7 * (1 - u), 2);
      }

      // 5 droplets
      drawDrops(ctx, L, P, g, t);

      // 6 hull: whole until the crack, then two halves flying apart
      if (f < 18) {
        drawWholeHull(ctx, L, P, g, bi);
      } else {
        // outBack over 3 frames to 70 px apart, then drift on twos and fade over 9 frames
        const k3 = L.ease.outBack(clamp((f - 18) / 3));
        const drift = f >= 21 ? (tw - 21 * FR) / (9 * FR) : 0;
        const off = 70 * k3 + 320 * L.ease.inQuad(clamp(drift));
        const alpha = f < 21 ? 1 : 1 - clamp(drift);
        const ang = 0.12 * k3 + 0.25 * clamp(drift);
        drawHalf(ctx, L, P, g.halfL, -1, -g.across[0] * off, -g.across[1] * off + 30 * clamp(drift), -ang, alpha, bi);
        drawHalf(ctx, L, P, g.halfR, 1, g.across[0] * off, g.across[1] * off + 30 * clamp(drift), ang, alpha, bi);
      }

      // 7 inset node
      drawNode(ctx, L, P, g, t, f, bi);
      drawVapourNode(ctx, L, P, g, t, bi);

      // 8 magenta crack and the progress glyph
      drawCrack(ctx, L, P, g, f);
      progressGlyph(ctx, L, 1, info.p, info.T, false);
    },
  });
})();
