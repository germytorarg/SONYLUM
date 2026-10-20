export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 900;

export const C = {
  paper: "#EAE2D4",
  paperLight: "#F3EDE3",
  paperDeep: "#DDD2BF",
  ink: "#191714",
  inkSoft: "#4A443C",
  terra: "#A45C43",
  terraDeep: "#8A4A35",
  rule: "rgba(25,23,20,0.32)",
  hair: "rgba(25,23,20,0.16)",
};

export const F = {
  serif: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  mono: '"Courier Prime", "Courier New", monospace',
  impact: 'Anton, "Bebas Neue", Impact, sans-serif',
};

// Métricas de Anton (advance / em), extraídas del woff2 con fontTools.
// Permiten maquetar palabras letra por letra sin medir en el navegador.
export const ANTON_ADV: Record<string, number> = {
  A: 0.4854, B: 0.4785, C: 0.4741, D: 0.4932, E: 0.4116, F: 0.3989, G: 0.4849,
  H: 0.499, I: 0.2266, J: 0.4663, K: 0.4722, L: 0.3975, M: 0.7461, N: 0.498,
  Ñ: 0.498, O: 0.4863, P: 0.4722, Q: 0.4937, R: 0.4766, S: 0.4614, T: 0.3955,
  U: 0.4736, V: 0.4692, W: 0.7119, X: 0.4839, Y: 0.4463, Z: 0.4102, ".": 0.2285,
  " ": 0.2344,
};
export const ANTON_CAP = 0.859;
