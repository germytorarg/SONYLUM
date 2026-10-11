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
    active = sec;
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
  $("#peekClose").addEventListener("click", closePeek);
  addEventListener("keydown", function (e) { if (e.key === "Escape") closePeek(); });
})();
