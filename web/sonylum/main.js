(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var stage = $("#stage");

  /* ---------- píldoras de tecnologías ---------- */
  var A = ["Web", "UX/UI", "Branding", "SEO", "Next.js", "Three.js", "WebGL", "Webhooks", "Make", "WhatsApp API"];
  var B = ["IA", "Agentes", "Prompts", "Reels 9:16", "Edición", "Motion", "Cámara", "Fotografía", "Campañas", "Drone"];
  function fill(el, list) {
    var html = list.concat(list).map(function (t) { return '<span class="chip">' + t.toUpperCase() + "</span>"; }).join("");
    el.innerHTML = html;
  }
  fill($("#chipsA"), A);
  fill($("#chipsB"), B);

  /* ---------- pantalla activa: riel, cuadrado, palabra de fondo ---------- */
  var screens = $$(".scr");
  var rail = $$(".rail a");
  var label = $("#diaLabel"), ghost = $("#ghost");
  var active = null;
  function activate(sec) {
    if (active === sec) return;
    active = sec;
    var id = "#" + sec.id;
    rail.forEach(function (a) {
      var on = a.getAttribute("href") === id;
      a.classList.toggle("is-on", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    stage.style.setProperty("--rz", sec.dataset.rz);
    stage.style.setProperty("--spread", sec.dataset.spread);
    label.classList.add("swap"); ghost.classList.add("swap");
    setTimeout(function () {
      label.textContent = sec.dataset.label;
      ghost.textContent = sec.dataset.ghost;
      label.classList.remove("swap"); ghost.classList.remove("swap");
    }, reduce ? 0 : 260);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        if (e.intersectionRatio > 0.35 || e.boundingClientRect.top < innerHeight * 0.4) activate(e.target);
      }
    });
  }, { threshold: [0.15, 0.35, 0.6] });
  screens.forEach(function (s) { io.observe(s); });
  activate(screens[0]);
  requestAnimationFrame(function () { screens[0].classList.add("in"); });

  /* ---------- inclinación del cuadrado con el puntero o el giroscopio ---------- */
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  function tilt() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    stage.style.setProperty("--tx", cx.toFixed(2) + "deg");
    stage.style.setProperty("--ty", cy.toFixed(2) + "deg");
    raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(tilt) : 0;
  }
  if (!reduce && finePointer) {
    addEventListener("pointermove", function (e) {
      tx = (e.clientY / innerHeight - 0.5) * -14;
      ty = (e.clientX / innerWidth - 0.5) * 18;
      if (!raf) raf = requestAnimationFrame(tilt);
    }, { passive: true });
  }

  /* ---------- reloj de Buenos Aires ---------- */
  var dEl = $("#clockDate"), tEl = $("#clockTime");
  var fDate = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "short", day: "numeric", month: "short" });
  var fTime = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  function tick() {
    var now = new Date();
    dEl.textContent = fDate.format(now).replace(/\./g, "").replace(",", "") + " · Buenos Aires";
    tEl.textContent = fTime.format(now);
  }
  tick(); setInterval(tick, 1000);

  /* ---------- pausa de movimiento ---------- */
  var mBtn = $("#motionBtn");
  mBtn.addEventListener("click", function () {
    var paused = root.classList.toggle("is-paused");
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
    var tries = [card.dataset.shot, "https://s.wordpress.com/mshots/v1/" + encodeURIComponent("https://" + card.dataset.site) + "?w=760&h=475"];
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
    peekFbImg.src = $("img", card).getAttribute("src");
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
  $("#peekClose").addEventListener("click", closePeek);
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !peek.hidden) closePeek(); });
})();
