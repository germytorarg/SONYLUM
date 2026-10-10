(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /* ---------- Rings: the motif. Hero, manifesto and CTA share one engine. ---------- */
  const createRings = (canvas, opts) => {
    const ctx = canvas.getContext("2d");
    const s = { ripples: [], w: 0, h: 0, t: Math.random() * 10, grow: reduce ? 1 : opts.grow ?? 1, boost: 0, px: 0, py: 0, tx: 0, ty: 0, running: false, color: "" };
    const readColor = () => { s.color = css(opts.colorVar); };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.w = r.width; s.h = r.height;
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const draw = () => {
      const { w, h, t, grow, boost, px, py, color } = s;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const span = opts.span(w, h);
      const base = span * opts.inner;
      const count = opts.count;
      const gap = (span - base) / count;
      for (let i = 0; i < count; i++) {
        const k = (i + 1) / count;
        const breathe = reduce ? 0 : Math.sin(t * 0.9 - i * 0.55) * gap * (0.16 + boost * 0.5);
        const r = (base + gap * (i + 0.6) + breathe + boost * gap * k * 2) * (0.6 + 0.4 * grow);
        const ox = px * opts.parallax * k, oy = py * opts.parallax * k;
        const alpha = (opts.alpha - i * (opts.alpha / (count + 2))) * grow;
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${Math.max(alpha, 0.04)})`;
        ctx.lineWidth = i === 0 ? 1.4 : 1;
        ctx.stroke();
        if (opts.dots && i % 2 === 1) {
          const a = t * (0.25 + i * 0.03) * (1 + boost * 2) + i * 1.7;
          ctx.beginPath();
          ctx.arc(cx + ox + Math.cos(a) * r, cy + oy + Math.sin(a) * r, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${0.85 * grow})`;
          ctx.fill();
        }
      }
      // Ripples: a wave leaves the center (or your tap) and fades as it travels
      s.ripples = s.ripples.filter((rp) => t - rp.born < rp.life);
      s.ripples.forEach((rp) => {
        const p = (t - rp.born) / rp.life;
        const e = 1 - Math.pow(1 - p, 3);
        const r = base * 0.9 + (span * 1.15 - base * 0.9) * e;
        ctx.beginPath();
        ctx.arc(rp.x ?? cx, rp.y ?? cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${(1 - p) * 0.75 * grow})`;
        ctx.lineWidth = 1.6 * (1 - p) + 0.4;
        ctx.stroke();
      });
    };
    s.emit = (x, y) => { if (!reduce) s.ripples.push({ born: s.t, life: opts.rippleLife ?? 2.6, x, y }); };
    let lastPulse = 0;
    const loop = () => {
      if (!s.running) return;
      s.t += 0.016;
      if (opts.pulse && s.grow > 0.9 && s.t - lastPulse > opts.pulse / (1 + s.boost * 2)) { lastPulse = s.t; s.emit(); }
      s.px += (s.tx - s.px) * 0.06;
      s.py += (s.ty - s.py) * 0.06;
      draw();
      requestAnimationFrame(loop);
    };
    s.start = () => { if (reduce || s.running) return; s.running = true; requestAnimationFrame(loop); };
    s.stop = () => { s.running = false; };
    s.draw = draw;

    readColor();
    resize();
    new ResizeObserver(resize).observe(canvas);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { readColor(); draw(); });
    new IntersectionObserver(([e]) => (e.isIntersecting ? s.start() : s.stop())).observe(canvas);
    const area = opts.pointerArea;
    if (area && finePointer && !reduce) {
      area.addEventListener("pointermove", (e) => {
        const r = area.getBoundingClientRect();
        s.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        s.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      area.addEventListener("pointerleave", () => { s.tx = 0; s.ty = 0; });
    }
    if (area && !reduce) {
      area.addEventListener("pointerdown", (e) => {
        const r = canvas.getBoundingClientRect();
        s.emit(e.clientX - r.left, e.clientY - r.top);
      });
    }
    return s;
  };

  const heroRings = createRings($('[data-rings]:not([data-rings="panel"]):not([data-rings="cta"])'), {
    colorVar: "--ring", count: 7, inner: 0.38, alpha: 0.5, parallax: 18, dots: true, grow: 0, pulse: 3.2,
    span: (w) => w * 0.5, pointerArea: $("[data-stage]"),
  });

  /* ---------- Buttons: hover fill starts where the pointer enters ---------- */
  $$(".btn").forEach((btn) => {
    btn.addEventListener("pointerenter", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--fx", `${e.clientX - r.left}px`);
      btn.style.setProperty("--fy", `${e.clientY - r.top}px`);
    });
    btn.addEventListener("pointerleave", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--fx", `${e.clientX - r.left}px`);
      btn.style.setProperty("--fy", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Pillars accordion (one open) ---------- */
  const pillars = $$(".pillar");
  pillars.forEach((p) => {
    $(".pillar-head", p).addEventListener("click", () => {
      const open = p.classList.contains("is-open");
      pillars.forEach((o) => { o.classList.remove("is-open"); $(".pillar-head", o).setAttribute("aria-expanded", "false"); });
      if (!open) { p.classList.add("is-open"); $(".pillar-head", p).setAttribute("aria-expanded", "true"); }
    });
  });


  /* ---------- Temas: caption swaps with a blur bridge ---------- */
  const caption = $("[data-temas-caption]");
  const temaBtns = $$("[data-temas] button");
  const setTema = (btn) => {
    if (btn.classList.contains("is-active")) return;
    temaBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    if (!reduce) {
      const ring = document.createElement("span");
      ring.className = "temas-ripple";
      $(".temas-card").append(ring);
      ring.animate([{ transform: "scale(.55)", opacity: .9 }, { transform: "scale(1)", opacity: 0 }], { duration: 700, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }).onfinish = () => ring.remove();
    }
    const swap = () => { caption.textContent = btn.dataset.caption; };
    if (hasGsap && !reduce) {
      gsap.killTweensOf(caption);
      gsap.to(caption, { opacity: 0, filter: "blur(4px)", scale: 0.97, duration: 0.14, ease: "power1.out", onComplete: () => {
        swap();
        gsap.to(caption, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.32, ease: "expo.out" });
      } });
    } else swap();
  };
  temaBtns.forEach((b) => {
    b.addEventListener("click", () => setTema(b));
    b.addEventListener("focus", () => setTema(b));
    if (finePointer) b.addEventListener("mouseenter", () => setTema(b));
  });

  /* ---------- FAQ: animated details, exit faster than enter ---------- */
  $$(".faq details").forEach((d) => {
    const summary = $("summary", d);
    const body = $(".faq-body", d);
    summary.addEventListener("click", (e) => {
      if (!hasGsap || reduce) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, opacity: 0, duration: 0.22, ease: "power2.out", onComplete: () => { d.open = false; gsap.set(body, { clearProps: "all" }); } });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.45, ease: "expo.out", clearProps: "height" });
      }
    });
  });

  const curtain = $("[data-curtain]");
  const steps = $$(".step");
  if (!hasGsap || reduce) {
    curtain?.remove();
    heroRings.grow = 1; heroRings.draw();
    steps.forEach((s) => s.classList.add("is-on"));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Nav: hide on the way down, return on the way up ---------- */
  const nav = $("[data-nav]");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle("is-scrolled", y > 40);
      nav.classList.toggle("is-hidden", self.direction === 1 && y > 320);
    },
  });

  /* ---------- Magnetic buttons (decorative, so a spring is fine) ---------- */
  if (finePointer) {
    $$(".magnetic").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.38);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  const mobileQuery = () => window.matchMedia("(max-width: 860px)");

  /* ---------- Word splitter ---------- */
  const splitWords = (el, cls, masked = true) => {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const outer = document.createElement("span"); outer.className = cls;
            if (masked) {
              const inner = document.createElement("span"); inner.textContent = part;
              outer.append(inner); out.push(inner);
            } else { outer.textContent = part; out.push(outer); }
            frag.append(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return out;
  };

  /* ---------- Section headings rise out of a mask ---------- */
  $$(".enfoque-intro h2, .temas h2, .proceso h2, .about-copy h2, .faq h2").forEach((h) => {
    h.classList.add("h-split");
    const words = splitWords(h, "w");
    gsap.from(words, {
      yPercent: 110, rotate: 3, duration: 1.1, stagger: 0.06, ease: "expo.out",
      scrollTrigger: { trigger: h, start: "top 85%" },
    });
  });

  /* ---------- Opening: curtain lifts, hero assembles ---------- */
  const titleWords = splitWords($("[data-split]"), "w");
  gsap.set(titleWords, { yPercent: 115, rotate: 4 });
  gsap.set("[data-hero-fade]", { opacity: 0, y: 18 });
  gsap.set("[data-portrait]", { scale: 0.85, opacity: 0 });
  gsap.set("[data-orbit]", { opacity: 0 });

  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .from(".curtain img", { scale: 0.92, opacity: 0, duration: 0.7 })
    .to(".curtain img", { scale: 0.9, opacity: 0, duration: 0.35, ease: "power2.in" }, "+=0.15")
    .to(curtain, { clipPath: "inset(0% 0% 100% 0% round 0 0 48px 48px)", duration: 0.9, ease: "power4.inOut" }, "<0.1")
    .add(() => curtain.remove())
    .to(titleWords, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.08 }, "-=0.45")
    .to("[data-portrait]", { scale: 1, opacity: 1, duration: 1.4 }, "<")
    .to(heroRings, { grow: 1, duration: 2, ease: "power3.out" }, "<")
    .to("[data-orbit]", { opacity: 1, duration: 1.2 }, "<0.3")
    .to("[data-hero-fade]", { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, "<0.1");

  // Hero leaves: portrait drifts, rings open up
  gsap.to("[data-portrait]", {
    yPercent: -16, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ---------- Manifesto: panel opens, words light up ---------- */
  gsap.fromTo(".manifesto-panel", { scale: 0.9, borderRadius: 120 }, {
    scale: 1, borderRadius: 32, ease: "none",
    scrollTrigger: { trigger: "[data-manifesto]", start: "top bottom", end: "top top", scrub: true },
  });
  // Pinned: as you read, the three conditions travel toward each other and "vos" appears where they meet
  const mWords = splitWords($("[data-scrub]"), "sw", false);
  const vennCircles = $$("[data-venn-c]");
  const offsets = mobileQuery().matches ? [[0, -70], [-80, 50], [80, 50]] : [[0, -90], [-110, 60], [110, 60]];
  const mtl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: "[data-manifesto]", start: "top top", end: "+=140%", scrub: 0.6, pin: true, anticipatePin: 1 },
  });
  vennCircles.forEach((c, i) => {
    mtl.fromTo(c, { x: offsets[i][0], y: offsets[i][1] }, { x: 0, y: 0, duration: 0.85, ease: "power2.inOut" }, 0);
  });
  mtl.fromTo(mWords, { opacity: 0.18 }, { opacity: 1, duration: 0.08, stagger: 0.8 / mWords.length }, 0.05)
    // grow the radius itself: exact center, no transform-origin math on SVG groups
    .fromTo("[data-venn-core] circle", { attr: { r: 0 } }, { attr: { r: 30 }, duration: 0.12, ease: "back.out(2.2)" }, 0.82)
    .fromTo("[data-venn-core] text", { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.88)
    .to(vennCircles, { duration: 0.05 }, 0.95);

  /* ---------- Ribbon: drifts on its own, speeds up with your scroll ---------- */
  const track = $("[data-ribbon]");
  const half = () => track.scrollWidth / 2;
  let x = 0, dir = -1, vel = 0;
  gsap.ticker.add((_, dt) => {
    x += dir * (0.04 + vel) * dt;
    const h = half();
    if (x <= -h) x += h;
    if (x > 0) x -= h;
    vel *= 0.92;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
  ScrollTrigger.create({
    trigger: ".ribbon", start: "top bottom", end: "bottom top",
    onUpdate: (self) => { dir = self.direction === 1 ? -1 : 1; vel = Math.min(Math.abs(self.getVelocity()) / 4000, 0.6); },
  });

  /* ---------- Enfoque ---------- */
  gsap.from(".pillar", {
    x: 48, opacity: 0, duration: 1.1, stagger: 0.1, ease: "expo.out",
    scrollTrigger: { trigger: ".pillars", start: "top 80%" },
  });

  /* ---------- Temas ---------- */
  gsap.from(".temas-list li", {
    y: 40, opacity: 0, duration: 1, stagger: 0.05, ease: "expo.out",
    scrollTrigger: { trigger: ".temas-list", start: "top 82%" },
  });
  gsap.from(".temas-card", {
    scale: 0.9, opacity: 0, duration: 1.4, ease: "expo.out",
    scrollTrigger: { trigger: ".temas-card", start: "top 85%" },
  });

  /* ---------- Proceso: the line draws, steps switch on ---------- */
  const fill = $("[data-timeline-fill]");
  const mobile = window.matchMedia("(max-width: 860px)");
  const pathEl = $("[data-path-draw]");
  const pathSvg = $("[data-path]");
  const pathDot = $("[data-path-dot]");
  // The stroke is non-scaling, so dashes live in screen pixels. Measure the path in
  // screen space once per layout, then drive the dash and the dot from the same number.
  const len = pathEl.getTotalLength();
  let table = [], screenLen = 0;
  const measure = () => {
    const w = pathSvg.clientWidth, h = pathSvg.clientHeight;
    table = []; screenLen = 0;
    let prev = null;
    for (let i = 0; i <= 240; i++) {
      const pt = pathEl.getPointAtLength((len * i) / 240);
      const x = (pt.x / 1000) * w, y = (pt.y / 120) * h;
      if (prev) screenLen += Math.hypot(x - prev.x, y - prev.y);
      table.push({ x, y, s: screenLen });
      prev = { x, y };
    }
  };
  const drawn = { p: 0 };
  const placeDot = (p) => {
    if (!table.length) measure();
    const target = screenLen * p;
    let i = table.findIndex((r) => r.s >= target);
    if (i <= 0) i = Math.max(i, 1);
    const a = table[i - 1], b = table[i] || a;
    const k = b.s === a.s ? 0 : (target - a.s) / (b.s - a.s);
    const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
    pathEl.style.strokeDasharray = `${target} ${screenLen + 10}`;
    pathDot.style.transform = `translate(${x}px, ${y - 120}px)`;
  };
  const setupTimeline = () => {
    if (!mobile.matches) {
      return gsap.fromTo(drawn, { p: 0 }, {
        p: 1, ease: "none",
        onUpdate() { placeDot(drawn.p); },
        scrollTrigger: {
          trigger: "[data-timeline]", start: "top 80%", end: "bottom 55%", scrub: 0.6,
          onUpdate: (self) => {
            steps.forEach((s, i) => s.classList.toggle("is-on", self.progress >= i / steps.length + 0.02));
          },
        },
      });
    }
    const prop = "scaleY";
    gsap.set(fill, { scaleX: 1, scaleY: 1 });
    return gsap.fromTo(fill, { [prop]: 0 }, {
      [prop]: 1, ease: "none",
      scrollTrigger: {
        trigger: "[data-timeline]", start: mobile.matches ? "top 70%" : "top 75%", end: mobile.matches ? "bottom 60%" : "top 30%", scrub: 0.5,
        onUpdate: (self) => steps.forEach((s, i) => s.classList.toggle("is-on", self.progress >= i / steps.length + 0.01)),
      },
    });
  };
  let tl = setupTimeline();
  ScrollTrigger.addEventListener("refresh", () => { if (!mobile.matches) { measure(); placeDot(drawn.p); } });
  if (!mobile.matches) placeDot(0);
  mobile.addEventListener("change", () => { tl.scrollTrigger.kill(); tl.kill(); tl = setupTimeline(); ScrollTrigger.refresh(); });

  /* ---------- Sobre mí: the portrait opens, the word drifts behind it ---------- */
  gsap.fromTo("[data-about-portrait]", { clipPath: "inset(100% 0% 0% 0% round 999px 999px 32px 32px)" }, {
    clipPath: "inset(0% 0% 0% 0% round 999px 999px 32px 32px)", duration: 1.4, ease: "power4.inOut",
    scrollTrigger: { trigger: "[data-about-portrait]", start: "top 80%" },
  });
  gsap.from("[data-about-portrait] img", {
    scale: 1.3, duration: 1.8, ease: "expo.out",
    scrollTrigger: { trigger: "[data-about-portrait]", start: "top 80%" },
  });
  gsap.set("[data-echo]", { translate: "none", yPercent: -50 });
  gsap.fromTo("[data-echo]", { xPercent: -38 }, {
    xPercent: -62, ease: "none",
    scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true },
  });

  /* ---------- CTA: panel opens ---------- */
  gsap.fromTo(".cta-panel", { scale: 0.92, borderRadius: 120 }, {
    scale: 1, borderRadius: 32, ease: "none",
    scrollTrigger: { trigger: ".cta", start: "top bottom", end: "top 20%", scrub: true },
  });
  const ctaWords = splitWords($("[data-cta-title]"), "w");
  gsap.from(ctaWords, {
    yPercent: 115, duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".cta-panel", start: "top 60%" },
  });
})();
