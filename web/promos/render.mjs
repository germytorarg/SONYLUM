// Renders device-promo.html to 1080x1920 MP4s, one per brand.
// 1. Extracts each page recording (assets/web-<brand>.mp4) to frames/<brand>/ at 30 fps.
// 2. Seeks the timeline at 60 fps and blends frame pairs down to 30 fps (motion blur).
// Usage: node render.mjs [sonylum|creando ...] [--from s --to s]   needs ffmpeg + playwright
import { chromium } from "playwright";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
const brands = args.filter((a) => ["sonylum", "creando"].includes(a));
if (!brands.length) brands.push("sonylum", "creando");
const CAPTURE_FPS = 60;

function extractFrames(brand) {
  const dir = path.join(here, "frames", brand);
  if (existsSync(dir) && readdirSync(dir).length) return;
  mkdirSync(dir, { recursive: true });
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", path.join(here, "assets", `web-${brand}.mp4`),
    "-vf", "fps=30,scale=640:-2", "-q:v", "3", path.join(dir, "f_%04d.jpg")], { stdio: "inherit" });
  if (r.status) throw new Error(`ffmpeg failed extracting ${brand}`);
}

async function render(browser, brand) {
  extractFrames(brand);
  const out = path.join(here, `promo-${brand}.mp4`);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on("pageerror", (e) => console.error(brand, e.message));
  await page.goto(pathToFileURL(path.join(here, "device-promo.html")).href + `?brand=${brand}&render`);
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.DURATION);
  const from = opt("--from", 0), to = Math.min(opt("--to", duration), duration);
  const frames = Math.round((to - from) * CAPTURE_FPS);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(CAPTURE_FPS), "-c:v", "mjpeg", "-i", "-",
    "-vf", "tmix=frames=2:weights='1 1',fps=30,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high", "-movflags", "+faststart", out],
    { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), from + f / CAPTURE_FPS);
    const buf = await page.screenshot({ type: "jpeg", quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 120 === 0) console.log(`${brand} ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await page.close();
  console.log(`wrote ${out}`);
}

const browser = await chromium.launch({ args: ["--allow-file-access-from-files", "--force-color-profile=srgb"] });
await Promise.all(brands.map((b) => render(browser, b)));
await browser.close();
