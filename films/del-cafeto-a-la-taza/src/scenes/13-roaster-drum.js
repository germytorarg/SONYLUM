// 13 roaster-drum : "The drum turns: green to gold to brown" (illustrated, global T 24.00 to 27.00)
// Act 3 opens on the hinge (bar 9 downbeat). Stripes stripeCream / stripeApricot.
//
// Layers, back to front (all inside the camera, which is locked until T 26.25 then pushes 1.0 -> 1.6):
//   1 stripes (drift 6 px per beat), floor shadow, legs and plinth
//   2 the roaster body: extruded red enamel box (front rrect (160,560)-(920,1380)), top and side faces,
//     hatched shadow side, seams, rivets, gloss streaks, gas pipe and valve, sample trier
//   3 chimney (chaff collector) on the left (220, 560 -> 260), hopper on top (420,360)-(660,560), dial stalk
//   4 burner slot with 7 flames at y 1300, heat shimmer
//   5 the cutaway window r 300 at (540, 960): cavity, rotating drum r 280 (back plate, hub, perforations, 8 vanes),
//     about 140 beans tumbling (bed + carried + flying), the pour from the hopper on the hinge, chaff in the drum
//   6 window bezel, bolts, hinge and latch; the thermometer dial at (820, 420) with its needle 0 -> 90 percent
//   7 overlays: annYellow roast arc r 330 with stage dots, annBlue rotation arrows, annMagenta ring on the dial (T 26.25)
(function () {
  'use strict';

  const ID = 'roaster-drum';
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

  // hoisted colours (pal is a read-only proxy)
  const INK = P.ink, INKSOFT = P.inkSoft, INKFAINT = P.inkFaint;
  const ENAMEL = P.enamel, STEEL = P.steel, STEELD = P.steelDeep;
  const ENAMEL_D = L.mix(P.enamel, P.ink, 0.42);
  const ENAMEL_S = L.mix(P.enamel, P.ink, 0.25);
  const ENAMEL_T = L.mix(P.enamel, P.white, 0.12);
  const STEEL_L = L.mix(P.steel, P.white, 0.45);
  const CAVITY = L.mix(P.ink, P.steelDeep, 0.3);
  const BACKPLATE = L.mix(P.steelDeep, P.ink, 0.38);
  const WHITE = P.white;
  const RAMP = [P.beanGreen, P.beanYellow, P.beanCinnamon, P.beanMedium];

  // ---------------------------------------------------------------------------
  // Beats (shot-local seconds; global T in comments)
  // ---------------------------------------------------------------------------
  const B_HINGE = 0.0; // T 24.00 bar 9 downbeat: beans pour in
  const B_GREEN_END = 0.75; // T 24.75 green until here
  const B_YELLOW = 1.5; // T 25.50 yellow; chaff starts
  const B_CINN = 2.25; // T 26.25 cinnamon; camera push; magenta ring on the dial
  const B_MED = 3.0; // T 27.00 medium brown
  const DRUM_PERIOD = 3.0; // one turn per bar

  // ---------------------------------------------------------------------------
  // Geometry constants (docs/storyboard.md, 13 Composition)
  // ---------------------------------------------------------------------------
  const CX = 540, CY = 960; // window and drum centre
  const RW = 300; // window radius
  const RD = 280; // drum radius
  const RB = 318; // bezel outer radius
  const BX0 = 160, BY0 = 560, BX1 = 920, BY1 = 1380, BR = 56; // enamel body
  const DX = 34, DY = -26; // extrusion (side and top faces)
  const DIAL = [820, 420], DIAL_R = 70;
  const BEAN_L = 38, BEAN_W = 28; // bean size in the drum

  // ---------------------------------------------------------------------------
  // Bean shape: the G1 superellipse family (exponent 2.3, top 6 percent narrower), unit half-axes
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
  const BEAN_U = beanUnit(44);
  const xf = (pts, cx, cy, a, b, rot) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    return pts.map(([x, y]) => [cx + x * a * c - y * b * s, cy + x * a * s + y * b * c]);
  };

  // a ribbon polygon around a centreline with width w(u) (u 0..1 along it)
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
    return left.concat(right.reverse());
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

  // paint one bean into a sprite context (upright, centre cx, cy; half-width a, half-length b)
  function paintBean(g, cx, cy, a, b, o) {
    const pts = xf(BEAN_U, cx, cy, a, b, 0);
    const deep = L.mix(o.col, INK, 0.5);
    // contact shadow, down-right
    fillPoly(g, xf(BEAN_U, cx + a * 0.16, cy + b * 0.12, a, b, 0), INK, 0.18);
    L.inkPath(g, pts, { closed: true, width: o.lw, fill: o.col, seed: o.seed, boil: o.bi, wobble: 0.5, tremble: 0.12, taper: [3, 6], rough: 0.25, boilAmp: 0.5, step: 1.5, overlap: 4 });
    L.hatch(g, pts, {
      angle: -Math.PI / 4, spacing: o.hs, width: o.hw, color: deep, alpha: 0.85, length: [o.hs * 1.6, o.hs * 5], gap: [1, 3],
      inset: 1, overshoot: 0, clip: true, seed: o.seed + 3, boil: o.bi, boilAmp: 0.3, edge: 0.08,
      density: (x, y) => sstep(0.0, 0.7, ((x - cx) / a) * 0.62 + ((y - cy) / b) * 0.78),
    });
    // highlight on the lit upper left
    g.save();
    g.strokeStyle = L.mix(o.col, WHITE, 0.5);
    g.lineCap = 'round';
    g.lineWidth = a * 0.16;
    g.globalAlpha = 0.85;
    g.beginPath();
    g.ellipse(cx, cy, a * 0.7, b * 0.76, 0, 1.08 * Math.PI, 1.42 * Math.PI);
    g.stroke();
    g.restore();
    if (o.view === 'face') {
      const cl = L.smoothPts(CREASE.map(([x, y]) => [cx + x * a, cy + y * b]), false, 2);
      const w0 = a * (0.12 + 0.22 * o.open);
      const groove = ribbon(cl, (u) => w0 * (0.3 + 0.7 * Math.sin(Math.PI * u)));
      fillPoly(g, groove, L.mix(o.col, INK, 0.72));
      L.inkPath(g, cl, { width: Math.max(1.2, o.lw * 0.45), color: INK, alpha: 0.8, seed: o.seed + 9, boil: o.bi, taper: [4, 4], wobble: 0.3, tremble: 0.1 });
      L.inkPath(g, cl.slice(3, cl.length - 3), { width: Math.max(1, a * 0.07), color: P.silverskin, alpha: 0.9, seed: o.seed + 11, boil: o.bi, taper: [3, 3], wobble: 0.2, tremble: 0.05 });
    } else {
      // rounded back: a soft ridge line, no crease
      L.inkPath(g, [[cx + a * 0.12, cy - b * 0.7], [cx + a * 0.2, cy], [cx + a * 0.1, cy + b * 0.7]], { width: Math.max(1, o.lw * 0.35), color: deep, alpha: 0.55, seed: o.seed + 13, boil: o.bi, taper: [6, 6], wobble: 0.3 });
    }
  }

  // sprite atlas: 25 colour steps along the ramp x (2 views x 3 boil variants), drawn at 2x
  const STEPS = 25, CW = 96, VAR = 3;
  function rampColour(s) {
    // s in 0..3 : green, yellow, cinnamon, medium
    const k = Math.min(2, Math.floor(s));
    return L.mix(RAMP[k], RAMP[k + 1], clamp(s - k));
  }
  function atlas() {
    const S = FILM.S || 1;
    return L.cached(['bean-atlas', ID, S].join('|'), () => {
      const c = FILM.makeCanvas(Math.ceil(STEPS * CW * S), Math.ceil(2 * VAR * CW * S));
      const g = c.getContext('2d');
      g.scale(S, S);
      for (let i = 0; i < STEPS; i++) {
        const col = rampColour((i / (STEPS - 1)) * 3);
        for (let v = 0; v < 2; v++) {
          for (let k = 0; k < VAR; k++) {
            paintBean(g, i * CW + CW / 2, (v * VAR + k) * CW + CW / 2, BEAN_W, BEAN_L, {
              col, view: v === 0 ? 'face' : 'back', open: 0.15 + 0.35 * (i / (STEPS - 1)), seed: sd('spr', i, v, k), bi: k * 7 + 3, lw: 3.6, hs: 5, hw: 2.2,
            });
          }
        }
      }
      return c;
    });
  }
  function blit(ctx, A, step, view, vk, x, y, rot, sc, alpha) {
    const S = FILM.S || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (alpha < 1) ctx.globalAlpha *= alpha;
    const d = CW * 0.5 * sc;
    ctx.drawImage(A, step * CW * S, (view * VAR + vk) * CW * S, CW * S, CW * S, -d / 2, -d / 2, d, d);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Drum bed, carried and flying beans (t-independent tables)
  // ---------------------------------------------------------------------------
  const polar = (a, r) => [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  const CHA = polar(186 * DEG, 252), CHB = polar(28 * DEG, 252); // bed surface chord (left high, right low)
  const belowChord = (x, y, pad = 0) => {
    const ux = CHB[0] - CHA[0], uy = CHB[1] - CHA[1];
    const ul = Math.hypot(ux, uy);
    return ((x - CHA[0]) * -uy + (y - CHA[1]) * ux) / ul > pad; // positive = below the chord (y down)
  };

  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const g = {};
    // bed beans
    const r = L.rng(sd('bed'));
    g.bed = [];
    let guard = 0;
    while (g.bed.length < 84 && guard++ < 40000) {
      const x = r.range(CX - 262, CX + 262), y = r.range(CY - 40, CY + 262);
      if (Math.hypot(x - CX, y - CY) > 254) continue;
      if (!belowChord(x, y, 4)) continue;
      if (g.bed.some((b) => Math.hypot(b.x - x, b.y - y) < 23)) continue;
      g.bed.push({
        x, y,
        rho: r.range(3, 9), ph: r.range(0, TAU), w: r.range(2.5, 6) * (r() < 0.5 ? -1 : 1),
        rot: r.range(0, TAU), spin: r.range(-1.6, 1.6), view: r() < 0.62 ? 0 : 1, vk: r.int(0, 2),
        off: r.range(-0.2, 0.2), arr: r.range(-0.4, 0.2), sx: r.range(-26, 26),
      });
    }
    g.bed.sort((p, q) => p.y - q.y);
    // flying beans: carried up the left wall by the vanes, released, thrown across onto the bed
    const f = L.rng(sd('fly'));
    g.fly = [];
    for (let i = 0; i < 58; i++) {
      const ar = f.range(204, 232) * DEG;
      const land = f.range(0.3, 0.96);
      g.fly.push({
        per: f.range(0.95, 1.35), ph: f.range(0, 1), ar, r: f.range(232, 248),
        lx: lerp(CHA[0], CHB[0], land) + f.range(-10, 10), ly: lerp(CHA[1], CHB[1], land) + f.range(4, 16),
        lift: f.range(110, 190), spin: f.range(4, 9) * (f() < 0.5 ? -1 : 1), rot: f.range(0, TAU),
        view: f() < 0.55 ? 0 : 1, vk: f.int(0, 2), off: f.range(-0.2, 0.2), arr: f.range(-0.4, 0.24), sx: f.range(-22, 22),
      });
    }
    // perforations on the back plate
    g.perf = [];
    for (const [rr, n] of [[236, 48], [206, 40], [96, 18]]) for (let i = 0; i < n; i++) g.perf.push([rr, (i / n) * TAU]);
    // rivets round the front face, skipping the window and the burner slot
    g.rivets = [];
    const rv = L.rrectPts(BX0 + 22, BY0 + 22, BX1 - BX0 - 44, BY1 - BY0 - 44, BR - 18, 46);
    for (const [x, y] of rv) {
      if (Math.hypot(x - CX, y - CY) < RB + 22) continue;
      if (y > 1268 && y < 1360 && x > 300 && x < 780) continue;
      g.rivets.push([x, y]);
    }
    // body outline and extrusion hull
    g.front = L.rrectPts(BX0, BY0, BX1 - BX0, BY1 - BY0, BR, 18);
    g.back = g.front.map(([x, y]) => [x + DX, y + DY]);
    g.hull = hull(g.front.concat(g.back));
    // chaff in the drum and at the chimney
    const c = L.rng(sd('chaff'));
    g.chaffIn = [];
    for (let i = 0; i < 22; i++) g.chaffIn.push({ t0: c.range(1.35, 2.95), x: c.range(CX - 150, CX + 210), life: c.range(0.7, 1.0), dx: c.range(-170, -60), rot: c.range(0, TAU), spin: c.range(-8, 8), s: c.range(0.8, 1.3) });
    g.chaffOut = [];
    for (let i = 0; i < 30; i++) g.chaffOut.push({ t0: c.range(1.45, 2.95), life: c.range(0.9, 1.3), dx: c.range(-90, 70), up: c.range(120, 240), rot: c.range(0, TAU), spin: c.range(-7, 7), s: c.range(0.8, 1.4), ph: c.range(0, TAU) });
    // hopper beans (a heap visible through the rim)
    const h = L.rng(sd('hop'));
    g.hop = [];
    for (let i = 0; i < 26; i++) g.hop.push({ x: h.range(-104, 104), y: h.range(-14, 22), rot: h.range(0, TAU), view: h() < 0.6 ? 0 : 1, vk: h.int(0, 2), k: h() });
    g.hop.sort((p, q) => p.y - q.y);
    GEO = g;
    return g;
  }

  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
      lo.push(q);
    }
    for (let i = p.length - 1; i >= 0; i--) {
      const q = p[i];
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
      up.push(q);
    }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  // roast colour index 0..3 at shot time s (inOutSine through each stage)
  function roastS(s) {
    if (s <= B_GREEN_END) return 0;
    if (s <= B_YELLOW) return E.inOutSine((s - B_GREEN_END) / 0.75);
    if (s <= B_CINN) return 1 + E.inOutSine((s - B_YELLOW) / 0.75);
    return 2 + E.inOutSine((s - B_CINN) / 0.75);
  }
  const stepOf = (s) => Math.round((roastS(s) / 3) * (STEPS - 1));

  // ---------------------------------------------------------------------------
  // Drawing helpers
  // ---------------------------------------------------------------------------
  function drawFloorAndBase(ctx) {
    // floor shadow
    const sh = L.ellipsePts(570, 1572, 470, 36, 48);
    L.hatch(ctx, sh, { angle: -Math.PI / 4, spacing: 6, width: 1.4, color: INK, alpha: 0.5, length: [14, 40], seed: sd('floorsh'), density: (x, y) => 1 - sstep(0.5, 1, Math.hypot((x - 570) / 470, (y - 1572) / 36)) });
    L.inkPath(ctx, [[40, 1590], [1040, 1594]], { width: 1.5, color: INKFAINT, alpha: 0.45, seed: sd('floor'), taper: [40, 40] });
    // legs
    for (const lx of [222, 858]) {
      const leg = [[lx - 20, 1430], [lx + 20, 1430], [lx + 16, 1566], [lx - 16, 1566]];
      L.inkPath(ctx, leg, { closed: true, width: 3, fill: STEELD, seed: sd('leg', lx), smooth: false, wobble: 0.6 });
      L.hatch(ctx, [[lx + 2, 1432], [lx + 18, 1432], [lx + 14, 1562], [lx + 2, 1562]], { angle: 0.1, spacing: 5, width: 1.3, color: INK, alpha: 0.7, length: [10, 24], seed: sd('legh', lx) });
      L.inkPath(ctx, L.ellipsePts(lx, 1568, 30, 8, 20), { closed: true, width: 2.5, fill: STEEL, seed: sd('foot', lx), wobble: 0.4 });
    }
    L.inkPath(ctx, [[240, 1512], [840, 1512]], { width: 6, color: INK, seed: sd('bar'), taper: [2, 2], swell: 0 });
    L.inkPath(ctx, [[240, 1512], [840, 1512]], { width: 3, color: STEEL, seed: sd('bar2'), taper: [2, 2], swell: 0 });
    // plinth
    const pl = L.rrectPts(176, 1378, 728, 62, 10, 20);
    L.inkPath(ctx, pl, { closed: true, width: 4, fill: STEEL, seed: sd('plinth'), wobble: 0.8 });
    L.hatch(ctx, pl, { angle: -Math.PI / 4, spacing: 6, width: 1.4, color: STEELD, alpha: 0.85, seed: sd('plh'), density: (x, y) => sstep(1390, 1440, y) * 0.6 + sstep(700, 904, x) * 0.6 });
    L.inkPath(ctx, [[186, 1392], [892, 1392]], { width: 1.8, color: STEEL_L, alpha: 0.9, seed: sd('plhi'), taper: [20, 20] });
  }

  function drawBody(ctx, G) {
    // extruded side and top faces
    fillPoly(ctx, G.hull, ENAMEL_S);
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, G.hull, true);
    ctx.clip();
    // top face (lit) above the front, left of the corner diagonal
    fillPoly(ctx, [[0, BY0 + 2], [BX1 - 16, BY0 + 2], [BX1 - 16 + 140, BY0 + 2 - 107], [0, BY0 - 107]], ENAMEL_T);
    // side face hatch (shadow)
    L.crossHatch(ctx, [[BX1 - 4, BY0 - 30], [BX1 + DX + 4, BY0 - 30], [BX1 + DX + 4, BY1 + 4], [BX1 - 4, BY1 + 4]], { tone: 0.55, spacing: 5, width: 1.4, color: INK, alpha: 0.7, seed: sd('sideh'), length: [16, 50] });
    ctx.restore();
    L.inkPath(ctx, G.hull, { closed: true, width: 4, seed: sd('hull'), wobble: 1.2 });
    L.inkPath(ctx, [[BX1 - 14, BY0 + 10], [BX1 - 14 + DX, BY0 + 10 + DY]], { width: 2.4, seed: sd('edge1'), taper: [3, 3] });
    L.inkPath(ctx, [[BX0 + 14, BY0 + 12], [BX0 + 14 + DX, BY0 + 12 + DY]], { width: 2.2, seed: sd('edge2'), taper: [3, 3] });
    // front face
    L.inkPath(ctx, G.front, { closed: true, width: 5, fill: ENAMEL, seed: sd('front'), wobble: 1.4, double: { offset: -4, alpha: 0.4 } });
    // enamel shadow: right and bottom of the front face (clipped strips, constant tone)
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, G.front, true);
    ctx.clip();
    L.crossHatch(ctx, [[760, BY0], [BX1 + 4, BY0], [BX1 + 4, BY1 + 4], [800, BY1 + 4]], { tone: 0.42, spacing: 7, crossSpacing: 7, width: 1.5, color: ENAMEL_D, alpha: 0.85, seed: sd('fronth'), length: [18, 60], edge: 0.3 });
    L.hatch(ctx, [[BX0, 1262], [800, 1262], [800, BY1 + 4], [BX0, BY1 + 4]], { spacing: 7, width: 1.5, color: ENAMEL_D, alpha: 0.85, seed: sd('fronth2'), length: [18, 60], edge: 0.3 });
    L.hatch(ctx, [[836, BY0], [BX1 + 4, BY0], [BX1 + 4, BY1 + 4], [836, BY1 + 4]], { angle: -Math.PI / 4 - Math.PI / 3, spacing: 6, width: 1.4, color: ENAMEL_D, alpha: 0.85, seed: sd('fronth3'), length: [18, 50] });
    ctx.restore();
    // gloss streaks along the lit top-left edge
    ctx.save();
    ctx.strokeStyle = WHITE;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(BX0 + 20, BY0 + 150);
    ctx.lineTo(BX0 + 20, BY0 + 88);
    ctx.quadraticCurveTo(BX0 + 22, BY0 + 22, BX0 + 88, BY0 + 20);
    ctx.lineTo(BX0 + 230, BY0 + 20);
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(BX0 + 252, BY0 + 20);
    ctx.lineTo(BX0 + 300, BY0 + 20);
    ctx.moveTo(BX0 + 20, BY0 + 172);
    ctx.lineTo(BX0 + 20, BY0 + 200);
    ctx.stroke();
    ctx.restore();
    // panel seams
    L.inkPath(ctx, [[BX0 + 8, 646], [BX1 - 8, 646]], { width: 1.8, color: INKSOFT, alpha: 0.9, seed: sd('seam1'), taper: [10, 10] });
    L.inkPath(ctx, [[BX0 + 8, 1296], [BX1 - 8, 1296]], { width: 1.8, color: INKSOFT, alpha: 0.9, seed: sd('seam2'), taper: [10, 10] });
    L.inkPath(ctx, [[BX0 + 10, 650], [BX1 - 10, 650]], { width: 1.2, color: ENAMEL_T, alpha: 0.9, seed: sd('seam1h'), taper: [10, 10] });
    // rivets
    for (const [x, y] of G.rivets) {
      ctx.save();
      ctx.fillStyle = ENAMEL_D;
      ctx.beginPath();
      ctx.arc(x + 1.5, y + 1.5, 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = STEEL;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x, y, 4.2, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(x - 1.3, y - 1.3, 1.3, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    // sample trier handle on the right of the window
    L.inkPath(ctx, L.rrectPts(866, 1060, 40, 26, 6, 10), { closed: true, width: 2.6, fill: STEEL, seed: sd('trier'), wobble: 0.4 });
    L.inkPath(ctx, L.ellipsePts(912, 1073, 10, 16, 18), { closed: true, width: 2.6, fill: P.wood, seed: sd('trierk'), wobble: 0.4 });
    // gas pipe and valve under the burner, down to the plinth
    L.inkPath(ctx, [[790, 1316], [850, 1316], [850, 1376]], { width: 12, color: INK, seed: sd('gas0'), taper: [0, 0], swell: 0, smooth: false });
    L.inkPath(ctx, [[790, 1316], [850, 1316], [850, 1376]], { width: 7, color: P.ochre, seed: sd('gas1'), taper: [0, 0], swell: 0, smooth: false });
    L.inkPath(ctx, L.ellipsePts(850, 1316, 15, 15, 20), { closed: true, width: 2.6, fill: P.red, seed: sd('valve'), wobble: 0.3 });
    L.inkPath(ctx, [[838, 1304], [862, 1328]], { width: 3, seed: sd('valveh'), taper: [1, 1] });
  }

  function drawChimney(ctx, tw) {
    // pipe from the top face up to the collector
    const pipe = [[192, 548], [192, 300], [248, 300], [248, 548]];
    L.inkPath(ctx, pipe, { closed: true, width: 3, fill: STEEL, seed: sd('pipe'), smooth: false, wobble: 0.8 });
    // contour hatching on the right half (horizontal, slightly curved)
    const ph = new Path2D();
    for (let y = 306; y < 544; y += 7) {
      const j = L.h3(y, 5, 31);
      ph.moveTo(224 + j * 6, y + 1);
      ph.quadraticCurveTo(236, y + 3, 246, y + 1);
    }
    ctx.save();
    ctx.strokeStyle = STEELD;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 1.4;
    ctx.stroke(ph);
    ctx.restore();
    for (const y of [380, 470, 530]) L.inkPath(ctx, [[192, y], [248, y + 2]], { width: 1.8, color: INKSOFT, seed: sd('band', y), taper: [2, 2] });
    // chaff collector drum (cylinder)
    const col = L.rrectPts(160, 320, 120, 112, 14, 14);
    L.inkPath(ctx, col, { closed: true, width: 3.4, fill: STEEL, seed: sd('coll'), wobble: 0.8 });
    const ch = new Path2D();
    for (let y = 326; y < 428; y += 6) {
      const j = L.h3(y, 9, 77);
      ch.moveTo(236 + j * 8, y);
      ch.quadraticCurveTo(258, y + 4, 276, y);
    }
    ctx.save();
    ctx.strokeStyle = STEELD;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.9;
    ctx.stroke(ch);
    ctx.restore();
    L.inkPath(ctx, [[166, 340], [274, 342]], { width: 1.8, color: INKSOFT, seed: sd('collb1'), taper: [3, 3] });
    L.inkPath(ctx, [[166, 412], [274, 414]], { width: 1.8, color: INKSOFT, seed: sd('collb2'), taper: [3, 3] });
    L.inkPath(ctx, [[176, 352], [176, 400]], { width: 3, color: STEEL_L, seed: sd('collhi'), taper: [6, 6] });
    // little window into the collector showing chaff
    L.inkPath(ctx, L.ellipsePts(206, 376, 16, 20, 20), { closed: true, width: 2.2, fill: CAVITY, seed: sd('collw'), wobble: 0.3 });
    for (let i = 0; i < 6; i++) {
      const a = L.h3(i, Math.floor(tw * 12), 5) * TAU;
      ctx.fillStyle = P.silverskin;
      ctx.beginPath();
      ctx.ellipse(206 + Math.cos(a + i) * 9, 376 + Math.sin(a * 1.3 + i) * 12, 3, 1.6, a, 0, TAU);
      ctx.fill();
    }
    // upper pipe and rain cap
    L.inkPath(ctx, [[204, 320], [204, 290], [236, 290], [236, 320]], { closed: true, width: 2.6, fill: STEEL, seed: sd('pipe2'), smooth: false, wobble: 0.4 });
    L.inkPath(ctx, [[220, 290], [220, 280]], { width: 2, seed: sd('capstem'), taper: [0, 0] });
    const cap = [[168, 282], [220, 256], [272, 282], [262, 286], [178, 286]];
    L.inkPath(ctx, cap, { closed: true, width: 3, fill: STEEL, seed: sd('cap'), smooth: false, wobble: 0.5 });
    L.hatch(ctx, [[220, 258], [272, 282], [262, 286], [220, 286]], { angle: -Math.PI / 4, spacing: 4, width: 1.2, color: STEELD, alpha: 0.9, seed: sd('caph'), length: [6, 16] });
  }

  function drawHopper(ctx, t, A, G, step) {
    // funnel body
    const body = [[420, 372], [660, 372], [570, 516], [570, 548], [510, 548], [510, 516]];
    L.inkPath(ctx, body, { closed: true, width: 4, fill: STEEL, seed: sd('hop'), smooth: false, wobble: 0.8 });
    L.hatch(ctx, [[560, 372], [660, 372], [570, 516], [570, 548], [548, 548], [548, 516]], { angle: -Math.PI / 4, spacing: 6, width: 1.4, color: STEELD, alpha: 0.85, seed: sd('hoph'), length: [12, 40], density: (x) => sstep(560, 640, x) * 0.6 + 0.35 });
    L.inkPath(ctx, [[440, 384], [520, 512]], { width: 3, color: STEEL_L, alpha: 0.9, seed: sd('hophi'), taper: [10, 14] });
    for (const y of [420, 470]) {
      const hw = lerp(120, 30, (y - 372) / 144);
      L.inkPath(ctx, [[540 - hw, y], [540 + hw, y]], { width: 1.8, color: INKSOFT, seed: sd('hopseam', y), taper: [4, 4] });
      for (let k = -2; k <= 2; k++) {
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(540 + (k * hw) / 2.6, y - 5, 2.2, 0, TAU);
        ctx.fill();
      }
    }
    // gate lever at the neck, swung open on the hinge
    const open = clamp((t + 0.4) / 0.2);
    const la = lerp(-0.1, -0.9, E.outBack(open));
    L.inkPath(ctx, [[570, 532], [570 + Math.cos(la) * 70, 532 + Math.sin(la) * 70]], { width: 5, seed: sd('lever'), taper: [1, 1], swell: 0 });
    L.inkPath(ctx, L.ellipsePts(570 + Math.cos(la) * 74, 532 + Math.sin(la) * 74, 9, 9, 14), { closed: true, width: 2.2, fill: P.red, seed: sd('leverk'), wobble: 0.3 });
    // flange on the top face
    L.inkPath(ctx, L.rrectPts(494, 542, 92, 14, 4, 10), { closed: true, width: 2.6, fill: STEELD, seed: sd('flange'), wobble: 0.4 });
    // rim: open mouth, the green heap sinks as the beans pour out
    const rim = L.ellipsePts(540, 372, 120, 22, 40);
    L.inkPath(ctx, rim, { closed: true, width: 3.4, fill: CAVITY, seed: sd('rim'), wobble: 0.5 });
    const level = clamp((0.25 - t) / 0.65); // 1 full at t -0.4, empty at 0.25
    if (level > 0) {
      ctx.save();
      ctx.beginPath();
      L.tracePath(ctx, L.ellipsePts(540, 372, 117, 20, 40), true);
      ctx.clip();
      const drop = (1 - level) * 30;
      for (const b of G.hop) {
        if (b.k > level * 1.15) continue;
        blit(ctx, A, 0, b.view, (b.vk + Math.floor(t * 12)) % VAR, 540 + b.x * (0.6 + 0.4 * level), 372 + b.y * 0.5 + drop - 6, b.rot, 1, 1);
      }
      ctx.restore();
    }
    L.inkPath(ctx, rim.slice(0, 21), { width: 2, color: STEEL_L, alpha: 0.9, seed: sd('rimhi'), taper: [10, 10] });
  }

  function drawDial(ctx, t) {
    const [x, y] = DIAL;
    // stalk and probe line into the body
    L.inkPath(ctx, [[x - 9, y + 64], [x - 9, 546], [x + 9, 546], [x + 9, y + 64]], { closed: true, width: 2.6, fill: STEEL, seed: sd('stalk'), smooth: false, wobble: 0.4 });
    L.inkPath(ctx, L.rrectPts(x - 18, 536, 36, 12, 3, 8), { closed: true, width: 2.2, fill: STEELD, seed: sd('stalkf'), wobble: 0.3 });
    // bezel and face
    L.inkPath(ctx, L.ellipsePts(x + 4, y + 5, DIAL_R, DIAL_R, 48), { closed: true, width: 0.1, fill: INK, fillAlpha: 0.25, seed: sd('dialsh'), wobble: 0.3 });
    L.inkPath(ctx, L.ellipsePts(x, y, DIAL_R, DIAL_R, 48), { closed: true, width: 4, fill: STEEL, seed: sd('dialb'), wobble: 0.6 });
    L.hatch(ctx, L.ellipsePts(x, y, DIAL_R - 2, DIAL_R - 2, 40), { angle: -Math.PI / 4, spacing: 4.5, width: 1.2, color: STEELD, alpha: 0.85, seed: sd('dialbh'), length: [6, 18], density: (px, py) => sstep(0.25, 0.75, ((px - x) * 0.7 + (py - y) * 0.7) / DIAL_R) });
    L.inkPath(ctx, L.ellipsePts(x, y, 56, 56, 40), { closed: true, width: 2.6, fill: P.ceramic, seed: sd('dialf'), wobble: 0.4 });
    // ticks over a 270 degree sweep (from lower left, clockwise)
    const a0 = 135 * DEG, span = 270 * DEG;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK;
    for (let i = 0; i <= 40; i++) {
      const a = a0 + (i / 40) * span;
      const major = i % 5 === 0;
      const r0 = major ? 40 : 46, r1 = 52;
      ctx.lineWidth = major ? 2.4 : 1.2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
      ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
      ctx.stroke();
    }
    // colour bands: green, yellow, cinnamon, medium zones (the roast stages) and a red zone
    const zones = [[0, 0.25, P.beanGreen], [0.25, 0.5, P.beanYellow], [0.5, 0.75, P.beanCinnamon], [0.75, 0.92, P.beanMedium], [0.92, 1, P.red]];
    ctx.lineWidth = 6;
    ctx.lineCap = 'butt';
    for (const [u0, u1, c] of zones) {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, 33, a0 + u0 * span, a0 + u1 * span);
      ctx.stroke();
    }
    ctx.restore();
    // needle on twos with a small tremble
    const tw = L.onTwos(t);
    const f = 0.9 * clamp(tw / B_MED) + 0.006 * Math.sin(tw * 31);
    const an = a0 + f * span;
    L.inkPath(ctx, [[x - Math.cos(an) * 12, y - Math.sin(an) * 12], [x + Math.cos(an) * 48, y + Math.sin(an) * 48]], { width: 3.4, color: P.red, seed: sd('needle'), taper: [2, 10], wobble: 0.2, swell: 0 });
    ctx.save();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, TAU);
    ctx.fill();
    // glass glare
    ctx.strokeStyle = WHITE;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, 47, 1.12 * Math.PI, 1.38 * Math.PI);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 47, 1.43 * Math.PI, 1.5 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  function flamePts(cx, by, w, h, sway, n = 28) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const top = (1 + Math.cos(a)) / 2; // 1 at the tip
      out.push([cx + w * Math.sin(a) * (0.55 + 0.45 * (1 - top)) + sway * top * top, by - h * top - w * 0.2 * (1 - top)]);
    }
    return out;
  }

  function drawBurner(ctx, t) {
    const slot = L.rrectPts(318, 1282, 444, 64, 14, 14);
    L.inkPath(ctx, slot, { closed: true, width: 3.4, fill: CAVITY, seed: sd('slot'), wobble: 0.6 });
    // burner rail
    L.inkPath(ctx, L.rrectPts(336, 1330, 408, 10, 4, 12), { closed: true, width: 2, fill: STEELD, seed: sd('rail'), wobble: 0.3 });
    const k = Math.floor(t * 12 + 1e-6);
    for (let i = 0; i < 7; i++) {
      const fx = 360 + i * 60;
      const n = L.noise1(k * 0.37 + i * 3.1, sd('fl')) * 0.5 + 0.5;
      const h = 46 + 14 * n + 6 * (i % 2);
      const sway = (L.h3(k, i, 41) - 0.5) * 10;
      const outer = flamePts(fx, 1332, 14, h, sway);
      L.inkPath(ctx, outer, { closed: true, width: 2.2, fill: P.flame, seed: sd('flame', i), wobble: 0.5, taper: [3, 6] });
      fillPoly(ctx, flamePts(fx + 1, 1331, 8.5, h * 0.66, sway * 0.6, 20), P.sun);
      fillPoly(ctx, flamePts(fx + 1, 1331, 4, h * 0.3, sway * 0.3, 16), WHITE, 0.9);
      fillPoly(ctx, L.ellipsePts(fx, 1330, 10, 4, 12), P.water, 0.9);
    }
    // heat shimmer: wavy pale strokes rising off the flames
    ctx.save();
    ctx.strokeStyle = WHITE;
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const u = ((t * 1.3 + L.h3(i, 2, 61)) % 1);
      const x0 = 350 + i * 48;
      const y0 = 1290 - u * 70;
      ctx.globalAlpha = 0.45 * Math.sin(Math.PI * u);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let s = 0; s <= 10; s++) {
        const yy = y0 - s * 5;
        const xx = x0 + Math.sin(s * 0.9 + t * 9 + i) * 4;
        if (s === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // drum interior: cavity, back plate, hub, perforations, shadow crescent
  function drawDrumBack(ctx, G, th, bi) {
    fillPoly(ctx, L.ellipsePts(CX, CY, RW, RW, 96), CAVITY);
    fillPoly(ctx, L.ellipsePts(CX, CY, RD, RD, 96), STEELD);
    fillPoly(ctx, L.ellipsePts(CX + 4, CY + 4, RD - 18, RD - 18, 96), BACKPLATE);
    // shell band highlights (the inside of the cylinder catching light at lower right)
    ctx.save();
    ctx.strokeStyle = STEEL;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(CX, CY, RD - 9, -0.15 * Math.PI, 0.55 * Math.PI);
    ctx.stroke();
    ctx.restore();
    // perforations and rings rotate with the drum
    const pp = new Path2D();
    for (const [r, a] of G.perf) {
      const x = CX + Math.cos(a + th) * r, y = CY + Math.sin(a + th) * r;
      pp.moveTo(x + 3, y);
      pp.arc(x, y, 3, 0, TAU);
    }
    ctx.save();
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.75;
    ctx.fill(pp);
    ctx.restore();
    for (const r of [222, 150]) L.inkPath(ctx, L.ellipsePts(CX, CY, r, r, 72), { closed: true, width: 1.8, color: STEEL, alpha: 0.55, seed: sd('ring', r), wobble: 0.6 });
    // hub and spokes
    for (let k = 0; k < 4; k++) {
      const a = th + (k * Math.PI) / 2;
      L.inkPath(ctx, [[CX + Math.cos(a) * 36, CY + Math.sin(a) * 36], [CX + Math.cos(a) * 140, CY + Math.sin(a) * 140]], { width: 5, color: STEEL, alpha: 0.7, seed: sd('spoke', k), taper: [2, 2], swell: 0 });
    }
    L.inkPath(ctx, L.ellipsePts(CX, CY, 36, 36, 28), { closed: true, width: 3, fill: STEEL, seed: sd('hub'), wobble: 0.4 });
    for (let k = 0; k < 6; k++) {
      const a = th + (k * TAU) / 6;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(CX + Math.cos(a) * 24, CY + Math.sin(a) * 24, 3, 0, TAU);
      ctx.fill();
    }
    // shadow crescent from the bezel lip, upper left inside the drum
    const cres = [];
    for (let i = 0; i <= 40; i++) cres.push(polar((100 + (i / 40) * 250) * DEG, RD));
    for (let i = 40; i >= 0; i--) {
      const a = (100 + (i / 40) * 250) * DEG;
      const p = [CX + 30 + Math.cos(a) * (RD - 6), CY + 30 + Math.sin(a) * (RD - 6)];
      cres.push(Math.hypot(p[0] - CX, p[1] - CY) < RD ? p : polar(a, RD));
    }
    L.crossHatch(ctx, cres, { tone: 0.5, spacing: 5, width: 1.3, color: INK, alpha: 0.75, seed: sd('cres'), length: [10, 30], clip: true, boil: bi });
  }

  function vanePoly(a) {
    const r0 = RD - 2, r1 = 196, lean = 0.13, th = 4.5;
    const p0 = polar(a, r0), p1 = polar(a + lean, r1);
    const nx = -Math.sin(a + lean / 2), ny = Math.cos(a + lean / 2);
    return [[p0[0] - nx * th, p0[1] - ny * th], [p1[0] - nx * th * 0.8, p1[1] - ny * th * 0.8], [p1[0] + nx * th * 0.8, p1[1] + ny * th * 0.8], [p0[0] + nx * th, p0[1] + ny * th]];
  }
  function drawVanes(ctx, th) {
    for (let k = 0; k < 8; k++) {
      const a = th + (k * TAU) / 8;
      const v = vanePoly(a);
      L.inkPath(ctx, v, { closed: true, width: 2.4, fill: STEEL, seed: sd('vane', k), smooth: false, wobble: 0.4, boil: Math.floor(L.boil(L.T)) });
      L.inkPath(ctx, [v[0], v[1]], { width: 1.6, color: STEEL_L, seed: sd('vaneh', k), taper: [4, 4], wobble: 0.2 });
      // bracket bolt at the shell
      const b = polar(a, RD - 10);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(b[0], b[1], 3.4, 0, TAU);
      ctx.fill();
    }
  }

  // bean state helpers
  function streamPos(b, tw, land) {
    // falling from the top of the drum into its landing place during the pour
    const t0 = b.arr - 0.3;
    const u = clamp((tw - t0) / 0.3);
    const x0 = CX + b.sx * 0.5, y0 = CY - RD + 26;
    return [lerp(x0, land[0], u * 0.9 + 0.1 * u * u), lerp(y0, land[1], u * u), u];
  }
  function bedPos(b, tw) {
    const a = b.ph + b.w * tw;
    return [b.x + Math.cos(a) * b.rho, b.y + Math.sin(a) * b.rho * 0.7, b.rot + b.spin * tw];
  }
  // cycle: 0 .. 0.42 carried up on the wall, 0.42 .. 0.84 thrown, 0.84 .. 1 sinking back (hidden in the bed)
  function flyPos(f, tw, th) {
    const u = (((tw / f.per + f.ph) % 1) + 1) % 1;
    const a1 = f.ar, a0 = f.ar - 112 * DEG;
    if (u < 0.42) {
      const a = lerp(a0, a1, u / 0.42);
      const p = polar(a, f.r);
      return { x: p[0], y: p[1], rot: a + Math.PI / 2, phase: 0, hidden: belowChord(p[0], p[1], 10) };
    }
    if (u < 0.84) {
      const s = (u - 0.42) / 0.42;
      const p0 = polar(a1, f.r);
      const tx = -Math.sin(a1), ty = Math.cos(a1);
      const c = [p0[0] + tx * f.lift, p0[1] + ty * f.lift];
      const v = 1 - s;
      const x = v * v * p0[0] + 2 * v * s * c[0] + s * s * f.lx;
      const y = v * v * p0[1] + 2 * v * s * c[1] + s * s * f.ly;
      return { x, y, rot: f.rot + f.spin * s, phase: 1, hidden: false };
    }
    const s = (u - 0.84) / 0.16;
    const p = polar(a0, f.r);
    return { x: lerp(f.lx, p[0], s), y: lerp(f.ly, p[1], s), rot: f.rot, phase: 2, hidden: true };
  }

  function drawBeans(ctx, t, tw, th, G, A) {
    const vkb = Math.floor(tw * 12);
    const grow = 1 + 0.1 * sstep(B_YELLOW, B_MED, tw);
    // the bed mass under the beans, so gaps never show the back plate
    const avg = rampColour(roastS(tw));
    const bedPoly = [];
    for (let i = 0; i <= 40; i++) {
      const a = 28 * DEG + (i / 40) * (158 * DEG);
      bedPoly.push(polar(a, 258));
    }
    const fillIn = clamp((tw + 0.25) / 0.45);
    const lift = (1 - fillIn) * 120;
    const mass = bedPoly.map(([x, y]) => [x, Math.max(y, Math.min(CY + RD, y + lift))]);
    // straighten the chord top so the bed has a slope
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, L.ellipsePts(CX, CY, RD - 4, RD - 4, 80), true);
    ctx.clip();
    fillPoly(ctx, [[CHA[0] - 10, CHA[1] + 14 + lift], [CHB[0] + 10, CHB[1] + 14 + lift]].concat(mass.slice().reverse().filter(([x, y]) => y > CY - 20)), L.mix(avg, INK, 0.55));
    ctx.restore();

    // hidden flyers (sinking back / carried inside the bed) are drawn behind the bed beans
    const flyers = G.fly.map((f) => {
      const q = flyPos(f, tw, th);
      return { f, q };
    });
    const sizeOf = (b) => (grow * BEAN_L) / BEAN_L;
    const drawFly = (f, q) => {
      let x = q.x, y = q.y, alpha = 1;
      if (tw < f.arr + 0.12) {
        const land = [f.lx, f.ly];
        if (tw < f.arr) {
          const s = streamPos(f, tw, land);
          if (s[2] <= 0) return;
          x = s[0]; y = s[1];
          alpha = clamp(s[2] * 4);
        } else {
          const u = (tw - f.arr) / 0.12;
          x = lerp(land[0], q.x, u);
          y = lerp(land[1], q.y, u);
        }
      }
      const s = tw < f.arr ? 0 : stepOf(tw + f.off);
      blit(ctx, A, s, f.view, (f.vk + vkb) % VAR, x, y, q.rot, sizeOf(f), alpha);
    };
    for (const { f, q } of flyers) if (q.hidden && tw >= f.arr + 0.12) drawFly(f, q);
    for (const b of G.bed) {
      const p = bedPos(b, tw);
      let x = p[0], y = p[1], alpha = 1;
      if (tw < b.arr) {
        const s = streamPos(b, tw, [b.x, b.y]);
        if (s[2] <= 0) continue;
        x = s[0]; y = s[1];
        alpha = clamp(s[2] * 4);
      }
      const s = tw < b.arr ? 0 : stepOf(tw + b.off);
      blit(ctx, A, s, b.view, (b.vk + vkb) % VAR, x, y, p[2], grow, alpha);
    }
    for (const { f, q } of flyers) if (!q.hidden || tw < f.arr + 0.12) drawFly(f, q);
  }

  function drawChaffIn(ctx, t, G) {
    const tw = L.onTwos(t);
    for (const c of G.chaffIn) {
      const u = (tw - c.t0) / c.life;
      if (u < 0 || u > 1) continue;
      const y0 = lerp(CHA[1], CHB[1], (c.x - CHA[0]) / (CHB[0] - CHA[0])) - 10;
      const x = c.x + c.dx * u + Math.sin(u * 9 + c.rot) * 10;
      const y = y0 - u * 300;
      if (Math.hypot(x - CX, y - CY) > RD - 10) continue;
      drawFlake(ctx, x, y, c.rot + c.spin * u, c.s, Math.sin(Math.PI * u));
    }
  }
  function drawFlake(ctx, x, y, rot, s, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha *= clamp(a * 1.6);
    ctx.fillStyle = P.silverskin;
    ctx.strokeStyle = INKSOFT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7 * s, 0);
    ctx.quadraticCurveTo(-2 * s, -5 * s, 7 * s, -1 * s);
    ctx.quadraticCurveTo(1 * s, 4 * s, -7 * s, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawChaffOut(ctx, t, G) {
    const tw = L.onTwos(t);
    for (const c of G.chaffOut) {
      const u = (tw - c.t0) / c.life;
      if (u < 0 || u > 1) continue;
      const x = 220 + c.dx * E.outQuad(u) + Math.sin(u * 7 + c.ph) * 12;
      const y = 284 - c.up * u;
      drawFlake(ctx, x, y, c.rot + c.spin * u, c.s, 1 - u * u);
    }
  }

  function drawBezel(ctx) {
    const outer = L.ellipsePts(CX, CY, RB, RB, 96);
    const inner = L.ellipsePts(CX, CY, RW, RW, 96);
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, outer, true);
    L.tracePath(ctx, inner.slice().reverse(), true);
    ctx.fillStyle = STEEL;
    ctx.fill();
    ctx.restore();
    const ann = [];
    for (let i = 0; i <= 36; i++) ann.push(polar((-40 + (i / 36) * 220) * DEG, RB + 2));
    for (let i = 36; i >= 0; i--) ann.push(polar((-40 + (i / 36) * 220) * DEG, RW - 1));
    L.hatch(ctx, ann, { angle: -Math.PI / 4, spacing: 4, width: 1.3, color: STEELD, alpha: 0.9, seed: sd('bezh'), length: [8, 22], clip: true, edge: 0.25 });
    L.inkPath(ctx, outer, { closed: true, width: 4, seed: sd('bezo'), wobble: 1, double: { offset: 5, alpha: 0.35 } });
    L.inkPath(ctx, inner, { closed: true, width: 3, seed: sd('bezi'), wobble: 1 });
    ctx.save();
    ctx.strokeStyle = STEEL_L;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(CX, CY, RW + 9, 1.05 * Math.PI, 1.45 * Math.PI);
    ctx.stroke();
    ctx.restore();
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU + 0.1;
      const [x, y] = polar(a, RW + 9);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(x, y, 3.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = STEEL_L;
      ctx.beginPath();
      ctx.arc(x - 1, y - 1, 1.2, 0, TAU);
      ctx.fill();
    }
    // hinge (left) and latch with handle (right)
    L.inkPath(ctx, L.rrectPts(CX - RB - 22, CY - 54, 34, 108, 8, 12), { closed: true, width: 3, fill: STEEL, seed: sd('hinge'), wobble: 0.5 });
    L.inkPath(ctx, [[CX - RB - 5, CY - 46], [CX - RB - 5, CY + 46]], { width: 2, color: INKSOFT, seed: sd('hingeline'), taper: [2, 2] });
    L.hatch(ctx, L.rrectPts(CX - RB - 5, CY - 52, 16, 104, 6, 10), { angle: 0.05, spacing: 4, width: 1.2, color: STEELD, alpha: 0.9, seed: sd('hingeh'), length: [8, 20] });
    L.inkPath(ctx, L.rrectPts(CX + RB - 14, CY - 30, 40, 60, 8, 12), { closed: true, width: 3, fill: STEEL, seed: sd('latch'), wobble: 0.5 });
    L.inkPath(ctx, [[CX + RB + 26, CY - 18], [CX + RB + 44, CY - 18], [CX + RB + 44, CY + 70], [CX + RB + 30, CY + 70]], { width: 5, seed: sd('handle'), taper: [1, 1], swell: 0, smooth: false });
    L.inkPath(ctx, L.ellipsePts(CX + RB + 37, CY + 82, 11, 15, 16), { closed: true, width: 2.4, fill: P.wood, seed: sd('handlek'), wobble: 0.3 });
    // glass glare: two flat white strokes across the window
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, inner, true);
    ctx.clip();
    ctx.strokeStyle = WHITE;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(CX - 250, CY - 40);
    ctx.lineTo(CX - 40, CY - 250);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(CX - 236, CY + 10);
    ctx.lineTo(CX + 10, CY - 236);
    ctx.stroke();
    ctx.restore();
  }

  function drawOverlays(ctx, t) {
    // annYellow roast arc round the window, sweeping with the roast progress
    const rp = clamp(t / B_MED);
    const a0 = -Math.PI / 2;
    L.arcAnnotation(ctx, CX, CY, 332, a0, a0 + rp * 0.9 * TAU, { color: P.annYellow, width: 2.5, arrow: 13, dot: 5, endTicks: 10 });
    // stage dots on the arc at green, yellow, cinnamon, medium
    const stages = [[0, P.beanGreen], [B_GREEN_END, P.beanGreen], [B_YELLOW, P.beanYellow], [B_CINN, P.beanCinnamon], [B_MED, P.beanMedium]];
    for (let i = 1; i < stages.length; i++) {
      const [ts, c] = stages[i];
      const a = a0 + (ts / B_MED) * 0.9 * TAU;
      const on = t + FR >= ts;
      const pop = on ? [0.72, 1.08, 1][Math.min(2, Math.floor((t - ts) * 12 + 1e-6 + 1))] || 1 : 0.6;
      const [x, y] = polar(a, 332);
      ctx.save();
      ctx.fillStyle = on ? c : P.paper;
      ctx.strokeStyle = P.annYellow;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 9 * pop, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // annBlue rotation arrows, turning with the drum (24 fps)
    const th = (t / DRUM_PERIOD) * TAU;
    for (const base of [-70 * DEG, 110 * DEG]) {
      L.arcAnnotation(ctx, CX, CY, 364, base + th, base + th + 52 * DEG, { color: P.annBlue, width: 2.5, arrow: 14, endTicks: 0, dash: [14, 10] });
    }
    // annMagenta ring on the dial at T 26.25
    if (t >= B_CINN - FR) {
      const u = clamp((t - B_CINN) / (10 * FR) + 0.1);
      const r = DIAL_R + 6 + 60 * E.outExpo(u);
      ctx.save();
      ctx.strokeStyle = P.annMagenta;
      ctx.globalAlpha = 1 - u * 0.85;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(DIAL[0], DIAL[1], r, 0, TAU);
      ctx.stroke();
      ctx.restore();
      if (u < 1) {
        // the needle-tip mark stays on the dial after the ring
      }
      ctx.save();
      ctx.strokeStyle = P.annMagenta;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(DIAL[0], DIAL[1], DIAL_R + 7, 135 * DEG + 0.62 * 270 * DEG, 135 * DEG + 0.92 * 270 * DEG);
      ctx.stroke();
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
      const th = (t / DRUM_PERIOD) * TAU; // drum angle, 24 fps

      // 1 stripes: band B turns apricot for act 3; drift 6 px per beat
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeApricot], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') });

      // camera: locked, then push 1.0 -> 1.6 on the window from T 26.25
      const zoom = t < B_CINN ? 1 : 1 + 0.6 * E.inOutCubic((t - B_CINN) / (B_MED - B_CINN));
      L.camera(ctx, { x: CX, y: CY, zoom }, (ctx) => {
        drawFloorAndBase(ctx);
        drawChimney(ctx, tw);
        drawBody(ctx, G);
        drawDial(ctx, t);
        drawHopper(ctx, t, A, G);
        drawBurner(ctx, t);
        // 5 the drum, clipped to the window
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, RW, 0, TAU);
        ctx.clip();
        drawDrumBack(ctx, G, th, bi);
        drawVanes(ctx, th);
        drawBeans(ctx, t, tw, th, G, A);
        if (t >= B_YELLOW - 0.15) drawChaffIn(ctx, t, G);
        ctx.restore();
        if(0) drawBezel(ctx);
        if (t >= B_YELLOW - 0.1) drawChaffOut(ctx, t, G);
        drawOverlays(ctx, t);
      });
    },
  });
})();
