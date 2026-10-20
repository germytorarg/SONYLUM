import React from "react";

/**
 * Motion blur direccional real: feGaussianBlur anisotrópico (σx ≠ σy),
 * calculado a partir de la velocidad del elemento en px/frame.
 * `focus` suma desenfoque isotrópico (profundidad de campo / foco).
 */
export const Blur: React.FC<{
  id: string;
  vx?: number;
  vy?: number;
  focus?: number;
  k?: number;
  max?: number;
  style?: React.CSSProperties;
  extraFilter?: string;
  children: React.ReactNode;
}> = ({ id, vx = 0, vy = 0, focus = 0, k = 0.42, max = 46, style, extraFilter = "", children }) => {
  const sx = Math.min(max, Math.abs(vx) * k) + focus;
  const sy = Math.min(max, Math.abs(vy) * k) + focus;
  const active = sx > 0.25 || sy > 0.25;
  const fid = `blur-${id}`;
  const filter = [active ? `url(#${fid})` : "", extraFilter].filter(Boolean).join(" ");
  return (
    <div style={{ position: "absolute", inset: 0, filter: filter || undefined, ...style }}>
      {active ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter
            id={fid}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation={`${sx.toFixed(2)} ${sy.toFixed(2)}`} />
          </filter>
        </svg>
      ) : null}
      {children}
    </div>
  );
};

/** Sombra de contacto: cuanto más "levantado" el objeto, más difusa y lejana. */
export const liftShadow = (elev: number, strength = 1) => {
  const e = Math.max(0, elev);
  const y = 5 + e * 46;
  const b = 7 + e * 54;
  const a = (0.3 - e * 0.13) * strength;
  const y2 = 1 + e * 8;
  const b2 = 2 + e * 10;
  const a2 = (0.22 - e * 0.15) * strength;
  return `drop-shadow(0px ${y2.toFixed(1)}px ${b2.toFixed(1)}px rgba(40,30,20,${Math.max(0, a2).toFixed(3)})) drop-shadow(0px ${y.toFixed(1)}px ${b.toFixed(1)}px rgba(48,36,24,${Math.max(0, a).toFixed(3)}))`;
};
