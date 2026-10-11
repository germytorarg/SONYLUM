(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- píldoras de tecnologías ---------- */
  var A = ["Web", "UX/UI", "Branding", "SEO técnico", "React", "Three.js", "WebGL", "Webhooks", "Supabase", "Cloudflare"];
  var B = ["IA Agents", "Automatización", "Prompts", "Reels 9:16", "Edición", "Motion", "Cámara", "Fotografía", "Campañas", "Drone"];
  function fill(el, list) {
    var html = list.concat(list).map(function (t) { return '<span class="chip">' + t.toUpperCase() + "</span>"; }).join("");
    el.innerHTML = html;
  }
  fill($("#chipsA"), A);
  fill($("#chipsB"), B);

  /* ---------- pantalla activa: riel, cuadrado, palabra de fondo ---------- */
  var screens = $$(".scr");
  var rail = $$(".rail a");
  var badge = $("#badge");
  var active = null;
  function activate(sec) {
    if (active === sec) return;
    if (active) active.classList.remove("is-active");
    active = sec;
    sec.classList.add("is-active");
    var id = "#" + sec.id;
    rail.forEach(function (a) {
      var on = a.getAttribute("href") === id;
      a.classList.toggle("is-on", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    window.sonyWords = sec.dataset.words.split("|");
    if (window.sonyCube) window.sonyCube.setWords(window.sonyWords);
    badge.classList.add("swap");
    setTimeout(function () {
      badge.innerHTML = "<b>" + sec.dataset.badge + "</b> / LIVE SYSTEM";
      badge.classList.remove("swap");
    }, reduce ? 0 : 220);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("in"); });
  }, { threshold: 0.15 });
  // la sección activa es la que cruza la línea del 45% de la pantalla (sirve con secciones cortas)
  var scrT = 0;
  function pickActive() {
    scrT = 0;
    var line = innerHeight * 0.45, pick = screens[0];
    for (var i = 0; i < screens.length; i++) { if (screens[i].getBoundingClientRect().top <= line) pick = screens[i]; }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) pick = screens[screens.length - 1];
    activate(pick);
  }
  addEventListener("scroll", function () { if (!scrT) scrT = requestAnimationFrame(pickActive); }, { passive: true });
  addEventListener("resize", pickActive, { passive: true });
  screens.forEach(function (s) { io.observe(s); });
  activate(screens[0]);
  requestAnimationFrame(function () { screens[0].classList.add("in"); });

  /* ---------- vidrio: desfase del reflejo por tarjeta y luz que sigue al puntero ---------- */
  [".cards .card", ".flips .flip-face", ".cvs .cv", ".works li"].forEach(function (sel) {
    $$(sel).forEach(function (el, i) { el.style.setProperty("--i", sel === ".flips .flip-face" ? Math.floor(i / 2) : i); });
  });
  if (finePointer) {
    $$(".card, .cv").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    });
  }

  /* ---------- portada en celular: el cubo se centra en el espacio libre sobre el panel ---------- */
  var heroEye = $("#s1 .eyebrow"), lastHero = 0;
  function placeHero() {
    if (innerWidth >= 1024) { root.style.removeProperty("--cy"); root.style.removeProperty("--spread"); window.sonyHeroY = 0; lastHero = 0; return; }
    var glassTop = heroEye.getBoundingClientRect().top + scrollY - 22;   // borde superior del vidrio
    var cy = Math.round((64 + glassTop) / 2);                            // entre el logo y el panel
    var spread = Math.round(Math.min(innerHeight * 0.12, (glassTop - 64) / 2 - 34)); // etiquetas sin tocar el vidrio
    if (Math.abs(cy - lastHero) < 2) return;
    lastHero = cy;
    root.style.setProperty("--cy", cy + "px");
    root.style.setProperty("--spread", spread + "px");
    window.sonyHeroY = cy / innerHeight;
    dispatchEvent(new Event("sony:hero"));
  }
  placeHero();
  var hrT = 0;
  addEventListener("resize", function () { clearTimeout(hrT); hrT = setTimeout(placeHero, 140); }, { passive: true });
  if (document.fonts) document.fonts.ready.then(placeHero);

  /* ---------- capacidades: la tarjeta se da vuelta al tocarla ---------- */
  $$(".flip").forEach(function (f) {
    var back = 0;
    f.addEventListener("click", function () {
      var on = f.getAttribute("aria-pressed") !== "true";
      f.setAttribute("aria-pressed", String(on));
      clearTimeout(back);
      if (on) back = setTimeout(function () { f.setAttribute("aria-pressed", "false"); }, 4500); // vuelve sola
    });
  });

  /* ---------- reloj de Buenos Aires ---------- */
  var dEl = $("#clockDate"), tEl = $("#clockTime");
  var fDate = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "short", day: "numeric", month: "short" });
  var fTime = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  function tick() {
    var now = new Date();
    dEl.textContent = (fDate.format(now).replace(/\./g, "").replace(",", "") + " · Buenos Aires").toUpperCase();
    var t = fTime.format(now).split(":");
    tEl.innerHTML = t[0] + ":" + t[1] + ":<em>" + t[2] + "</em>";
  }
  tick(); setInterval(tick, 1000);

  /* ---------- pausa de movimiento ---------- */
  var mBtn = $("#motionBtn");
  mBtn.addEventListener("click", function () {
    var paused = root.classList.toggle("is-paused");
    dispatchEvent(new CustomEvent("sony:motion", { detail: !paused }));
    mBtn.setAttribute("aria-pressed", String(!paused));
    mBtn.setAttribute("aria-label", paused ? "Reanudar movimiento" : "Pausar movimiento");
  });
  if (reduce) root.classList.add("is-paused");

  /* ---------- tarjetas: foto al tocar y vista previa del sitio ---------- */
  var peek = $("#peek"), peekImg = $("#peekImg"), peekFbImg = $("#peekFbImg");
  var peekUrl = $("#peekUrl"), peekName = $("#peekName"), peekFbUrl = $("#peekFbUrl"), peekGo = $("#peekGo");
  var lastPointer = "mouse", peekFor = null, px = 0, py = 0, fx = 0, fy = 0, pRaf = 0;
  addEventListener("pointerdown", function (e) { lastPointer = e.pointerType; }, true);
  addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; }, { passive: true });

  function loadShot(card) {
    var tries = [card.dataset.shot, "https://s.wordpress.com/mshots/v1/" + encodeURIComponent("https://" + card.dataset.site) + "?w=1200&h=900"];
    var i = 0;
    peek.classList.add("no-shot");
    peekImg.onload = function () { if (peekFor === card) peek.classList.remove("no-shot"); };
    peekImg.onerror = function () { i++; if (i < tries.length) peekImg.src = tries[i]; };
    peekImg.src = tries[0];
  }
  function openPeek(card, touch) {
    peekFor = card;
    peekUrl.textContent = peekFbUrl.textContent = card.dataset.site;
    peekName.textContent = card.dataset.name;
    peekFbImg.src = $(".card-bg", card).getAttribute("src");
    peekGo.href = card.href;
    peek.classList.toggle("is-touch", !!touch);
    peek.hidden = false;
    loadShot(card);
    if (!touch && !pRaf) { fx = px; fy = py; pRaf = requestAnimationFrame(follow); }
  }
  function closePeek() {
    peek.hidden = true; peekFor = null;
    $$(".card.is-lit").forEach(function (c) { c.classList.remove("is-lit"); });
  }
  function follow() {
    if (peek.hidden || peek.classList.contains("is-touch")) { pRaf = 0; return; }
    fx += (px - fx) * 0.18; fy += (py - fy) * 0.18;
    var w = peek.offsetWidth, h = peek.offsetHeight;
    var x = fx + 28 + w > innerWidth - 16 ? fx - w - 28 : fx + 28;
    var y = Math.min(innerHeight - h - 16, Math.max(80, fy - h * 0.4));
    peek.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
    pRaf = requestAnimationFrame(follow);
  }
  $$(".card").forEach(function (card) {
    card.addEventListener("mouseenter", function () { if (finePointer) openPeek(card, false); });
    card.addEventListener("mouseleave", function () { if (finePointer) closePeek(); });
    card.addEventListener("click", function (e) {
      if (finePointer && lastPointer === "mouse") return;      // en desktop el click abre el sitio
      if (peekFor === card && !peek.hidden) return;            // segundo toque: ir al sitio
      e.preventDefault();
      closePeek();
      card.classList.add("is-lit");
      openPeek(card, true);
    });
  });

  /* proyectos: cada uno abre su sitio en vivo dentro de un modal */
  var sm = $("#sm"), smFrame = $("#smFrame"), smWait = $("#smWait");
  var smSlow = 0;
  function openSite(btn) {
    var url = btn.dataset.url;
    if (!url) return;
    $("#smLogo").removeAttribute("src");
    $("#smName").textContent = btn.dataset.name;
    $("#smUrl").textContent = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    $("#smOpen").href = $("#smGo").href = url;
    smWait.hidden = false; smWait.classList.remove("is-slow");
    $("#smMsg").textContent = "Cargando sitio"; $("#smGo").hidden = true;
    clearTimeout(smSlow);
    // si el sitio tarda o no se deja mostrar adentro, se ofrece abrirlo aparte
    smSlow = setTimeout(function () {
      smWait.classList.add("is-slow");
      $("#smMsg").textContent = "Si el sitio no aparece, abrilo en una pestaña nueva";
      $("#smGo").hidden = false;
    }, 5000);
    smFrame.onload = function () { if (smFrame.getAttribute("src") === url) { clearTimeout(smSlow); smWait.hidden = true; } };
    smFrame.src = url;
    if (typeof sm.showModal === "function") sm.showModal(); else sm.setAttribute("open", "");
  }
  function closeSite() { if (sm.open) sm.close(); }
  sm.addEventListener("close", function () { clearTimeout(smSlow); if (!sm.open) smFrame.src = "about:blank"; });
  $$(".work-open").forEach(function (b) { b.addEventListener("click", function () { openSite(b); }); });
  $("#smClose").addEventListener("click", closeSite);
  sm.addEventListener("click", function (e) { if (e.target === sm) closeSite(); });

  $("#peekClose").addEventListener("click", closePeek);
  addEventListener("keydown", function (e) { if (e.key === "Escape") closePeek(); });
})();
