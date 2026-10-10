(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mobileMQ = matchMedia("(max-width: 767px)");

  /* ---------- entrada ---------- */
  var ready = function () { requestAnimationFrame(function () { document.documentElement.classList.add("is-loaded"); }); };
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(ready);
  } else ready();

  /* ---------- gota ---------- */
  var drop = window.SonylumDrop.create($("#drop"), $("#dropFallback"));
  var SH = window.SonylumDrop.SHAPES;

  var sections = $$("[data-drop]").map(function (el) {
    var parse = function (attr) {
      var p = (el.getAttribute(attr) || el.getAttribute("data-drop")).split(/\s+/);
      return { x: +p[0], y: +p[1], size: +p[2], shape: p[3], spread: +p[4] };
    };
    return {
      el: el,
      d: parse("data-drop"),
      m: parse("data-drop-m"),
      seq: el.dataset.seq ? el.dataset.seq.split(" ") : null,
      env: $("img[data-env]", el),
      bgs: el.id === "metamorfosis" ? $$(".meta-bgs img", el) : null
    };
  });

  var meta = $("#metamorfosis");
  var metaSteps = $$(".meta-step", meta);
  var metaBar = $("#metaBar");
  var metaBgs = $$(".meta-bgs img", meta);
  var metaIdx = 0;

  function sectionProgress(el, H) {
    var r = el.getBoundingClientRect();
    var span = r.height - H;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  }

  function choreograph() {
    var W = innerWidth, H = innerHeight, mob = mobileMQ.matches;
    var unit = Math.min(W, H);
    var tot = 0, x = 0, y = 0, r = 0, sp = 0, w = [0, 0, 0, 0];
    var best = null, bestW = 0;

    sections.forEach(function (sec) {
      var rc = sec.el.getBoundingClientRect();
      var ov = Math.max(0, Math.min(rc.bottom, H) - Math.max(rc.top, 0)) / H;
      if (ov <= 0) return;
      var k = ov * ov * ov;
      var st = mob ? sec.m : sec.d;
      var shape;
      if (sec.seq) {
        var p = sectionProgress(sec.el, H);
        var f = p * (sec.seq.length - 1);
        var i0 = Math.floor(f), i1 = Math.min(i0 + 1, sec.seq.length - 1);
        // mantener cada forma un rato y transformar rápido entre medio
        var tt = f - i0; tt = tt < 0.35 ? 0 : tt > 0.65 ? 1 : (tt - 0.35) / 0.3;
        tt = tt * tt * (3 - 2 * tt);
        var a = SH[sec.seq[i0]], b = SH[sec.seq[i1]];
        shape = [0, 1, 2, 3].map(function (j) { return a[j] + (b[j] - a[j]) * tt; });
      } else shape = SH[st.shape];
      x += st.x * W * k; y += st.y * H * k; r += st.size * unit * k; sp += st.spread * k;
      for (var j = 0; j < 4; j++) w[j] += shape[j] * k;
      tot += k;
      if (k > bestW) { bestW = k; best = sec; }
    });

    if (tot > 0) {
      drop.setTarget(x / tot, y / tot, r / tot, w.map(function (v) { return v / tot; }), sp / tot);
      var envEl = best ? (best.bgs ? best.bgs[metaIdx] : best.env) : null;
      drop.setEnv(envEl && bestW > 0.25 ? envEl : null);
    }

    // pasos de la metamorfosis
    if (meta && !reduce) {
      var mp = sectionProgress(meta, H);
      var idx = Math.min(metaSteps.length - 1, Math.round(mp * (metaSteps.length - 1)));
      if (idx !== metaIdx) {
        metaSteps[metaIdx].classList.remove("is-on");
        metaSteps[idx].classList.add("is-on");
        metaBgs[metaIdx].classList.remove("is-on");
        metaBgs[idx].classList.add("is-on");
        metaIdx = idx;
      }
      metaBar.style.transform = "scaleX(" + mp.toFixed(4) + ")";
    }

    pan(W, H, mob);
    experimental(W, H, mob);
    requestAnimationFrame(choreograph);
  }

  /* ---------- paneo horizontal de proyectos ---------- */
  var works = $("#proyectos"), track = $("#worksTrack"), cards = $$(".work", track);
  var panDist = 0;
  function measurePan() {
    if (reduce || mobileMQ.matches) { works.style.removeProperty("--pan-h"); panDist = 0; track.style.transform = ""; return; }
    panDist = Math.max(0, track.scrollWidth - innerWidth);
    works.style.setProperty("--pan-h", (innerHeight + panDist) + "px");
  }
  function pan(W, H, mob) {
    if (panDist > 0) {
      var p = sectionProgress(works, H);
      track.style.transform = "translate3d(" + (-p * panDist).toFixed(1) + "px,0,0)";
    }
    cards.forEach(function (c) {
      var rc = c.getBoundingClientRect();
      var near = Math.abs(rc.left + rc.width / 2 - W / 2) < W * 0.42 && rc.top < H && rc.bottom > 0;
      c.classList.toggle("is-near", near);
    });
  }
  addEventListener("resize", measurePan);
  addEventListener("load", measurePan);
  mobileMQ.addEventListener("change", measurePan);
  measurePan();

  requestAnimationFrame(choreograph);


  /* ---------- capa experimental: especímenes, archivo, velocidad de scroll ---------- */
  var specimens = $$(".specimen").map(function (el) { return { el: el, d: +el.dataset.depth || 0, ph: Math.random() * 6 }; });
  var rows = $$(".archive-row").map(function (el) { return { el: el, dir: +el.dataset.dir || 1, plates: $$(".plate", el) }; });
  var archive = $("#archivo");
  var lastY = scrollY, vel = 0, mxN = 0, myN = 0, tExp = 0;
  if (finePointer) addEventListener("pointermove", function (e) { mxN = e.clientX / innerWidth - 0.5; myN = e.clientY / innerHeight - 0.5; }, { passive: true });

  function experimental(W, H, mob) {
    var y = scrollY;
    vel += ((y - lastY) - vel) * 0.18; lastY = y;
    tExp += 0.016;
    if (reduce) return;
    var skew = Math.max(-8, Math.min(8, vel * 0.12));

    specimens.forEach(function (sp) {
      var ty = -y * sp.d * 0.6 + Math.sin(tExp * 0.8 + sp.ph) * 8 + myN * sp.d * 60;
      var tx = Math.cos(tExp * 0.6 + sp.ph) * 6 + mxN * sp.d * 80;
      sp.el.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0) skewY(" + (skew * 0.5).toFixed(2) + "deg)";
    });

    if (archive) {
      var r = archive.getBoundingClientRect();
      if (r.bottom > 0 && r.top < H) {
        var p = (H - r.top) / (H + r.height); // 0..1 mientras cruza la pantalla
        rows.forEach(function (row) {
          var x = (p - 0.5) * row.dir * W * 0.9;
          row.el.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0) skewX(" + (-skew * row.dir).toFixed(2) + "deg)";
          if (!finePointer) {
            row.plates.forEach(function (pl) {
              var pr = pl.getBoundingClientRect();
              pl.classList.toggle("is-lit", Math.abs(pr.left + pr.width / 2 - W / 2) < pr.width * 0.6);
            });
          }
        });
      }
    }
  }

  /* ---------- vista previa de cada sitio ---------- */
  var peek = $("#sitePeek"), peekImg = $("#peekImg"), peekFbImg = $("#peekFbImg");
  var peekUrl = $("#peekUrl"), peekName = $("#peekName"), peekFbUrl = $("#peekFbUrl"), peekGo = $("#peekGo");
  var lastPointer = "mouse", peekFor = null, px = 0, py = 0, pfx = 0, pfy = 0, peekRaf = 0;
  addEventListener("pointerdown", function (e) { lastPointer = e.pointerType; }, true);

  function shotFor(card, done) {
    var site = card.dataset.site;
    var tries = [card.dataset.shot, "https://s.wordpress.com/mshots/v1/" + encodeURIComponent("https://" + site) + "?w=760&h=475"];
    var i = 0;
    peekImg.onload = function () { if (peekFor === card) peek.classList.remove("no-shot"); };
    peekImg.onerror = function () {
      i++;
      if (i < tries.length) peekImg.src = tries[i];
      else if (peekFor === card) peek.classList.add("no-shot");
    };
    peek.classList.add("no-shot"); // mientras carga, se ve la ficha
    peekImg.src = tries[0];
  }
  function openPeek(card, touch) {
    peekFor = card;
    peekUrl.textContent = card.dataset.site;
    peekFbUrl.textContent = card.dataset.site;
    peekName.textContent = card.dataset.name;
    peekFbImg.src = $("img", card).getAttribute("src");
    peekGo.href = card.href;
    peek.classList.toggle("is-touch", !!touch);
    peek.hidden = false;
    shotFor(card);
    if (!touch && !peekRaf) { pfx = px; pfy = py; peekRaf = requestAnimationFrame(followPeek); }
  }
  function closePeek() { peek.hidden = true; peekFor = null; }
  function followPeek() {
    if (peek.hidden || peek.classList.contains("is-touch")) { peekRaf = 0; return; }
    pfx += (px - pfx) * 0.18; pfy += (py - pfy) * 0.18;
    var w = peek.offsetWidth, h = peek.offsetHeight;
    var x = Math.min(innerWidth - w - 16, pfx + 24), y = Math.min(innerHeight - h - 16, Math.max(80, pfy - h * 0.4));
    if (pfx + 24 + w > innerWidth - 16) x = pfx - w - 24;
    peek.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
    peekRaf = requestAnimationFrame(followPeek);
  }
  $$(".work").forEach(function (card) {
    card.addEventListener("mouseenter", function () { if (finePointer) openPeek(card, false); });
    card.addEventListener("mouseleave", function () { if (finePointer) closePeek(); });
    card.addEventListener("click", function (e) {
      if (finePointer && lastPointer === "mouse") return; // en desktop el click abre el sitio
      if (peekFor === card && !peek.hidden) return;   // segundo toque: ir al sitio
      e.preventDefault();
      openPeek(card, true);
    });
  });
  addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; }, { passive: true });
  $("#peekClose").addEventListener("click", closePeek);
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !peek.hidden) closePeek(); });
  addEventListener("scroll", function () { if (!peek.hidden && peek.classList.contains("is-touch")) { var r = peekFor && peekFor.getBoundingClientRect(); if (!r || r.bottom < 0 || r.top > innerHeight) closePeek(); } }, { passive: true });

  /* ---------- reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  $$(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- menú mobile ---------- */
  var menuBtn = $("#menuBtn"), sheet = $("#sheet");
  function setMenu(open) {
    sheet.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.innerHTML = open ? '<i class="ph ph-x" aria-hidden="true"></i>' : '<i class="ph ph-list" aria-hidden="true"></i>';
    menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  menuBtn.addEventListener("click", function () { setMenu(sheet.hidden); });
  $$("a", sheet).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) { setMenu(false); menuBtn.focus(); } });

  /* ---------- vista previa flotante en capacidades ---------- */
  var caps = $("#capacidades"), float = $("#capFloat");
  if (finePointer && caps && float) {
    var inner = $(".cap-float-inner", float);
    var imgs = $$(".cap-img", caps).map(function (src) {
      var im = document.createElement("img");
      im.alt = ""; im.src = src.getAttribute("src"); im.dataset.remote = src.dataset.remote;
      inner.appendChild(im);
      return im;
    });
    var fx = 0, fy = 0, mx = 0, my = 0, active = false, raf = 0;
    var tick = function () {
      fx += (mx - fx) * 0.14; fy += (my - fy) * 0.14;
      float.style.translate = fx.toFixed(1) + "px " + fy.toFixed(1) + "px";
      if (active || Math.abs(mx - fx) > 0.5) raf = requestAnimationFrame(tick); else raf = 0;
    };
    $$(".cap a", caps).forEach(function (a) {
      a.addEventListener("mouseenter", function () {
        var i = +a.dataset.preview;
        imgs.forEach(function (im, j) { im.classList.toggle("is-on", j === i); });
        if (!active) { fx = mx; fy = my; }
        active = true; float.classList.add("is-on");
        if (!raf) raf = requestAnimationFrame(tick);
      });
    });
    $(".caps-list", caps).addEventListener("mouseleave", function () { active = false; float.classList.remove("is-on"); });
    caps.addEventListener("mousemove", function (e) {
      var rc = caps.getBoundingClientRect();
      var fw = float.offsetWidth, fh = float.offsetHeight;
      mx = Math.min(rc.width - fw - 16, Math.max(16, e.clientX - rc.left + 28));
      my = e.clientY - rc.top - fh / 2;
      if (!raf && active) raf = requestAnimationFrame(tick);
    });
  }

  /* ---------- laboratorio ---------- */
  function radio(group, attr, cb) {
    $$("[" + attr + "]", group).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("[" + attr + "]", group).forEach(function (o) { o.setAttribute("aria-checked", String(o === b)); });
        cb(b.getAttribute(attr));
      });
    });
  }
  var lab = $("#lab");
  if (lab) {
    var segs = $$(".seg", lab);
    radio(segs[0], "data-tint", function (v) { drop.setTint(v); });
    radio(segs[1], "data-shape", function (v) { drop.setOverride(v === "auto" ? null : v); });
    var energy = $("#energy"), out = $("#energyOut");
    energy.addEventListener("input", function () { out.textContent = energy.value; drop.setEnergy(energy.value / 100); });
    $("#splash").addEventListener("click", function () { drop.splash(); });
    var size = $("#size"), sizeOut = $("#sizeOut");
    size.addEventListener("input", function () { sizeOut.textContent = size.value; drop.setScale(size.value / 100); });
    $("#reset").addEventListener("click", function () {
      segs[0].querySelector('[data-tint="rojo"]').click();
      segs[1].querySelector('[data-shape="auto"]').click();
      energy.value = 55; out.textContent = "55"; drop.setEnergy(0.55);
      size.value = 100; sizeOut.textContent = "100"; drop.setScale(1);
    });
  }
})();
