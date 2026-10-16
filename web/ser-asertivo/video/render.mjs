// Renders promo.html to a 1080x1920 MP4.
// Captures at 60 fps and blends frame pairs down to 30 fps for natural motion blur.
// Usage: node render.mjs [out.mp4] [--fps 60] [--from 0 --to 20.5]   (needs ffmpeg + playwright)
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
const out = path.resolve(args.find((a) => a.endsWith(".mp4")) ?? path.join(here, "ser-asertivo-promo.mp4"));
const fps = opt("--fps", 60);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--allow-file-access-from-files", "--force-color-profile=srgb"],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, "promo.html")).href + "?render");
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.DURATION);
const from = opt("--from", 0), to = Math.min(opt("--to", duration), duration);
const frames = Math.round((to - from) * fps);

const ff = spawn("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
  "-vf", "tmix=frames=2:weights='1 1',fps=30,format=yuv420p",
  "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high", "-movflags", "+faststart",
  out,
], { stdio: ["pipe", "inherit", "inherit"] });

for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.seek(t), from + f / fps);
  const buf = await page.screenshot({ type: "png" });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 60 === 0) process.stdout.write(`\r${f}/${frames}`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();
console.log(`\nwrote ${out}`);
