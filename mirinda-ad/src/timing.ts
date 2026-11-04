import {Easing, interpolate} from 'remotion';

// 12 s a 30 fps. Grilla musical: 120 BPM -> 1 tiempo = 15 frames (tools/audio.py).
export const FPS = 30;
export const DURATION = 360;

export const T = {
  drop: 15, // la lata entra girando desde arriba
  impact: 45, // aterriza: golpe + salpicadura
  spinFrom: 150, // giro rápido
  spinTo: 180,
  hero: 180, // inclinación y acercamiento
  end: 262, // reacomodo para el cierre
  logo: 270, // golpe del logo
} as const;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const prog = (f: number, a: number, b: number, e: (t: number) => number = easeOut) =>
  interpolate(f, [a, b], [0, 1], {...clamp, easing: e});

// Cámara 3D (también usada para proyectar los overlays 2D sobre la lata).
export const CAMERA = {fov: 28, z: 7.2};
export const CAN_HEIGHT = 2.4; // unidades de mundo

// La marca del frente está corrida a la derecha en la foto: giro de reposo para centrarla.
const REST_Y = -0.2;

export type CanState = {x: number; y: number; rotX: number; rotY: number; rotZ: number; scale: number};

/** Estado de la lata en cada frame (posición, giro, escala). */
export const canState = (f: number): CanState => {
  const t = f / FPS;
  // entrada: cae girando y frena de frente
  const enter = prog(f, T.drop, T.impact, easeOut);
  const fall = 1 - prog(f, T.drop, T.impact, Easing.bezier(0.3, 0, 0.2, 1));
  const bounce = f >= T.impact ? -0.12 * Math.exp(-(f - T.impact) / 5) * Math.cos((f - T.impact) * 0.55) : 0;
  const spinIn = -(1 - enter) * Math.PI * 6;
  // flotación
  const bob = Math.sin(t * 2.2) * 0.07 * prog(f, T.impact, T.impact + 20);
  const sway = Math.sin(t * 1.3) * 0.42 * prog(f, T.impact + 5, T.impact + 30, easeInOut);
  // giro rápido (2 vueltas) y giro lento de exhibición en el hero
  const whip = prog(f, T.spinFrom, T.spinTo, easeInOut) * Math.PI * 4;
  const endP = prog(f, T.end, T.logo + 10, easeInOut);
  return {
    x: 0,
    y: fall * 3.4 + bounce + bob + endP * 0.42,
    rotX: 0.1 + 0.12 * prog(f, T.hero, T.hero + 30, easeInOut) * (1 - endP) + Math.sin(t * 1.7) * 0.03,
    rotY: REST_Y + spinIn + sway * (1 - prog(f, T.spinFrom - 10, T.spinFrom)) + whip + Math.sin(t * 0.9) * 0.3 * prog(f, T.spinTo, T.spinTo + 20),
    rotZ: Math.sin(t * 1.6) * 0.07 + (1 - enter) * 0.4,
    scale: 0.8 + 0.06 * prog(f, T.hero, T.hero + 40, easeInOut) * (1 - endP) - 0.1 * endP,
  };
};

/** Proyección del centro de la lata y su alto en px (para overlays 2D). */
export const canScreen = (s: CanState) => {
  const k = 1 / (Math.tan(((CAMERA.fov / 2) * Math.PI) / 180) * CAMERA.z); // mundo -> NDC
  return {
    cx: 540 + s.x * k * 960,
    cy: 960 - s.y * k * 960,
    h: CAN_HEIGHT * s.scale * k * 960,
  };
};
