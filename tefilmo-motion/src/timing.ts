// Fuente de verdad temporal (01_GUION_ESCENAS.md + 02_PROMPT_PARA_CLAUDE_CODE.md).
// 30 fps · 900 frames · grilla musical 120 BPM: 1 tiempo = 15 f, 1 compás = 60 f.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 900;

export const SCENES = {
  s01: {from: 0, to: 149, name: 'Dos caminos'},
  s02: {from: 150, to: 299, name: 'Encuentro'},
  s03: {from: 300, to: 419, name: 'Expectativa'},
  s04: {from: 420, to: 599, name: 'Ceremonia'},
  s05: {from: 600, to: 749, name: 'Promesa'},
  s06: {from: 750, to: 899, name: 'Recuerdo / Marca'},
} as const;

// Acentos musicales (frames). Coinciden con tools/compose_music.py.
export const SYNC = {
  ringsLand: 75, // campana de anillos 2,5 s
  flare: 117, // swell 3,9 s -> 5,0 s
  lightWipe: 198, // shimmer 6,6 s
  bouquetSweep: 279, // whoosh 9,3 s
  veil: 402, // aire 13,4 s
  pulseStart: 420, // pulso 14 s
  candles: 480, // shimmer 16 s
  envelope: 531, // papel 17,7 s
  seal: 552, // campana 18,4 s
  hands: 600, // 20 s
  ringGlint: 630, // 21 s
  cutEmbrace: 657, // 21,9 s
  cutKiss: 690, // 23 s
  clink: 728, // copas 24,25 s
  warmDissolve: 720,
  film: 801, // cinta 26,7 s
  brand: 825, // acorde final 27,5 s (últimos 2,5 s)
} as const;

// Ventanas de transición compartidas entre escenas.
export const TRANSITIONS = {
  flare: {from: 112, to: 176},
  bouquet: {from: 279, to: 322},
  veil: {from: 398, to: 446},
  warm: {from: 724, to: 772},
} as const;
