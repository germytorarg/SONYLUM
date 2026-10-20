import { Easing, interpolate, random, spring } from "remotion";
import { noise2D } from "@remotion/noise";
import { FPS } from "../theme";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Curvas propias. Nada de rebotes: salidas largas y entradas decididas. */
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-out editorial
  outSoft: Easing.bezier(0.25, 1, 0.5, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  whip: Easing.bezier(0.83, 0, 0.17, 1), // arranque y frenado bruscos
  glide: Easing.bezier(0.45, 0, 0.15, 1), // objetos que se apoyan
  linear: (t: number) => t,
};
export type EaseFn = (t: number) => number;

/** Interpolación entre dos frames con easing y clamp. */
export const tw = (
  f: number,
  [f0, f1]: [number, number],
  [v0, v1]: [number, number],
  e: EaseFn = ease.out,
) =>
  interpolate(f, [f0, f1], [v0, v1], {
    easing: e,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** 0→1 entre f0 y f1. */
export const prog = (f: number, f0: number, f1: number, e: EaseFn = ease.out) =>
  tw(f, [f0, f1], [0, 1], e);

/**
 * Pista de keyframes: [[frame, valor, easingHaciaEsteKey?], ...]
 * Editable: cada objeto del video declara su recorrido con esto.
 */
export type Key = [number, number, EaseFn?];
export const track = (f: number, keys: Key[]): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [fa, va] = keys[i - 1];
    const [fb, vb, e] = keys[i];
    if (f <= fb) return lerp(va, vb, (e ?? ease.inOut)((f - fa) / Math.max(1e-6, fb - fa)));
  }
  return keys[keys.length - 1][1];
};

/** Spring con overshoot controlado (por defecto ~4%). */
export const spr = (
  f: number,
  start: number,
  cfg: { damping?: number; stiffness?: number; mass?: number } = {},
) =>
  spring({
    frame: f - start,
    fps: FPS,
    config: { damping: cfg.damping ?? 15, stiffness: cfg.stiffness ?? 120, mass: cfg.mass ?? 1 },
  });

/** Micro-movimiento orgánico continuo (respiración de los objetos). */
export const drift = (f: number, seed: string, amp = 1, speed = 0.012) =>
  noise2D(seed, f * speed, 0) * amp;

export const rnd = (seed: string | number) => random(seed);

/** Velocidad (px/frame) de una función de posición, para el motion blur. */
export const vel = (fn: (f: number) => number, f: number) => fn(f) - fn(f - 1);
