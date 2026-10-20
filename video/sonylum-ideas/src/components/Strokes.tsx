import React, { useMemo } from "react";
import { random } from "remotion";
import { clamp } from "../lib/anim";
import { C } from "../theme";

/** Elipse a mano alzada (dos vueltas que no cierran perfecto), trazada con dashoffset. */
export const HandCircle: React.FC<{
  w: number;
  h: number;
  p: number;
  seed?: string;
  color?: string;
  width?: number;
  style?: React.CSSProperties;
}> = ({ w, h, p, seed = "hc", color = C.terra, width = 5, style }) => {
  const d = useMemo(() => {
    const pts: string[] = [];
    const n = 64;
    const a0 = -2.2;
    const a1 = a0 + Math.PI * 2 * 1.12;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = a0 + (a1 - a0) * t;
      const wob = 1 + (random(`${seed}-${Math.floor(i / 6)}`) - 0.5) * 0.05 + t * 0.06;
      const x = w / 2 + Math.cos(a) * (w / 2) * wob;
      const y = h / 2 + Math.sin(a) * (h / 2) * wob * (1 - t * 0.08) + t * 6;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return "M" + pts.join("L");
  }, [w, h, seed]);
  const len = (w + h) * 1.75 * 1.12;
  if (p <= 0.001) return null;
  return (
    <svg width={w} height={h} style={{ position: "absolute", overflow: "visible", ...style }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - clamp(p))}
      />
    </svg>
  );
};

/** Trazo recto que se dibuja (de a→b) y opcionalmente se retira (b→a). */
export const Rule: React.FC<{
  x: number;
  y: number;
  len: number;
  p: number;
  out?: number;
  thick?: number;
  color?: string;
  angle?: number;
  glow?: boolean;
}> = ({ x, y, len, p, out = 0, thick = 4, color = C.terra, angle = 0, glow = false }) => {
  const a = clamp(out) * 100;
  const b = (1 - clamp(p)) * 100;
  if (p <= 0 || out >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - thick / 2,
        width: len,
        height: thick,
        background: color,
        transformOrigin: "0 50%",
        transform: `rotate(${angle}deg)`,
        clipPath: `inset(0 ${b}% 0 ${a}%)`,
        boxShadow: glow ? `0 0 18px 2px ${color}55` : undefined,
      }}
    />
  );
};

/** Esquinas de visor (como en un encuadre de cámara). */
export const Corners: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  size?: number;
  thick?: number;
  color?: string;
  spread?: number; // px extra hacia afuera (para animar el cierre)
  o?: number;
}> = ({ x, y, w, h, size = 60, thick = 6, color = C.ink, spread = 0, o = 1 }) => {
  const s = spread;
  const corner = (cx: number, cy: number, sx: number, sy: number, k: string) => (
    <div
      key={k}
      style={{
        position: "absolute",
        left: cx - (sx < 0 ? size : 0),
        top: cy - (sy < 0 ? size : 0),
        width: size,
        height: size,
        borderLeft: sx > 0 ? `${thick}px solid ${color}` : undefined,
        borderRight: sx < 0 ? `${thick}px solid ${color}` : undefined,
        borderTop: sy > 0 ? `${thick}px solid ${color}` : undefined,
        borderBottom: sy < 0 ? `${thick}px solid ${color}` : undefined,
      }}
    />
  );
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      {corner(x - s, y - s, 1, 1, "tl")}
      {corner(x + w + s, y - s, -1, 1, "tr")}
      {corner(x - s, y + h + s, 1, -1, "bl")}
      {corner(x + w + s, y + h + s, -1, -1, "br")}
    </div>
  );
};

/** Cruz de registro técnica. */
export const Cross: React.FC<{ x: number; y: number; size?: number; color?: string; o?: number; thick?: number }> = ({
  x,
  y,
  size = 26,
  color = C.terra,
  o = 1,
  thick = 2,
}) => (
  <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: o }}>
    <div style={{ position: "absolute", left: 0, top: size / 2 - thick / 2, width: size, height: thick, background: color }} />
    <div style={{ position: "absolute", top: 0, left: size / 2 - thick / 2, width: thick, height: size, background: color }} />
  </div>
);
