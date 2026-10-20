// Genera src/web-assets.gen.ts: importa cada archivo de public/ para que esbuild
// lo embeba como data URI en web/player.js (la página web no depende de rutas).
import fs from "node:fs";
import path from "node:path";

const root = "public";
const files = [];
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(png|jpe?g|webp|svg|woff2)$/i.test(e.name)) files.push(path.relative(root, p).split(path.sep).join("/"));
  });
walk(root);
files.sort();
const lines = ["// Archivo generado por tools/gen_web_assets.mjs — no editar a mano.", ""];
files.forEach((f, i) => lines.push(`import a${i} from "../public/${f}";`));
lines.push("", "export const WEB_ASSETS: Record<string, string> = {");
files.forEach((f, i) => lines.push(`  ${JSON.stringify(f)}: a${i},`));
lines.push("};", "");
fs.writeFileSync("src/web-assets.gen.ts", lines.join("\n"));
console.log(`${files.length} assets`);
