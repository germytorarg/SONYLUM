// Línea de tiempo de SALIDA (30 fps). La toma 1 (Obelisco, 0–0,6 s del original
// a 60 fps) va en cámara lenta x0,3 interpolada (57 frames, public/open) para que
// el anillo de texto gire alrededor del Obelisco. Desde ahí el original corre a
// velocidad normal, desplazado SHIFT frames.
export const FPS = 30;
export const OPEN_END = 57; // 1,9 s
export const SHIFT = 39; // 1,3 s
export const DURATION = 486; // 16,2 s

/** Frame de salida -> frame del original (60 fps), desde OPEN_END. */
export const srcFrame = (f: number) => 2 * f - 2 * SHIFT;

const o = (f: number) => f + (OPEN_END - 36); // cortes medidos con la versión de 36 frames
// Cortes del original (detección de escena) convertidos a frames de salida.
export const CUT = {
  avenida: o(36),
  auto: o(57),
  floralis: o(78),
  floralisCerca: o(98),
  planetario: o(116),
  lagos: o(137),
  palacio: o(159),
  mansion: o(180),
  madero: o(197),
  puente: o(218),
  caminito: o(235),
  tango: o(256),
  skyline: o(275),
  obeliscoNoche: o(295),
  logo: o(318),
  logoFin: o(396),
} as const;
export const OFFSET = OPEN_END - 36;

// Cuadros nocturnos con recorte de primer plano (original 556–580, antes del glitch).
export const MATTE_NIGHT = {from: o(296), to: o(308)};
