import React, { useMemo } from "react";
import { random } from "remotion";
import { noise2D } from "@remotion/noise";
import { C } from "../theme";
import { asset } from "../lib/asset";

type Sides = { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean };

/** Borde rasgado: ruido de baja frecuencia + astillado fino, siempre hacia adentro. */
const tornEdge = (
  seed: string,
  len: number,
  rough: number,
  step = 6,
): number[] => {
  const n = Math.max(2, Math.ceil(len / step));
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const low = (noise2D(seed, t * len * 0.004, 0) + 1) * 0.5;
    const mid = (noise2D(seed + "m", t * len * 0.025, 3) + 1) * 0.5;
    const chip = random(`${seed}-${i}`);
    out.push(rough * (0.15 + low * 0.95 + mid * 0.45 + chip * 0.32));
  }
  return out;
};

const buildPath = (w: number, h: number, sides: Sides, seed: string, rough: number, inset = 0) => {
  const pts: [number, number][] = [];
  const side = (
    on: boolean | undefined,
    len: number,
    key: string,
    map: (t: number, d: number) => [number, number],
  ) => {
    if (!on) {
      pts.push(map(0, inset * 0.3), map(1, inset * 0.3));
      return;
    }
    const e = tornEdge(seed + key, len, rough);
    e.forEach((d, i) => pts.push(map(i / (e.length - 1), Math.max(0, d - inset))));
  };
  side(sides.top, w, "t", (t, d) => [t * w, d]);
  side(sides.right, h, "r", (t, d) => [w - d, t * h]);
  side(sides.bottom, w, "b", (t, d) => [w - t * w, h - d]);
  side(sides.left, h, "l", (t, d) => [d, h - t * h]);
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
};

/**
 * Hoja / recorte de papel procedural: borde rasgado con fibra blanca,
 * textura de papel y contenido HTML encima. Reutilizable para barridos,
 * recortes, tarjetas de marca y cintas.
 */
export const Paper: React.FC<{
  w: number;
  h: number;
  seed: string;
  color?: string;
  sides?: Sides;
  rough?: number;
  texture?: number;
  rim?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  w,
  h,
  seed,
  color = C.paperLight,
  sides = { top: true, right: true, bottom: true, left: true },
  rough = 10,
  texture = 0.5,
  rim = "#FBF9F4",
  style,
  children,
}) => {
  const id = `paper-${seed}`;
  const { rimPath, bodyPath } = useMemo(
    () => ({
      rimPath: buildPath(w, h, sides, seed, rough, 0),
      bodyPath: buildPath(w, h, sides, seed, rough, rough * 0.45),
    }),
    [w, h, seed, rough, sides.top, sides.right, sides.bottom, sides.left],
  );
  return (
    <div style={{ position: "relative", width: w, height: h, ...style }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id={`${id}-fuzz`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={7} />
            <feDisplacementMap in="SourceGraphic" scale="3.2" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <path d={bodyPath} />
          </clipPath>
          <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#3a2a1a" stopOpacity="0.07" />
          </linearGradient>
        </defs>
        <path d={rimPath} fill={rim} filter={`url(#${id}-fuzz)`} />
        <path d={bodyPath} fill={color} />
        {texture > 0 ? (
          <image
            href={asset("textures/paper.jpg")}
            x={0}
            y={0}
            width={Math.max(w, 1080)}
            height={Math.max(h, 1920)}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${id}-clip)`}
            style={{ mixBlendMode: "multiply", opacity: texture }}
          />
        ) : null}
        <path d={bodyPath} fill={`url(#${id}-shade)`} />
      </svg>
      {children ? <div style={{ position: "absolute", inset: 0 }}>{children}</div> : null}
    </div>
  );
};
