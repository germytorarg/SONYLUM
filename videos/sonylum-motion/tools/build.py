import math, sys

OUT = sys.argv[1]
W, H, CX, CY = 1080, 1920, 540, 960
HITS = [  # (time, ring color var, ray color var)
    (1.30, "--bone", "--gold-hi"),
    (1.75, "--gold", "--bone"),
    (2.15, "--bordo-hi", "--gold"),
    (2.55, "--gold-hi", "--bordo-hi"),
    (3.90, "--gold", "--gold-hi"),
]

def rays(n, r1, r2, color, width, cls):
    out = []
    for k in range(n):
        a = 2 * math.pi * k / n
        out.append(
            f'<line class="{cls}" x1="{CX + r1*math.cos(a):.1f}" y1="{CY + r1*math.sin(a):.1f}" '
            f'x2="{CX + r2*math.cos(a):.1f}" y2="{CY + r2*math.sin(a):.1f}" '
            f'stroke="var({color})" stroke-width="{width}" stroke-linecap="square" />'
        )
    return "\n".join(out)

# ---------- hit clips (bursts + speed lines) ----------
hit_html, hit_js = [], []
speed_rows = [180, 330, 520, 1380, 1560, 1740]
for i, (t, rc, yc) in enumerate(HITS):
    rings = "\n".join(
        f'<div class="layer ring"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><circle cx="{CX}" cy="{CY}" r="150" fill="none" stroke="var({rc})" stroke-width="{14 - 4*k}" /></svg></div>'
        for k in range(3)
    )
    speed = "\n".join(
        f'<span class="speed" style="top:{y}px;width:{420 + (j*137) % 380}px;height:{6 + (j*5) % 14}px"></span>'
        for j, y in enumerate(speed_rows)
    )
    hit_html.append(f'''
      <div id="hit-{i}" class="clip fx-hit" data-start="{t}" data-duration="0.55" data-track-index="5">
        <svg class="fx-svg rays" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
          {rays(24, 200, 1250, yc, 5, "ray")}
        </svg>
        {rings}
        {speed}
      </div>''')
    dir_ = 1 if i % 2 == 0 else -1
    hit_js.append(f'''
      tl.fromTo("#hit-{i} .rays", {{ scale: 0.35, opacity: 1 }}, {{ scale: 1.2, opacity: 0, duration: 0.45, ease: "expo.out", transformOrigin: "{CX}px {CY}px" }}, {t});
      tl.fromTo("#hit-{i} .ring", {{ scale: 0.2, opacity: 1 }}, {{ scale: (k) => 2.4 + k * 1.3, opacity: 0, duration: 0.5, ease: "expo.out", transformOrigin: "{CX}px {CY}px", stagger: 0.03 }}, {t});
      tl.fromTo("#hit-{i} .speed", {{ x: {dir_ * -1400} }}, {{ x: {dir_ * 1500}, duration: 0.32, ease: "power4.inOut", stagger: 0.015 }}, {t});''')

# ---------- dot grid ----------
dots = []
for row in range(0, 33):
    for col in range(0, 19):
        x, y = 30 + col * 60, 0 + row * 60
        dots.append(f'<circle cx="{x}" cy="{y}" r="3.2" />')
dots_svg = "\n".join(dots)

# ---------- scene A side rails ----------
# ---------- dot column scene C ----------
dot_col = "\n".join(f'<span class="pop-dot" style="top:{300 + k*95}px"></span>' for k in range(14))

# ---------- logo ghost letters ----------
ghosts = [  # letter, left, top, size
    ("S", -120, -40, 760), ("Y", 640, -120, 700), ("L", -60, 1180, 720),
    ("M", 520, 1260, 720),
]
ghost_html = "\n".join(
    f'<span class="ghost" data-layout-ignore style="left:{l}px;top:{tp}px;font-size:{s}px">{ch}</span>' for ch, l, tp, s in ghosts
)

# ---------- logo corner squares / marks ----------
compass = "\n".join(
    f'<span class="cmp" style="left:{CX + 470*math.cos(a) - 14:.1f}px;top:{CY + 470*math.sin(a) - 14:.1f}px"></span>'
    for a in [0, math.pi/2, math.pi, 3*math.pi/2]
)
ticks = rays(60, 500, 528, "--gold", 3, "tick")

bars_letters = "SONYLUM"
bars = "\n".join(
    f'<span class="bar{" gold" if k % 2 else ""}"><b>{ch}</b></span>' for k, ch in enumerate(bars_letters)
)

html = f'''<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Sonylum — motion</title>
    <script src="vendor/gsap.min.js"></script>
    <style>
      @font-face {{
        font-family: "Cormorant Garamond";
        font-style: normal;
        font-weight: 700;
        src: url("fonts/cormorant-700.woff2") format("woff2");
      }}
      @font-face {{
        font-family: "Cormorant Garamond";
        font-style: italic;
        font-weight: 600;
        src: url("fonts/cormorant-italic-600.woff2") format("woff2");
      }}
      :root {{
        --ink: #0b0908;
        --gold: #c9a45c;
        --gold-hi: #e8c987;
        --bordo: #6e1423;
        --bordo-hi: #9b1b30;
        --bone: #ede6d8;
        --display: "Archivo Black", sans-serif;
        --serif: "Cormorant Garamond", serif;
      }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: var(--ink); }}
      #root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; background: var(--ink); }}
      .clip {{ position: absolute; inset: 0; overflow: hidden; }}
      .fx-svg {{ position: absolute; left: 0; top: 0; overflow: visible; }}
      .layer {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }}
      .cmp {{ position: absolute; width: 28px; height: 28px; background: var(--bordo-hi); display: block; }}
      .scene-content {{
        position: relative;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; height: 100%; padding: 160px 80px; gap: 24px;
      }}
      .slam {{
        font-family: var(--display); color: var(--bone); line-height: 0.9;
        text-transform: uppercase; letter-spacing: -0.03em; display: block; white-space: nowrap;
      }}

      /* A — scroll infinito */
      #scroll-stack {{ position: absolute; left: 0; top: 0; width: 100%; display: flex; flex-direction: column; align-items: center; }}
      .scroll-word {{ font-family: var(--display); font-size: 236px; line-height: 1; letter-spacing: -0.03em; color: var(--bone); }}
      .scroll-word.outline {{ color: var(--ink); -webkit-text-stroke: 4px var(--gold); }}
      #scroll-geo {{ position: absolute; inset: 0; }}

      /* B — FRENÁ. */
      #scene-frena {{ background: var(--bordo); }}
      #frena-sq {{ position: absolute; left: 190px; top: 610px; width: 700px; height: 700px; background: var(--bordo-hi); }}
      #frena-sq2 {{ position: absolute; left: 90px; top: 510px; width: 900px; height: 900px; border: 8px solid var(--gold); }}
      #frena-text {{ font-size: 236px; }}

      /* C — ESTO / NO SE */
      #scene-esto .scene-content {{ align-items: stretch; gap: 40px; }}
      #esto-text {{ font-size: 280px; align-self: flex-start; }}
      #nose-text {{ font-size: 280px; align-self: flex-end; color: var(--gold); }}
      #hazard {{
        position: absolute; left: -200px; top: 1290px; width: 1500px; height: 130px;
        background: repeating-linear-gradient(-45deg, var(--gold) 0 34px, var(--ink) 34px 68px);
        transform: rotate(-7deg);
      }}
      #hazard2 {{
        position: absolute; left: -200px; top: 470px; width: 1500px; height: 40px;
        background: var(--bordo-hi); transform: rotate(-7deg);
      }}
      .pop-dot {{ position: absolute; right: 60px; width: 26px; height: 26px; border-radius: 50%; background: var(--gold); display: block; }}
      #ghost-s {{
        position: absolute; left: -260px; top: 220px; font-family: var(--display); font-size: 1500px; line-height: 1;
        color: var(--ink); -webkit-text-stroke: 4px var(--gold);
      }}

      /* D — scrollea. */
      #scrollea-text {{
        font-family: var(--serif); font-style: italic; font-weight: 600; font-size: 300px; line-height: 1;
        white-space: nowrap; color: var(--gold-hi); letter-spacing: -0.02em; display: block;
      }}
      #scrollea-bar {{ display: block; width: 900px; height: 30px; background: var(--bordo-hi); transform-origin: left center; }}

      /* Transición — barras con letras */
      #bars {{ display: flex; flex-direction: column; width: 100%; height: 100%; }}
      .bar {{
        display: flex; align-items: center; justify-content: center; width: 100%; flex: 1;
        background: var(--bordo); overflow: hidden;
      }}
      .bar b {{ font-family: var(--display); font-size: 250px; line-height: 1; color: var(--bone); display: block; }}
      .bar.gold {{ background: var(--gold); }}
      .bar.gold b {{ color: var(--ink); }}

      /* E — logo */
      #scene-logo {{ background: radial-gradient(ellipse at 50% 50%, #22140f 0%, var(--ink) 60%); }}
      .ghost {{
        position: absolute; font-family: var(--display); line-height: 1; display: block;
        color: var(--ink); -webkit-text-stroke: 3px var(--gold);
      }}
      #logo-push, #logo-shake {{ display: flex; flex-direction: column; align-items: center; gap: 34px; }}
      #logo-word {{
        display: flex; font-family: var(--serif); font-weight: 700; font-size: 200px; line-height: 1;
        color: var(--gold-hi); letter-spacing: -0.01em;
      }}
      #logo-word span {{ display: inline-block; }}
      #logo-rule {{ display: block; width: 700px; height: 8px; background: var(--gold); }}
      #logo-tag {{
        font-family: var(--display); font-size: 27px; letter-spacing: 0.26em; padding-left: 0.26em; white-space: nowrap;
        color: var(--bone); text-transform: uppercase;
      }}

      /* capas globales */
      #fx-dots svg {{ fill: var(--gold); }}
      #dots-wrap {{ position: absolute; inset: 0; opacity: 0.22; }}
      #frame-marks {{ pointer-events: none; }}
      .edge {{ position: absolute; background: var(--gold); display: block; }}
      .edge.h {{ left: 48px; right: 48px; height: 3px; }}
      .edge.v {{ top: 48px; bottom: 48px; width: 3px; }}
      .mark-label {{
        position: absolute; font-family: var(--display); font-size: 22px; letter-spacing: 0.25em;
        color: var(--gold-hi); background: var(--ink); padding: 6px 12px;
      }}
      .speed {{ position: absolute; left: 0; background: var(--gold-hi); display: block; }}
      #flash {{ background: var(--gold-hi); opacity: 0; }}
      #vignette {{ background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%); }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="7" data-width="1080" data-height="1920">

      <!-- Grilla de puntos global -->
      <div id="fx-dots" class="clip" data-start="0" data-duration="7" data-track-index="4">
        <div id="dots-wrap">
          <svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{dots_svg}</svg>
        </div>
      </div>

      <!-- A: scroll infinito -->
      <section id="scene-scroll" class="clip" data-start="0" data-duration="1.3" data-track-index="0">
        <div id="scroll-stack" data-layout-ignore>
          {"".join(f'<div class="scroll-word{" outline" if k % 2 else ""}">SCROLL</div>' for k in range(28))}
        </div>
        <svg id="scroll-geo" class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
          <line id="rail-l" x1="70" y1="0" x2="70" y2="{H}" stroke="var(--bordo-hi)" stroke-width="16" stroke-dasharray="60 40" />
          <line id="rail-r" x1="1010" y1="0" x2="1010" y2="{H}" stroke="var(--bordo-hi)" stroke-width="16" stroke-dasharray="60 40" />
          <line id="scan" x1="0" y1="{CY}" x2="{W}" y2="{CY}" stroke="var(--bordo-hi)" stroke-width="22" />
        </svg>
        <div id="scroll-ring" class="layer"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><circle cx="{CX}" cy="{CY}" r="420" fill="none" stroke="var(--gold-hi)" stroke-width="10" stroke-dasharray="40 26" /></svg></div>
      </section>

      <!-- B: FRENÁ. -->
      <section id="scene-frena" class="clip" data-start="1.3" data-duration="0.45" data-track-index="0">
        <span id="frena-sq2"></span>
        <span id="frena-sq"></span>
        <div class="scene-content">
          <div id="frena-shake"><span id="frena-text" class="slam">FRENÁ.</span></div>
        </div>
      </section>

      <!-- C: ESTO / NO SE -->
      <section id="scene-esto" class="clip" data-start="1.75" data-duration="0.8" data-track-index="0">
        <span id="ghost-s" data-layout-ignore>S</span>
        <span id="hazard2"></span>
        <span id="hazard"></span>
        {dot_col}
        <div class="scene-content" id="esto-shake">
          <span id="esto-text" class="slam">ESTO</span>
          <span id="nose-text" class="slam">NO SE</span>
        </div>
      </section>

      <!-- D: scrollea. -->
      <section id="scene-scrollea" class="clip" data-start="2.55" data-duration="0.9" data-track-index="0">
        <div id="cross-h" class="layer"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><line x1="0" y1="{CY}" x2="{W}" y2="{CY}" stroke="var(--gold)" stroke-width="4" /></svg></div>
        <div id="cross-v" class="layer"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><line x1="{CX}" y1="0" x2="{CX}" y2="{H}" stroke="var(--gold)" stroke-width="4" /></svg></div>
        <div id="sc-ring" class="layer"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><circle id="sc-ring-c" cx="{CX}" cy="{CY}" r="430" fill="none" stroke="var(--bordo-hi)" stroke-width="18" stroke-dasharray="2702" /></svg></div>
        <div id="orbit" class="layer"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><circle cx="{CX}" cy="{CY - 430}" r="30" fill="var(--gold-hi)" /><circle cx="{CX}" cy="{CY + 430}" r="16" fill="var(--bone)" /></svg></div>
        <div class="scene-content">
          <span id="scrollea-text">scrollea.</span>
          <span id="scrollea-bar"></span>
        </div>
      </section>

      <!-- E: SONYLUM -->
      <section id="scene-logo" class="clip" data-start="3.45" data-duration="3.55" data-track-index="0">
        <div id="ghosts">{ghost_html}</div>
        <div id="diag-a" class="layer"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><line x1="0" y1="0" x2="{W}" y2="{H}" stroke="var(--bordo-hi)" stroke-width="6" /></svg></div>
        <div id="diag-b" class="layer"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><line x1="{W}" y1="0" x2="0" y2="{H}" stroke="var(--bordo-hi)" stroke-width="6" /></svg></div>
        <div id="logo-ring" class="layer"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><circle id="logo-ring-c" cx="{CX}" cy="{CY}" r="470" fill="none" stroke="var(--gold)" stroke-width="10" stroke-dasharray="2953" /></svg></div>
        <div id="logo-ticks" class="layer"><svg class="fx-svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{ticks}</svg></div>
        {compass}
        <div class="scene-content">
          <div id="logo-push">
            <div id="logo-shake">
              <div id="logo-word">{"".join(f"<span>{c}</span>" for c in "SONYLUM")}</div>
              <span id="logo-rule"></span>
              <div id="logo-tag">Estudio digital · Villa Luro, BA</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Transición: barras SONYLUM -->
      <section id="scene-bars" class="clip" data-start="3.3" data-duration="0.42" data-track-index="1">
        <div id="bars">{bars}</div>
      </section>

      <!-- Ráfagas de impacto -->
      {"".join(hit_html)}

      <div id="flash" class="clip" data-start="0" data-duration="7" data-track-index="2"></div>
      <div id="vignette" class="clip" data-start="0" data-duration="7" data-track-index="3"></div>
      <!-- Marcas de cuadro -->
      <div id="frame-marks" class="clip" data-start="0" data-duration="7" data-track-index="6">
        <span class="edge h" id="edge-t" style="top:48px"></span>
        <span class="edge h" id="edge-b" style="bottom:48px"></span>
        <span class="edge v" id="edge-l" style="left:48px"></span>
        <span class="edge v" id="edge-r" style="right:48px"></span>
        <span class="mark-label" id="lbl-1" style="left:72px;top:30px">SNY — 001</span>
        <span class="mark-label" id="lbl-2" style="right:72px;bottom:30px">BA · AR</span>
      </div>

    </div>

    <script>
      const tl = gsap.timeline({{ paused: true }});

      const shake = (target, at, amp, first = true) => {{
        tl.fromTo(target, {{ x: 0, y: 0 }}, {{
          keyframes: [
            {{ x: -amp, y: amp * 0.6, duration: 0.03 }},
            {{ x: amp * 0.8, y: -amp * 0.5, duration: 0.03 }},
            {{ x: -amp * 0.5, y: amp * 0.3, duration: 0.03 }},
            {{ x: amp * 0.3, y: -amp * 0.2, duration: 0.03 }},
            {{ x: 0, y: 0, duration: 0.04 }},
          ],
          ease: "none",
          immediateRender: first,
        }}, at);
      }};
      const flash = (at, peak, len, first = false) => {{
        tl.fromTo("#flash", {{ opacity: 0 }}, {{
          keyframes: [{{ opacity: peak, duration: 0.01 }}, {{ opacity: 0, duration: len, ease: "power2.out" }}],
          immediateRender: first,
        }}, at);
      }};

      // Capas globales: marco que se dibuja + grilla que late en cada golpe
      tl.fromTo(["#edge-t", "#edge-b"], {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.35, ease: "expo.out" }}, 0);
      tl.fromTo(["#edge-l", "#edge-r"], {{ scaleY: 0 }}, {{ scaleY: 1, duration: 0.35, ease: "expo.out" }}, 0.05);
      tl.fromTo(["#lbl-1", "#lbl-2"], {{ autoAlpha: 0, x: -40 }}, {{ autoAlpha: 1, x: 0, duration: 0.2, ease: "expo.out", stagger: 0.06 }}, 0.1);
      tl.fromTo("#dots-wrap", {{ scale: 1, opacity: 0.22 }}, {{ scale: 1, opacity: 0.22, duration: 0.01 }}, 0);
      [{",".join(str(t) for t, _, _ in HITS)}].forEach((t) => {{
        tl.to("#dots-wrap", {{ scale: 1.12, opacity: 0.6, duration: 0.05, ease: "power4.out" }}, t);
        tl.to("#dots-wrap", {{ scale: 1, opacity: 0.22, duration: 0.3, ease: "power2.out" }}, t + 0.05);
      }});

      // A — scroll que acelera + rieles + anillo + scanline
      tl.fromTo("#scroll-stack", {{ y: 0, filter: "blur(0px)" }}, {{ y: -4600, filter: "blur(10px)", duration: 1.3, ease: "power3.in" }}, 0);
      tl.fromTo("#scroll-stack", {{ scaleY: 1 }}, {{ scaleY: 1.25, duration: 0.5, ease: "power2.in" }}, 0.8);
      tl.fromTo(["#rail-l", "#rail-r"], {{ strokeDashoffset: 0 }}, {{ strokeDashoffset: 3000, duration: 1.3, ease: "power3.in" }}, 0);
      tl.fromTo("#scroll-ring", {{ rotation: 0, scale: 0.4 }}, {{ rotation: 540, scale: 1.3, duration: 1.3, ease: "power3.in", transformOrigin: "540px 960px" }}, 0);
      tl.fromTo("#scan", {{ y: -960 }}, {{ y: 960, duration: 0.42, ease: "none", repeat: 2 }}, 0);

      // B — FRENÁ.
      flash(1.3, 1, 0.14, true);
      tl.fromTo("#frena-sq", {{ rotation: 0, scale: 0 }}, {{ rotation: 135, scale: 1, duration: 0.3, ease: "expo.out" }}, 1.3);
      tl.fromTo("#frena-sq2", {{ rotation: -30, scale: 1.6 }}, {{ rotation: 20, scale: 1, duration: 0.35, ease: "expo.out" }}, 1.3);
      tl.fromTo("#frena-text", {{ scale: 2.6 }}, {{ scale: 1, duration: 0.16, ease: "expo.out" }}, 1.3);
      shake("#frena-shake", 1.42, 24);

      // C — ESTO / NO SE
      tl.fromTo("#ghost-s", {{ x: -300, rotation: -12 }}, {{ x: 60, rotation: 4, duration: 0.8, ease: "power2.out" }}, 1.75);
      tl.fromTo(".pop-dot", {{ scale: 0 }}, {{ scale: 1, duration: 0.12, ease: "back.out(3)", stagger: 0.02 }}, 1.75);
      tl.fromTo("#hazard2", {{ xPercent: -110 }}, {{ xPercent: 0, duration: 0.16, ease: "power4.out" }}, 1.75);
      tl.fromTo("#esto-text", {{ x: -1200, skewX: -14 }}, {{ x: 0, skewX: 0, duration: 0.14, ease: "power4.out" }}, 1.75);
      shake("#esto-shake", 1.86, 18);
      tl.fromTo("#hazard", {{ xPercent: 110 }}, {{ xPercent: 0, duration: 0.16, ease: "power4.out" }}, 2.15);
      tl.fromTo("#nose-text", {{ x: 1200, skewX: 14, autoAlpha: 0 }}, {{ x: 0, skewX: 0, autoAlpha: 1, duration: 0.14, ease: "power4.out" }}, 2.15);
      shake("#esto-shake", 2.26, 22, false);

      // D — scrollea. con mira, anillo que se dibuja y órbita
      flash(2.55, 0.55, 0.12);
      tl.fromTo("#cross-h", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.2, ease: "expo.out", transformOrigin: "540px 960px" }}, 2.55);
      tl.fromTo("#cross-v", {{ scaleY: 0 }}, {{ scaleY: 1, duration: 0.2, ease: "expo.out", transformOrigin: "540px 960px" }}, 2.58);
      tl.fromTo("#sc-ring-c", {{ strokeDashoffset: 2702 }}, {{ strokeDashoffset: 0, duration: 0.45, ease: "expo.out" }}, 2.55);
      tl.fromTo("#sc-ring", {{ rotation: -90 }}, {{ rotation: 90, duration: 0.45, ease: "expo.out", transformOrigin: "540px 960px" }}, 2.55);
      tl.fromTo("#orbit", {{ rotation: 0 }}, {{ rotation: 520, duration: 0.9, ease: "power2.out", transformOrigin: "540px 960px" }}, 2.55);
      tl.fromTo("#scrollea-text", {{ clipPath: "inset(0% 100% 0% 0%)", scale: 1.2 }}, {{ clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 0.2, ease: "expo.out" }}, 2.55);
      tl.fromTo("#scrollea-bar", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.16, ease: "power4.out" }}, 2.68);
      tl.to("#scrollea-text", {{ scale: 1.08, duration: 0.08, ease: "power2.out" }}, 2.95);
      tl.to("#scrollea-text", {{ scale: 1, duration: 0.18, ease: "power2.inOut" }}, 3.03);

      // Transición — barras con las letras SONYLUM
      gsap.utils.toArray(".bar").forEach((bar, i) => {{
        const dir = i % 2 === 0 ? -1 : 1;
        tl.fromTo(bar, {{ xPercent: dir * 105 }}, {{
          keyframes: [{{ xPercent: 0, duration: 0.14, ease: "power4.out" }}, {{ xPercent: -dir * 105, duration: 0.16, ease: "power4.in" }}],
        }}, 3.3 + i * 0.012);
      }});

      // E — SONYLUM con construcción geométrica
      tl.fromTo(".ghost", {{ scale: 1.4, autoAlpha: 0 }}, {{ scale: 1, autoAlpha: 1, duration: 0.3, ease: "expo.out", stagger: 0.05 }}, 3.55);
      tl.fromTo(".ghost", {{ y: 0 }}, {{ y: (i) => (i % 2 ? -70 : 70), duration: 3.2, ease: "sine.inOut", immediateRender: false }}, 3.8);
      tl.fromTo("#diag-a", {{ scale: 0 }}, {{ scale: 1, duration: 0.35, ease: "expo.out", transformOrigin: "540px 960px" }}, 3.6);
      tl.fromTo("#diag-b", {{ scale: 0 }}, {{ scale: 1, duration: 0.35, ease: "expo.out", transformOrigin: "540px 960px" }}, 3.66);
      tl.fromTo("#logo-word span", {{ yPercent: -140, scale: 2.4, autoAlpha: 0 }}, {{ yPercent: 0, scale: 1, autoAlpha: 1, duration: 0.2, ease: "expo.out", stagger: 0.04 }}, 3.62);
      flash(3.9, 0.5, 0.14);
      shake("#logo-shake", 3.9, 22);
      tl.fromTo("#logo-ring-c", {{ strokeDashoffset: 2953 }}, {{ strokeDashoffset: 0, duration: 0.6, ease: "expo.out" }}, 3.9);
      tl.fromTo("#logo-ring", {{ rotation: -90 }}, {{ rotation: 0, duration: 0.6, ease: "expo.out", transformOrigin: "540px 960px" }}, 3.9);
      tl.fromTo("#logo-ticks", {{ rotation: -40, autoAlpha: 0 }}, {{ rotation: 40, autoAlpha: 1, duration: 3.1, ease: "sine.out", transformOrigin: "540px 960px" }}, 3.9);
      tl.fromTo(".cmp", {{ scale: 0, rotation: 0 }}, {{ scale: 1, rotation: 45, duration: 0.25, ease: "back.out(3)", stagger: 0.05 }}, 4.0);
      tl.fromTo("#logo-rule", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.3, ease: "expo.out" }}, 4.05);
      tl.fromTo("#logo-tag", {{ autoAlpha: 0, y: 30 }}, {{ autoAlpha: 1, y: 0, duration: 0.4, ease: "expo.out" }}, 4.2);
      tl.fromTo("#logo-push", {{ scale: 1 }}, {{ scale: 1.06, duration: 2.8, ease: "sine.inOut" }}, 4.2);

      // Ráfagas: anillos, rayos y líneas de velocidad en cada golpe
      {"".join(hit_js)}

      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
'''
open(OUT, "w").write(html)
print("ok", len(html))
