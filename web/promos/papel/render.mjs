// Renders papel.html to MP4 (1080x1920, 30 fps). Usage: node render.mjs [out.mp4] [--text "a|b|c"] [--tiles brown|white] [--fps 30]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const out = path.resolve(args.find((a) => a.endsWith(".mp4")) ?? path.join(here, "papel.mp4"));
const fps = Number(val("--fps") ?? 30);
const text = val("--text");
const tiles = val("--tiles");

const browser = await chromium.launch({ args: ["--allow-file-access-from-files", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => console.error(e.message));
const q = new URLSearchParams({ render: "1", ...(text ? { text } : {}), ...(tiles ? { tiles } : {}) });
await page.goto(pathToFileURL(path.join(here, "papel.html")).href + "?" + q);
await page.waitForFunction(() => window.ready);
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.DURATION);
const frames = Math.round(duration * fps);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
  "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", out],
  { stdio: ["pipe", "inherit", "inherit"] });
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.seek(t), f / fps);
  const buf = await page.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 60 === 0) console.log(`${f}/${frames}`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();
console.log(`wrote ${out}`);
