// Renders holo.html to MP4 (1080x1920, 30 fps; captured at 60 and frame-blended for motion blur).
// Usage: node render.mjs [out.mp4]   needs ffmpeg + playwright
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv.find((a) => a.endsWith(".mp4")) ?? path.join(here, "holo.mp4"));
const FPS = 60;
const browser = await chromium.launch({ args: ["--allow-file-access-from-files", "--force-color-profile=srgb"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => console.error(e.message));
await page.goto(pathToFileURL(path.join(here, "holo.html")).href + "?render");
await page.evaluate(() => window.ready);
const frames = Math.round((await page.evaluate(() => window.DURATION)) * FPS);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-vf", "tmix=frames=2:weights='1 1',fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-movflags", "+faststart", out],
  { stdio: ["pipe", "inherit", "inherit"] });
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.seek(t), f / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 120 === 0) console.log(`${f}/${frames}`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();
console.log(`wrote ${out}`);
