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
    const s = { w: 0, h: 0, t: Math.random() * 10, grow: reduce ? 1 : opts.grow ?? 1, boost: 0, px: 0, py: 0, tx: 0, ty: 0, running: false, color: "" };
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
    };
    const loop = () => {
      if (!s.running) return;
      s.t += 0.016;
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
    return s;
  };

  const heroRings = createRings($('[data-rings]:not([data-rings="panel"]):not([data-rings="cta"])'), {
    colorVar: "--ring", count: 7, inner: 0.38, alpha: 0.5, parallax: 18, dots: true, grow: 0,
    span: (w) => w * 0.5, pointerArea: $("[data-stage]"),
  });
  const panelRings = createRings($('[data-rings="panel"]'), {
    colorVar: "--ring-panel", count: 11, inner: 0.12, alpha: 0.3, parallax: 30, dots: true,
    span: (w, h) => Math.hypot(w, h) * 0.55, pointerArea: $("[data-manifesto]"),
  });
  const ctaRings = createRings($('[data-rings="cta"]'), {
    colorVar: "--ring-panel", count: 10, inner: 0.1, alpha: 0.32, parallax: 24, dots: true,
    span: (w, h) => Math.hypot(w, h) * 0.5, pointerArea: $("[data-cta]"),
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
    scrollTrigger: { trigger: "[data-manifesto]", start: "top bottom", end: "top 15%", scrub: true },
  });
  const mWords = splitWords($("[data-scrub]"), "sw", false);
  gsap.fromTo(mWords, { opacity: 0.12, filter: "blur(3px)" }, {
    opacity: 1, filter: "blur(0px)", stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: "[data-scrub]", start: "top 75%", end: "bottom 45%", scrub: 0.6 },
  });

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
  const setupTimeline = () => {
    const prop = mobile.matches ? "scaleY" : "scaleX";
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

  /* ---------- CTA: panel opens, rings answer the button ---------- */
  gsap.fromTo(".cta-panel", { scale: 0.92, borderRadius: 120 }, {
    scale: 1, borderRadius: 32, ease: "none",
    scrollTrigger: { trigger: ".cta", start: "top bottom", end: "top 20%", scrub: true },
  });
  const ctaWords = splitWords($("[data-cta-title]"), "w");
  gsap.from(ctaWords, {
    yPercent: 115, duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".cta-panel", start: "top 60%" },
  });
  const ctaBtn = $(".cta .btn");
  if (finePointer) {
    ctaBtn.addEventListener("pointerenter", () => gsap.to(ctaRings, { boost: 1, duration: 0.8, ease: "expo.out" }));
    ctaBtn.addEventListener("pointerleave", () => gsap.to(ctaRings, { boost: 0, duration: 0.5, ease: "power2.out" }));
  }
})();
