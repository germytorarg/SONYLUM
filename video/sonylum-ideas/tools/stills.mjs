// Renderiza frames sueltos para revisión rápida: node tools/stills.mjs 20 60 120 ...
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const frames = process.argv.slice(2).map(Number);
const outDir = process.env.OUT ?? "out/stills";
fs.mkdirSync(outDir, { recursive: true });
const browserExecutable = fs.existsSync("/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell")
  ? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
  : null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "SonylumIdeas", browserExecutable });
for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(3, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output, browserExecutable, scale: 0.5 });
  console.log(output);
}
