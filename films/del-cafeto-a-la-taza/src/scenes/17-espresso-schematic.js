// 17 espresso-schematic : "Nine bar, ninety-three degrees" (schematic, global T 33.00 to 35.25, hard cut)
// Act 4 (taza) starts here.
//
// The group head and portafilter in section, centred on x 540. Hot water comes down through the group
// head and the shower screen into the tamped puck (hex lattice); a pressure gauge at (180, 420) sweeps
// to its 9-bar tick; a temperature bracket on the right marks the brew band; the two G4 spouts at
// (505, 760) and (575, 760) start to run, the streams reach the G3 cup and its liquid level rises to
// the G3 liquid surface (540, 1102), rx 232, ry 60 on the last frame. No numbers anywhere.
//
// Layers, back to front:
//   1 blueprint plate, guide circles, construction lines, registration crosses
//   2 network: node glyphs (fine grounds, crema bubbles) and their curved links
//   3 the G3 cup in lavender 60 percent: saucer, foot, body, handle, rim; the liquid filling
//   4 the group head in section: walls, bore, dispersion chamber, shower screen, gasket
//   5 the portafilter in section: basket, puck lattice (wetting), body, handle, spouts
//   6 water: schemWater dashed flow lines, glow dots where water enters the puck, flow to the spouts
//   7 G4 streams (from T 34.125), first-drop glow dots
//   8 measurement: pressure gauge, temperature bracket and column, extraction timer, brackets
//   9 magenta moments (water arrives, 9 bar reached), progress glyph (stage 3, u = p)
(function () {
  'use strict';

  const ID = 'espresso-schematic';
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
  const B_WATER = 0.375; // T 33.375 water arrives (8th)
  const B_PRESS = 1.125; // T 34.125 9 bar reached, first drops (beat)
  const B_STREAM = 1.5; // T 34.50 streams reach the cup, filling starts

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
  // helpers
  // ---------------------------------------------------------------------------
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
  function fill(ctx, path, color, alpha) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha *= alpha;
    ctx.fill(path);
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
  // boil wobble of a polyline: shifts each point a little per 12 fps drawing
  function wob(L, pts, seed, amp, bi) {
    return pts.map((p, i) => [p[0] + (L.h3(i, bi, seed) - 0.5) * 2 * amp, p[1] + (L.h3(i, bi, seed + 7) - 0.5) * 2 * amp]);
  }
  // double lavender outline (art bible 3.2): outer 2.5 px at 85 percent and inner 1.5 px at 50 percent, 9 px apart
  function dbl(ctx, L, outer, inner, bi, seed, closed = true, a = 1) {
    const P = L.pal;
    stroke(ctx, pathOf(wob(L, outer, seed, 0.6, bi), closed), P.lavender, 0.85 * a, 2.5);
    if (inner) stroke(ctx, pathOf(wob(L, inner, seed + 3, 0.6, bi), closed), P.lavender, 0.5 * a, 1.5);
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
  // G3 cup (docs/storyboard.md, Shared geometry G3)
  // ---------------------------------------------------------------------------
  const CUP = { cx: 540, rimY: 1080, rx: 250, ry: 70, footY: 1395, footRx: 160, footRy: 34, liqY: 1102, liqRx: 232, liqRy: 60 };
  // the body's left side from the rim side point (290, 1080) curving in to the foot ellipse (380, 1395)
  const SIDE_L = bez([290, 1080], [288, 1250], [338, 1372], [380, 1395], 40);
  const SIDE_R = SIDE_L.map(([x, y]) => [1080 - x, y]);
  function cupHalf(y) {
    for (let i = 1; i < SIDE_L.length; i++) {
      if (SIDE_L[i][1] >= y) {
        const a = SIDE_L[i - 1], b = SIDE_L[i];
        const u = (y - a[1]) / (b[1] - a[1] || 1);
        return 540 - lerp(a[0], b[0], u);
      }
    }
    return CUP.footRx;
  }
  const HANDLE = bez([782, 1130], [880, 1110], [930, 1200], [905, 1240], 20).concat(bez([905, 1240], [885, 1300], [800, 1310], [752, 1300], 20).slice(1));

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
      const bi = L.boil(info.T);
      const lav = P.lavender, white = P.lineWhite, water = P.schemWater, mag = P.magenta;

      const drawing = (a) => Math.floor((t - a) * 12 + 1e-6);
      const hit = (a, frames, e, lead = 1) => {
        if (t < a) return 0;
        const u = clamp((t - a) / (frames * FR) + lead / frames);
        return e ? e(u) : u;
      };

      // state
      const wTop = t < B_WATER ? 0 : E.outCubic(clamp((t - B_WATER) / 0.375 + 1 / 9)); // water down to the screen
      const wPuck = clamp((t - 0.75) / (B_PRESS - 0.75)); // water through the puck
      const press = E.inOutCubic(clamp((t - B_WATER) / (B_PRESS - B_WATER)));
      const strm = t < B_PRESS ? 0 : E.outExpo(clamp((t - B_PRESS) / (B_STREAM - B_PRESS) + 1 / 9));
      const level = t < B_STREAM ? 0 : E.outQuad(clamp((t - B_STREAM) / (dur - B_STREAM - FR)));

      // ---- 1 plate and guides ------------------------------------------------------
      L.blueprint(ctx, { center: [540, 900], seed: 1717 });
      ctx.save();
      ctx.translate(540, 900);
      ctx.rotate(4 * DEG * (t / dur));
      L.guideCircle(ctx, 0, 0, 460, { alpha: 0.13 });
      L.ticks(ctx, 0, 0, { r: 460, n: 120, len: 6, major: 10, majorLen: 15, inward: true, color: lav, alpha: 0.2, width: 1 });
      L.guideCircle(ctx, 0, 0, 640, { alpha: 0.08 });
      L.guideCircle(ctx, 0, 0, 652, { alpha: 0.1, width: 1, dash: [2, 9] });
      ctx.restore();
      L.guideCircle(ctx, 540, 1250, 330, { alpha: 0.12, dash: [6, 8] });
      {
        const cons = new Path2D();
        cons.moveTo(540, 230);
        cons.lineTo(540, 1560);
        stroke(ctx, cons, lav, 0.16, 1, [10, 8]);
        const hl = new Path2D();
        for (const y of [300, 520, 640, 760, 1102]) {
          hl.moveTo(60, y);
          hl.lineTo(1020, y);
        }
        stroke(ctx, hl, lav, 0.1, 1, [3, 7]);
        const vl = new Path2D();
        for (const x of [505, 575]) {
          vl.moveTo(x, 700);
          vl.lineTo(x, 1500);
        }
        stroke(ctx, vl, lav, 0.12, 1, [2, 6]);
        const reg = new Path2D();
        for (const [x, y] of [[505, 760], [575, 760], [290, 1080], [790, 1080], [540, 1395], [540, 1102], [280, 300], [800, 300], [390, 640], [690, 640]]) {
          reg.moveTo(x - 9, y);
          reg.lineTo(x + 9, y);
          reg.moveTo(x, y - 9);
          reg.lineTo(x, y + 9);
        }
        stroke(ctx, reg, lav, 0.4, 1.2);
      }

      // ---- 2 network ------------------------------------------------------------------
      {
        const nodes = [
          { x: 168, y: 800, from: [390, 600], c1: [300, 640], c2: [190, 700], kind: 'grounds', on: 0 },
          { x: 880, y: 860, from: [590, 740], c1: [700, 760], c2: [860, 760], kind: 'bubbles', on: B_PRESS },
          { x: 158, y: 1040, from: [292, 1150], c1: [250, 1150], c2: [170, 1140], kind: 'timer', on: B_PRESS },
        ];
        for (let k = 0; k < nodes.length; k++) {
          const n = nodes[k];
          const a = n.on === 0 ? 1 : hit(n.on, 6, E.outExpo);
          if (a <= 0) continue;
          const link = bez(n.from, n.c1, n.c2, [n.x, n.y - 56], 30);
          const cut = link.slice(0, Math.max(2, Math.round(link.length * a)));
          stroke(ctx, pathOf(cut, false), lav, 0.4, 1.2);
          ctx.beginPath();
          ctx.arc(n.from[0], n.from[1], 3.5, 0, TAU);
          ctx.fillStyle = lav;
          ctx.globalAlpha = 0.7 * a;
          ctx.fill();
          ctx.globalAlpha = 1;
          if (a < 0.6) continue;
          const na = (a - 0.6) / 0.4;
          ctx.save();
          ctx.globalAlpha = na;
          L.guideCircle(ctx, n.x, n.y, 56, { alpha: 0.75, width: 1.5 });
          L.guideCircle(ctx, n.x, n.y, 47, { alpha: 0.35, width: 1 });
          ctx.save();
          ctx.beginPath();
          ctx.arc(n.x, n.y, 45, 0, TAU);
          ctx.clip();
          if (n.kind === 'grounds') {
            L.hexLattice(ctx, null, { r: 9, alpha: 0.3, bounds: { x: n.x - 50, y: n.y - 50, w: 100, h: 100 }, seed: sd('nodeHex'), dots: 2.2 });
          } else if (n.kind === 'bubbles') {
            const rr = L.rng(sd('bub'));
            const bp = new Path2D();
            for (let i = 0; i < 22; i++) {
              const ang = rr() * TAU, d = Math.sqrt(rr()) * 38;
              const rad = rr.range(3, 9);
              const x = n.x + Math.cos(ang) * d, y = n.y + Math.sin(ang) * d - ((t * 18 + i * 7) % 12);
              bp.moveTo(x + rad, y);
              bp.arc(x, y, rad, 0, TAU);
            }
            stroke(ctx, bp, white, 0.6, 1.2);
          } else {
            // extraction timer: sweeping hand over a tick ring (25 to 30 s band marked)
            L.ticks(ctx, n.x, n.y, { r: 36, n: 30, len: 5, major: 5, majorLen: 9, inward: true, color: white, alpha: 0.6, width: 1.2 });
            L.arcAnnotation(ctx, n.x, n.y, 28, -Math.PI / 2 + TAU * (25 / 30) * 0.95, -Math.PI / 2 + TAU * 0.98, { color: lav, alpha: 0.8, width: 2, endTicks: 6 });
            const ha = -Math.PI / 2 + TAU * clamp((t - B_PRESS) / (dur - B_PRESS)) * 0.92;
            const hp = new Path2D();
            hp.moveTo(n.x, n.y);
            hp.lineTo(n.x + Math.cos(ha) * 32, n.y + Math.sin(ha) * 32);
            stroke(ctx, hp, white, 0.95, 2);
          }
          ctx.restore();
          ctx.restore();
        }
      }

      // ---- 3 the G3 cup (lavender 60 percent) ------------------------------------------
      {
        const a = 0.6 / 0.85; // dbl() draws the outer at 85 percent: scale it to 60
        // saucer and well
        const sauc = arcPts(540, 1420, 400, 96, 0, TAU, 96);
        dbl(ctx, L, sauc, arcPts(540, 1420, 391, 89, 0, TAU, 96), bi, sd('sauc'), true, a);
        stroke(ctx, pathOf(arcPts(540, 1434, 400, 96, 0.05, Math.PI - 0.05, 60), false), lav, 0.35, 1.5);
        stroke(ctx, pathOf(wob(L, arcPts(540, 1420, 190, 44, 0, TAU, 64), sd('well'), 0.5, bi)), lav, 0.45, 1.5);
        // foot
        stroke(ctx, pathOf(wob(L, arcPts(540, CUP.footY, CUP.footRx, CUP.footRy, 0, TAU, 64), sd('foot'), 0.5, bi)), lav, 0.5, 1.5);
        // body sides and the bottom of the bowl
        // left side down, the front of the foot from left to right, right side up
        const frontFix = SIDE_L.concat(arcPts(540, CUP.footY, CUP.footRx, CUP.footRy, Math.PI, 0, 40).map(([x, y]) => [x, 2 * CUP.footY - y]).slice(1)).concat(SIDE_R.slice().reverse().slice(1));
        const innerSide = frontFix.map(([x, y]) => [540 + (x - 540) * 0.95, y - 4]);
        dbl(ctx, L, frontFix, innerSide, bi, sd('body'), false, a);
        // handle loop, 26 px band
        const hOut = offsetLine(HANDLE, -13), hIn = offsetLine(HANDLE, 13);
        stroke(ctx, pathOf(wob(L, hOut, sd('hO'), 0.5, bi), false), lav, 0.6, 2.5);
        stroke(ctx, pathOf(wob(L, hIn, sd('hI'), 0.5, bi), false), lav, 0.45, 1.5);
        stroke(ctx, pathOf(HANDLE, false), lav, 0.14, 1, [4, 6]);

        // the liquid filling: level from the bottom to the G3 liquid surface
        const yL = lerp(1372, CUP.liqY, level);
        const k = (cupHalf(yL) - 18) / (cupHalf(CUP.liqY) - 18);
        const lrx = CUP.liqRx * k, lry = CUP.liqRy * k;
        if (t >= B_STREAM) {
          // liquid body clipped to the inside of the cup
          const inner = SIDE_L.map(([x, y]) => [540 + (x - 540) * 0.93, y]).concat(arcPts(540, CUP.footY - 6, CUP.footRx * 0.92, CUP.footRy * 0.9, Math.PI, 0, 30).map(([x, y]) => [x, 2 * (CUP.footY - 6) - y])).concat(SIDE_R.map(([x, y]) => [540 + (x - 540) * 0.93, y]).reverse());
          ctx.save();
          ctx.beginPath();
          trace(ctx, inner, true);
          ctx.clip();
          ctx.beginPath();
          ctx.rect(0, yL, 1080, 400);
          ctx.ellipse(540, yL, lrx, lry, 0, 0, Math.PI, true);
          ctx.clip('evenodd');
          const hl = new Path2D();
          for (let y = yL - lry; y < 1440; y += 9) {
            hl.moveTo(250, y);
            hl.lineTo(830, y);
          }
          stroke(ctx, hl, lav, 0.32, 1);
          ctx.restore();
          // the level ellipse: lineWhite, the surface glow when it lands on G3
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(540, yL, lrx, lry, 0, 0, TAU);
          ctx.fillStyle = P.navyLight;
          ctx.globalAlpha = 0.6;
          ctx.fill();
          ctx.restore();
          // the foam cap: a fine bubble lattice on the surface, thickening as the cup fills
          L.hexLattice(ctx, arcPts(540, yL, lrx - 4, lry - 2, 0, TAU, 48), { r: 7, alpha: 0.12 + 0.2 * level, seed: sd('foam'), jitter: 1.4 });
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(540, yL, lrx, lry, 0, 0, TAU);
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = white;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
          // ripple rings where the streams land
          for (const x of [505, 575]) {
            for (let r = 0; r < 2; r++) {
              const ph = ((t * 2.4 + r * 0.5 + (x > 540 ? 0.25 : 0)) % 1);
              ctx.save();
              ctx.strokeStyle = white;
              ctx.globalAlpha = 0.55 * (1 - ph);
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.ellipse(x, yL, 8 + 34 * ph * k, (8 + 34 * ph * k) * (lry / lrx), 0, 0, TAU);
              ctx.stroke();
              ctx.restore();
            }
          }
        } else {
          stroke(ctx, pathOf(arcPts(540, CUP.liqY, CUP.liqRx, CUP.liqRy, 0, TAU, 64)), lav, 0.28, 1.2, [6, 7]);
        }
        // rim, 12 px thick
        dbl(ctx, L, arcPts(540, CUP.rimY, CUP.rx, CUP.ry, 0, TAU, 96), null, bi, sd('rim'), true, a);
        stroke(ctx, pathOf(wob(L, arcPts(540, CUP.rimY, CUP.rx - 12, CUP.ry - 9, 0, TAU, 96), sd('rimIn'), 0.5, bi)), lav, 0.45, 1.5);
        // brackets: the cup height and the liquid surface width (no numbers)
        L.bracket(ctx, 250, 1080, 250, 1395, { alpha: 0.4, cap: 12, width: 1.2, offset: 0 });
        L.bracket(ctx, 308, 1196, 772, 1196, { alpha: 0.32 * (t >= B_STREAM ? 1 : 0.5), cap: 10, width: 1.2 });
      }

      // ---- 4 group head in section ------------------------------------------------------
      const GH = { x0: 280, x1: 800, y0: 300, y1: 520 };
      {
        const outer = L.rrectPts(GH.x0, GH.y0, GH.x1 - GH.x0, GH.y1 - GH.y0, 22, 12);
        const inner = L.rrectPts(GH.x0 + 9, GH.y0 + 9, GH.x1 - GH.x0 - 18, GH.y1 - GH.y0 - 18, 15, 12);
        // section hatch in the solid metal (outer shape minus the bore and the dispersion chamber)
        const bore = [[518, GH.y0 - 60], [562, GH.y0 - 60], [562, 470], [518, 470]];
        const chamber = L.rrectPts(352, 466, 376, 40, 10, 12);
        ctx.save();
        ctx.beginPath();
        trace(ctx, outer, true);
        trace(ctx, bore, true);
        trace(ctx, chamber, true);
        ctx.clip('evenodd');
        const sh = new Path2D();
        for (let k = -600; k < 700; k += 12) {
          sh.moveTo(GH.x0 + k, GH.y1);
          sh.lineTo(GH.x0 + k + 240, GH.y0 - 20);
        }
        stroke(ctx, sh, lav, 0.14, 1);
        ctx.restore();
        dbl(ctx, L, outer, inner, bi, sd('gh'));
        // inlet pipe from the top (boiler) and the valve block
        dbl(ctx, L, [[518, 230], [518, GH.y0 + 4]], null, bi, sd('bL'), false);
        dbl(ctx, L, [[562, 230], [562, GH.y0 + 4]], null, bi, sd('bR'), false);
        stroke(ctx, pathOf(wob(L, bore.slice(1, 3).concat([]), sd('boreR'), 0.5, bi), false), lav, 0.5, 1.5);
        stroke(ctx, pathOf(wob(L, [bore[0], bore[3]], sd('boreL'), 0.5, bi), false), lav, 0.5, 1.5);
        dbl(ctx, L, L.rrectPts(470, 232, 140, 40, 8, 10), null, bi, sd('valve'));
        stroke(ctx, pathOf(L.rrectPts(484, 242, 112, 20, 5, 10)), lav, 0.35, 1);
        // dispersion chamber and its plate holes
        stroke(ctx, pathOf(wob(L, chamber, sd('ch'), 0.5, bi)), lav, 0.6, 1.5);
        const holes = new Path2D();
        for (let x = 372; x <= 708; x += 24) {
          holes.moveTo(x, 466);
          holes.lineTo(x, 456);
        }
        stroke(ctx, holes, lav, 0.4, 1);
        // shower screen at y 520: a line with a row of perforations
        stroke(ctx, pathOf(wob(L, [[360, 520], [720, 520]], sd('screen'), 0.4, bi), false), white, 0.75, 1.8);
        const perf = new Path2D();
        for (let x = 368; x <= 712; x += 8) {
          perf.moveTo(x + 1.2, 514);
          perf.arc(x, 514, 1.2, 0, TAU);
        }
        fill(ctx, perf, lav, 0.6);
        // gasket blocks
        for (const x of [344, 704]) {
          const gk = L.rrectPts(x, 506, 32, 16, 4, 6);
          fill(ctx, pathOf(gk), lav, 0.25);
          stroke(ctx, pathOf(gk), lav, 0.6, 1.2);
        }
        // fixing bolts
        for (const x of [312, 768]) {
          L.guideCircle(ctx, x, 340, 10, { alpha: 0.6, width: 1.2, cross: 6 });
        }
      }

      // ---- 5 portafilter in section ------------------------------------------------------
      {
        // body outline: ears at the gasket, walls down, funnel into the spout block
        const outer = [[338, 522], [338, 640], [356, 676], [420, 700], [496, 704], [496, 716], [584, 716], [584, 704], [660, 700], [724, 676], [742, 640], [742, 522]];
        const inner = [[347, 528], [347, 636], [362, 668], [422, 691], [500, 695], [580, 695], [658, 691], [718, 668], [733, 636], [733, 528]];
        // basket: thin wall around the puck with a perforated floor at y 650
        const basket = [[382, 522], [384, 652], [696, 652], [698, 522]];
        ctx.save();
        ctx.beginPath();
        trace(ctx, outer, true);
        ctx.clip();
        ctx.beginPath();
        trace(ctx, basket, true);
        ctx.rect(400, 652, 280, 40);
        ctx.rect(0, 0, 1080, 1920);
        ctx.clip('evenodd');
        const sh = new Path2D();
        for (let k = -400; k < 600; k += 12) {
          sh.moveTo(338 + k, 716);
          sh.lineTo(338 + k + 200, 500);
        }
        stroke(ctx, sh, lav, 0.14, 1);
        ctx.restore();
        dbl(ctx, L, outer, inner, bi, sd('pf'), false);
        stroke(ctx, pathOf(wob(L, basket, sd('basket'), 0.4, bi), false), lav, 0.75, 1.8);
        const floor = new Path2D();
        for (let x = 392; x < 690; x += 10) {
          floor.moveTo(x, 652);
          floor.lineTo(x + 6, 652);
        }
        stroke(ctx, floor, white, 0.7, 1.6);
        // handle off to the left (to x 110)
        const hTop = [[338, 572], [250, 586], [160, 598], [116, 604]], hBot = [[338, 612], [250, 620], [160, 632], [116, 638]];
        dbl(ctx, L, hTop, null, bi, sd('hT'), false);
        dbl(ctx, L, hBot, null, bi, sd('hB'), false);
        stroke(ctx, pathOf(wob(L, arcPts(116, 621, 12, 17, Math.PI / 2, Math.PI * 1.5, 12), sd('hE'), 0.4, bi), false), lav, 0.85, 2.5);
        stroke(ctx, pathOf([[300, 598], [128, 621]], false), lav, 0.18, 1, [5, 6]);
        // the two spouts down to the G4 tips (505, 760) and (575, 760)
        for (const [sx, tx] of [[516, 505], [564, 575]]) {
          const sp = [[sx - 10, 716], [tx - 9, 758], [tx + 9, 758], [sx + 10, 716]];
          dbl(ctx, L, sp, null, bi, sd('spout', tx), false);
          stroke(ctx, pathOf(arcPts(tx, 759, 9, 3, 0, TAU, 16)), lav, 0.8, 1.5);
        }
        // the puck: hex lattice, wetting as the water front passes
        const puck = [[390, 530], [690, 530], [690, 640], [390, 640]];
        const wetY = 530 + 110 * wPuck;
        L.hexLattice(ctx, puck, {
          r: 14,
          alpha: 0.38,
          seed: sd('puck'),
          cellFn: (cx, cy) => (wPuck > 0 && cy < wetY ? { fill: water, alpha: 0.16 } : true),
        });
        dbl(ctx, L, puck, [[399, 539], [681, 539], [681, 631], [399, 631]], bi, sd('puckO'));
        // tamped-flat bracket on the puck (thickness)
        L.bracket(ctx, 372, 530, 372, 640, { style: 'square', cap: 8, alpha: 0.6, width: 1.5 });
      }

      // ---- 6 water ---------------------------------------------------------------------
      if (wTop > 0) {
        const xs = [];
        for (let i = 0; i < 8; i++) xs.push(410 + i * 37);
        const yFront = lerp(286, 528, wTop);
        const fl = new Path2D();
        for (const x of xs) {
          // from the bore, the water spreads through the chamber to eight parallel lines
          fl.moveTo(540, 240);
          fl.lineTo(540, 300);
          fl.moveTo(x, 300);
          fl.lineTo(x, yFront);
        }
        stroke(ctx, fl, water, 0.9, 2, [12, 8], -t * 140);
        // spread bar in the chamber
        if (yFront > 470) stroke(ctx, pathOf([[410, 486], [669, 486]], false), water, 0.6, 2, [6, 6], -t * 80);
        // arrowheads at the front
        const ah = new Path2D();
        for (const x of xs) {
          const y = Math.min(yFront, 528);
          ah.moveTo(x - 6, y - 9);
          ah.lineTo(x, y);
          ah.lineTo(x + 6, y - 9);
        }
        stroke(ctx, ah, water, 1, 2);
        // inside the puck: thin wavering paths as the front soaks down
        if (wPuck > 0) {
          const pp = new Path2D();
          for (const x of xs) {
            pp.moveTo(x, 532);
            const yEnd = 532 + 106 * wPuck;
            for (let y = 532; y <= yEnd; y += 6) pp.lineTo(x + 5 * Math.sin(y * 0.11 + x), y);
          }
          stroke(ctx, pp, water, 0.75, 1.5, [4, 4], -t * 60);
          // glow dots where the water enters the puck
          for (let i = 0; i < xs.length; i++) {
            const tw = 0.7 + 0.3 * Math.sin(t * 9 + i * 1.3);
            L.glowDot(ctx, xs[i], 531, 4.5 * tw, { color: water, rays: 0, glow: 4, intensity: 0.75 });
          }
        }
        // below the puck: converging flow to the spouts
        if (t >= B_PRESS - 3 * FR) {
          const cv = new Path2D();
          for (const x of xs) {
            const tx = x < 540 ? 505 : 575;
            cv.moveTo(x, 656);
            cv.quadraticCurveTo(x, 688, tx, 712);
            cv.lineTo(tx, 752);
          }
          stroke(ctx, cv, white, 0.55, 1.2, [5, 6], -t * 90);
        }
      }

      // ---- 7 G4 streams ----------------------------------------------------------------
      if (t >= B_PRESS) {
        const yL = lerp(1372, CUP.liqY, level);
        const yEnd = lerp(760, yL, strm);
        for (const x of [505, 575]) {
          const len = Math.max(0, yEnd - 760);
          const wAt = (y) => lerp(14, 9, clamp((y - 760) / (CUP.liqY - 760))) / 2;
          if (len > 2) {
            const L0 = [], R0 = [];
            for (let y = 760; y <= yEnd; y += 12) {
              const w = wAt(y);
              L0.push([x - w, y]);
              R0.push([x + w, y]);
            }
            L0.push([x - wAt(yEnd), yEnd]);
            R0.push([x + wAt(yEnd), yEnd]);
            const shape = L0.concat(R0.reverse());
            fill(ctx, pathOf(shape), lav, 0.3);
            stroke(ctx, pathOf(wob(L, L0, sd('sl', x), 0.5, bi), false), white, 0.9, 1.5);
            stroke(ctx, pathOf(wob(L, R0, sd('sr', x), 0.5, bi), false), white, 0.9, 1.5);
            const core = new Path2D();
            core.moveTo(x, 762);
            core.lineTo(x, yEnd);
            stroke(ctx, core, white, 0.8, 1.2, [10, 12], -t * 220);
          }
          // first drops: glow dot at the tip, popping on the beat
          const dk = hit(B_PRESS, 6, E.outBack);
          L.glowDot(ctx, x, 762, 5 + 3 * dk * (1 - clamp((t - B_PRESS) / 0.5)), { color: P.glow, rays: 8, rayLen: 2.6, glow: 4, intensity: 0.85, seed: sd('drop', x) });
          if (strm < 1) L.glowDot(ctx, x, yEnd, 4, { color: P.glow, rays: 0, glow: 3, intensity: 0.7 });
        }
      }

      // ---- 8 measurement -----------------------------------------------------------------
      // the fall of the streams: a tick ruler on the left and a bracket on the right
      {
        const rk = hit(B_PRESS, 6, E.outExpo);
        L.ticks(ctx, 466, 760, { length: CUP.liqY - 760, angle: Math.PI / 2, n: 19, len: 7, major: 3, majorLen: 14, side: -1, color: lav, alpha: 0.4, width: 1.2, p: 0.25 + 0.75 * rk });
        if (rk > 0) L.bracket(ctx, 612, 760, 612, CUP.liqY, { alpha: 0.5 * rk, cap: 12, width: 1.2, p: rk });
        // a pressure tick ring around the group head, brightening with the pressure
        L.ticks(ctx, 540, 410, { r: 300, n: 72, len: 8, start: -168 * DEG, span: 156 * DEG, major: 6, majorLen: 16, color: lav, alpha: 0.18 + 0.32 * press, width: 1.2 });
        L.arcAnnotation(ctx, 540, 410, 286, -168 * DEG, (-168 + 156 * press) * DEG, { color: water, alpha: 0.35, width: 1.5, endTicks: 0 });
      }
      // pressure gauge at (180, 420), radius 70
      {
        const gx = 180, gy = 420;
        const angOf = (bar) => (135 + (bar / 12) * 270) * DEG;
        dbl(ctx, L, arcPts(gx, gy, 70, 70, 0, TAU, 72), arcPts(gx, gy, 61, 61, 0, TAU, 72), bi, sd('gauge'));
        L.ticks(ctx, gx, gy, { r: 58, n: 48, len: 5, start: angOf(0), span: 270 * DEG, major: 4, majorLen: 11, inward: true, color: white, alpha: 0.6, width: 1.5 });
        // last tick at 12 (span covers 0..12 exclusive), draw it
        const tk = new Path2D();
        tk.moveTo(gx + Math.cos(angOf(12)) * 58, gy + Math.sin(angOf(12)) * 58);
        tk.lineTo(gx + Math.cos(angOf(12)) * 47, gy + Math.sin(angOf(12)) * 47);
        stroke(ctx, tk, white, 0.6, 1.5);
        // brew band 8 to 10 and the marked 9-bar tick
        L.arcAnnotation(ctx, gx, gy, 42, angOf(8), angOf(10), { color: lav, alpha: 0.75, width: 3, endTicks: 0 });
        const a9 = angOf(9);
        const m9 = new Path2D();
        m9.moveTo(gx + Math.cos(a9) * 64, gy + Math.sin(a9) * 64);
        m9.lineTo(gx + Math.cos(a9) * 40, gy + Math.sin(a9) * 40);
        stroke(ctx, m9, white, 1, 2.5);
        const tri = new Path2D();
        const ox = gx + Math.cos(a9) * 76, oy = gy + Math.sin(a9) * 76;
        const nx = Math.cos(a9), ny = Math.sin(a9);
        tri.moveTo(ox - nx * 4, oy - ny * 4);
        tri.lineTo(ox + nx * 8 - ny * 6, oy + ny * 8 + nx * 6);
        tri.lineTo(ox + nx * 8 + ny * 6, oy + ny * 8 - nx * 6);
        tri.closePath();
        fill(ctx, tri, white, 0.9);
        // the needle: 0 to 9 bar from T 33.375 to T 34.125 (inOutCubic), pump pulse after
        const pulse = t > B_PRESS ? 0.12 * Math.sin(t * 40) : 0;
        const na = angOf(9 * press + pulse);
        const nd = new Path2D();
        nd.moveTo(gx - Math.cos(na) * 12, gy - Math.sin(na) * 12);
        nd.lineTo(gx + Math.cos(na) * 52, gy + Math.sin(na) * 52);
        stroke(ctx, nd, white, 1, 2.5);
        L.glowDot(ctx, gx, gy, 5, { rays: 0, glow: 3, intensity: 0.7 });
        // swept arc behind the needle
        if (press > 0) L.arcAnnotation(ctx, gx, gy, 30, angOf(0), na, { color: water, alpha: 0.6, width: 2, endTicks: 0 });
        // pipe to the group head
        stroke(ctx, pathOf([[gx + 70, gy], [GH.x0, gy]], false), lav, 0.6, 1.5);
        stroke(ctx, pathOf([[gx + 70, gy + 9], [GH.x0, gy + 9]], false), lav, 0.35, 1);
        if (press > 0) stroke(ctx, pathOf([[gx + 72, gy + 4.5], [GH.x0 - 2, gy + 4.5]], false), water, 0.8, 1.5, [5, 5], -t * 60);
        // the gauge's own bracket (radius)
        L.bracket(ctx, gx - 70, gy + 96, gx + 70, gy + 96, { alpha: 0.4, cap: 10, width: 1.2 });
      }
      // temperature: a column and a bracket on the right (x 900), the 90 to 96 band and the 93 tick
      {
        const bx = 900, y0 = 384, y1 = 650;
        const cx = 852;
        dbl(ctx, L, L.rrectPts(cx - 9, y0, 18, y1 - y0 - 14, 9, 8), null, bi, sd('therm'));
        dbl(ctx, L, arcPts(cx, y1, 16, 16, 0, TAU, 32), null, bi, sd('bulb'));
        const tLevel = lerp(0.18, 0.62, E.outCubic(clamp((t - B_WATER) / 0.75)));
        const yT = lerp(y1 - 14, y0 + 6, tLevel);
        fill(ctx, pathOf(L.rrectPts(cx - 4, yT, 8, y1 - yT, 4, 6)), water, 0.75);
        fill(ctx, pathOf(arcPts(cx, y1, 10, 10, 0, TAU, 24)), water, 0.75);
        L.bracket(ctx, bx, y0, bx, y1, { style: 'square', cap: 16, alpha: 0.6, width: 1.5 });
        L.ticks(ctx, bx, y0, { length: y1 - y0, angle: Math.PI / 2, n: 20, len: 8, major: 5, majorLen: 16, side: 1, baseline: false, color: white, alpha: 0.55, width: 1.5 });
        // brew band and the marked tick (93 sits at 62 percent of the column)
        const yB0 = lerp(y1 - 14, y0 + 6, 0.56), yB1 = lerp(y1 - 14, y0 + 6, 0.68);
        L.bracket(ctx, 924, yB1, 924, yB0, { style: 'square', cap: 8, alpha: 0.75, width: 1.5 });
        const y93 = lerp(y1 - 14, y0 + 6, 0.62);
        const mk = new Path2D();
        mk.moveTo(868, y93);
        mk.lineTo(918, y93);
        stroke(ctx, mk, white, 1, 2.5);
        const tri = new Path2D();
        tri.moveTo(936, y93);
        tri.lineTo(928, y93 - 6);
        tri.lineTo(928, y93 + 6);
        tri.closePath();
        fill(ctx, tri, white, 0.9);
        stroke(ctx, pathOf([[GH.x1, 440], [cx - 9, 440]], false), lav, 0.4, 1, [4, 5]);
      }

      // ---- 9 magenta moments and the progress glyph -----------------------------------
      {
        // water arrives at the shower screen (8 frames)
        const ws = clamp((t - (B_WATER + 0.375)) / (8 * FR) + 1 / 8);
        if (t >= B_WATER + 0.375 && ws < 1) {
          stroke(ctx, pathOf([[360, 521], [720, 521]], false), mag, 1 - ws, 3);
        }
        // 9 bar reached (12 frames): a ring on the gauge, a flash on the marked tick
        if (t >= B_PRESS) {
          const u = clamp((t - B_PRESS) / (12 * FR) + 1 / 12);
          if (u < 1) {
            ctx.save();
            ctx.strokeStyle = mag;
            ctx.globalAlpha = 1 - u * u;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(180, 420, 74 + 40 * E.outExpo(u), 0, TAU);
            ctx.stroke();
            const a9 = (135 + 202.5) * DEG;
            ctx.beginPath();
            ctx.moveTo(180 + Math.cos(a9) * 66, 420 + Math.sin(a9) * 66);
            ctx.lineTo(180 + Math.cos(a9) * 38, 420 + Math.sin(a9) * 38);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      progressGlyph(ctx, L, 3, info.p, info.T, false);
    },
  });
})();
