import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const faces: { family: string; file: string; weight: string; style?: string }[] = [
  { family: "Anton", file: "anton-latin-400-normal.woff2", weight: "400" },
  { family: "Cormorant Garamond", file: "cormorant-garamond-latin-400-normal.woff2", weight: "400" },
  { family: "Cormorant Garamond", file: "cormorant-garamond-latin-500-normal.woff2", weight: "500" },
  { family: "Cormorant Garamond", file: "cormorant-garamond-latin-600-normal.woff2", weight: "600" },
  { family: "Cormorant Garamond", file: "cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
  { family: "Cormorant Garamond", file: "cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
  { family: "Courier Prime", file: "courier-prime-latin-400-normal.woff2", weight: "400" },
  { family: "Courier Prime", file: "courier-prime-latin-700-normal.woff2", weight: "700" },
];

// loadFont ya maneja delayRender/continueRender: el render espera a las fuentes.
export const fontsReady = Promise.all(
  faces.map((f) =>
    loadFont({
      family: f.family,
      url: staticFile(`fonts/${f.file}`),
      weight: f.weight,
      style: f.style ?? "normal",
    }),
  ),
);
