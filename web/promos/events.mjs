// Exports the animation event times of device-promo.html (per brand) as JSON for sound.py.
// Usage: node events.mjs > events.json
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const out = {};
for (const brand of ["sonylum", "creando"]) {
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`${new URL("device-promo.html", import.meta.url).href}?brand=${brand}&render`);
  await p.evaluate(() => window.ready);
  out[brand] = await p.evaluate(() => ({
    pieces: B.pieces.map((x) => x.at), chips: B.chips.length, cards: B.cards.length, tags: B.tags.length,
    T0, TYPE_AT, TYPE_DUR, SEND, OUT, E, DURATION: window.DURATION, msg: B.message,
  }));
  await p.close();
}
await b.close();
console.log(JSON.stringify(out, null, 1));
