(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Rings: the person at the center ---------- */
  const canvas = $("[data-rings]");
  const stage = $("[data-stage]");
  const rings = (() => {
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    const state = { w: 0, h: 0, dpr: 1, t: 0, grow: reduce ? 1 : 0, px: 0, py: 0, tx: 0, ty: 0, running: false, color: "106, 76, 156" };
    const readColor = () => {
      state.color = getComputedStyle(document.documentElement).getPropertyValue("--ring").trim() || state.color;
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = r.width; state.h = r.height;
      canvas.width = r.width * state.dpr; canvas.height = r.height * state.dpr;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      draw();
    };
    const draw = () => {
      const { w, h, t, grow, px, py, color } = state;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const base = w * 0.19;
      const count = 7;
      const gap = (w * 0.5 - base) / count;
      for (let i = 0; i < count; i++) {
        const k = (i + 1) / count;
        const breathe = reduce ? 0 : Math.sin(t * 0.9 - i * 0.55) * gap * 0.16;
        const r = (base + gap * (i + 0.6) + breathe) * (0.6 + 0.4 * grow);
        const ox = px * 18 * k, oy = py * 18 * k;
        const alpha = (0.5 - i * 0.055) * grow;
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${Math.max(alpha, 0.05)})`;
        ctx.lineWidth = i === 0 ? 1.4 : 1;
        ctx.stroke();
        if (i % 2 === 1) {
          const a = t * (0.25 + i * 0.03) + i * 1.7;
          ctx.beginPath();
          ctx.arc(cx + ox + Math.cos(a) * r, cy + oy + Math.sin(a) * r, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${0.85 * grow})`;
          ctx.fill();
        }
      }
    };
    const loop = () => {
      if (!state.running) return;
      state.t += 0.016;
      state.px += (state.tx - state.px) * 0.06;
      state.py += (state.ty - state.py) * 0.06;
      draw();
      requestAnimationFrame(loop);
    };
    const start = () => { if (reduce || state.running) return; state.running = true; requestAnimationFrame(loop); };
    const stop = () => { state.running = false; };

    readColor();
    resize();
    new ResizeObserver(resize).observe(canvas);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { readColor(); draw(); });
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);
    if (finePointer && !reduce) {
      stage.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        state.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        state.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      stage.addEventListener("pointerleave", () => { state.tx = 0; state.ty = 0; });
    }
    return state;
  })();

  /* ---------- Pillars accordion (one open) ---------- */
  const pillars = $$(".pillar");
  pillars.forEach((p) => {
    $(".pillar-head", p).addEventListener("click", () => {
      const open = p.classList.contains("is-open");
      pillars.forEach((o) => { o.classList.remove("is-open"); $(".pillar-head", o).setAttribute("aria-expanded", "false"); });
      if (!open) { p.classList.add("is-open"); $(".pillar-head", p).setAttribute("aria-expanded", "true"); }
    });
  });

  /* ---------- Temas caption ---------- */
  const caption = $("[data-temas-caption]");
  const temaBtns = $$("[data-temas] button");
  const setTema = (btn) => {
    if (btn.classList.contains("is-active")) return;
    temaBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    const swap = () => { caption.textContent = btn.dataset.caption; };
    if (hasGsap && !reduce) {
      gsap.to(caption, { opacity: 0, y: 6, duration: 0.18, ease: "power2.in", onComplete: () => {
        swap(); gsap.fromTo(caption, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" });
      } });
    } else swap();
  };
  temaBtns.forEach((b) => {
    b.addEventListener("click", () => setTema(b));
    b.addEventListener("focus", () => setTema(b));
    if (finePointer) b.addEventListener("mouseenter", () => setTema(b));
  });

  /* ---------- FAQ: animated details ---------- */
  $$(".faq details").forEach((d) => {
    const summary = $("summary", d);
    const body = $(".faq-body", d);
    summary.addEventListener("click", (e) => {
      if (!hasGsap || reduce) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, opacity: 0, duration: 0.4, ease: "power3.inOut", onComplete: () => { d.open = false; gsap.set(body, { clearProps: "all" }); } });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.6, ease: "expo.out", clearProps: "height" });
      }
    });
  });

  if (!hasGsap) return;
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

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$(".magnetic").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.45)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.45)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.38);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Steps light up as the line passes ---------- */
  const steps = $$(".step");
  const fill = $("[data-timeline-fill]");
  const mobile = window.matchMedia("(max-width: 860px)");

  if (reduce) {
    steps.forEach((s) => s.classList.add("is-on"));
    return;
  }

  /* ---------- Hero entrance ---------- */
  const title = $("[data-split]");
  const splitWords = (el, cls) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const outer = document.createElement("span"); outer.className = cls;
            const inner = document.createElement("span"); inner.textContent = part;
            outer.append(inner); frag.append(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$(`.${cls} > span`, el);
  };
  const titleWords = splitWords(title, "w");
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .from(titleWords, { yPercent: 115, rotate: 4, duration: 1.3, stagger: 0.08 }, 0.15)
    .from("[data-hero-fade]", { opacity: 0, y: 18, duration: 1.1, stagger: 0.12 }, 0.55)
    .from("[data-portrait]", { scale: 0.6, opacity: 0, duration: 1.6 }, 0.2)
    .to(rings, { grow: 1, duration: 2.2, ease: "power3.out" }, 0.3);

  // Portrait drifts gently as the hero leaves
  gsap.to("[data-portrait]", {
    yPercent: -18, scale: 0.92, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ---------- Manifesto: words light up with scroll ---------- */
  const scrub = $("[data-scrub]");
  const mWords = (() => {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const s = document.createElement("span"); s.className = "sw"; s.textContent = part;
            out.push(s); frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(scrub);
    return out;
  })();
  gsap.fromTo(mWords, { opacity: 0.14, filter: "blur(2px)" }, {
    opacity: 1, filter: "blur(0px)", stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: scrub, start: "top 78%", end: "bottom 50%", scrub: 0.6 },
  });

  /* ---------- Enfoque ---------- */
  gsap.from(".pillar", {
    x: 48, opacity: 0, duration: 1.1, stagger: 0.12, ease: "expo.out",
    scrollTrigger: { trigger: ".pillars", start: "top 80%" },
  });

  /* ---------- Temas ---------- */
  gsap.from(".temas-list li", {
    y: 40, opacity: 0, duration: 1, stagger: 0.05, ease: "expo.out",
    scrollTrigger: { trigger: ".temas-list", start: "top 82%" },
  });

  /* ---------- Proceso: the line draws, steps switch on ---------- */
  const setupTimeline = () => {
    const prop = mobile.matches ? "scaleY" : "scaleX";
    gsap.set(fill, { scaleX: 1, scaleY: 1 });
    return gsap.fromTo(fill, { [prop]: 0 }, {
      [prop]: 1, ease: "none",
      scrollTrigger: {
        trigger: "[data-timeline]", start: mobile.matches ? "top 70%" : "top 75%", end: mobile.matches ? "bottom 60%" : "top 30%", scrub: 0.5,
        onUpdate: (self) => {
          steps.forEach((s, i) => s.classList.toggle("is-on", self.progress >= i / steps.length + 0.01));
        },
      },
    });
  };
  let tl = setupTimeline();
  mobile.addEventListener("change", () => { tl.scrollTrigger.kill(); tl.kill(); tl = setupTimeline(); ScrollTrigger.refresh(); });

  /* ---------- Sobre mí: the portrait opens ---------- */
  gsap.fromTo("[data-about-portrait]", { clipPath: "inset(22% 22% 22% 22% round 999px)" }, {
    clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.6, ease: "expo.out",
    scrollTrigger: { trigger: "[data-about-portrait]", start: "top 78%" },
    onComplete: () => gsap.set("[data-about-portrait]", { clearProps: "clipPath" }),
  });
  gsap.from("[data-about-portrait] img", {
    scale: 1.25, duration: 1.8, ease: "expo.out",
    scrollTrigger: { trigger: "[data-about-portrait]", start: "top 78%" },
  });

  /* ---------- CTA ---------- */
  const ctaWords = splitWords($("[data-cta-title]"), "w");
  gsap.from(ctaWords, {
    yPercent: 115, duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".cta", start: "top 75%" },
  });
})();
