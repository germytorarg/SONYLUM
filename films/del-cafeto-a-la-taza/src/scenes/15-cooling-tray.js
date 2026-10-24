// 15 cooling-tray : "The cooling tray and the roast ladder" (illustrated, global T 28.50 to 30.75)
// Stripes stripeCream / stripeApricot. Camera locked with a slow drift down (y 960 -> 990).
//
// Layers, back to front (inside the camera):
//   1 stripes, floor shadow, the tray stand (legs, motor housing)
//   2 the roast card behind the ladder (paper, printed slot rings), its shadow
//   3 the roast ladder: six large beans at y 520 popping in on 8th-triplets, green -> yellow -> cinnamon ->
//     medium -> dark -> dark with oil sheen, growing 0.8 -> 1.0, crease opening; the oil gleam at T 30.0
//   4 the cooling tray (ellipse (540, 1180) rx 470 ry 300): side wall, rim, perforated floor, the bean bed
//     (about 190 roasted beans, 48 x 34, medium with cinnamon and dark mixed), the stirring arm (one turn per 1.5 s)
//   5 steam / smoke wisps rising off the tray
//   6 overlays: annBlue elliptical arrow with the arm, annYellow bracket under the ladder, annMagenta ring on the
//     oily bean at T 30.0
(function () {
  'use strict';

  const ID = 'cooling-tray';
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

  const INK = P.ink, INKSOFT = P.inkSoft, INKFAINT = P.inkFaint, WHITE = P.white;
  const STEEL = P.steel, STEELD = P.steelDeep;
  const STEEL_L = L.mix(P.steel, P.white, 0.45);
  const FLOOR = L.mix(P.steelDeep, P.ink, 0.25);

  // ---------------------------------------------------------------------------
  // Beats (shot-local; global T in comments)
  // ---------------------------------------------------------------------------
  const POPS = [0.0, 0.25, 0.5, 0.75, 1.0, 1.25]; // T 28.50 .. 29.75, one per 8th-triplet
  const B_GLEAM = 1.5; // T 30.00 magenta ring + oil gleam (second crack)
  const ARM_PERIOD = 1.5;

  // ---------------------------------------------------------------------------
  // Layout (docs/storyboard.md 15). The ladder is re-spaced to sit inside the safe area x 60..940
  // (storyboard x 135..930 would put the last bean and its ring past x 940).
  // ---------------------------------------------------------------------------
  const LAD_Y = 520;
  const LAD_X = [125, 273, 421, 569, 717, 865];
  const LAD_W = 110, LAD_H = 150;
  const LAD_S = [0.7, 0.72, 0.86, 0.95, 1.0, 1.0]; // green to roasted: about twice the size (storyboard 0.8)
  const LAD_OPEN = [0.0, 0.08, 0.42, 0.62, 0.78, 0.84];
  const LAD_COL = [P.beanGreen, P.beanYellow, P.beanCinnamon, P.beanMedium, P.beanDark, P.beanDark];
  const LAD_ROT = -15 * DEG; // the G1 lean
  const TC = [540, 1180], TRX = 470, TRY = 300, RIM = 30;
  const KY = TRY / TRX; // foreshortening of the tray plane

  // ---------------------------------------------------------------------------
  // Bean shape (G1 superellipse family) and helpers
  // ---------------------------------------------------------------------------
  const CREASE = [[548, 682], [531, 750], [536, 826], [552, 900], [547, 976], [530, 1052], [538, 1118]].map(([x, y]) => [(x - 540) / 170, (y - 900) / 240]);
  function beanUnit(n) {
    const out = [];
    const e = 2 / 2.3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const c = Math.cos(a), s = Math.sin(a);
      const x = Math.sign(c) * Math.pow(Math.abs(c), e);
      const y = Math.sign(s) * Math.pow(Math.abs(s), e);
      out.push([x * (1 - (0.06 * (1 - y)) / 2), y]);
    }
    return out;
  }
  const BEAN_U = beanUnit(48);
  const xf = (pts, cx, cy, a, b, rot) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    return pts.map(([x, y]) => [cx + x * a * c - y * b * s, cy + x * a * s + y * b * c]);
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
  const fillPoly = (ctx, pts, col, a = 1) => {
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = col;
    ctx.beginPath();
    L.tracePath(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  };

  // one roasted / green bean, upright local frame rotated by rot. o: col, open, oil, seed, lw, hs, hw, bi
  function paintBean(g, cx, cy, a, b, rot, o) {
    const pts = xf(BEAN_U, cx, cy, a, b, rot);
    const deep = L.mix(o.col, INK, o.dark ? 0.55 : 0.5);
    const local = (x, y) => {
      const dx = x - cx, dy = y - cy, c = Math.cos(-rot), s = Math.sin(-rot);
      return [(dx * c - dy * s) / a, (dx * s + dy * c) / b];
    };
    fillPoly(g, xf(BEAN_U, cx + a * 0.14, cy + b * 0.1, a, b, rot), INK, 0.2);
    const bo = o.bi == null ? {} : { boil: o.bi };
    L.inkPath(g, pts, Object.assign({ closed: true, width: o.lw, fill: o.col, seed: o.seed, wobble: o.big ? 1 : 0.5, tremble: o.big ? 0.3 : 0.12, taper: [4, 8], step: o.big ? 2.5 : 1.5, overlap: o.big ? 10 : 4 }, bo));
    const dens = (x, y) => {
      const [u, v] = local(x, y);
      return sstep(-0.05, 0.75, u * 0.62 + v * 0.78);
    };
    if (o.dark) {
      L.crossHatch(g, pts, Object.assign({ tone: 0.75, spacing: o.hs, crossSpacing: o.hs * 1.3, width: o.hw, color: L.mix(o.col, INK, 0.7), alpha: 0.9, length: [o.hs * 2, o.hs * 6], gap: [1, 3], inset: 1, overshoot: 0, clip: true, seed: o.seed + 3, density: dens }, bo));
    } else {
      L.hatch(g, pts, Object.assign({ angle: -Math.PI / 4, spacing: o.hs, width: o.hw, color: deep, alpha: 0.85, length: [o.hs * 1.8, o.hs * 6], gap: [1, 3], inset: 1, overshoot: 0, clip: true, seed: o.seed + 3, density: dens }, bo));
    }
    // highlight on the lit upper left
    g.save();
    g.translate(cx, cy);
    g.rotate(rot);
    g.strokeStyle = L.mix(o.col, WHITE, o.dark ? 0.32 : 0.5);
    g.lineCap = 'round';
    g.lineWidth = a * 0.14;
    g.globalAlpha = 0.9;
    g.beginPath();
    g.ellipse(0, 0, a * 0.72, b * 0.78, 0, 1.08 * Math.PI, 1.42 * Math.PI);
    g.stroke();
    g.restore();
    // crease
    const cl = L.smoothPts(xf(CREASE, cx, cy, a, b, rot), false, o.big ? 3 : 2);
    const w0 = a * (0.1 + 0.3 * o.open);
    const groove = ribbon(cl, (u) => w0 * (0.25 + 0.75 * Math.pow(Math.sin(Math.PI * u), 0.7)));
    fillPoly(g, groove.poly, L.mix(o.col, INK, 0.78));
    if (o.open > 0.3) {
      // opened lips catch the light on the left edge
      L.inkPath(g, groove.left, Object.assign({ width: Math.max(1, o.lw * 0.35), color: L.mix(o.col, WHITE, 0.3), alpha: 0.9, seed: o.seed + 21, taper: [6, 6], wobble: 0.3 }, bo));
    }
    L.inkPath(g, groove.right, Object.assign({ width: Math.max(1.1, o.lw * 0.45), color: INK, alpha: 0.85, seed: o.seed + 9, taper: [5, 5], wobble: 0.3, tremble: 0.1 }, bo));
    // the pale silverskin line stays in the crease
    L.inkPath(g, cl.slice(3, cl.length - 3), Object.assign({ width: Math.max(1, a * (0.05 + 0.03 * o.open)), color: P.silverskin, alpha: 0.95, seed: o.seed + 11, taper: [4, 4], wobble: 0.2, tremble: 0.05 }, bo));
    if (o.oil) {
      // oily sheen: beanOil patches and two white gloss streaks
      g.save();
      g.beginPath();
      L.tracePath(g, pts, true);
      g.clip();
      g.translate(cx, cy);
      g.rotate(rot);
      g.fillStyle = P.beanOil;
      g.globalAlpha = 0.55;
      g.beginPath();
      g.ellipse(-a * 0.42, -b * 0.25, a * 0.2, b * 0.42, 0.1, 0, TAU);
      g.fill();
      g.beginPath();
      g.ellipse(a * 0.45, b * 0.18, a * 0.12, b * 0.3, -0.1, 0, TAU);
      g.fill();
      g.strokeStyle = WHITE;
      g.lineCap = 'round';
      g.globalAlpha = 0.9;
      g.lineWidth = a * 0.12;
      g.beginPath();
      g.ellipse(0, 0, a * 0.6, b * 0.66, 0, 1.12 * Math.PI, 1.34 * Math.PI);
      g.stroke();
      g.lineWidth = a * 0.06;
      g.beginPath();
      g.ellipse(0, 0, a * 0.6, b * 0.66, 0, 1.4 * Math.PI, 1.46 * Math.PI);
      g.stroke();
      g.restore();
    }
  }

  // tray bean atlas: 4 colours (cinnamon, medium, dark, dark+oil) x 3 boil drawings, drawn at 2x
  const TCOL = [P.beanCinnamon, P.beanMedium, P.beanDark, P.beanDark];
  const CW = 64, VAR = 3, TB_W = 17, TB_L = 24; // half sizes of a 48 x 34 bean
  function atlas() {
    const S = FILM.S || 1;
    return L.cached(['bean-atlas', ID, S].join('|'), () => {
      const c = FILM.makeCanvas(Math.ceil(TCOL.length * CW * S), Math.ceil(VAR * CW * S));
      const g = c.getContext('2d');
      g.scale(S, S);
      for (let i = 0; i < TCOL.length; i++) {
        for (let k = 0; k < VAR; k++) {
          paintBean(g, i * CW + CW / 2, k * CW + CW / 2, TB_W, TB_L, 0, {
            col: TCOL[i], open: 0.75, oil: i === 3, dark: i >= 2, seed: sd('spr', i, k), bi: k * 7 + 5, lw: 2, hs: 3, hw: 1.1,
          });
        }
      }
      return c;
    });
  }
  function blit(ctx, A, ci, vk, x, y, rot, sc) {
    const S = FILM.S || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(1, 0.9); // seen from three-quarters above
    const d = CW * sc;
    ctx.drawImage(A, ci * CW * S, vk * CW * S, CW * S, CW * S, -d / 2, -d / 2, d, d);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Geometry tables
  // ---------------------------------------------------------------------------
  const tp = (r, a, lift = 0) => [TC[0] + Math.cos(a) * r, TC[1] + Math.sin(a) * r * KY - lift];
  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const g = {};
    const r = L.rng(sd('beans'));
    g.beans = [];
    let guard = 0;
    while (g.beans.length < 196 && guard++ < 60000) {
      const u = r.range(-1, 1), v = r.range(-1, 1);
      if (u * u + v * v > 1) continue;
      const rr = Math.hypot(u, v) * 402, a = Math.atan2(v, u);
      const p = tp(rr, a);
      if (g.beans.some((b) => Math.hypot(b.x0 - p[0], (b.y0 - p[1]) / 0.9) < 33)) continue;
      const k = r();
      g.beans.push({
        rr, a, x0: p[0], y0: p[1],
        ci: k < 0.62 ? 1 : k < 0.8 ? 0 : k < 0.95 ? 2 : 3,
        rot: r.range(0, TAU), vk: r.int(0, 2), jig: r.range(0, TAU), sc: r.range(0.94, 1.06),
      });
    }
    // perforation dots on the floor ring
    g.perf = [];
    for (let y = -280; y <= 280; y += 14) {
      for (let x = -440; x <= 440; x += 16) {
        const xx = x + ((y / 14) % 2 ? 8 : 0);
        const e = (xx / 440) ** 2 + (y / 280) ** 2;
        if (e < 0.8 || e > 0.97) continue;
        g.perf.push([TC[0] + xx, TC[1] + y]);
      }
    }
    // steam wisps
    const w = L.rng(sd('wisps'));
    g.wisps = [];
    for (let i = 0; i < 7; i++) g.wisps.push({ x: 230 + i * 100 + w.range(-25, 25), y0: w.range(1000, 1090), h: w.range(260, 380), ph: w.range(0, 1), spd: w.range(0.35, 0.55), amp: w.range(16, 30), seed: sd('wisp', i) });
    g.rimOut = L.ellipsePts(TC[0], TC[1], TRX, TRY, 120);
    g.rimIn = L.ellipsePts(TC[0], TC[1], TRX - RIM, TRY - RIM * KY * 1.3, 120);
    GEO = g;
    return g;
  }

  // ---------------------------------------------------------------------------
  // Layers
  // ---------------------------------------------------------------------------
  function drawStand(ctx) {
    // floor shadow
    const sh = L.ellipsePts(560, 1800, 520, 60, 48);
    hat(ctx, sh, { angle: -Math.PI / 4, spacing: 6, width: 1.4, color: INK, alpha: 0.5, length: [14, 40], seed: sd('floorsh'), density: (x, y) => 1 - sstep(0.45, 1, Math.hypot((x - 560) / 520, (y - 1800) / 60)) });
    // legs
    for (const [x0, x1] of [[260, 200], [820, 880], [540, 540]]) {
      const top = x0 === 540 ? 1520 : 1440;
      ink(ctx, [[x0 - 12, top], [x1 - 12, 1800], [x1 + 12, 1800], [x0 + 12, top]], { closed: true, width: 3, fill: STEELD, smooth: false, seed: sd('leg', x0), wobble: 0.6 });
      hat(ctx, [[x0 + 1, top], [x1 + 1, 1800], [x1 + 12, 1800], [x0 + 12, top]], { angle: 0.05, spacing: 5, width: 1.3, color: INK, alpha: 0.7, length: [10, 26], seed: sd('legh', x0) });
      ink(ctx, L.ellipsePts(x1, 1802, 26, 8, 20), { closed: true, width: 2.4, fill: STEEL, seed: sd('foot', x0), wobble: 0.3 });
    }
    // motor housing under the centre
    const mh = [[470, 1470], [470, 1590], [610, 1590], [610, 1470]];
    ink(ctx, mh, { closed: true, width: 3.4, fill: STEEL, smooth: false, seed: sd('motor'), wobble: 0.6 });
    const cont = new Path2D();
    for (let y = 1476; y < 1588; y += 7) {
      cont.moveTo(560 + L.h3(y, 1, 9) * 8, y);
      cont.quadraticCurveTo(590, y + 3, 607, y);
    }
    ctx.save();
    ctx.strokeStyle = STEELD;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.9;
    ctx.stroke(cont);
    ctx.restore();
    ink(ctx, L.ellipsePts(540, 1590, 70, 14, 30), { closed: true, width: 3, fill: STEELD, seed: sd('motorb'), wobble: 0.4 });
    for (let k = 0; k < 4; k++) ink(ctx, [[482, 1500 + k * 22], [520, 1500 + k * 22]], { width: 2, color: INKSOFT, seed: sd('vent', k), taper: [2, 2] });
  }

  function drawCard(ctx, bi) {
    // roast card: a paper strip behind the ladder, slightly askew
    const card = L.rrectPts(40, 400, 1000, 252, 14, 24).map(([x, y]) => [x, y + (x - 540) * -0.012]);
    fillPoly(ctx, card.map(([x, y]) => [x + 12, y + 14]), INK, 0.12);
    hat(ctx, card.map(([x, y]) => [x + 12, y + 14]), { angle: -Math.PI / 4, spacing: 6, width: 1.3, color: INK, alpha: 0.45, length: [12, 30], seed: sd('cardsh'), density: (x, y) => (y > 640 || x > 1030 ? 1 : 0) });
    ink(ctx, card, { closed: true, width: 3, fill: P.white, seed: sd('card'), wobble: 1.2 });
    ink(ctx, [[64, 444 + 6], [1016, 444 - 6]], { width: 1.5, color: INKFAINT, alpha: 0.6, seed: sd('cardline1'), taper: [10, 10] });
    ink(ctx, [[64, 618 + 6], [1016, 618 - 6]], { width: 1.5, color: INKFAINT, alpha: 0.6, seed: sd('cardline2'), taper: [10, 10] });
    // a printed slot ring under each bean and colour swatches along the bottom
    for (let i = 0; i < 6; i++) {
      const x = LAD_X[i], y = LAD_Y + (x - 540) * -0.012;
      ink(ctx, L.ellipsePts(x, y + 2, 64, 86, 40, LAD_ROT), { closed: true, width: 1.4, color: INKFAINT, alpha: 0.55, seed: sd('slot', i), wobble: 0.6 });
      const sw = L.rrectPts(x - 26, y + 92, 52, 14, 4, 8);
      ink(ctx, sw, { closed: true, width: 1.6, fill: LAD_COL[i], seed: sd('sw', i), wobble: 0.3 });
    }
  }

  function drawLadder(ctx, t, bi) {
    for (let i = 0; i < 6; i++) {
      const x = LAD_X[i], y = LAD_Y + (x - 540) * -0.012;
      const t0 = POPS[i];
      if (t + 1e-6 < t0) {
        // empty slot: a faint dashed placeholder
        L.inkPath(ctx, xf(BEAN_U, x, y, (LAD_W / 2) * LAD_S[i] * 0.9, (LAD_H / 2) * LAD_S[i] * 0.9, LAD_ROT), { closed: true, width: 1.5, color: INKFAINT, alpha: 0.35, seed: sd('ph', i), wobble: 0.6 });
        continue;
      }
      const d = Math.floor((t - t0) * 12 + 1e-6);
      const pop = [0.72, 1.08, 1][Math.min(2, d)];
      const s = LAD_S[i] * pop;
      const a = (LAD_W / 2) * s, b = (LAD_H / 2) * s;
      // cast shadow on the card
      const sh = xf(BEAN_U, x + 12, y + 16, a, b, LAD_ROT);
      L.hatch(ctx, sh, { angle: -Math.PI / 4, spacing: 4, width: 1.3, color: INK, alpha: 0.55, length: [8, 24], seed: sd('lsh', i) });
      paintBean(ctx, x, y, a, b, LAD_ROT, {
        col: LAD_COL[i], open: LAD_OPEN[i], oil: i === 5, dark: i >= 4, seed: sd('lad', i), lw: 4, hs: 6, hw: 1.5, big: true,
      });
      if (i === 5 && t >= B_GLEAM - FR) {
        // the gleam travels across the oily bean over 6 frames
        const u = clamp((t - B_GLEAM) / (6 * FR) + 1 / 6);
        if (u < 1) {
          const pts = xf(BEAN_U, x, y, a, b, LAD_ROT);
          ctx.save();
          ctx.beginPath();
          L.tracePath(ctx, pts, true);
          ctx.clip();
          const gx = x - a * 1.4 + u * a * 2.8, gy = y - b * 1.1 + u * b * 2.2;
          ctx.translate(gx, gy);
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = WHITE;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(-140, -9, 280, 18);
          ctx.globalAlpha = 0.5;
          ctx.fillRect(-140, 14, 280, 5);
          ctx.restore();
        }
        // tiny sparkle at the gleam's start
        const sp = 1 - u;
        if (sp > 0) {
          ctx.save();
          ctx.strokeStyle = WHITE;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.globalAlpha = sp;
          const sx = x - a * 0.5, sy = y - b * 0.55, rr = 18 * (0.5 + u);
          ctx.beginPath();
          ctx.moveTo(sx - rr, sy);
          ctx.lineTo(sx + rr, sy);
          ctx.moveTo(sx, sy - rr);
          ctx.lineTo(sx, sy + rr);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // boil override while painting cached layers (null = live)
  let CB = null;
  const ink = (ctx, pts, o) => L.inkPath(ctx, pts, CB == null ? o : Object.assign({}, o, { boil: CB }));
  const hat = (ctx, c, o) => L.hatch(ctx, c, CB == null ? o : Object.assign({}, o, { boil: CB }));
  const xhat = (ctx, c, o) => L.crossHatch(ctx, c, CB == null ? o : Object.assign({}, o, { boil: CB }));
  const stip = (ctx, c, o) => L.stipple(ctx, c, CB == null ? o : Object.assign({}, o, { boil: CB }));
  // the tray's static parts as three boil drawings: under the beans and over them
  const LX0 = 0, LY0 = 360, LW = 1080, LH = 1530;
  function trayLayer(G, which, v) {
    const S = FILM.S || 1;
    return L.cached(['tray', which, ID, S, v].join('|'), () => {
      const c = FILM.makeCanvas(Math.ceil(LW * S), Math.ceil(LH * S));
      const g = c.getContext('2d');
      g.scale(S, S);
      g.translate(-LX0, -LY0);
      CB = v * 5 + (which === 'under' ? 1 : 3);
      try {
        if (which === 'under') {
          drawStand(g);
          drawCard(g);
          trayUnder(g, G);
        }
        else trayOver(g, G);
      } finally {
        CB = null;
      }
      return c;
    });
  }
  function trayUnder(ctx, G) {
    // side wall below the rim (front half)
    const wall = [];
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * Math.PI;
      wall.push(tp(TRX, a));
    }
    for (let i = 60; i >= 0; i--) {
      const a = (i / 60) * Math.PI;
      const p = tp(TRX - 6, a);
      wall.push([p[0], p[1] + 46]);
    }
    ink(ctx, wall, { closed: true, width: 4, fill: STEEL, seed: sd('wall'), wobble: 1 });
    xhat(ctx, wall, { tone: 0.5, spacing: 6, width: 1.4, color: STEELD, alpha: 0.9, seed: sd('wallh'), length: [10, 30], density: (x) => sstep(380, 1000, x) * 0.8 + 0.2 });
    // rivets on the wall
    for (let k = 1; k < 18; k++) {
      const a = (k / 18) * Math.PI;
      const p = tp(TRX - 3, a);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(p[0], p[1] + 24, 3, 0, TAU);
      ctx.fill();
    }
    // rim top surface
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, G.rimOut, true);
    L.tracePath(ctx, G.rimIn.slice().reverse(), true);
    ctx.fillStyle = STEEL;
    ctx.fill();
    ctx.restore();
    // floor
    fillPoly(ctx, G.rimIn, FLOOR);
    const pp = new Path2D();
    for (const [x, y] of G.perf) {
      pp.moveTo(x + 2.4, y);
      pp.ellipse(x, y, 2.4, 1.6, 0, 0, TAU);
    }
    ctx.save();
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.8;
    ctx.fill(pp);
    ctx.restore();
    // the bean bed mass
    fillPoly(ctx, L.ellipsePts(TC[0], TC[1] + 4, 412, 262, 80), L.mix(P.beanMedium, INK, 0.5));
    stip(ctx, L.ellipsePts(TC[0], TC[1] + 4, 404, 256, 60), { spacing: 9, density: 0.7, r: [1.2, 2.2], color: P.beanCinnamon, alpha: 0.5, seed: sd('bedst') });
  }
  function trayOver(ctx, G) {
    // rim outlines and light
    ink(ctx, G.rimOut, { closed: true, width: 5, seed: sd('rimo'), wobble: 1.2, double: { offset: -4, alpha: 0.35 } });
    ink(ctx, G.rimIn, { closed: true, width: 3, seed: sd('rimi'), wobble: 1 });
    ctx.save();
    ctx.strokeStyle = STEEL_L;
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(TC[0], TC[1], TRX - RIM / 2, TRY - (RIM / 2) * KY * 1.3, 0, 1.05 * Math.PI, 1.55 * Math.PI);
    ctx.stroke();
    ctx.restore();
    // rim shadow inside along the far (upper) floor edge
    const cr = [];
    for (let i = 0; i <= 40; i++) cr.push(tp(TRX - RIM, Math.PI + (i / 40) * Math.PI));
    for (let i = 40; i >= 0; i--) { const p = tp(TRX - RIM - 34, Math.PI + (i / 40) * Math.PI); cr.push([p[0], p[1] + 10]); }
    hat(ctx, cr, { angle: -Math.PI / 4, spacing: 5, width: 1.3, color: INK, alpha: 0.5, seed: sd('rimsh'), length: [10, 26], clip: true });
  }
  function drawTray(ctx, t, tw, G, A, bi) {
    const vkb = Math.floor(tw * 12);
    const phi = (t / ARM_PERIOD) * TAU;
    const v = ((bi % 3) + 3) % 3;
    // beans, circulating slower than the arm and jostled on twos
    const drift = 0.3 * phi;
    const list = G.beans.map((b) => {
      const near = Math.cos(b.a + drift - phi);
      const push = Math.max(0, near) ** 6 * 0.06;
      const a = b.a + drift * (0.6 + 0.4 * (1 - b.rr / 402)) + push;
      const p = tp(b.rr, a);
      const j = L.h3(vkb, b.jig * 100, 7) - 0.5;
      return { b, x: p[0] + j * 2, y: p[1] + j * 1.5, rot: b.rot + 0.5 * drift + j * 0.3 };
    });
    list.sort((p, q) => p.y - q.y);
    for (const q of list) blit(ctx, A, q.b.ci, (q.b.vk + vkb) % VAR, q.x, q.y, q.rot, q.b.sc);
    ctx.drawImage(trayLayer(G, 'over', v), LX0, LY0, LW, LH);
    drawArm(ctx, phi);
  }

  function drawArm(ctx, phi) {
    // central spindle
    for (let k = 0; k < 2; k++) {
      const a = phi + k * Math.PI;
      const pts = [];
      for (let i = 0; i <= 10; i++) pts.push(tp(34 + (i / 10) * 382, a, 16));
      L.inkPath(ctx, pts, { width: 13, color: INK, seed: sd('armo', k), taper: [0, 2], swell: 0, wobble: 0.4 });
      L.inkPath(ctx, pts, { width: 7, color: STEEL, seed: sd('arm', k), taper: [0, 2], swell: 0, wobble: 0.4 });
      L.inkPath(ctx, pts.slice(0, 9).map(([x, y]) => [x, y - 2]), { width: 2, color: STEEL_L, seed: sd('armh', k), taper: [4, 4], wobble: 0.3 });
      // paddles hanging into the beans, with little bristle brushes
      for (const r of [140, 250, 360]) {
        const p = tp(r, a, 16);
        const nx = -Math.sin(a), ny = Math.cos(a) * KY;
        const nl = Math.hypot(nx, ny) || 1;
        const hw = 22;
        const pad = [[p[0] - (nx / nl) * hw, p[1] - (ny / nl) * hw], [p[0] + (nx / nl) * hw, p[1] + (ny / nl) * hw], [p[0] + (nx / nl) * hw, p[1] + (ny / nl) * hw + 22], [p[0] - (nx / nl) * hw, p[1] - (ny / nl) * hw + 22]];
        L.inkPath(ctx, pad, { closed: true, width: 2.6, fill: STEEL, smooth: false, seed: sd('pad', k, r), wobble: 0.3 });
        L.hatch(ctx, pad, { angle: -Math.PI / 4, spacing: 4, width: 1.1, color: STEELD, alpha: 0.85, seed: sd('padh', k, r), length: [6, 14] });
        const br = new Path2D();
        for (let m = 0; m <= 8; m++) {
          const u = m / 8 - 0.5;
          const bx = p[0] + (nx / nl) * hw * 2 * u, by = p[1] + (ny / nl) * hw * 2 * u + 22;
          br.moveTo(bx, by);
          br.lineTo(bx + (L.h3(m, r, k) - 0.5) * 3, by + 7);
        }
        ctx.save();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.2;
        ctx.stroke(br);
        ctx.restore();
      }
    }
    // hub
    L.inkPath(ctx, L.ellipsePts(TC[0], TC[1] - 4, 34, 22, 28), { closed: true, width: 3, fill: STEELD, seed: sd('hubb'), wobble: 0.4 });
    L.inkPath(ctx, [[TC[0] - 34, TC[1] - 4], [TC[0] - 34, TC[1] - 24], [TC[0] + 34, TC[1] - 24], [TC[0] + 34, TC[1] - 4]], { width: 3, color: INK, seed: sd('hubs'), taper: [1, 1], smooth: false });
    fillPoly(ctx, [[TC[0] - 33, TC[1] - 4], [TC[0] - 33, TC[1] - 24], [TC[0] + 33, TC[1] - 24], [TC[0] + 33, TC[1] - 4]], STEEL);
    L.hatch(ctx, [[TC[0] + 6, TC[1] - 4], [TC[0] + 6, TC[1] - 24], [TC[0] + 33, TC[1] - 24], [TC[0] + 33, TC[1] - 4]], { angle: 0.05, spacing: 4, width: 1.2, color: STEELD, alpha: 0.9, seed: sd('hubsh'), length: [6, 16] });
    L.inkPath(ctx, L.ellipsePts(TC[0], TC[1] - 24, 34, 12, 28), { closed: true, width: 3, fill: STEEL_L, seed: sd('hubt'), wobble: 0.3 });
    L.inkPath(ctx, L.ellipsePts(TC[0], TC[1] - 25, 10, 4, 14), { closed: true, width: 2, fill: INK, seed: sd('hubc'), wobble: 0.2 });
  }

  function drawWisps(ctx, t, G) {
    const tw = L.onTwos(t);
    for (const w of G.wisps) {
      const u = (tw * w.spd + w.ph) % 1;
      const base = w.y0 - u * 120;
      const len = w.h * (0.55 + 0.45 * Math.sin(Math.PI * u));
      const pts = [];
      for (let k = 0; k <= 14; k++) {
        const s = k / 14;
        const y = base - s * len;
        const x = w.x + Math.sin(s * 4.2 + tw * 3 + w.ph * 6) * w.amp * (0.3 + s) + L.noise1(s * 2 + tw, w.seed) * 10;
        pts.push([x, y]);
      }
      const a = Math.sin(Math.PI * u);
      L.inkPath(ctx, pts, { width: 12, color: WHITE, alpha: 0.55 * a, seed: w.seed, taper: [20, 60], wobble: 1, swell: 0.4 });
      L.inkPath(ctx, pts.map(([x, y]) => [x + 6, y + 2]), { width: 1.4, color: INKSOFT, alpha: 0.45 * a, seed: w.seed + 1, taper: [30, 60], wobble: 1 });
    }
  }

  function drawOverlays(ctx, t) {
    // annYellow bracket under the ladder with a tick per bean (draws on over 6 frames)
    const dp = E.outExpo(clamp(t / (6 * FR) + 1 / 6));
    L.bracket(ctx, 70, 668, 920, 668, { style: 'square', cap: 16, offset: 0, color: P.annYellow, alpha: 1, width: 2.5, p: dp });
    ctx.save();
    ctx.strokeStyle = P.annYellow;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      if (t + 1e-6 < POPS[i]) continue;
      const x = LAD_X[i];
      ctx.beginPath();
      ctx.moveTo(x, 668);
      ctx.lineTo(x, 680);
      ctx.stroke();
    }
    // growth wedge: a thin rising line from the green bean's height to the roasted one's
    const top0 = LAD_Y - (LAD_H / 2) * LAD_S[0] - 14, top1 = LAD_Y - (LAD_H / 2) * LAD_S[5] - 14;
    const k = clamp((t - POPS[5]) / (6 * FR) + 1 / 6);
    if (t + 1e-6 >= POPS[1]) {
      const xe = lerp(LAD_X[0], LAD_X[5], clamp((t - POPS[0]) / (POPS[5] - POPS[0] + 6 * FR)));
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(LAD_X[0], top0 + 8);
      ctx.lineTo(xe, lerp(top0, top1, (xe - LAD_X[0]) / (LAD_X[5] - LAD_X[0])) + 8);
      ctx.stroke();
      ctx.setLineDash([]);
      if (k > 0) {
        ctx.beginPath();
        ctx.moveTo(LAD_X[5] - 9, top1 + 4);
        ctx.lineTo(LAD_X[5] + 3, top1 + 10);
        ctx.lineTo(LAD_X[5] - 7, top1 + 18);
        ctx.stroke();
      }
    }
    ctx.restore();
    // annBlue arrow riding with the stirring arm (elliptical, dashed)
    const phi = (t / ARM_PERIOD) * TAU;
    const rx = 300, ry = rx * KY;
    const a0 = phi + 0.25, a1 = phi + 1.75;
    ctx.save();
    ctx.strokeStyle = P.annBlue;
    ctx.fillStyle = P.annBlue;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.ellipse(TC[0], TC[1] - 30, rx, ry, 0, a0, a1);
    ctx.stroke();
    ctx.setLineDash([]);
    const ex = TC[0] + Math.cos(a1) * rx, ey = TC[1] - 30 + Math.sin(a1) * ry;
    const tx = -Math.sin(a1) * rx, ty = Math.cos(a1) * ry;
    const tl = Math.hypot(tx, ty) || 1;
    const ux = tx / tl, uy = ty / tl, nx = -uy, ny = ux, ah = 15;
    ctx.beginPath();
    ctx.moveTo(ex + ux * ah * 0.4, ey + uy * ah * 0.4);
    ctx.lineTo(ex - ux * ah * 0.8 + nx * ah * 0.5, ey - uy * ah * 0.8 + ny * ah * 0.5);
    ctx.lineTo(ex - ux * ah * 0.45, ey - uy * ah * 0.45);
    ctx.lineTo(ex - ux * ah * 0.8 - nx * ah * 0.5, ey - uy * ah * 0.8 - ny * ah * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // annMagenta ring on the oily bean at T 30.0 (second crack), 10 frames
    if (t >= B_GLEAM - FR) {
      const u = clamp((t - B_GLEAM) / (10 * FR) + 0.1);
      const x = LAD_X[5], y = LAD_Y + (x - 540) * -0.012;
      ctx.save();
      ctx.strokeStyle = P.annMagenta;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1 - 0.7 * u;
      ctx.beginPath();
      ctx.ellipse(x, y, 62 + 8 * E.outExpo(u), 90 + 14 * E.outExpo(u), LAD_ROT, 0, TAU);
      ctx.stroke();
      // crackle ticks round the ring
      ctx.lineCap = 'round';
      ctx.globalAlpha = 1 - u;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU + 0.2;
        const r0 = 1.18 + 0.25 * E.outExpo(u);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 62 * r0, y + Math.sin(a) * 90 * r0);
        ctx.lineTo(x + Math.cos(a) * 62 * (r0 + 0.14), y + Math.sin(a) * 90 * (r0 + 0.14));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const t = clamp(tIn, 0, info.dur);
      const tw = L.onTwos(t);
      const bi = L.boil(info.T);
      const G = geo();
      const A = atlas();

      L.stripes(ctx, { colors: [P.stripeCream, P.stripeApricot], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') });
      const camY = 960 + 30 * E.inOutSine(info.p);
      L.camera(ctx, { x: 540, y: camY, zoom: 1 }, (ctx) => {
        ctx.drawImage(trayLayer(G, 'under', ((bi % 3) + 3) % 3), LX0, LY0, LW, LH);
        drawLadder(ctx, t, bi);
        drawTray(ctx, t, tw, G, A, bi);
        drawWisps(ctx, t, G);
        drawOverlays(ctx, t);
      });
    },
  });
})();
