import React from "react";
import { random } from "remotion";
import { clamp, ease, EaseFn, prog } from "../lib/anim";
import { C, F } from "../theme";

/**
 * Revelado por máscara: el contenido entra desde fuera de su propia caja
 * (clip-path), como una línea que emerge del papel.
 */
export const Reveal: React.FC<{
  p: number; // 0 oculto → 1 visible
  dir?: "up" | "down" | "left" | "right";
  blur?: boolean;
  pad?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ p, dir = "up", blur = true, pad = "0.12em 0.06em", style, children }) => {
  const q = 1 - clamp(p);
  const d = q * 112;
  const tr =
    dir === "up"
      ? `translateY(${d}%)`
      : dir === "down"
        ? `translateY(${-d}%)`
        : dir === "left"
          ? `translateX(${d}%)`
          : `translateX(${-d}%)`;
  const vertical = dir === "up" || dir === "down";
  const b = blur ? q * 10 : 0;
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        padding: pad,
        margin: pad.split(" ").map((v) => `-${v}`).join(" "),
        verticalAlign: "top",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: tr,
          filter: b > 0.2 ? `blur(${vertical ? b * 0.3 : b}px)` : undefined,
        }}
      >
        {children}
      </span>
    </span>
  );
};

/** Palabras con stagger por máscara. */
export const Words: React.FC<{
  text: string;
  f: number;
  start: number;
  stagger?: number;
  dur?: number;
  dir?: "up" | "down" | "left" | "right";
  out?: number; // frame de salida (opcional)
  outDur?: number;
  e?: EaseFn;
  gap?: string;
  style?: React.CSSProperties;
  wordStyle?: (i: number, w: string) => React.CSSProperties | undefined;
}> = ({ text, f, start, stagger = 3, dur = 16, dir = "up", out, outDur = 12, e = ease.out, gap = "0.24em", style, wordStyle }) => {
  const words = text.split(" ");
  return (
    <span style={{ display: "inline-flex", gap, flexWrap: "nowrap", ...style }}>
      {words.map((w, i) => {
        const pin = prog(f, start + i * stagger, start + i * stagger + dur, e);
        const pout = out !== undefined ? prog(f, out + i * (stagger * 0.6), out + i * (stagger * 0.6) + outDur, ease.in) : 0;
        const outDir = dir === "up" ? "down" : dir;
        return (
          <Reveal key={i} p={pout > 0 ? 1 - pout : pin} dir={pout > 0 ? outDir : dir}>
            <span style={wordStyle?.(i, w)}>{w}</span>
          </Reveal>
        );
      })}
    </span>
  );
};

/**
 * Máquina de escribir: cada tecla golpea con entintado irregular,
 * leve desalineación y una cadencia humana (no lineal).
 */
export const Typewriter: React.FC<{
  text: string;
  f: number;
  start: number;
  cps?: number; // frames por carácter (promedio)
  seed?: string;
  size?: number;
  color?: string;
  caret?: boolean;
  style?: React.CSSProperties;
  charStyle?: (i: number, ch: string) => React.CSSProperties | undefined;
}> = ({ text, f, start, cps = 1.7, seed = text, size = 56, color = C.ink, caret = true, style, charStyle }) => {
  // tiempos acumulados con jitter
  const times: number[] = [];
  let t = start;
  for (let i = 0; i < text.length; i++) {
    times.push(t);
    const ch = text[i];
    t += ch === " " ? cps * 1.6 : cps * (0.65 + random(`${seed}-cad-${i}`) * 0.8);
  }
  const done = t;
  const typed = times.filter((x) => f >= x).length;
  const showCaret = caret && f >= start - 6 && f < done + 22 && (f < done || Math.floor(f / 7) % 2 === 0);
  return (
    <span
      style={{
        fontFamily: F.mono,
        fontSize: size,
        color,
        whiteSpace: "pre",
        letterSpacing: "0.02em",
        position: "relative",
        display: "inline-block",
        ...style,
      }}
    >
      {text.split("").map((ch, i) => {
        const age = f - times[i];
        const vis = age >= 0;
        const r = random(`${seed}-${i}`);
        const strike = vis ? 1 + 0.22 * Math.max(0, 1 - age / 3) : 1;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: vis ? 0.8 + r * 0.2 : 0,
              transform: `translateY(${(r - 0.5) * 3}px) rotate(${(random(`${seed}-r-${i}`) - 0.5) * 2.4}deg) scale(${strike})`,
              textShadow: vis ? `0 0 0.6px ${color}` : undefined,
              ...charStyle?.(i, ch),
            }}
          >
            {ch}
          </span>
        );
      })}
      {showCaret ? (
        <span
          style={{
            position: "absolute",
            left: `${typed * 0.62}em`,
            top: "0.12em",
            width: "0.08em",
            height: "0.95em",
            background: C.terra,
          }}
        />
      ) : null}
    </span>
  );
};
