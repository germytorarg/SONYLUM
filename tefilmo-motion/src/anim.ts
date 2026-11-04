import {Easing, interpolate, random} from 'remotion';

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-out: entradas
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // cámara
  in: Easing.bezier(0.7, 0, 0.84, 0), // salidas
  soft: Easing.bezier(0.33, 0, 0.2, 1),
  linear: (t: number) => t,
};

/** Interpola en [f0, f1] con clamp y easing. */
export const tw = (
  frame: number,
  f0: number,
  f1: number,
  v0: number,
  v1: number,
  easing: (t: number) => number = ease.out,
) =>
  interpolate(frame, [f0, f1], [v0, v1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** 0..1 de progreso en [f0, f1]. */
export const prog = (frame: number, f0: number, f1: number, easing = ease.out) =>
  tw(frame, f0, f1, 0, 1, easing);

/** Ventana enter/hold/exit: 0 -> 1 -> 0. */
export const win = (
  frame: number,
  inFrom: number,
  inTo: number,
  outFrom: number,
  outTo: number,
  easingIn = ease.out,
  easingOut = ease.in,
) => Math.min(prog(frame, inFrom, inTo, easingIn), 1 - prog(frame, outFrom, outTo, easingOut));

/** Ruido suave determinístico (suma de senos con fases por semilla). */
export const wobble = (frame: number, seed: string, speed = 1) => {
  const p1 = random(seed + 'a') * Math.PI * 2;
  const p2 = random(seed + 'b') * Math.PI * 2;
  return (
    Math.sin(frame * 0.031 * speed + p1) * 0.6 + Math.sin(frame * 0.057 * speed + p2) * 0.4
  );
};

/** Punto de una curva Bézier cúbica. */
export const bezierPoint = (
  t: number,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
): [number, number] => {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  return [x, y];
};
