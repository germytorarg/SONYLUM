// 18 pour-crema : "Tiger stripes and crema" (illustrated, global T 35.25 to 37.50, hard cut)
//
// The inked portafilter spouts at G4 (505, 760) and (575, 760) pour two streams straight down into
// the ceramic G3 cup (rim (540, 1080) rx 250 ry 70, liquid surface (540, 1102) rx 232 ry 60) on its
// saucer, a teaspoon at the right. The surface goes from dark espresso to caramel crema with tiger
// mottling by T 36.375; the streams go honey-coloured and thin, and cut off on the beat T 36.75 (top
// first, the last drops fall over 6 frames). On the 8th T 37.125 an annYellow ring pops around the
// crema and a first wisp of steam rises. The last frame (full cup, caramel crema, first wisp) is the
// first frame of 19, which starts on the same cup at G3. Cup, saucer and streams are screen-fixed.
//
// Layers, back to front:
//   1 stripes stripeCream / stripeYellow (drift 6 px per beat)
//   2 espresso machine: top band, group head, drip-tray grate behind the saucer, tray front
//   3 saucer with its well, the cup's cast shadow, teaspoon
//   4 cup: body with contour hatching, handle, inner wall, crema surface (clipped to the inner rim), rim
//   5 portafilter: ring, basket bowl, wooden handle, spout fork and the two nozzles ending on G4
//   6 streams (on twos), impact ripples, cut-off and last drops
//   7 steam wisp (from T 37.125)
//   8 overlays: annBlue flow arrows, annYellow crema ring, construction lines
(function () {
  'use strict';

  const ID = 'pour-crema';
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

  // beats (shot-local seconds)
  const B_CREMA = 1.125; // T 36.375 crema fully caramel
  const B_CUT = 1.5; // T 36.75 streams cut off (beat)
  const B_RING = 1.875; // T 37.125 ring pops, first wisp of steam (8th)

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
  function fillPoly(ctx, pts, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    trace(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  }
  function stroke(ctx, path, color, alpha, width, dash, dashOff) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha *= alpha;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash) {
      ctx.setLineDash(dash);
      ctx.lineDashOffset = dashOff || 0;
    }
    ctx.stroke(path);
    ctx.restore();
  }
  function arcPts(cx, cy, rx, ry, a0, a1, n = 32) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = lerp(a0, a1, i / n);
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }
  function bez(p0, p1, p2, p3, n = 24) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, v = 1 - u;
      out.push([v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]);
    }
    return out;
  }
  function offsetLine(pts, d) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      out.push([pts[i][0] - ty * d, pts[i][1] + tx * d]);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // G3 cup (docs/storyboard.md, Shared geometry G3), same construction as 17
  // ---------------------------------------------------------------------------
  const CUP = { cx: 540, rimY: 1080, rx: 250, ry: 70, footY: 1395, footRx: 160, footRy: 34, liqY: 1102, liqRx: 232, liqRy: 60 };
  const SIDE_L = bez([290, 1080], [288, 1250], [338, 1372], [380, 1395], 40);
  const SIDE_R = SIDE_L.map(([x, y]) => [1080 - x, y]);
  const HANDLE = bez([782, 1130], [880, 1110], [930, 1200], [905, 1240], 20).concat(bez([905, 1240], [885, 1300], [800, 1310], [752, 1300], 20).slice(1));
  // exterior: left side down, front of the foot, right side up, front half of the rim back to the left
  const BODY = SIDE_L.concat(arcPts(540, CUP.footY, CUP.footRx, CUP.footRy, Math.PI, 0, 40).map(([x, y]) => [x, 2 * CUP.footY - y]).slice(1))
    .concat(SIDE_R.slice().reverse().slice(1))
    .concat(arcPts(540, CUP.rimY, CUP.rx, CUP.ry, 0, Math.PI, 60).slice(1, -1));
  const RIM_IN = { rx: CUP.rx - 12, ry: CUP.ry - 8 };

  let GEO = null;
  function geo(L) {
    if (GEO) return GEO;
    const r = L.rng(sd('crema'));
    // crema mottling blobs in unit-disk coordinates
    const blobs = [];
    for (let i = 0; i < 70; i++) {
      const rad = Math.sqrt(r()) * 0.95;
      blobs.push({ a: r() * TAU, d: rad, len: r.range(0.08, 0.26), w: r.range(0.025, 0.06), kind: r() < 0.62 ? 0 : r() < 0.7 ? 1 : 2, ph: r() * TAU });
    }
    // tiger streaks: spiral arcs
    const streaks = [];
    for (let i = 0; i < 34; i++) streaks.push({ a: r() * TAU, d: r.range(0.15, 0.92), span: r.range(0.5, 1.4), w: r.range(3, 8), dark: i % 3 === 2 });
    GEO = { blobs, streaks };
    return GEO;
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
      const g = geo(L);
      const ink = (pts, o) => L.inkPath(ctx, pts, Object.assign({ step: 4.5 }, o));
      const drawing = (a) => Math.floor((t - a) * 12 + 1e-6);
      const ink0 = P.ink, inkSoft = P.inkSoft, steel = P.steel, steelDeep = P.steelDeep;
      const steelLight = L.mix(P.steel, P.white, 0.45);

      // ---- 1 stripes ----------------------------------------------------------------------
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeYellow], width: 140, angle: -0.52, offset: 8 * info.T, seed: sd('stripes') });

      // ---- 2 machine --------------------------------------------------------------------------
      {
        // top band (scenery, full bleed)
        const band = [[-10, -10], [1090, -10], [1090, 236], [-10, 236]];
        fillPoly(ctx, band, steel);
        L.hatch(ctx, band, { angle: 0, spacing: 9, width: 1.4, color: steelDeep, alpha: 0.8, length: [30, 120], seed: sd('bandH'), density: (x, y) => 0.25 + 0.6 * sstep(140, 236, y) + 0.3 * sstep(700, 1080, x) });
        ink([[-20, 236], [1100, 236]], { width: 4, seed: sd('bandL'), taper: [0, 0], smooth: false, step: 8 });
        ink([[-20, 222], [1100, 222]], { width: 1.6, color: inkSoft, alpha: 0.8, seed: sd('bandL2'), taper: [0, 0], smooth: false, step: 8 });
        const hl = new Path2D();
        hl.moveTo(0, 196);
        hl.lineTo(1080, 196);
        stroke(ctx, hl, P.white, 0.7, 4);
        // the drip-tray grate behind the saucer, seen from above at three quarters
        const grate = [[90, 1290], [990, 1290], [1070, 1600], [10, 1600]];
        fillPoly(ctx, grate, L.mix(steel, P.paper, 0.15));
        const slots = new Path2D();
        for (let i = 0; i < 13; i++) {
          const y = 1302 + i * 23 + i * i * 0.4;
          const u = (y - 1290) / 310;
          const x0 = lerp(110, 32, u), x1 = lerp(970, 1048, u);
          slots.moveTo(x0, y);
          slots.lineTo(x1, y);
        }
        stroke(ctx, slots, ink0, 0.75, 5.5);
        stroke(ctx, slots, steelDeep, 0.9, 2.2);
        L.hatch(ctx, grate, { angle: -Math.PI / 4, spacing: 8, width: 1.3, color: ink0, alpha: 0.35, seed: sd('grateH'), density: (x) => 0.3 + 0.7 * sstep(600, 1050, x) });
        ink(grate, { closed: true, width: 3, seed: sd('grate'), smooth: false });
        // tray front and the machine base below (scenery)
        const front = [[10, 1600], [1070, 1600], [1070, 1660], [10, 1660]];
        ink(front, { closed: true, width: 3, fill: steelLight, seed: sd('trayF'), smooth: false });
        L.hatch(ctx, front, { angle: Math.PI / 2 - 0.2, spacing: 6, width: 1.3, color: steelDeep, alpha: 0.8, length: [10, 30], seed: sd('trayFH'), density: (x) => sstep(500, 1070, x) });
        const base = [[-10, 1660], [1090, 1660], [1090, 1930], [-10, 1930]];
        fillPoly(ctx, base, L.mix(steelDeep, P.ink, 0.3));
        L.hatch(ctx, base, { angle: -Math.PI / 4, spacing: 9, width: 1.3, color: ink0, alpha: 0.6, seed: sd('baseH') });
      }

      // group head (above the portafilter, mostly scenery)
      {
        const gh = [[372, 236], [708, 236], [700, 404], [380, 404]];
        ink(gh, { closed: true, width: 4, fill: steel, seed: sd('gh'), smooth: false });
        L.hatch(ctx, gh, { angle: 0.02, spacing: 6, width: 1.4, color: steelDeep, alpha: 0.9, length: [14, 50], bend: 2, seed: sd('ghH'), density: (x) => sstep(560, 700, x) });
        L.crossHatch(ctx, gh, { spacing: 5, width: 1.2, color: ink0, alpha: 0.5, layers: 2, seed: sd('ghX'), density: (x) => sstep(650, 705, x) });
        const ribs = new Path2D();
        for (let i = 0; i < 5; i++) {
          const y = 262 + i * 26;
          ribs.moveTo(378, y);
          ribs.lineTo(702, y);
        }
        stroke(ctx, ribs, inkSoft, 0.8, 1.8);
        const hl = new Path2D();
        hl.moveTo(404, 244);
        hl.lineTo(406, 398);
        hl.moveTo(420, 244);
        hl.lineTo(421, 330);
        stroke(ctx, hl, P.white, 0.85, 3.5);
        // gasket shadow line
        ink([[380, 404], [700, 404]], { width: 5, seed: sd('gasket'), taper: [0, 0] });
      }

      // ---- 3 saucer, cast shadow, teaspoon -----------------------------------------------------
      {
        const under = arcPts(540, 1420, 400, 96, 0, Math.PI, 60).concat(arcPts(540, 1438, 392, 92, Math.PI, 0, 60));
        ink(under, { closed: true, width: 3, fill: P.ceramicShade, seed: sd('saucU') });
        L.hatch(ctx, under, { angle: Math.PI / 2 - 0.3, spacing: 5, width: 1.3, color: ink0, alpha: 0.7, length: [6, 18], seed: sd('saucUH'), density: (x) => 0.2 + 0.8 * sstep(560, 940, x) });
        const sauc = arcPts(540, 1420, 400, 96, 0, TAU, 120);
        ink(sauc, { closed: true, width: 5, fill: P.ceramic, seed: sd('sauc'), double: true });
        // a soft band of shade on the saucer's far right
        L.hatch(ctx, sauc, { angle: -Math.PI / 4, spacing: 9, width: 1.3, color: P.ceramicShade, alpha: 0.9, seed: sd('saucH'), density: (x, y) => sstep(0.7, 1, Math.hypot((x - 540) / 400, (y - 1420) / 96)) * sstep(500, 900, x) });
        // the well
        const well = arcPts(540, 1420, 190, 44, 0, TAU, 72);
        ink(well, { closed: true, width: 1.8, color: inkSoft, alpha: 0.9, seed: sd('well') });
        L.hatch(ctx, arcPts(540, 1420, 186, 40, Math.PI, TAU, 40).concat(arcPts(540, 1426, 180, 36, 0, -Math.PI, 40)), { angle: -Math.PI / 4 + 0.6, spacing: 6, width: 1.2, color: P.ceramicShade, alpha: 0.9, seed: sd('wellH') });
        // the cup's cast shadow, down and to the right (light from the upper left)
        ctx.save();
        ctx.beginPath();
        trace(ctx, sauc, true);
        ctx.clip();
        const csh = arcPts(615, 1432, 205, 52, 0, TAU, 60);
        L.crossHatch(ctx, csh, { spacing: 5, width: 1.3, color: ink0, alpha: 0.55, layers: 2, seed: sd('castH'), density: (x, y) => 1 - sstep(0.55, 1, Math.hypot((x - 615) / 205, (y - 1432) / 52)) });
        ctx.restore();
        // teaspoon: bowl on the saucer, handle out to (920, 1470)
        const bowl = L.ellipsePts(735, 1468, 38, 16, 40, -0.06);
        ink(bowl, { closed: true, width: 3, fill: steelLight, seed: sd('spoonB') });
        L.hatch(ctx, bowl, { angle: -Math.PI / 4, spacing: 4, width: 1.2, color: steelDeep, alpha: 0.85, seed: sd('spoonBH'), density: (x, y) => sstep(-6, 10, (x - 735) * 0.4 + (y - 1468)) });
        const stemTop = bez([770, 1462], [820, 1462], [870, 1460], [918, 1462], 16);
        const stemBot = bez([770, 1472], [820, 1474], [870, 1476], [918, 1478], 16);
        const stem = stemTop.concat(stemBot.slice().reverse());
        ink(stem, { closed: true, width: 2.6, fill: steel, seed: sd('spoonS') });
        L.hatch(ctx, stem, { angle: Math.PI / 2 - 0.2, spacing: 4, width: 1.1, color: steelDeep, alpha: 0.85, length: [4, 10], seed: sd('spoonSH'), density: (x, y) => sstep(1466, 1476, y) });
        ink(L.ellipsePts(920, 1470, 10, 8, 16), { closed: true, width: 2.4, fill: steel, seed: sd('spoonE') });
        const shl = new Path2D();
        shl.moveTo(716, 1462);
        shl.quadraticCurveTo(730, 1458, 748, 1460);
        stroke(ctx, shl, P.white, 0.95, 3);
      }

      // ---- 4 cup --------------------------------------------------------------------------------
      {
        // handle first (the body overlaps its roots)
        const hOut = offsetLine(HANDLE, -13), hIn = offsetLine(HANDLE, 13);
        const band = hOut.concat(hIn.slice().reverse());
        fillPoly(ctx, band, P.ceramic);
        L.hatch(ctx, band, { angle: -Math.PI / 4, spacing: 5, width: 1.3, color: P.ceramicShade, alpha: 1, seed: sd('handleH'), density: (x, y) => sstep(1170, 1300, y) * 0.6 + sstep(860, 920, x) });
        L.hatch(ctx, band, { angle: -Math.PI / 4 + 1.1, spacing: 6, width: 1.2, color: ink0, alpha: 0.6, seed: sd('handleX'), density: (x, y) => sstep(1250, 1310, y) });
        ink(hOut, { width: 5, seed: sd('hOut'), taper: [4, 4] });
        ink(hIn, { width: 3, seed: sd('hIn'), taper: [4, 4] });

        // body
        ink(BODY, { closed: true, width: 5, fill: P.ceramic, seed: sd('body'), double: { from: 0.05, to: 0.45 } });
        // contour hatching on the shadow half, curving with the bowl
        L.hatch(ctx, BODY, { angle: Math.PI / 2 - 0.22, spacing: 7, width: 1.5, color: P.ceramicShade, alpha: 1, length: [20, 70], bend: 4, seed: sd('bodyH'), density: (x, y) => sstep(560, 760, x + (y - 1150) * 0.25) });
        L.crossHatch(ctx, BODY, { spacing: 6, width: 1.3, color: ink0, alpha: 0.45, layers: 2, seed: sd('bodyX'), density: (x, y) => 0.9 * sstep(690, 790, x + (y - 1150) * 0.35) });
        // the lower bowl turns away from the light
        L.hatch(ctx, BODY, { angle: 0.15, spacing: 8, width: 1.3, color: P.ceramicShade, alpha: 0.9, length: [20, 60], seed: sd('bodyLow'), density: (x, y) => sstep(1300, 1400, y) });
        // highlight streak on the lit side
        const hl = new Path2D();
        hl.moveTo(334, 1170);
        hl.bezierCurveTo(336, 1240, 352, 1300, 382, 1350);
        stroke(ctx, hl, P.white, 0.95, 7);
        const hl2 = new Path2D();
        hl2.moveTo(360, 1172);
        hl2.bezierCurveTo(362, 1210, 368, 1240, 376, 1262);
        stroke(ctx, hl2, P.white, 0.8, 3);

        // rim top surface (12 px), then the inside of the cup
        const rimOut = arcPts(540, CUP.rimY, CUP.rx, CUP.ry, 0, TAU, 120);
        const rimIn = arcPts(540, CUP.rimY, RIM_IN.rx, RIM_IN.ry, 0, TAU, 120);
        fillPoly(ctx, rimOut, P.ceramic);
        fillPoly(ctx, rimIn, P.ceramic);
        ctx.save();
        ctx.beginPath();
        trace(ctx, rimIn, true);
        ctx.clip();
        // inner wall in shadow on the left (the rim blocks the light)
        L.hatch(ctx, rimIn, { angle: -Math.PI / 4, spacing: 6, width: 1.3, color: P.ceramicShade, alpha: 1, seed: sd('innerH'), density: (x) => 1 - sstep(380, 640, x) });
        L.hatch(ctx, rimIn, { angle: -Math.PI / 4 + 1.05, spacing: 7, width: 1.2, color: ink0, alpha: 0.45, seed: sd('innerX'), density: (x) => 1 - sstep(300, 470, x) });

        // the crema surface
        const c = sstep(-0.1, B_CREMA, tw); // dark to caramel
        const base = c < 1 ? L.mix(P.espresso, P.crema, 0.15 + 0.85 * c) : P.crema;
        const liq = arcPts(540, CUP.liqY, CUP.liqRx, CUP.liqRy, 0, TAU, 96);
        fillPoly(ctx, liq, base);
        ctx.save();
        ctx.beginPath();
        trace(ctx, liq, true);
        ctx.clip();
        // swirl on twos
        const swirl = 0.55 * tw;
        // tiger streaks (cremaLight spiral arcs), stronger as the crema forms
        if (c > 0.05) {
          const sp = new Path2D(), spd = new Path2D();
          for (const s of g.streaks) {
            const path = s.dark ? spd : sp;
            const a0 = s.a + swirl * (1.3 - s.d * 0.6);
            const n = 14;
            for (let i = 0; i <= n; i++) {
              const a = a0 + (s.span * i) / n;
              const d = s.d * (1 - 0.12 * (i / n));
              const x = 540 + Math.cos(a) * d * CUP.liqRx, y = CUP.liqY + Math.sin(a) * d * CUP.liqRy;
              if (i === 0) path.moveTo(x, y);
              else path.lineTo(x, y);
            }
          }
          stroke(ctx, spd, L.mix(P.crema, P.beanMedium, 0.45), 0.2 + 0.5 * c, 6);
          stroke(ctx, sp, P.cremaLight, 0.25 + 0.65 * c, 6);
          // micro-bubbles of the foam
          L.stipple(ctx, arcPts(540, CUP.liqY, CUP.liqRx - 8, CUP.liqRy - 4, 0, TAU, 48), { spacing: 10, r: [0.8, 1.6], color: P.cremaLight, alpha: 0.7 * c, seed: sd('foam', drawing(0) % 3) });
        }
        // mottling blobs: light tiger flecks, darker flecks, espresso pits
        for (const kind of [0, 1, 2]) {
          const path = new Path2D();
          for (const b of g.blobs) {
            if (b.kind !== kind) continue;
            const a = b.a + swirl * (1.4 - b.d * 0.7);
            const x = 540 + Math.cos(a) * b.d * CUP.liqRx, y = CUP.liqY + Math.sin(a) * b.d * CUP.liqRy;
            const rx = b.len * CUP.liqRx * (0.4 + 0.6 * c) * (b.kind === 1 ? 0.3 : 0.5), ry = Math.max(1.5, b.w * CUP.liqRy * (b.kind === 1 ? 1.4 : 2.2));
            const rot = Math.atan2(Math.cos(a) * CUP.liqRy, -Math.sin(a) * CUP.liqRx);
            path.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx);
            path.ellipse(x, y, rx, ry, rot, 0, TAU);
          }
          ctx.save();
          if (kind === 0) {
            ctx.fillStyle = P.cremaLight;
            ctx.globalAlpha = 0.2 + 0.7 * c;
          } else if (kind === 1) {
            ctx.fillStyle = L.mix(P.crema, P.beanMedium, 0.4);
            ctx.globalAlpha = 0.3 + 0.3 * c;
          } else {
            ctx.fillStyle = P.espresso;
            ctx.globalAlpha = 0.65 * (1 - c);
          }
          ctx.fill(path);
          ctx.restore();
        }
        // where the streams land the crema is pushed aside (dark pits while pouring)
        const pour = tw < B_CUT + 0.25 ? 1 - clamp((tw - B_CUT) / 0.25) : 0;
        if (pour > 0) {
          for (const x of [505, 575]) {
            ctx.save();
            ctx.globalAlpha = 0.85 * pour;
            ctx.fillStyle = L.mix(P.espresso, P.crema, 0.35 * c);
            ctx.beginPath();
            ctx.ellipse(x, CUP.liqY, 14, 5, 0, 0, TAU);
            ctx.fill();
            ctx.restore();
          }
        }
        // darker crema ring at the edge
        ctx.save();
        ctx.strokeStyle = L.mix(P.crema, P.beanMedium, 0.6);
        ctx.globalAlpha = 0.4 + 0.5 * c;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.ellipse(540, CUP.liqY, CUP.liqRx - 2, CUP.liqRy - 1, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
        // shadow from the rim across the far left of the surface
        L.hatch(ctx, liq, { angle: -Math.PI / 4, spacing: 6, width: 1.3, color: ink0, alpha: 0.5, seed: sd('liqH'), density: (x, y) => sstep(0.25, 0.9, -((x - 540) / CUP.liqRx) * 0.8 - ((y - CUP.liqY) / CUP.liqRy) * 0.5) });
        ctx.restore();
        ink(liq, { closed: true, width: 1.8, color: inkSoft, alpha: 0.85, seed: sd('liqL') });
        ctx.restore();
        // rim lines
        ink(rimOut, { closed: true, width: 5, seed: sd('rimOut') });
        ink(rimIn, { closed: true, width: 2.6, seed: sd('rimIn') });
        const rhl = new Path2D();
        rhl.ellipse(540, CUP.rimY, CUP.rx - 6, CUP.ry - 4, 0, 0.62 * Math.PI, 0.92 * Math.PI);
        stroke(ctx, rhl, P.white, 0.95, 3.5);
      }

      // ---- 5 portafilter -------------------------------------------------------------------------
      {
        // wooden handle off to the left
        const neck = [[388, 430], [300, 446], [300, 476], [392, 470]];
        ink(neck, { closed: true, width: 3, fill: steel, seed: sd('neck') });
        L.hatch(ctx, neck, { angle: Math.PI / 2 - 0.2, spacing: 5, width: 1.2, color: steelDeep, alpha: 0.85, seed: sd('neckH'), density: (x, y) => sstep(452, 474, y) });
        const grip = [[306, 440], [210, 452], [110, 466], [70, 474], [58, 492], [72, 510], [112, 510], [214, 494], [306, 480]];
        ink(grip, { closed: true, width: 4, fill: P.wood, seed: sd('grip') });
        L.hatch(ctx, grip, { angle: -0.14, spacing: 5, width: 1.3, color: P.barkDeep, alpha: 0.85, length: [20, 60], seed: sd('gripH'), density: (x, y) => sstep(476, 504, y + (x - 200) * -0.14) });
        const grain = new Path2D();
        grain.moveTo(290, 452);
        grain.bezierCurveTo(230, 458, 160, 466, 100, 482);
        grain.moveTo(288, 466);
        grain.bezierCurveTo(220, 474, 150, 484, 106, 494);
        stroke(ctx, grain, P.barkDeep, 0.7, 1.4);
        // ring with ears
        const ring = [[350, 404], [730, 404], [726, 446], [354, 446]];
        ink(ring, { closed: true, width: 4, fill: steelLight, seed: sd('ring'), smooth: false });
        L.hatch(ctx, ring, { angle: Math.PI / 2 - 0.3, spacing: 5, width: 1.3, color: steelDeep, alpha: 0.9, length: [8, 30], seed: sd('ringH'), density: (x) => sstep(560, 720, x) });
        for (const sgn of [-1, 1]) ink([[540 + sgn * 192, 410], [540 + sgn * 214, 414], [540 + sgn * 212, 440], [540 + sgn * 190, 440]], { closed: true, width: 2.6, fill: steel, seed: sd('ear', sgn), smooth: false });
        // basket bowl
        const bowl = [[372, 446]].concat(bez([372, 446], [372, 560], [440, 600], [540, 602], 20).slice(1)).concat(bez([540, 602], [640, 600], [708, 560], [708, 446], 20).slice(1));
        ink(bowl, { closed: true, width: 5, fill: steel, seed: sd('bowl'), double: true });
        L.hatch(ctx, bowl, { angle: Math.PI / 2 - 0.4, spacing: 6, width: 1.4, color: steelDeep, alpha: 0.95, length: [14, 50], bend: 3, seed: sd('bowlH'), density: (x) => sstep(540, 690, x) });
        L.crossHatch(ctx, bowl, { spacing: 5, width: 1.2, color: ink0, alpha: 0.5, layers: 2, seed: sd('bowlX'), density: (x, y) => sstep(620, 700, x) * sstep(470, 590, y) });
        const bhl = new Path2D();
        bhl.moveTo(400, 466);
        bhl.bezierCurveTo(402, 520, 422, 560, 460, 580);
        stroke(ctx, bhl, P.white, 0.9, 5);
        // spout stem and fork, two nozzles ending exactly on the G4 tips (505, 760) and (575, 760)
        const stem = [[516, 598], [564, 598], [562, 650], [518, 650]];
        ink(stem, { closed: true, width: 3, fill: steel, seed: sd('stem'), smooth: false });
        L.hatch(ctx, stem, { angle: 0.04, spacing: 5, width: 1.2, color: steelDeep, alpha: 0.9, length: [6, 18], seed: sd('stemH'), density: (x) => sstep(540, 562, x) });
        const fork = [[490, 646], [590, 646], [596, 676], [484, 676]];
        ink(fork, { closed: true, width: 3, fill: steelLight, seed: sd('fork'), smooth: false });
        L.hatch(ctx, fork, { angle: -Math.PI / 4, spacing: 5, width: 1.2, color: steelDeep, alpha: 0.85, seed: sd('forkH'), density: (x) => sstep(550, 596, x) });
        for (const x of [505, 575]) {
          const nz = [[x - 13, 676], [x + 13, 676], [x + 10, 760], [x - 10, 760]];
          ink(nz, { closed: true, width: 3, fill: steel, seed: sd('nozzle', x), smooth: false });
          L.hatch(ctx, nz, { angle: 0.04, spacing: 4, width: 1.2, color: steelDeep, alpha: 0.9, length: [4, 12], seed: sd('nozH', x), density: (xx) => sstep(x - 2, x + 10, xx) });
          const nh = new Path2D();
          nh.moveTo(x - 6, 682);
          nh.lineTo(x - 5, 750);
          stroke(ctx, nh, P.white, 0.85, 2.5);
          ink(L.ellipsePts(x, 760, 10, 4, 16), { closed: true, width: 2, fill: P.ink, seed: sd('tip', x), wobble: 0.2 });
        }
      }

      // ---- 6 streams --------------------------------------------------------------------------------
      {
        const k = drawing(0);
        const s = sstep(0.1, 1.45, tw); // dark to honey
        const col = s < 0.55 ? L.mix(P.espresso, P.crema, s / 0.55) : L.mix(P.crema, P.cremaLight, (s - 0.55) / 0.45 * 0.6);
        const thin = 1 - 0.42 * sstep(0.95, 1.5, tw);
        const G = 10944; // px/s2: the cut stream's top falls 342 px in 6 frames
        const cutT = tw - B_CUT;
        const yTop = cutT < 0 ? 760 : 760 + 0.5 * G * cutT * cutT;
        const yBot = CUP.liqY;
        for (const x0 of [505, 575]) {
          if (yTop < yBot - 2) {
            const Lp = [], Rp = [];
            for (let y = yTop; y <= yBot; y += 10) {
              const f = (y - 760) / (yBot - 760);
              const w = lerp(14, 9, f) * 0.5 * thin;
              const wv = 1.6 * Math.sin(y * 0.045 + k * 1.9 + x0) * (0.3 + f);
              Lp.push([x0 - w + wv, y]);
              Rp.push([x0 + w + wv, y]);
            }
            const wb = 4.5 * thin;
            Lp.push([x0 - wb, yBot]);
            Rp.push([x0 + wb, yBot]);
            const shape = Lp.concat(Rp.slice().reverse());
            fillPoly(ctx, shape, col);
            // tiger bands travelling down the stream (flat per drawing)
            ctx.save();
            ctx.beginPath();
            trace(ctx, shape, true);
            ctx.clip();
            const tb = new Path2D();
            for (let y = 760 + ((k * 23 + (x0 > 540 ? 11 : 0)) % 34); y < yBot; y += 34) {
              if (y < yTop) continue;
              tb.moveTo(x0 - 8, y);
              tb.quadraticCurveTo(x0, y + 7, x0 + 8, y + 2);
            }
            stroke(ctx, tb, s < 0.5 ? P.beanMedium : P.cremaLight, 0.7, 2.6);
            const core = new Path2D();
            core.moveTo(x0 - 1.5 * thin, Math.max(yTop, 762));
            core.lineTo(x0 - 1 * thin, yBot - 4);
            stroke(ctx, core, s < 0.5 ? P.crema : P.white, 0.75, 1.4);
            ctx.restore();
            ink(Lp, { width: 1.8, seed: sd('sL', x0, k % 3), taper: [4, 4], wobble: 0.4 });
            ink(Rp, { width: 1.8, seed: sd('sR', x0, k % 3), taper: [4, 4], wobble: 0.4 });
          }
          // last drops after the cut: two drops released from the tip, one drawing apart
          if (cutT >= 0) {
            for (let d = 1; d <= 2; d++) {
              const rel = cutT - d / 12;
              if (rel < 0) {
                // hanging at the tip, swelling
                if (d === 1 || rel > -1 / 12) {
                  const sw = clamp(1 + rel * 12);
                  ctx.save();
                  ctx.fillStyle = col;
                  ctx.beginPath();
                  ctx.ellipse(x0, 763 + 3 * sw, 3 + 2 * sw, 3 + 3 * sw, 0, 0, TAU);
                  ctx.fill();
                  ctx.restore();
                }
                continue;
              }
              const y = 766 + 0.5 * G * rel * rel;
              if (y > yBot) continue;
              const dp = [[x0, y - 13], [x0 + 5, y - 2], [x0 + 4.5, y + 3], [x0, y + 6], [x0 - 4.5, y + 3], [x0 - 5, y - 2]];
              ink(dp, { closed: true, width: 1.6, fill: col, seed: sd('drop', x0, d), taper: 0, wobble: 0.2 });
            }
          }
          // impact ripples on the crema while pouring, plus a ring for each last drop
          const pour = tw < B_CUT + 0.3 ? 1 - clamp((tw - B_CUT) / 0.3) : 0;
          for (let r = 0; r < 3; r++) {
            const ph = (t * 2.2 + r / 3 + (x0 > 540 ? 0.17 : 0)) % 1;
            const a = pour * (1 - ph);
            if (a <= 0.02) continue;
            ctx.save();
            ctx.strokeStyle = P.cremaLight;
            ctx.globalAlpha = 0.8 * a;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x0, CUP.liqY, 10 + 46 * ph, (10 + 46 * ph) * 0.26, 0, 0, TAU);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // ---- 7 steam ---------------------------------------------------------------------------------
      if (t >= B_RING) {
        const wisps = [
          { x: 566, y: 1086, len: 250, ph: 0.4, start: B_RING, w: 11 },
          { x: 498, y: 1094, len: 150, ph: 2.1, start: B_RING + 2 / 12, w: 8 },
        ];
        for (let i = 0; i < wisps.length; i++) {
          const wsp = wisps[i];
          if (tw < wsp.start) continue;
          const u = E.outCubic(clamp((tw - wsp.start + 1 / 12) / 0.375));
          const top = wsp.y - wsp.len * u;
          const pts = [];
          for (let y = wsp.y; y >= top; y -= 8) {
            const f = (wsp.y - y) / wsp.len;
            pts.push([wsp.x + (6 + 26 * f) * Math.sin(f * 5.2 + wsp.ph + tw * 3.2), y]);
          }
          if (pts.length < 3) continue;
          ink(pts, { width: wsp.w, color: P.steam, alpha: 0.8, seed: sd('steam', i, drawing(B_RING) % 4), taper: [4, 30], wobble: 1 });
          const edge = pts.map(([x, y]) => [x + wsp.w * 0.55, y]);
          ink(edge, { width: 1.4, color: inkSoft, alpha: 0.6, seed: sd('steamE', i), taper: [6, 20], wobble: 1 });
          ink(pts.map(([x, y]) => [x - wsp.w * 0.55, y]), { width: 1.1, color: inkSoft, alpha: 0.35, seed: sd('steamF', i), taper: [6, 30], wobble: 1 });
        }
      }

      // ---- 8 overlays -----------------------------------------------------------------------------------
      {
        // construction: centre axis, the G4 verticals, registration crosses on the G3 points
        const cons = new Path2D();
        cons.moveTo(540, 250);
        cons.lineTo(540, 1290);
        stroke(ctx, cons, P.inkFaint, 0.3, 1.5, [10, 8]);
        const reg = new Path2D();
        for (const [x, y] of [[290, 1080], [790, 1080], [540, 1395], [905, 1200], [140, 1420], [940, 1420]]) {
          reg.moveTo(x - 9, y);
          reg.lineTo(x + 9, y);
          reg.moveTo(x, y - 9);
          reg.lineTo(x, y + 9);
        }
        stroke(ctx, reg, P.inkFaint, 0.55, 1.5);
        L.guideCircle(ctx, 540, 1102, 300, { color: P.inkFaint, alpha: 0.22, width: 1.5, dash: [3, 7] });

        // annBlue flow arrows beside the streams (fade over 6 frames after the cut)
        const fa = t < B_CUT ? 1 : 1 - clamp((t - B_CUT) / (6 * FR));
        if (fa > 0) {
          ctx.save();
          ctx.globalAlpha = fa;
          for (const x of [462, 618]) {
            const p = new Path2D();
            p.moveTo(x, 800);
            p.lineTo(x, 990);
            stroke(ctx, p, P.annBlue, 1, 2.5, [14, 10], -t * 120);
            const ah = new Path2D();
            ah.moveTo(x - 9, 984);
            ah.lineTo(x, 1002);
            ah.lineTo(x + 9, 984);
            ah.closePath();
            ctx.fillStyle = P.annBlue;
            ctx.fill(ah);
          }
          ctx.restore();
        }

        // annYellow ring around the crema: pops on T 37.125 (3 frames, outBack) and holds
        if (t >= B_RING) {
          const u = clamp((t - B_RING) / (3 * FR) + 1 / 3);
          const k = E.outBack(u);
          ctx.save();
          ctx.strokeStyle = P.annYellow;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(540, CUP.liqY, 232 * (0.8 + 0.42 * k), 60 * (0.8 + 0.5 * k), 0, 0, TAU);
          ctx.stroke();
          // a second, thin echo expanding and fading (8 frames)
          const e = clamp((t - B_RING) / (8 * FR) + 1 / 8);
          if (e < 1) {
            ctx.globalAlpha = 1 - e;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(540, CUP.liqY, 232 * (1.22 + 0.25 * E.outExpo(e)), 60 * (1.3 + 0.4 * E.outExpo(e)), 0, 0, TAU);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    },
  });
})();
