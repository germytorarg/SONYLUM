// Genera web/sonylum-captura.html: un único archivo autocontenido (animación,
// recortes, logos, texturas y fuentes embebidos) a pantalla completa 9:16,
// sin controles, para grabar la pantalla. Requiere `npm run web` antes.
import fs from "node:fs";

const js = fs.readFileSync("web/player.js", "utf8").replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SONYLUM · Captura 9:16</title>
<style>
  :root { --bg: #EAE2D4; --ink: #191714; --terra: #A45C43; color-scheme: light; }
  html, body { margin: 0; height: 100%; background: var(--bg); overflow: hidden; }
  body { display: grid; place-items: center; cursor: none; }
  #stage { position: relative; height: 100vh; height: 100dvh; aspect-ratio: 9 / 16; max-width: 100vw; }
  @media (max-aspect-ratio: 9/16) { #stage { width: 100vw; height: auto; } }
  #player { position: absolute; inset: 0; }
  #hint {
    position: fixed; inset: 0; display: grid; place-items: center; z-index: 5;
    background: rgba(234, 226, 212, 0.94); color: var(--ink); cursor: pointer;
    font: 400 15px/1.7 "Courier Prime", "Courier New", monospace; letter-spacing: 0.08em; text-align: center;
  }
  #hint b { display: block; font: 400 clamp(40px, 9vh, 88px)/1 Anton, Impact, sans-serif; letter-spacing: 0.01em; margin-bottom: 18px; }
  #hint span { color: var(--terra); }
  #hint[hidden] { display: none; }
</style>
</head>
<body>
<div id="stage"><div id="player"></div></div>
<div id="hint" role="button" tabindex="0">
  <div><b>LISTO PARA GRABAR</b>Empezá a grabar la pantalla y tocá acá.<br>
  La animación arranca en <span>1 segundo</span>, corre una vez (30 s) y queda en el último cuadro.<br><br>
  ESPACIO pausa · R reinicia · F pantalla completa</div>
</div>
<script>window.SONYLUM_MODE = "capture";</script>
<script type="module">${js}</script>
<script>
  const hint = document.getElementById("hint");
  const ready = () => new Promise((res) => {
    const t = setInterval(() => { if (window.sonylumPlayer) { clearInterval(t); res(window.sonylumPlayer); } }, 50);
  });
  async function start() {
    hint.hidden = true;
    const p = await ready();
    p.pause(); p.seekTo(0);
    setTimeout(() => p.play(), 1000);
  }
  hint.addEventListener("click", start);
  hint.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); } });
  document.addEventListener("keydown", async (e) => {
    if (!hint.hidden) return;
    const p = await ready();
    if (e.key === " ") { e.preventDefault(); p.isPlaying() ? p.pause() : p.play(); }
    if (e.key === "r" || e.key === "R") { p.pause(); p.seekTo(0); setTimeout(() => p.play(), 400); }
    if (e.key === "f" || e.key === "F") { document.documentElement.requestFullscreen?.().catch(() => {}); }
  });
  ready().then((p) => { p.pause(); p.seekTo(0); });
</script>
</body>
</html>
`;
fs.writeFileSync("web/sonylum-captura.html", html);
console.log("web/sonylum-captura.html", Math.round(html.length / 1024), "KB");
