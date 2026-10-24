// 21 bean-loop : Back to the seed.  T 42.75 to 45.00 (54 frames), schematic, hard cut from 20.
// A near-duplicate of 02's finished frame, fully drawn on frame 0: the G2 cherry guide oval, the G1 bean
// (double outline, crease, endosperm lattice, embryo), the three network nodes with their lines, the bracket
// and tick scales, and the progress glyph with all four arcs lit. The G1 construction block, the node glyphs
// and every wobble seed are copied from 02 (seeded from 02's id) so the drawing matches it line for line.
// The wordmark `café` (the film's only text) fades in at T 43.50; the embryo pulses at T 44.25; then the
// network, measurement, lattice, construction, glyph and wordmark fade out, leaving only the G2 oval (which
// firms up into a cherry outline with its calyx and gloss) around the G1 bean outline, so the loop seam into
// 01 frame 0 (the inked cherry on G2) reads as a match cut.
//
// Layers, back to front:
//   1 lib.blueprint (as 02)
//   2 guide geometry (as 02's finished frame), fading on the last beat except the r 420 circle
//   3 G2 cherry oval, brightening into the loop seam
//   4 measurement: bracket x 790, tick scales (fade)
//   5 the G1 bean: lattice (fades), double outline, crease, embryo outline
//   6 network nodes (fade)
//   7 embryo glow (pulse at T 44.25, then fades)
//   8 progress glyph (allLit) and the wordmark
(function () {
  'use strict';

  const ID = 'bean-loop';
  const REF = 'bean-blueprint'; // every seed comes from 02 so the wobble and lattice match its frame
  const LIB = FILM.lib;
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const FR = 1 / 24;

  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => {
    const u = clamp((x - a) / (b - a));
    return u * u * (3 - 2 * u);
  };
  const sd = (...k) => LIB.hash(REF, ...k) & 0x7fffffff;
  void ID;
  // ===========================================================================
  // G1 BEAN CONSTRUCTION — canonical (docs/storyboard.md, Shared geometry G1).
  // Self-contained: copy this whole block to draw G1 on the same pixels (21 does).
  //   Upright superellipse |dx/170|^2.3 + |dy/240|^2.3 = 1 about (540, 900), 96 points from the top end
  //   running clockwise, top end 6 percent narrower (dx *= 1 - 0.06 * (1 - dy/240) / 2), then rotated
  //   -15 degrees (top leans left) about (540, 900).
  //   g1Outline(inset, scale)  closed outline; inset shrinks both radii (the 9 px inner line uses inset 9);
  //                            scale scales about (540, 900) (1 = G1)
  //   g1Crease()               crease centreline, smooth, top to bottom (rotated)
  //   g1CreaseWidth(u)         groove width along it: 12 px, tapering to 3 px at both ends
  //   g1Silverskin()           the silverskin line inside the groove, (546, 700) to (538, 1100) before rotation
  //   G1_EMBRYO                embryo centre, (548, 1110) before rotation -> (602, 1101)
  //   g1Rot(x, y) / g1Unrot(x, y)  rotate a pre-rotation point onto the frame, and back
  // ===========================================================================
  const G1 = { cx: 540, cy: 900, a: 170, b: 240, n: 2.3, taper: 0.06, rot: -15 * Math.PI / 180, N: 96 };
  const G1_COS = Math.cos(G1.rot), G1_SIN = Math.sin(G1.rot);
  function g1Rot(x, y) {
    const dx = x - G1.cx, dy = y - G1.cy;
    return [G1.cx + dx * G1_COS - dy * G1_SIN, G1.cy + dx * G1_SIN + dy * G1_COS];
  }
  function g1Unrot(x, y) {
    const dx = x - G1.cx, dy = y - G1.cy;
    return [G1.cx + dx * G1_COS + dy * G1_SIN, G1.cy - dx * G1_SIN + dy * G1_COS];
  }
  // half-width of the upright bean at height dy (pre-rotation, dy in -240..240), with the top taper
  function g1HalfWidth(dy, inset) {
    const a = G1.a - (inset || 0), b = G1.b - (inset || 0);
    const v = Math.min(1, Math.abs(dy) / b);
    const w = a * Math.pow(Math.max(0, 1 - Math.pow(v, G1.n)), 1 / G1.n);
    return w * (1 - (G1.taper * (1 - dy / G1.b)) / 2);
  }
  function g1Outline(inset, scale) {
    const a = G1.a - (inset || 0), b = G1.b - (inset || 0), s = scale || 1, e = 2 / G1.n;
    const out = [];
    for (let i = 0; i < G1.N; i++) {
      const th = -Math.PI / 2 + (i / G1.N) * Math.PI * 2;
      const c = Math.cos(th), sn = Math.sin(th);
      let dx = a * Math.sign(c) * Math.pow(Math.abs(c), e);
      const dy = b * Math.sign(sn) * Math.pow(Math.abs(sn), e);
      dx *= 1 - (G1.taper * (1 - dy / G1.b)) / 2;
      const p = g1Rot(G1.cx + dx * s, G1.cy + dy * s);
      out.push(p);
    }
    return out;
  }
  const G1_CREASE_RAW = [[548, 682], [531, 750], [536, 826], [552, 900], [547, 976], [530, 1052], [538, 1118]];
  function g1Crease() {
    return LIB.smoothPts(G1_CREASE_RAW.map((p) => g1Rot(p[0], p[1])), false, 5);
  }
  const g1CreaseWidth = (u) => 3 + 9 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.55);
  function g1Silverskin() {
    // the crease centreline between y 700 and 1100 (pre-rotation), nudged to the listed end points
    const raw = LIB.smoothPts(G1_CREASE_RAW, false, 5).filter((p) => p[1] >= 700 && p[1] <= 1100);
    raw[0] = [546, 700];
    raw[raw.length - 1] = [538, 1100];
    return raw.map((p) => g1Rot(p[0], p[1]));
  }
  const G1_EMBRYO = g1Rot(548, 1110);
  // ===================== end of the G1 construction block =====================

  // G2 cherry guide oval
  const G2 = { x: 540, y: 900, rx: 260, ry: 290 };

  // network nodes (100 px glyphs)
  const NODES = [
    { x: 180, y: 520, kind: 'cells' },
    { x: 180, y: 1340, kind: 'seedling' },
    { x: 880, y: 1340, kind: 'water' },
  ];


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
  // drawing helpers
  // ---------------------------------------------------------------------------

  function wobPts(L, pts, seed, amp, bi, closed) {
    const n = pts.length;
    const out = new Array(n);
    let s = 0;
    const sdv = (seed + bi * 7919) | 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (i > 0) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      const a = pts[i > 0 ? i - 1 : closed ? n - 1 : 0], b = pts[i < n - 1 ? i + 1 : closed ? 0 : n - 1];
      const tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      const d = amp * L.noise1(s * 0.018, sdv);
      out[i] = [p[0] - (ty / tl) * d, p[1] + (tx / tl) * d];
    }
    // keep a closed loop closed: blend the last points back onto the first
    if (closed && n > 8) {
      for (let k = 0; k < 6; k++) {
        const w = (6 - k) / 7;
        const j = n - 1 - k;
        out[j] = [lerp(out[j][0], pts[j][0] + (out[0][0] - pts[0][0]), w), lerp(out[j][1], pts[j][1] + (out[0][1] - pts[0][1]), w)];
      }
    }
    return out;
  }

  function addPoly(path, pts, closed) {
    if (pts.length < 2) return;
    path.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
    if (closed) path.closePath();
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

  function cumLen(pts, closed) {
    const c = new Float64Array(pts.length + 1);
    for (let i = 1; i <= pts.length; i++) {
      const a = pts[i - 1], b = pts[i % pts.length];
      c[i] = c[i - 1] + (i < pts.length || closed ? Math.hypot(b[0] - a[0], b[1] - a[1]) : 0);
    }
    return c;
  }

  // the first `frac` of a polyline (closed loops include the closing segment)
  function slicePts(pts, frac, closed) {
    const c = cumLen(pts, closed);
    const total = c[closed ? pts.length : pts.length - 1];
    const want = total * clamp(frac);
    const out = [pts[0]];
    const m = closed ? pts.length : pts.length - 1;
    for (let i = 1; i <= m; i++) {
      const b = pts[i % pts.length];
      if (c[i] <= want) out.push(b);
      else {
        const a = pts[i - 1];
        const u = (want - c[i - 1]) / (c[i] - c[i - 1] || 1);
        out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
        break;
      }
    }
    return out;
  }

  function pointAt(pts, frac) {
    const s = slicePts(pts, frac, false);
    return s[s.length - 1];
  }

  function ovalPts(cx, cy, rx, ry, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * TAU;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // geometry, built once (t-independent)
  // ---------------------------------------------------------------------------

  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const outer = g1Outline(0, 1);
    const inner = g1Outline(9, 1);
    const crease = g1Crease();
    const ccum = cumLen(crease, false);
    const silver = g1Silverskin();
    const outerPath = new Path2D();
    addPoly(outerPath, outer, true);
    const innerPath = new Path2D();
    addPoly(innerPath, inner, true);

    // endosperm lattice: rows every 12 px, meridians every 18 px at the waist (curving with the dome)
    const rows = [];
    for (let y = G1.cy - G1.b + 12; y < G1.cy + G1.b - 4; y += 12) {
      const dy = y - G1.cy;
      const w = g1HalfWidth(dy, 10);
      if (w < 6) continue;
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const x = G1.cx - w + (k / 12) * 2 * w;
        // rows bow a little downward across the dome, like latitudes seen slightly from above
        const bow = 4 * (1 - Math.pow((x - G1.cx) / w, 2));
        pts.push(g1Rot(x, y + bow));
      }
      rows.push({ y, pts });
    }
    const merid = [];
    for (let k = -9; k <= 9; k++) {
      const u = (k * 18) / 160;
      if (Math.abs(u) >= 0.98) continue;
      const pts = [];
      for (let y = G1.cy - G1.b + 6; y <= G1.cy + G1.b - 6; y += 8) {
        const dy = y - G1.cy;
        const w = g1HalfWidth(dy, 10);
        const x = G1.cx + u * w;
        const bow = 4 * (1 - u * u);
        pts.push(g1Rot(x, y + bow));
      }
      merid.push(pts);
    }
    // cell nuclei: a dot in about one cell in five, away from the crease
    const r = LIB.rng(sd('nuclei'));
    const nuclei = [];
    for (let y = G1.cy - G1.b + 18; y < G1.cy + G1.b - 12; y += 12) {
      const dy = y - G1.cy;
      const w = g1HalfWidth(dy, 16);
      for (let k = -9; k <= 9; k++) {
        const u = ((k + 0.5) * 18) / 160;
        if (Math.abs(u) > 0.92 || r() > 0.22) continue;
        const x = G1.cx + u * w;
        if (Math.abs(x - G1.cx) < 18) continue;
        nuclei.push({ p: g1Rot(x + r.range(-3, 3), y + 6 + r.range(-2, 2)), y, s: r.range(1.2, 2) });
      }
    }
    // embryo: a small comma near the bottom tip, beside the crease end
    const emb = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TAU;
      const rr = 1 + 0.18 * Math.cos(a - 0.6);
      emb.push(g1Rot(548 + Math.cos(a) * 26 * rr, 1110 + Math.sin(a) * 15 * rr));
    }
    // construction box around the upright bean
    const box = [[370, 660], [710, 660], [710, 1140], [370, 1140]].map((p) => g1Rot(p[0], p[1]));
    // spark path: down the guide oval's left side, then in to the bean's top end
    const top = outer[0];
    const sparkPts = [];
    for (let i = 0; i <= 18; i++) {
      const a = (-90 - (i / 18) * 34) * DEG;
      sparkPts.push([G2.x + Math.cos(a) * G2.rx, G2.y + Math.sin(a) * G2.ry]);
    }
    const s0 = sparkPts[sparkPts.length - 1];
    const ctrl = [s0[0] + 40, s0[1] + 80];
    for (let i = 1; i <= 12; i++) {
      const u = i / 12, v = 1 - u;
      sparkPts.push([v * v * s0[0] + 2 * v * u * ctrl[0] + u * u * top[0], v * v * s0[1] + 2 * v * u * ctrl[1] + u * u * top[1]]);
    }
    // network: from the outline point nearest each node, a curved line out to the node rim
    const net = NODES.map((nd, i) => {
      let best = 0, bd = Infinity;
      for (let k = 0; k < outer.length; k++) {
        const d = Math.hypot(outer[k][0] - nd.x, outer[k][1] - nd.y);
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      const s = outer[best];
      const dx = nd.x - s[0], dy = nd.y - s[1];
      const l = Math.hypot(dx, dy);
      const e = [nd.x - (dx / l) * 56, nd.y - (dy / l) * 56];
      const bow = i === 0 ? -90 : i === 1 ? 80 : -80;
      const c = [(s[0] + e[0]) / 2 - (dy / l) * bow, (s[1] + e[1]) / 2 + (dx / l) * bow];
      const pts = [];
      for (let k = 0; k <= 40; k++) {
        const u = k / 40, v = 1 - u;
        pts.push([v * v * s[0] + 2 * v * u * c[0] + u * u * e[0], v * v * s[1] + 2 * v * u * c[1] + u * u * e[1]]);
      }
      return { s, e, pts };
    });
    GEO = { outer, inner, crease, ccum, silver, outerPath, innerPath, rows, merid, nuclei, emb, box, sparkPts, net };
    return GEO;
  }

  // ---------------------------------------------------------------------------
  // node glyphs, drawn about (0, 0), 100 px across
  // ---------------------------------------------------------------------------

  function drawNode(ctx, L, P, nd, k, bi, alpha) {
    const lav = P.lavender;
    ctx.save();
    ctx.translate(nd.x, nd.y);
    ctx.scale(k, k);
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = P.navyLight;
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, TAU);
    ctx.fill();
    ctx.globalAlpha /= 0.85;
    const ring = new Path2D();
    ring.arc(0, 0, 50, 0, TAU);
    stroke(ctx, ring, lav, 0.85, 2.5);
    const ring2 = new Path2D();
    ring2.arc(0, 0, 41, 0, TAU);
    stroke(ctx, ring2, lav, 0.5, 1.5);
    L.ticks(ctx, 0, 0, { r: 54, n: 36, len: 5, major: 9, majorLen: 10, color: lav, alpha: 0.45, width: 1 });
    if (nd.kind === 'cells') {
      // endosperm: a mini hexagonal cell lattice with a few glowing nuclei
      L.hexLattice(ctx, (c) => c.arc(0, 0, 38, 0, TAU), { bounds: [-40, -40, 80, 80], r: 8, alpha: 0.55, width: 1, color: lav, seed: sd('nodehex'), dots: 1.4 });
      for (const [x, y] of [[-12, -8], [14, 6], [-2, 20]]) L.glowDot(ctx, x, y, 2.4, { rays: 0, glow: 3, intensity: 0.7, seed: sd('nodeglow', x) });
    } else if (nd.kind === 'seedling') {
      // embryo: a stem, two round cotyledons, a root, the soil line
      const p = new Path2D();
      p.moveTo(-30, 14);
      p.lineTo(30, 14);
      stroke(ctx, p, lav, 0.4, 1, [3, 4]);
      const st = new Path2D();
      st.moveTo(0, 30);
      st.quadraticCurveTo(-3, 4, 0, -10);
      stroke(ctx, st, P.lineWhite, 0.9, 2);
      const rt = new Path2D();
      rt.moveTo(0, 30);
      rt.lineTo(-5, 36);
      rt.moveTo(0, 26);
      rt.lineTo(6, 33);
      stroke(ctx, rt, lav, 0.7, 1.2);
      for (const s of [-1, 1]) {
        const c = new Path2D();
        c.ellipse(s * 13, -16, 12, 8, s * -0.35, 0, TAU);
        stroke(ctx, c, P.lineWhite, 0.9, 1.8);
        const v = new Path2D();
        v.moveTo(s * 3, -12);
        v.lineTo(s * 20, -19);
        stroke(ctx, v, lav, 0.6, 1);
      }
    } else {
      // water uptake: a drop in schemWater with an inner drop and ripples
      const drop = (s) => {
        const d = new Path2D();
        d.moveTo(0, -30 * s);
        d.bezierCurveTo(10 * s, -14 * s, 20 * s, 0, 20 * s, 10 * s);
        d.arc(0, 10 * s, 20 * s, 0, Math.PI);
        d.bezierCurveTo(-20 * s, 0, -10 * s, -14 * s, 0, -30 * s);
        d.closePath();
        return d;
      };
      stroke(ctx, drop(1), P.schemWater, 0.95, 2.2);
      stroke(ctx, drop(0.62), P.schemWater, 0.5, 1.2);
      const hl = new Path2D();
      hl.arc(0, 10, 13, Math.PI * 1.05, Math.PI * 1.45);
      stroke(ctx, hl, P.schemWater, 0.9, 1.6);
      const rip = new Path2D();
      for (const r of [26, 33]) {
        rip.moveTo(-r, 34);
        rip.quadraticCurveTo(0, 34 + r * 0.18, r, 34);
      }
      stroke(ctx, rip, P.schemWater, 0.45, 1);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // scene
  // ---------------------------------------------------------------------------

  const B_WORD = 0.75; // T 43.50 wordmark fades in over 9 frames
  const B_PULSE = 1.5; // T 44.25 embryo pulse; the diagram starts to fade
  const F_END = 2.125; // T 44.875 diagram gone, 3 frames before the last frame

  FILM.scene({
    id: 'bean-loop',
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, E = L.ease;
      const dur = info.dur;
      let t = clamp(tIn, 0, dur);
      const tFrame = Math.round(t * 24) / 24;
      if (Math.abs(t - tFrame) < 1e-4) t = tFrame + 1e-7;
      const bi = L.boil(info.T);
      const g = geo();
      const lav = P.lavender, white = P.lineWhite;
      const hit = (a, frames, e, lead = 1) => {
        if (t < a) return 0;
        const u = clamp((t - a) / (frames * FR) + lead / frames);
        return e ? e(u) : u;
      };
      const fadeNet = 1 - E.inOutSine(clamp((t - B_PULSE) / (F_END - B_PULSE)));
      const endK = 1 - fadeNet; // the cherry oval comes forward as the diagram leaves
      const fadeLate = 1 - E.inOutSine(clamp((t - 1.875) / (F_END - 1.875)));

      // ---- 1 base -------------------------------------------------------------------
      L.blueprint(ctx, { center: [540, 900], circles: 2, diagonals: 2, seed: 1502 });

      // ---- 2 guide geometry (02's finished frame) ---------------------------------------
      L.guideCircle(ctx, 540, 900, 420, { alpha: 0.15, width: 1.5 });
      ctx.save();
      ctx.globalAlpha = fadeNet;
      L.ticks(ctx, 540, 900, { r: 420, n: 120, len: 6, major: 10, majorLen: 15, inward: true, color: lav, alpha: 0.22, width: 1, rot: -15 * DEG - (4 * DEG * t) / dur });
      L.guideCircle(ctx, 540, 900, 560, { alpha: 0.1, width: 1.2, dash: [3, 9] });
      L.guideCircle(ctx, 540, 900, 300, { alpha: 0.08, width: 1 });
      {
        const ax = new Path2D();
        const a0 = g1Rot(540, 380), a1 = g1Rot(540, 1420);
        ax.moveTo(a0[0], a0[1]);
        ax.lineTo(a1[0], a1[1]);
        const c0 = g1Rot(250, 900), c1 = g1Rot(830, 900);
        ax.moveTo(c0[0], c0[1]);
        ax.lineTo(c1[0], c1[1]);
        stroke(ctx, ax, lav, 0.18, 1, [10, 8]);
        const pl = new Path2D();
        pl.moveTo(540, 520);
        pl.lineTo(540, 1290);
        stroke(ctx, pl, lav, 0.12, 1, [3, 6]);
        const bx = new Path2D();
        addPoly(bx, g.box, true);
        stroke(ctx, bx, lav, 0.1, 1, [2, 7]);
        const ck = new Path2D();
        for (let i = 0; i < 4; i++) {
          const p = g.box[i], q = g.box[(i + 1) % 4], r = g.box[(i + 3) % 4];
          const u = [(q[0] - p[0]) / 340, (q[1] - p[1]) / 340], v = [(r[0] - p[0]) / 340, (r[1] - p[1]) / 340];
          ck.moveTo(p[0] + u[0] * 22, p[1] + u[1] * 22);
          ck.lineTo(p[0], p[1]);
          ck.lineTo(p[0] + v[0] * 22, p[1] + v[1] * 22);
        }
        stroke(ctx, ck, lav, 0.4, 1.2);
        const reg = new Path2D();
        for (const [x, y] of [[540, 480], [120, 900], [960, 900], [540, 1320], [540, 610], [540, 1190]]) {
          reg.moveTo(x - 9, y);
          reg.lineTo(x + 9, y);
          reg.moveTo(x, y - 9);
          reg.lineTo(x, y + 9);
        }
        stroke(ctx, reg, lav, 0.4, 1.2);
      }
      L.ticks(ctx, 60, 220, { length: 1320, angle: Math.PI / 2, n: 44, len: 9, major: 4, majorLen: 20, side: 1, alpha: 0.35, width: 1.2, color: lav });
      L.ticks(ctx, 120, 1620, { length: 840, angle: 0, n: 28, len: 8, major: 7, majorLen: 18, side: -1, alpha: 0.25, width: 1.2, color: lav });
      {
        const ch = new Path2D();
        ch.moveTo(520, 900);
        ch.lineTo(560, 900);
        ch.moveTo(540, 880);
        ch.lineTo(540, 920);
        stroke(ctx, ch, lav, 0.35, 1);
        // the oval's quadrant marks and graduated ring
        const qt = new Path2D();
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2;
          const x = G2.x + Math.cos(a) * G2.rx, y = G2.y + Math.sin(a) * G2.ry;
          qt.moveTo(x - Math.cos(a) * 8, y - Math.sin(a) * 8);
          qt.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8);
        }
        stroke(ctx, qt, lav, 0.5, 1.5);
        const gt = new Path2D(), gtM = new Path2D();
        for (let d = 0; d < 360; d += 5) {
          const a = d * DEG;
          const x = G2.x + Math.cos(a) * G2.rx, y = G2.y + Math.sin(a) * G2.ry;
          let nx = Math.cos(a) / G2.rx, ny = Math.sin(a) / G2.ry;
          const nl = Math.hypot(nx, ny);
          nx /= nl;
          ny /= nl;
          const major = d % 30 === 0;
          const pth = major ? gtM : gt;
          pth.moveTo(x - nx * 3, y - ny * 3);
          pth.lineTo(x - nx * (major ? 16 : 8), y - ny * (major ? 16 : 8));
        }
        stroke(ctx, gt, lav, 0.38, 1.2);
        stroke(ctx, gtM, lav, 0.6, 1.5);
        const gh = new Path2D();
        addPoly(gh, g.outer, true);
        stroke(ctx, gh, lav, 0.13, 1.2, [6, 7]);
      }
      ctx.restore();

      // ---- 3 G2 cherry oval: 02's 1.5 px / 30 percent guide, firming up for the loop seam ----------
      {
        const ov = new Path2D();
        addPoly(ov, wobPts(L, ovalPts(G2.x, G2.y, G2.rx, G2.ry, 160), sd('loop-oval'), 0.5 * endK, bi, true), true);
        stroke(ctx, ov, lav, lerp(0.3, 0.85, endK), lerp(1.5, 2.5, endK));
        if (endK > 0) {
          const ov2 = new Path2D();
          addPoly(ov2, wobPts(L, ovalPts(G2.x, G2.y, G2.rx - 9, G2.ry - 9, 160), sd('loop-oval2'), 0.4, bi, true), true);
          stroke(ctx, ov2, lav, 0.45 * endK, 1.5);
        }
        // calyx scar disc (02's faint construction ring) and the gloss crescent, both coming forward
        const sc = new Path2D();
        sc.ellipse(540, 900 + 272, 34, 24, 0, 0, TAU);
        stroke(ctx, sc, lav, lerp(0.2, 0.6, endK), lerp(1, 1.5, endK));
        if (endK > 0) {
          const star = new Path2D();
          for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + (i * TAU) / 5;
            star.moveTo(540, 1172);
            star.lineTo(540 + Math.cos(a) * 18, 1172 + Math.sin(a) * 12);
          }
          stroke(ctx, star, lav, 0.45 * endK, 1.2);
          const gl = new Path2D();
          gl.ellipse(G2.x, G2.y, G2.rx - 40, G2.ry - 40, 0, 200 * DEG, 250 * DEG);
          stroke(ctx, gl, white, 0.6 * endK, 2);
        }
      }

      // ---- 4 measurement -------------------------------------------------------------------
      if (fadeNet > 0) {
        ctx.save();
        ctx.globalAlpha = fadeNet;
        L.bracket(ctx, 790, 660, 790, 1140, { alpha: 0.6, cap: 16 });
        L.ticks(ctx, 790, 660, { length: 480, angle: Math.PI / 2, n: 8, len: 10, side: 1, baseline: false, alpha: 0.6, width: 1.5, color: white });
        L.ticks(ctx, 360, 1230, { length: 360, angle: 0, n: 12, len: 12, major: 3, majorLen: 20, side: 1, alpha: 0.6, width: 1.5 });
        const ext = new Path2D();
        const top = g.outer[0], bot = g.outer[48];
        ext.moveTo(top[0] + 14, 660);
        ext.lineTo(806, 660);
        ext.moveTo(bot[0] + 14, 1140);
        ext.lineTo(806, 1140);
        let minX = 1e9, maxX = -1e9;
        for (const p of g.outer) {
          minX = Math.min(minX, p[0]);
          maxX = Math.max(maxX, p[0]);
        }
        ext.moveTo(minX, 1000);
        ext.lineTo(minX, 1244);
        ext.moveTo(maxX, 1000);
        ext.lineTo(maxX, 1244);
        stroke(ctx, ext, lav, 0.28, 1, [4, 6]);
        L.arcAnnotation(ctx, 540, 900, 330, -Math.PI / 2, -Math.PI / 2 - 15 * DEG, { color: lav, alpha: 0.6, width: 1.5, endTicks: 10 });
        ctx.restore();
      }

      // ---- 5 the G1 bean ----------------------------------------------------------------------
      if (fadeNet > 0) {
        const lp = new Path2D();
        for (let j = 0; j < g.rows.length; j++) addPoly(lp, wobPts(L, g.rows[j].pts, sd('row', j), 0.6, bi, false), false);
        stroke(ctx, lp, lav, 0.32 * fadeNet, 1);
        ctx.save();
        ctx.clip(g.innerPath);
        const mp = new Path2D();
        for (let k = 0; k < g.merid.length; k++) addPoly(mp, wobPts(L, g.merid[k], sd('mer', k), 0.6, bi, false), false);
        stroke(ctx, mp, lav, 0.3 * fadeNet, 1);
        ctx.fillStyle = lav;
        ctx.globalAlpha = 0.45 * fadeNet;
        ctx.beginPath();
        for (const n of g.nuclei) {
          ctx.moveTo(n.p[0] + n.s, n.p[1]);
          ctx.arc(n.p[0], n.p[1], n.s, 0, TAU);
        }
        ctx.fill();
        ctx.restore();
      }
      {
        const p = new Path2D();
        addPoly(p, wobPts(L, g.outer, sd('outer'), 1.1, bi, true), true);
        stroke(ctx, p, lav, 0.85, 2.5);
        const p2 = new Path2D();
        addPoly(p2, wobPts(L, g.inner, sd('inner'), 0.9, bi, true), true);
        stroke(ctx, p2, lav, 0.5, 1.5);
      }
      {
        const cr = wobPts(L, g.crease, sd('crease'), 0.7, bi, false);
        const n = cr.length;
        const total = g.ccum[n - 1];
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = white;
        ctx.globalAlpha = 0.9;
        for (let i = 1; i < n; i++) {
          ctx.lineWidth = g1CreaseWidth(g.ccum[i] / total);
          ctx.beginPath();
          ctx.moveTo(cr[i - 1][0], cr[i - 1][1]);
          ctx.lineTo(cr[i][0], cr[i][1]);
          ctx.stroke();
        }
        ctx.restore();
        const floor = new Path2D();
        addPoly(floor, cr, false);
        stroke(ctx, floor, P.navy, 0.75, 2.2);
        const svp = new Path2D();
        addPoly(svp, wobPts(L, g.silver, sd('silver'), 0.5, bi, false).map((p) => [p[0] + 1.2, p[1] - 0.4]), false);
        stroke(ctx, svp, P.paleBlue, 0.7, 1);
        const lips = new Path2D();
        for (const s of [-1, 1]) {
          const lp = [];
          for (let i = 0; i < n; i++) {
            const a = cr[Math.max(0, i - 1)], b = cr[Math.min(n - 1, i + 1)];
            const tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
            const w = g1CreaseWidth(g.ccum[i] / total) / 2 + 5;
            lp.push([cr[i][0] - (ty / tl) * w * s, cr[i][1] + (tx / tl) * w * s]);
          }
          addPoly(lips, lp, false);
        }
        stroke(ctx, lips, lav, 0.45 * fadeNet, 1);
      }
      // embryo outline and glow: pulse on the beat (x1.4 and back over 12 frames), then fade
      const pulse = t >= B_PULSE ? Math.sin(Math.PI * clamp((t - B_PULSE) / (12 * FR))) : 0;
      const embA = 1 - E.inOutSine(clamp((t - (B_PULSE + 12 * FR)) / (F_END - B_PULSE - 12 * FR)));
      if (embA > 0.002) {
        const p = new Path2D();
        addPoly(p, wobPts(L, g.emb, sd('emb'), 0.5, bi, true), true);
        stroke(ctx, p, lav, 0.7 * embA, 1.5);
        const p2 = new Path2D();
        addPoly(p2, g.emb.map((q) => [lerp(q[0], G1_EMBRYO[0], 0.3), lerp(q[1], G1_EMBRYO[1], 0.3)]), true);
        stroke(ctx, p2, lav, 0.35 * embA, 1);
      }

      // ---- 6 network -----------------------------------------------------------------------------
      if (fadeNet > 0) {
        for (let i = 0; i < NODES.length; i++) {
          const net = g.net[i];
          const p = new Path2D();
          addPoly(p, wobPts(L, net.pts, sd('net', i), 0.8, bi, false), false);
          stroke(ctx, p, lav, 0.6 * fadeNet, 1.5);
          ctx.save();
          ctx.fillStyle = white;
          ctx.globalAlpha = 0.85 * fadeNet;
          ctx.beginPath();
          ctx.arc(net.s[0], net.s[1], 3.5, 0, TAU);
          ctx.fill();
          ctx.restore();
          drawNode(ctx, L, P, NODES[i], 1, bi, fadeNet);
        }
      }

      // ---- 7 embryo glow ----------------------------------------------------------------------------
      if (embA > 0.002) {
        ctx.save();
        ctx.globalAlpha = embA;
        L.glowDot(ctx, G1_EMBRYO[0], G1_EMBRYO[1], 9 * (1 + 0.15 * pulse), { rays: 12, rayLen: 2, glow: 40 / 9, intensity: 1 + 0.4 * pulse, rot: (bi % 2) * 15 * DEG, seed: sd('embryo') });
        L.ticks(ctx, G1_EMBRYO[0], G1_EMBRYO[1], { r: 30 + 6 * pulse, n: 16, len: 6, color: white, alpha: 0.5, width: 1.2, rot: (2.25 + t) * 0.6 });
        ctx.restore();
      }

      // ---- 8 progress glyph and wordmark ------------------------------------------------------------
      if (fadeNet > 0) {
        ctx.save();
        ctx.globalAlpha = fadeNet;
        progressGlyph(ctx, L, 3, 1, info.T, true);
        ctx.restore();
      }
      const wA = hit(B_WORD, 9, E.inOutSine, 0) * fadeLate;
      if (wA > 0.002) {
        // canvas letter spacing trails the last glyph, so shift right by half of it to stay centred
        L.text(ctx, 'café', 540 + 0.06 * 44, 1470, { size: 44, weight: 300, tracking: '0.12em', color: lav, alpha: 0.85 * wA, align: 'center' });
      }
    },
  });
})();
