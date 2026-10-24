// 10 drying-patio: "Seven suns on the patio". T 18.00 to 21.00, illustrated, hard cut.
// A time-passage hold: a raised drying bed of parchment coffee seen from above-front while the sun
// crosses its arc seven times (six days of one 8th each, then a slow seventh day over the last two
// beats). A rake drags once per day, leaving furrows; the beans dry from glistening mucilage-wet to
// pale parchment; a seven-circle day tally fills top left.
//
// Layers, back to front:
//   1 stripes stripeCream / stripeSage (sky, top 45 percent), drifting 6 px per beat
//   2 sun-path arc (dotted annYellow) and the sun disc on it (on twos)
//   3 far ridge and near ridge of coffee hills, the patio ground with converging slab seams
//   4 night pass: navy wash on the sky band for the last 2 frames of days 1 to 6
//   5 under the bed: shadow, legs, contact shadows
//   6 the bed frame: back, left and right rails, the front board
//   7 the bean field: two cached layers (wet and dry) crossfaded, plus live glints while wet
//   8 rake furrows (current day and the day before), the bean ridge pushed by the head
//   9 the rake: head with tines, handle running out of frame at the bottom
//  10 overlays: annBlue dashed rake path and vapour wisps, annYellow day tally (screen-fixed)
(function () {
  'use strict';

  const ID = 'drying-patio';
  const TAU = Math.PI * 2;
  const FR = 1 / 24;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => {
    const u = clamp((x - a) / (b - a));
    return u * u * (3 - 2 * u);
  };
  const sd = (...k) => FILM.lib.hash(ID, ...k) & 0x7fffffff;

  // ---------------------------------------------------------------------------
  // layout (storyboard 10)
  // ---------------------------------------------------------------------------
  const SKY_Y = 864; // sky band: top 45 percent
  const BACK_Y = 1000, FRONT_Y = 1600;
  const leftX = (y) => lerp(90, -40, (y - BACK_Y) / (FRONT_Y - BACK_Y));
  const rightX = (y) => lerp(990, 1120, (y - BACK_Y) / (FRONT_Y - BACK_Y));
  const depthScale = (y) => lerp(0.58, 1.0, clamp((y - BACK_Y) / (FRONT_Y - BACK_Y)));
  const BED = [[90, BACK_Y], [990, BACK_Y], [1120, FRONT_Y], [-40, FRONT_Y]];

  // sun-path arc: the circle through (60, 700), (540, 330), (1020, 700)
  const ARC_CX = 540;
  const ARC_CY = (480 * 480 + 700 * 700 - 330 * 330) / (2 * (700 - 330));
  const ARC_R = ARC_CY - 330;
  const ARC_A0 = Math.atan2(700 - ARC_CY, 60 - ARC_CX);
  const ARC_A1 = Math.atan2(700 - ARC_CY, 1020 - ARC_CX);
  const SUN_R = 44;

  // day tally: 7 circles at y 250 from x 120 to 480
  const TALLY_Y = 250, TALLY_X0 = 120, TALLY_DX = 60, TALLY_R = 17;

  // rake: the handle runs from (700, 1600) up to the head near (980, 1180); the head drags toward
  // the viewer along the handle and back, once per day
  const HEAD_FAR = [962, 1207];
  const HEAD_NEAR = [818, 1423];
  const RD = (() => {
    const dx = HEAD_NEAR[0] - HEAD_FAR[0], dy = HEAD_NEAR[1] - HEAD_FAR[1];
    const l = Math.hypot(dx, dy);
    return [dx / l, dy / l]; // toward the viewer
  })();
  const RP = [RD[1], -RD[0]]; // across the rake (points right-down)
  const DAY_OFF = [-34, 16, -10, 30, -24, 8, 0]; // lateral shift of each day's stroke
  const TINES = 7, TINE_GAP = 25;

  // ---------------------------------------------------------------------------
  // timing: frame-exact days
  // ---------------------------------------------------------------------------
  function timing(t) {
    const f = Math.min(71, Math.floor(t * 24 + 1e-6));
    let day, df, len;
    if (f < 54) {
      day = Math.floor(f / 9);
      df = f - day * 9;
      len = 9;
    } else {
      day = 6;
      df = f - 54;
      len = 18;
    }
    const df2 = df - (df % 2); // on twos
    const night = day < 6 && df >= 7;
    // sun: rises at the left end on the day's first frame, sets at the right end
    const su = day < 6 ? Math.min(1, df2 / 6) : Math.min(1, df2 / 12);
    // rake: out and back over the day
    const ru = day < 6 ? df2 / 8 : df2 / 16;
    const rs = Math.sin(Math.PI * ru);
    const rmax = ru <= 0.5 ? rs : 1;
    const dayF = f < 54 ? f / 9 : 6 + (f - 54) / 18;
    const wet = 1 - clamp(dayF / 5);
    return { f, day, df, len, night, su, ru, rs, rmax, dayF, wet };
  }
  // the frame on which tally circle k (0-based) fills
  const tallyFrame = (k) => (k < 6 ? k * 9 + 7 : 66);

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------
  function canvas(w, h) {
    if (FILM.makeCanvas) return FILM.makeCanvas(w, h);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function polyPath(pts, closed = true) {
    const p = new Path2D();
    pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])));
    if (closed) p.closePath();
    return p;
  }
  function strokeP(ctx, path, color, alpha, width, dash) {
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
  function fillP(ctx, path, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.fill(path);
    ctx.restore();
  }
  function quad(a, b, c, d) {
    return [a, b, c, d];
  }
  // a tapered ribbon polygon around a polyline
  function ribbon(pts, w0, w1) {
    const n = pts.length;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const w = lerp(w0, w1, i / (n - 1)) / 2;
      L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
      R.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    return L.concat(R.reverse());
  }

  // ---------------------------------------------------------------------------
  // geometry (t-independent, built once)
  // ---------------------------------------------------------------------------
  let G = null;
  function geo(L) {
    if (G) return G;
    const g = {};
    // the bean field: rows back to front in a gently foreshortened plane
    const r = L.rng(sd('beans'));
    const rows = [];
    let y = BACK_Y + 3;
    while (y < FRONT_Y + 4) {
      const s = depthScale(y);
      const row = [];
      const x0 = leftX(y) - 12, x1 = rightX(y) + 12;
      let x = x0 + r() * 10 * s;
      while (x < x1) {
        const rx = 6.4 * s * r.range(0.82, 1.18);
        const ry = rx * r.range(0.6, 0.74);
        row.push({ x, y: y + r.range(-1.6, 1.6) * s, rx, ry, rot: r.range(-1.15, 1.15), tone: (r() * 3) | 0, h: r() });
        x += r.range(9.6, 12.6) * s;
      }
      rows.push(row);
      y += r.range(5.4, 6.6) * s;
    }
    g.rows = rows;
    // glint candidates: a sparse sample of beans
    g.glints = [];
    let k = 0;
    for (const row of rows) for (const b of row) if (((k++) * 2654435761) % 1000 < 34) g.glints.push(b);
    // raking patches: soft darker zones from earlier passes
    g.patches = [];
    for (let i = 0; i < 9; i++) g.patches.push([r.range(120, 960), r.range(1060, 1560), r.range(60, 150), r()]);
    // ridges
    // the far mountain: a terraced coffee slope with its peak left of centre
    const mtn = (x) => 826 - 205 * Math.exp(-Math.pow((x - 600) / 290, 2)) - 70 * Math.exp(-Math.pow((x - 130) / 150, 2)) + 9 * L.noise1(x * 0.011, sd('mtn')) + 4 * L.noise1(x * 0.04, sd('mtn2'));
    g.mtn = mtn;
    g.far = [];
    for (let x = -40; x <= 1120; x += 12) g.far.push([x, mtn(x)]);
    g.terraces = [];
    for (let k = 1; k <= 7; k++) {
      const row = [];
      for (let x = -40; x <= 1120; x += 14) {
        const y0 = mtn(x);
        const u = k / 8;
        row.push([x, lerp(y0, SKY_Y, u) + 6 * Math.sin(x * 0.01 + k) * u]);
      }
      g.terraces.push(row);
    }
    g.near = [];
    for (let x = -40; x <= 1120; x += 16) g.near.push([x, 842 + 14 * L.noise1(x * 0.005 + 7.3, sd('near')) + 5 * L.noise1(x * 0.02, sd('near2')) - 22 * Math.exp(-Math.pow((x - 820) / 180, 2))]);
    // coffee shrub rows on the near ridge (small bumps along contour rows)
    g.shrubs = [];
    const rs = L.rng(sd('shrubs'));
    for (let row = 0; row < 3; row++) {
      for (let x = -20; x < 1100; x += rs.range(26, 34)) {
        const i = clamp(Math.round((x + 40) / 16), 0, g.near.length - 1);
        const yy = g.near[i][1] + 7 + row * 8;
        if (yy > SKY_Y - 2) continue;
        g.shrubs.push([x + row * 11, yy, rs.range(7, 10) * (1 - row * 0.15)]);
      }
    }
    g.farShrubs = [];
    g.terraces.forEach((row, k) => {
      for (let i = 0; i < row.length; i++) {
        if (rs() < 0.25) continue;
        const [x, y] = row[i];
        if (y > g.near[clamp(Math.round((x + 40) / 16), 0, g.near.length - 1)][1] - 2) continue;
        g.farShrubs.push([x + rs.range(-4, 4), y - 2, rs.range(3, 5.5) * (0.7 + k * 0.06)]);
      }
    });
    // clouds: three, shifted each day
    g.clouds = [[200, 540, 150, 0.9], [740, 470, 200, 1], [980, 640, 120, 0.8]].map(([x, y, w, k], i) => {
      const r = L.rng(sd('cloud', i));
      const bumps = [];
      const n = 5 + i;
      for (let j = 0; j < n; j++) bumps.push([lerp(-0.9, 0.9, j / (n - 1)) * w * 0.55, -r.range(0.35, 0.75) * w * 0.4 * (1 - Math.pow(lerp(-1, 1, j / (n - 1)), 2) * 0.5), r.range(0.22, 0.32) * w]);
      return { x, y, w, k, bumps };
    });
    // vapour wisps: bases on the bed
    g.wisps = [];
    const rw = L.rng(sd('wisps'));
    for (let i = 0; i < 10; i++) g.wisps.push({ x: rw.range(110, 900), y: rw.range(1080, 1520), ph: rw(), h: rw.range(60, 110) });
    G = g;
    return g;
  }

  // ---------------------------------------------------------------------------
  // the bean field sprite (wet or dry), cached; boil-free so it never needs redrawing
  // ---------------------------------------------------------------------------
  const SPR_Y = 990, SPR_H = 620;
  function beanField(L, P, wet) {
    const S = FILM.S || 1;
    return L.cached(['bean-field', ID, wet ? 'wet' : 'dry', S].join('|'), () => {
      const g = geo(L);
      const c = canvas(Math.round(1080 * S), Math.round(SPR_H * S));
      const x = c.getContext('2d');
      x.scale(S, S);
      x.translate(0, -SPR_Y);
      x.save();
      x.beginPath();
      L.tracePath(x, BED, true);
      x.clip();
      const pal = wet
        ? {
            gap: L.mix(P.parchmentDeep, P.ink, 0.6),
            shadow: L.mix(P.parchmentDeep, P.ink, 0.42),
            tones: [L.mix(P.mucilage, P.ochre, 0.12), L.mix(P.mucilage, P.parchmentDeep, 0.45), L.mix(P.mucilage, P.ochre, 0.3)],
            hi: P.white,
            line: 0.42,
          }
        : {
            gap: L.mix(P.parchmentDeep, P.inkSoft, 0.32),
            shadow: P.parchmentDeep,
            tones: [P.parchment, L.mix(P.parchment, P.white, 0.4), L.mix(P.parchment, P.parchmentDeep, 0.3)],
            hi: P.white,
            line: 0.28,
          };
      x.fillStyle = pal.gap;
      x.fillRect(-60, BACK_Y - 10, 1200, FRONT_Y - BACK_Y + 20);
      for (const row of g.rows) {
        const sh = new Path2D(), ol = new Path2D(), hi = new Path2D();
        const tp = [new Path2D(), new Path2D(), new Path2D()];
        for (const b of row) {
          const o = 1.1 * depthScale(b.y);
          sh.moveTo(b.x + o + b.rx, b.y + o);
          sh.ellipse(b.x + o, b.y + o, b.rx, b.ry, b.rot, 0, TAU);
          tp[b.tone].moveTo(b.x - o * 0.4 + b.rx, b.y - o * 0.4);
          tp[b.tone].ellipse(b.x - o * 0.4, b.y - o * 0.4, b.rx, b.ry, b.rot, 0, TAU);
          ol.moveTo(b.x - o * 0.4 + b.rx, b.y - o * 0.4);
          ol.ellipse(b.x - o * 0.4, b.y - o * 0.4, b.rx, b.ry, b.rot, 0, TAU);
          // a lit fleck on the upper left of the hull
          const hx = b.x - o * 0.4 - b.rx * 0.38, hy = b.y - o * 0.4 - b.ry * 0.42;
          hi.moveTo(hx + b.rx * 0.28, hy);
          hi.ellipse(hx, hy, b.rx * 0.28, b.ry * 0.22, b.rot, 0, TAU);
        }
        fillP(x, sh, pal.shadow, 0.95);
        for (let i = 0; i < 3; i++) fillP(x, tp[i], pal.tones[i]);
        fillP(x, hi, pal.hi, wet ? 0.55 : 0.35);
        x.save();
        x.strokeStyle = P.ink;
        x.globalAlpha = pal.line;
        x.lineWidth = 0.7;
        x.stroke(ol);
        x.restore();
      }
      // raking patches: slightly deeper tone where beans were turned
      for (const [px, py, pr, ph] of g.patches) {
        L.hatch(x, null, {
          bounds: [px - pr, py - pr * 0.5, pr * 2, pr],
          spacing: 7,
          width: 1.1,
          color: pal.shadow,
          alpha: 0.35,
          length: [8, 22],
          seed: sd('patch', px | 0, wet ? 1 : 0),
          boil: 0,
          density: (hx, hy) => 0.8 * (1 - clamp(Math.hypot((hx - px) / pr, (hy - py) / (pr * 0.5)))) * (0.6 + 0.4 * ph),
        });
      }
      // the left rail's shadow falls across the beans next to it (light from upper left)
      const shade = [[90, BACK_Y], [134, BACK_Y], [26, FRONT_Y], [-40, FRONT_Y]];
      L.hatch(x, shade, { spacing: 5, width: 1.3, color: P.ink, alpha: 0.55, length: [10, 30], seed: sd('railshade', wet ? 1 : 0), boil: 0 });
      // the back rail's shadow: a thin band
      L.hatch(x, [[90, BACK_Y], [990, BACK_Y], [994, BACK_Y + 16], [87, BACK_Y + 16]], { spacing: 5, width: 1.2, color: P.ink, alpha: 0.5, length: [12, 34], seed: sd('backshade', wet ? 1 : 0), boil: 0 });
      x.restore();
      return c;
    });
  }

  // ---------------------------------------------------------------------------
  // background: stripes, sun arc, sun, hills, patio
  // ---------------------------------------------------------------------------
  function sunRays(x, y) {
    const out = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + 0.13;
      const long = i % 2 === 0;
      const r0 = SUN_R + 10, r1 = SUN_R + (long ? 36 : 24);
      out.push([x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1]);
    }
    return out;
  }
  function drawSun(ctx, L, P, x, y) {
    const seed = sd('sun');
    sunRays(x, y).forEach((q, i) => L.inkLine(ctx, q[0], q[1], q[2], q[3], { width: 3.6, seed: seed + i, taper: [2, 8], wobble: 0.4 }));
    const disc = L.ellipsePts(x, y, SUN_R, SUN_R, 40);
    L.inkPath(ctx, disc, { closed: true, fill: P.sun, width: 3.6, seed: seed + 20 });
    L.hatch(ctx, disc, { spacing: 5, width: 1.3, color: P.ochre, alpha: 0.85, seed: seed + 21, length: [8, 26], density: (px, py) => sstep(0.05, 0.7, ((px - x) * 0.6 + (py - y) * 0.8) / SUN_R) });
    L.stipple(ctx, disc, { spacing: 7, r: [0.8, 1.4], color: P.ochre, alpha: 0.7, seed: seed + 23, density: (px, py) => 0.6 * sstep(-0.2, 0.4, ((px - x) * 0.6 + (py - y) * 0.8) / SUN_R) });
    L.inkPath(ctx, [[x - 27, y - 13], [x - 17, y - 27], [x - 3, y - 33]], { width: 3, color: P.white, alpha: 0.85, seed: seed + 22, taper: [6, 8] });
  }
  function sunPos(u) {
    const a = lerp(ARC_A0, ARC_A1, u);
    return [ARC_CX + Math.cos(a) * ARC_R, ARC_CY + Math.sin(a) * ARC_R];
  }

  function cloudPts(c, ox) {
    // the upper outline as a union of bumps, a flat-ish bottom
    const pts = [];
    const w = c.w;
    const n = 90;
    for (let i = 0; i <= n; i++) {
      const x = lerp(-w * 0.78, w * 0.78, i / n);
      let top = 0;
      for (const [bx, by, br] of c.bumps) {
        const d = br * br - (x - bx) * (x - bx);
        if (d > 0) top = Math.min(top, by - Math.sqrt(d) + br * 0.6);
      }
      pts.push([c.x + ox + x, c.y + Math.min(top, -4)]);
    }
    pts.push([c.x + ox + w * 0.7, c.y + 10], [c.x + ox - w * 0.7, c.y + 10]);
    return pts;
  }
  function drawClouds(ctx, L, P, g, day, night) {
    g.clouds.forEach((c, i) => {
      let ox = day * (i === 1 ? 46 : 62) * (i === 2 ? -1 : 1);
      const pts = cloudPts(c, ox);
      L.inkPath(ctx, pts, { closed: true, fill: night ? L.mix(P.white, P.nightSky, 0.25) : P.white, width: 2.6, color: P.inkSoft, seed: sd('cloudline', i), taper: [6, 12] });
      L.hatch(ctx, pts, { spacing: 5, width: 1.2, color: P.inkSoft, alpha: 0.7, length: [10, 34], seed: sd('cloudh', i), density: (x, y) => sstep(c.y - c.w * 0.12, c.y + 6, y) * 0.9 + 0.3 * sstep(c.x + ox, c.x + ox + c.w * 0.8, x) * sstep(c.y - c.w * 0.3, c.y, y) });
    });
  }

  function drawHills(ctx, L, P, g, bo) {
    // far ridge
    const farPoly = g.far.concat([[1120, SKY_Y + 4], [-40, SKY_Y + 4]]);
    ctx.save();
    ctx.fillStyle = L.mix(P.stripeSage, P.sage, 0.55);
    ctx.beginPath();
    L.tracePath(ctx, farPoly, true);
    ctx.fill();
    ctx.restore();
    // shadow flank right of the peak, light from the upper left
    L.hatch(ctx, farPoly, { spacing: 7, width: 1.2, color: P.leafDeep, alpha: 0.55, angle: -0.95, length: [14, 44], boil: bo, seed: sd('farhatch'), density: (x, y) => 0.15 + 0.75 * sstep(560, 900, x) * (0.7 + 0.3 * L.noise1(y * 0.03, sd('fh'))) });
    L.crossHatch(ctx, farPoly, { spacing: 6, width: 1.1, color: P.leafDeep, alpha: 0.45, tone: 0.6, boil: bo, seed: sd('farx'), density: (x, y) => sstep(760, 1080, x) });
    const ter = new Path2D();
    for (const row of g.terraces) row.forEach((q, i) => (i ? ter.lineTo(q[0], q[1]) : ter.moveTo(q[0], q[1])));
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, farPoly, true);
    ctx.clip();
    strokeP(ctx, ter, P.leafDeep, 0.5, 1.4);
    ctx.restore();
    const fs = new Path2D();
    for (const [x, y, r] of g.farShrubs) {
      fs.moveTo(x + r, y);
      fs.arc(x, y, r, 0, TAU);
    }
    fillP(ctx, fs, P.leafDeep, 0.45);
    L.inkPath(ctx, g.far, { width: 2.2, color: P.inkSoft, alpha: 0.85, boil: bo, seed: sd('farline'), taper: 0 });
    // near ridge with coffee rows
    const nearPoly = g.near.concat([[1120, SKY_Y + 4], [-40, SKY_Y + 4]]);
    ctx.save();
    ctx.fillStyle = P.sage;
    ctx.beginPath();
    L.tracePath(ctx, nearPoly, true);
    ctx.fill();
    ctx.restore();
    L.hatch(ctx, nearPoly, { spacing: 6, width: 1.3, color: P.leafDeep, alpha: 0.55, angle: -0.2, length: [10, 30], boil: bo, seed: sd('nearhatch'), density: (x, y) => 0.3 + 0.5 * sstep(-0.2, 0.7, L.noise1(x * 0.008 + 3, sd('nh'))) });
    const sh = new Path2D(), sl = new Path2D();
    for (const [x, y, r] of g.shrubs) {
      sh.moveTo(x + r, y);
      sh.ellipse(x, y, r, r * 0.8, 0, Math.PI, TAU);
      sh.closePath();
      sl.moveTo(x - r * 0.5, y - r * 0.4);
      sl.arc(x - r * 0.15, y - r * 0.2, r * 0.32, Math.PI, TAU);
    }
    fillP(ctx, sh, P.leafCoffee, 0.95);
    strokeP(ctx, sh, P.ink, 0.6, 1.1);
    fillP(ctx, sl, P.leafLight, 0.6);
    L.inkPath(ctx, g.near, { width: 3, color: P.ink, alpha: 0.9, boil: bo, seed: sd('nearline'), taper: 0 });
  }

  function drawPatio(ctx, L, P, bo) {
    // patio slab from the horizon line down behind and under the bed
    const top = SKY_Y;
    ctx.save();
    ctx.fillStyle = L.mix(P.paperShade, P.paper, 0.35);
    ctx.fillRect(0, top, 1080, 1920 - top);
    ctx.restore();
    // slab seams converge toward a far vanishing point; cross seams step with depth
    const VPY = -1080, VPX = 540;
    const seams = new Path2D();
    for (let i = -10; i <= 10; i++) {
      const xb = 540 + i * 150;
      const u0 = (top - VPY) / (1920 - VPY);
      seams.moveTo(lerp(VPX, xb, u0), top);
      seams.lineTo(xb, 1920);
    }
    let yy = top + 18;
    for (let k = 0; yy < 1920; k++) {
      seams.moveTo(0, yy);
      seams.lineTo(1080, yy);
      yy += 22 + k * 9;
    }
    strokeP(ctx, seams, P.inkFaint, 0.32, 1.4);
    // horizon hatching: a band of horizontal strokes under the ridge
    L.hatch(ctx, null, { bounds: [0, top + 2, 1080, 40], angle: 0, spacing: 6, width: 1.1, color: P.inkSoft, alpha: 0.35, length: [20, 70], boil: bo, seed: sd('patioband'), density: (x, y) => 1 - (y - top) / 40 });
  }

  // ---------------------------------------------------------------------------
  // the bed: under-shadow, legs, rails and front board
  // ---------------------------------------------------------------------------
  function drawUnder(ctx, L, P, bo) {
    // the shadow under the bed
    const shade = [[-60, 1660], [1140, 1660], [1140, 1920], [-60, 1920]];
    fillP(ctx, polyPath(shade), L.mix(P.paperShade, P.paperDeep, 0.6), 1);
    L.crossHatch(ctx, shade, { spacing: 6, crossSpacing: 8, width: 1.3, color: P.ink, alpha: 0.6, tone: 0.55, boil: bo, seed: sd('undershade'), density: (x, y) => 1 - 0.55 * sstep(1700, 1920, y) });
    // legs: back pair (deeper in shadow, shorter), front pair
    const legs = [[178, 1660, 1838, 30, 0.6], [902, 1660, 1838, 30, 0.6], [40, 1660, 1960, 46, 1], [1040, 1660, 1960, 46, 1]];
    legs.forEach(([x, y0, y1, w, k], i) => {
      const pts = [[x - w / 2, y0], [x + w / 2, y0], [x + w / 2 + 2, y1], [x - w / 2 - 2, y1]];
      // contact shadow on the ground
      if (y1 < 1920) {
        ctx.save();
        ctx.fillStyle = L.rgba(P.ink, 0.35);
        ctx.beginPath();
        ctx.ellipse(x + 10, y1, w * 1.1, 8, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      L.inkPath(ctx, pts, { closed: true, fill: L.mix(P.wood, P.barkDeep, 1 - k * 0.7), width: 3, boil: bo, seed: sd('leg', i), taper: [4, 8] });
      L.hatch(ctx, [[x, y0], [x + w / 2, y0], [x + w / 2 + 2, y1], [x, y1]], { angle: Math.PI / 2 - 0.05, spacing: 5, width: 1.3, color: P.barkDeep, alpha: 0.85, length: [30, 90], boil: bo, seed: sd('leghatch', i) });
    });
  }

  function drawRails(ctx, L, P) {
    const wood = P.wood;
    // back rail (thin, far)
    const back = [[80, 986], [1000, 986], [992, BACK_Y + 1], [88, BACK_Y + 1]];
    L.inkPath(ctx, back, { closed: true, fill: wood, width: 2.6, seed: sd('backrail'), taper: [4, 8] });
    L.hatch(ctx, back, { angle: 0, spacing: 4, width: 1, color: P.barkDeep, alpha: 0.6, length: [30, 80], seed: sd('backrailh'), density: 0.5 });
    // side rails (top faces)
    const left = [[80, 986], [90, BACK_Y], [-40, FRONT_Y], [-62, 1604]];
    const right = [[1000, 986], [990, BACK_Y], [1120, FRONT_Y], [1142, 1604]];
    L.inkPath(ctx, left, { closed: true, fill: wood, width: 3, seed: sd('leftrail'), taper: [4, 8] });
    L.inkPath(ctx, right, { closed: true, fill: L.mix(wood, P.white, 0.15), width: 3, seed: sd('rightrail'), taper: [4, 8] });
    L.hatch(ctx, left, { angle: Math.atan2(600, -130), spacing: 4, width: 1.1, color: P.barkDeep, alpha: 0.7, length: [40, 120], seed: sd('leftrailh') });
    // front board: top face and front face
    const topF = [[-62, 1596], [1142, 1596], [1142, 1612], [-62, 1612]];
    const face = [[-62, 1612], [1142, 1612], [1142, 1664], [-62, 1664]];
    L.inkPath(ctx, face, { closed: true, fill: L.mix(wood, P.barkDeep, 0.25), width: 5, seed: sd('frontface'), taper: [4, 8] });
    L.hatch(ctx, face, { angle: 0.01, spacing: 5, width: 1.4, color: P.barkDeep, alpha: 0.8, length: [40, 160], seed: sd('frontfaceh'), density: (x, y) => 0.45 + 0.5 * sstep(1620, 1660, y) });
    // grain knots
    for (const [kx, ky] of [[220, 1636], [610, 1640], [890, 1632]]) {
      L.inkPath(ctx, L.ellipsePts(kx, ky, 16, 6, 18), { closed: true, width: 1.6, color: P.barkDeep, seed: sd('knot', kx), taper: [3, 6] });
      L.inkPath(ctx, [[kx - 70, ky + 8], [kx - 20, ky + 9], [kx, ky + 12], [kx + 26, ky + 9], [kx + 90, ky + 8]], { width: 1.4, color: P.barkDeep, alpha: 0.8, seed: sd('grain', kx) });
    }
    L.inkPath(ctx, topF, { closed: true, fill: L.mix(wood, P.white, 0.2), width: 4, seed: sd('fronttop'), taper: [4, 8] });
    // nail heads along the front board
    const nails = new Path2D();
    for (let x = 30; x < 1080; x += 150) {
      nails.moveTo(x + 3.5, 1626);
      nails.arc(x, 1626, 3.5, 0, TAU);
      nails.moveTo(x + 3.5, 1652);
      nails.arc(x, 1652, 3.5, 0, TAU);
    }
    fillP(ctx, nails, P.ink, 0.8);
  }

  // the static backdrop (patio, hills, under the bed), cached for two boil drawings
  const BD_Y = 560;
  function backdrop(L, P, g, b) {
    const S = FILM.S || 1;
    return L.cached(['backdrop', ID, b, S].join('|'), () => {
      const c = canvas(Math.round(1080 * S), Math.round((1920 - BD_Y) * S));
      const x = c.getContext('2d');
      x.scale(S, S);
      x.translate(0, -BD_Y);
      drawPatio(x, L, P, b);
      drawHills(x, L, P, g, b);
      drawUnder(x, L, P, b);
      return c;
    });
  }

  // ---------------------------------------------------------------------------
  // rake, furrows, overlays
  // ---------------------------------------------------------------------------
  function headAt(s, day) {
    const off = DAY_OFF[day];
    return [lerp(HEAD_FAR[0], HEAD_NEAR[0], s) + RP[0] * off, lerp(HEAD_FAR[1], HEAD_NEAR[1], s) + RP[1] * off];
  }

  function drawFurrows(ctx, L, P, day, smax, alpha, wet, bi) {
    if (smax <= 0.02 || alpha <= 0) return;
    const a = headAt(0, day), b = headAt(smax, day);
    const groove = new Path2D(), ridgeL = new Path2D(), ridgeD = new Path2D();
    const seed = sd('furrow', day);
    for (let j = 0; j < TINES; j++) {
      const n = 22;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u);
        const s = depthScale(y);
        const lat = (j - (TINES - 1) / 2) * TINE_GAP * s + 3.2 * L.noise1(u * 6 + j * 1.7, seed) + 0.8 * L.noise1(u * 20 + j, seed + bi);
        pts.push([x + RP[0] * lat, y + RP[1] * lat, s]);
      }
      pts.forEach((q, i) => (i ? groove.lineTo(q[0], q[1]) : groove.moveTo(q[0], q[1])));
      // ridges: lit on the left of each groove, shaded on the right
      pts.forEach((q, i) => {
        const o = 8 * q[2];
        const lx = q[0] - RP[0] * o, ly = q[1] - RP[1] * o;
        const rx = q[0] + RP[0] * o, ry = q[1] + RP[1] * o;
        if (i) {
          ridgeL.lineTo(lx, ly);
        } else ridgeL.moveTo(lx, ly);
        if (i) ridgeD.lineTo(rx, ry);
        else ridgeD.moveTo(rx, ry);
      });
    }
    const dark = L.mix(P.parchmentDeep, P.ink, 0.35 + 0.25 * wet);
    strokeP(ctx, groove, dark, 0.22 * alpha, 13);
    strokeP(ctx, groove, dark, 0.3 * alpha, 7);
    strokeP(ctx, groove, dark, 0.55 * alpha, 2.4, [16, 5]);
    strokeP(ctx, ridgeD, P.parchmentDeep, 0.55 * alpha, 2.4, [7, 4]);
    strokeP(ctx, ridgeL, P.white, 0.6 * alpha, 2.4, [9, 3]);
  }

  function drawRake(ctx, L, P, st, bi) {
    const h = headAt(st.rs, st.day);
    const s = depthScale(h[1]);
    const half = (TINES - 1) / 2 * TINE_GAP * s + 22 * s;
    // bean ridge pushed ahead of the head (toward the viewer) while it moves
    const push = st.rs > 0.05 ? 1 : 0.4;
    {
      const r = L.rng(sd('push', st.day, Math.round(st.rs * 8)));
      const pp = new Path2D(), ps = new Path2D();
      for (let i = 0; i < 70 * push; i++) {
        const u = r.range(-1, 1), v = r.range(0, 1);
        const x = h[0] + RP[0] * u * half + RD[0] * (8 + v * 16) * s;
        const y = h[1] + RP[1] * u * half + RD[1] * (8 + v * 16) * s;
        const rx = 6.2 * s * r.range(0.8, 1.15), ry = rx * 0.66, rot = r.range(-1.2, 1.2);
        ps.moveTo(x + 1.2 + rx, y + 1.2);
        ps.ellipse(x + 1.2, y + 1.2, rx, ry, rot, 0, TAU);
        pp.moveTo(x + rx, y);
        pp.ellipse(x, y, rx, ry, rot, 0, TAU);
      }
      const tone = L.mix(P.mucilage, P.parchment, 1 - st.wet);
      fillP(ctx, ps, L.mix(P.parchmentDeep, P.inkSoft, 0.4), 0.9);
      fillP(ctx, pp, tone);
      strokeP(ctx, pp, P.ink, 0.35, 0.7);
    }
    // handle: from the head toward the viewer and out of frame at the bottom
    const hEnd = [h[0] + RD[0] * 900, h[1] + RD[1] * 900];
    const hStart = [h[0] - RD[0] * 6, h[1] - RD[1] * 6];
    const hp = ribbon([hStart, [lerp(hStart[0], hEnd[0], 0.5), lerp(hStart[1], hEnd[1], 0.5)], hEnd], 13, 30);
    L.inkPath(ctx, hp, { closed: true, fill: L.mix(P.wood, P.white, 0.12), width: 3, seed: sd('handle'), taper: [4, 8] });
    // lengthwise hatching on the handle's shadow (right) half
    const hShade = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const x = lerp(hStart[0], hEnd[0], u), y = lerp(hStart[1], hEnd[1], u), w = lerp(13, 30, u) / 2;
      hShade.push([x + RP[0] * w * 0.05, y + RP[1] * w * 0.05]);
    }
    for (let i = 8; i >= 0; i--) {
      const u = i / 8;
      const x = lerp(hStart[0], hEnd[0], u), y = lerp(hStart[1], hEnd[1], u), w = lerp(13, 30, u) / 2;
      hShade.push([x + RP[0] * w, y + RP[1] * w]);
    }
    L.hatch(ctx, hShade, { angle: Math.atan2(RD[1], RD[0]), spacing: 3.2, width: 1.1, color: P.barkDeep, alpha: 0.85, length: [30, 110], inset: 1, seed: sd('handleh') });
    // ferrule where the handle meets the head
    const fe = ribbon([[h[0] + RD[0] * 4, h[1] + RD[1] * 4], [h[0] + RD[0] * 26, h[1] + RD[1] * 26]], 18, 19);
    L.inkPath(ctx, fe, { closed: true, fill: P.steel, width: 2.2, seed: sd('ferrule'), taper: [3, 5] });
    // the head: a wooden bar across the stroke, tines buried in the beans
    const bar = [
      [h[0] - RP[0] * half - RD[0] * 12 * s, h[1] - RP[1] * half - RD[1] * 12 * s - 10 * s],
      [h[0] + RP[0] * half - RD[0] * 12 * s, h[1] + RP[1] * half - RD[1] * 12 * s - 10 * s],
      [h[0] + RP[0] * half + RD[0] * 9 * s, h[1] + RP[1] * half + RD[1] * 9 * s + 4 * s],
      [h[0] - RP[0] * half + RD[0] * 9 * s, h[1] - RP[1] * half + RD[1] * 9 * s + 4 * s],
    ];
    // tines hang from the bar into the beans (their tips buried)
    const tines = new Path2D(), tips = new Path2D();
    for (let j = 0; j < TINES; j++) {
      const lat = (j - (TINES - 1) / 2) * TINE_GAP * s;
      const x = h[0] + RP[0] * lat + RD[0] * 6 * s, y = h[1] + RP[1] * lat + RD[1] * 6 * s;
      tines.moveTo(x, y);
      tines.lineTo(x + RD[0] * 8 * s, y + 36 * s);
      tips.moveTo(x + RD[0] * 8 * s + 8 * s, y + 37 * s);
      tips.ellipse(x + RD[0] * 8 * s, y + 37 * s, 8 * s, 3.5 * s, 0, 0, TAU);
    }
    strokeP(ctx, tines, P.ink, 1, 6 * s);
    strokeP(ctx, tines, P.steel, 1, 2.4 * s);
    fillP(ctx, tips, L.mix(P.parchmentDeep, P.ink, 0.4), 0.8);
    L.inkPath(ctx, bar, { closed: true, fill: P.wood, width: 3.4, seed: sd('bar'), taper: [4, 8], double: true });
    L.hatch(ctx, [bar[3], bar[2], [lerp(bar[2][0], bar[1][0], 0.45), lerp(bar[2][1], bar[1][1], 0.45)], [lerp(bar[3][0], bar[0][0], 0.45), lerp(bar[3][1], bar[0][1], 0.45)]], { angle: Math.atan2(RP[1], RP[0]), spacing: 3.5, width: 1.1, color: P.barkDeep, alpha: 0.85, length: [20, 60], inset: 1, seed: sd('barh') });
  }

  function drawWisps(ctx, L, P, g, t, wet, dayF) {
    const k = clamp(1 - dayF / 4.6);
    if (k <= 0) return;
    const p = new Path2D();
    for (const w of g.wisps) {
      const ph = (t * 1.6 + w.ph) % 1; // rises and fades in a loop (24 fps overlay)
      const s = depthScale(w.y);
      const y0 = w.y - ph * 50 * s;
      const n = 10;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = w.x + Math.sin(u * 5.2 + w.ph * 6 + t * 7) * 7 * s;
        const y = y0 - u * w.h * s;
        if (i) p.lineTo(x, y);
        else p.moveTo(x, y);
      }
    }
    strokeP(ctx, p, P.annBlue, 0.85 * k, 2);
  }

  function drawRakePath(ctx, L, P, st, t) {
    // a dashed annBlue guide beside the rake: both ways, drawn on over the day's first 6 frames
    const dayStart = st.day < 6 ? st.day * 9 : 54;
    const prog = L.ease.outExpo((st.f - dayStart + 1) / 6);
    const off = DAY_OFF[st.day] - 150;
    const a = [HEAD_FAR[0] + RP[0] * off, HEAD_FAR[1] + RP[1] * off];
    const b = [HEAD_NEAR[0] + RP[0] * off + RD[0] * 40, HEAD_NEAR[1] + RP[1] * off + RD[1] * 40];
    const e = [lerp(a[0], b[0], prog), lerp(a[1], b[1], prog)];
    ctx.save();
    ctx.strokeStyle = P.annBlue;
    ctx.fillStyle = P.annBlue;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(e[0], e[1]);
    ctx.stroke();
    ctx.setLineDash([]);
    const arrow = (p, dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(p[0] + dx * 6, p[1] + dy * 6);
      ctx.lineTo(p[0] - dx * 12 - dy * 8, p[1] - dy * 12 + dx * 8);
      ctx.lineTo(p[0] - dx * 7, p[1] - dy * 7);
      ctx.lineTo(p[0] - dx * 12 + dy * 8, p[1] - dy * 12 - dx * 8);
      ctx.closePath();
      ctx.fill();
    };
    arrow(e, RD[0], RD[1]);
    if (prog > 0.98) arrow(a, -RD[0], -RD[1]);
    ctx.restore();
  }

  function drawTally(ctx, L, P, st) {
    ctx.save();
    ctx.lineCap = 'round';
    // the guide rule under the tally
    ctx.strokeStyle = P.annYellow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(TALLY_X0 - 30, TALLY_Y + 34);
    ctx.lineTo(TALLY_X0 + 6 * TALLY_DX + 30, TALLY_Y + 34);
    for (let k = 0; k < 7; k++) {
      ctx.moveTo(TALLY_X0 + k * TALLY_DX, TALLY_Y + 28);
      ctx.lineTo(TALLY_X0 + k * TALLY_DX, TALLY_Y + 40);
    }
    ctx.stroke();
    for (let k = 0; k < 7; k++) {
      const x = TALLY_X0 + k * TALLY_DX, y = TALLY_Y;
      const ff = st.f - tallyFrame(k);
      ctx.save();
      ctx.translate(x, y);
      if (ff >= 0) {
        const sc = ff < 3 ? L.ease.outBack((ff + 1) / 3) : 1;
        ctx.scale(sc, sc);
        ctx.fillStyle = P.annYellow;
        ctx.beginPath();
        ctx.arc(0, 0, TALLY_R, 0, TAU);
        ctx.fill();
        // a little sun glyph knocked out of the disc
        ctx.fillStyle = P.white;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, TAU);
        ctx.fill();
      } else {
        ctx.strokeStyle = P.annYellow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, TALLY_R - 1.5, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
      // attention ring on a circle as it fills (expands and fades over 9 frames)
      if (ff >= 0 && ff < 9) {
        const u = (ff + 1) / 9;
        ctx.save();
        ctx.strokeStyle = P.annYellow;
        ctx.globalAlpha = 1 - sstep(0.3, 1, u);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, lerp(TALLY_R + 4, TALLY_R + 26, L.ease.outExpo(u)), 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
    // the current day marker: a small caret under today's circle
    const cx = TALLY_X0 + st.day * TALLY_DX;
    ctx.fillStyle = P.annYellow;
    ctx.beginPath();
    ctx.moveTo(cx, TALLY_Y + 46);
    ctx.lineTo(cx - 7, TALLY_Y + 58);
    ctx.lineTo(cx + 7, TALLY_Y + 58);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGlints(ctx, L, P, g, wet, bi) {
    if (wet <= 0.02) return;
    const p = new Path2D(), x = new Path2D();
    let i = 0;
    for (const b of g.glints) {
      i++;
      if (L.h3(i, bi, 77) < 0.45) continue;
      const s = depthScale(b.y);
      const gx = b.x - b.rx * 0.35, gy = b.y - b.ry * 0.5;
      p.moveTo(gx + 1.6 * s, gy);
      p.arc(gx, gy, 1.6 * s, 0, TAU);
      if (i % 4 === 0) {
        const r = 5.5 * s;
        x.moveTo(gx - r, gy);
        x.lineTo(gx + r, gy);
        x.moveTo(gx, gy - r);
        x.lineTo(gx, gy + r);
      }
    }
    fillP(ctx, p, P.white, wet);
    strokeP(ctx, x, P.white, 0.9 * wet, 1.2);
  }

  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal;
      const t = clamp(tIn, 0, info.dur);
      const g = geo(L);
      const st = timing(t);
      const bi = L.boil(info.T);

      // 1 stripes (sky)
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeSage], width: 140, angle: -0.52, offset: (info.T / 0.75) * 6, bounds: [0, 0, 1080, SKY_Y + 40] });

      drawClouds(ctx, L, P, g, st.day, st.night);

      // 2 sun-path arc and sun
      ctx.save();
      ctx.strokeStyle = P.annYellow;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.setLineDash([0.01, 9]);
      ctx.beginPath();
      ctx.arc(ARC_CX, ARC_CY, ARC_R, ARC_A0, ARC_A1);
      ctx.stroke();
      ctx.restore();
      // hour ticks on the arc
      ctx.save();
      ctx.strokeStyle = P.annYellow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = lerp(ARC_A0, ARC_A1, i / 6);
        const l = i % 3 === 0 ? 14 : 8;
        ctx.moveTo(ARC_CX + Math.cos(a) * (ARC_R - l), ARC_CY + Math.sin(a) * (ARC_R - l));
        ctx.lineTo(ARC_CX + Math.cos(a) * (ARC_R + l), ARC_CY + Math.sin(a) * (ARC_R + l));
      }
      ctx.stroke();
      ctx.restore();
      if (!st.night) {
        const [sx, sy] = sunPos(st.su);
        // the trail of today's crossing (24 fps overlay behind the disc)
        ctx.save();
        ctx.strokeStyle = P.annYellow;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ARC_CX, ARC_CY, ARC_R, ARC_A0, lerp(ARC_A0, ARC_A1, st.su));
        ctx.stroke();
        ctx.restore();
        drawSun(ctx, L, P, sx, sy);
      }

      // 3 hills and patio
      ctx.drawImage(backdrop(L, P, g, bi % 2), 0, BD_Y, 1080, 1920 - BD_Y);

      // 4 night pass
      if (st.night) {
        ctx.save();
        ctx.fillStyle = L.rgba(P.navy, 0.25);
        ctx.fillRect(0, 0, 1080, SKY_Y + 2);
        ctx.fillStyle = L.rgba(P.navy, 0.1);
        ctx.fillRect(0, SKY_Y + 2, 1080, 1920 - SKY_Y);
        ctx.restore();
        // a few stars in the dimmed band
        const r = L.rng(sd('stars', st.day));
        const sp = new Path2D();
        for (let i = 0; i < 14; i++) {
          const x = r.range(80, 1000), y = r.range(340, 760), rr = r.range(1.4, 2.6);
          sp.moveTo(x + rr, y);
          sp.arc(x, y, rr, 0, TAU);
        }
        fillP(ctx, sp, P.white, 0.85);
      }

      // 5-6 under the bed and the frame
      drawRails(ctx, L, P);

      // 7 the bean field: dry underneath, wet on top fading out
      ctx.drawImage(beanField(L, P, false), 0, SPR_Y, 1080, SPR_H);
      if (st.wet > 0.004) {
        ctx.save();
        ctx.globalAlpha = st.wet;
        ctx.drawImage(beanField(L, P, true), 0, SPR_Y, 1080, SPR_H);
        ctx.restore();
      }
      if (st.night) {
        ctx.save();
        ctx.fillStyle = L.rgba(P.navy, 0.1);
        ctx.beginPath();
        L.tracePath(ctx, BED, true);
        ctx.fill();
        ctx.restore();
      }

      // 8 furrows: yesterday's (settling) and today's
      ctx.save();
      ctx.beginPath();
      L.tracePath(ctx, BED, true);
      ctx.clip();
      if (st.day > 0) drawFurrows(ctx, L, P, st.day - 1, 1, 0.4, st.wet, bi);
      drawFurrows(ctx, L, P, st.day, st.rmax, 1, st.wet, bi);
      drawGlints(ctx, L, P, g, st.wet, bi);
      ctx.restore();

      // 9 the rake
      drawRake(ctx, L, P, st, bi);

      // 10 overlays
      drawWisps(ctx, L, P, g, t, st.wet, st.dayF);
      drawRakePath(ctx, L, P, st, t);
      drawTally(ctx, L, P, st);
    },
  });
})();
