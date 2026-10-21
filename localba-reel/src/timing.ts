// Línea de tiempo de SALIDA (30 fps). La toma 1 (Obelisco, 0–0,6 s del original
// a 60 fps) va en cámara lenta x0,5 y dura 36 frames; desde ahí todo el video
// original corre a velocidad normal desplazado 0,6 s (SHIFT).
export const FPS = 30;
export const DURATION = 465; // 15,5 s
export const SLOW_END = 36;
export const SHIFT = 18; // 0,6 s en frames de salida

/** Frame de salida -> frame del original (60 fps). */
export const srcFrame = (f: number) => (f < SLOW_END ? f : 2 * f - 2 * SHIFT);

// Cortes del original (detección de escena) convertidos a frames de salida.
export const CUT = {
  avenida: 36,
  auto: 57,
  floralis: 78,
  floralisCerca: 98,
  planetario: 116,
  lagos: 137,
  palacio: 159,
  mansion: 180,
  madero: 197,
  puente: 218,
  caminito: 235,
  tango: 256,
  skyline: 275,
  obeliscoNoche: 295,
  logo: 318,
  logoFin: 396,
} as const;

// Cuadros con recorte de primer plano (título detrás del Obelisco).
export const MATTE_DAY = {from: 0, to: 35};
export const MATTE_NIGHT = {from: 296, to: 308}; // original 556–580, antes del glitch
