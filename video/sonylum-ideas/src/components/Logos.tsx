import React from "react";
import { getStaticFiles, Img } from "remotion";
import { clamp, ease, prog, spr } from "../lib/anim";
import { C, F } from "../theme";
import { Blur } from "./Blur";
import { asset } from "../lib/asset";

/* ───────────────────────── SONYLUM ───────────────────────── */

const SONY_W = 638;
const SONY_H = 571;
const SONY_WORD_TOP = 0.835; // fracción del alto donde empieza el wordmark
const SYMBOL = ["chevron-left", "chevron-right", "arc-top", "arc-bottom"] as const;
const LETTERS = ["letter-s", "letter-o", "letter-n", "letter-y", "letter-l", "letter-u", "letter-m"] as const;
export const SONYLUM_AR = SONY_W / SONY_H;

export type PartState = { dx: number; dy: number; o: number };
export type PartFn = (f: number, part: string, index: number) => PartState;

/**
 * Ensamble del símbolo: las cuatro piezas llegan desde su propio eje y se
 * enclavan. Nunca se escala ni se deforma el logo: solo traslación y máscara.
 */
export const sonylumAssemble =
  (start: number, dist = 560, wordStart = 16): PartFn =>
  (f, part, i) => {
    if (part.startsWith("letter")) {
      const s = start + wordStart + i * 2;
      const p = prog(f, s, s + 16, ease.out);
      return { dx: 0, dy: (1 - p) * 120, o: 1 };
    }
    const delay = part.startsWith("arc") ? 5 : 0;
    const p = spr(f, start + delay, { damping: 17, stiffness: 105 });
    const vec: Record<string, [number, number]> = {
      "chevron-left": [-1, 0.18],
      "chevron-right": [1, -0.18],
      "arc-top": [0.12, -1],
      "arc-bottom": [-0.12, 1],
    };
    const [vx, vy] = vec[part];
    return { dx: vx * dist * (1 - p), dy: vy * dist * (1 - p), o: clamp(p * 3) };
  };

export const sonylumDisassemble =
  (start: number, dist = 700): PartFn =>
  (f, part, i) => {
    if (part.startsWith("letter")) {
      const s = start + i * 1.2;
      const p = prog(f, s, s + 12, ease.in);
      return { dx: 0, dy: p * 120, o: 1 };
    }
    const delay = part.startsWith("arc") ? 0 : 3;
    const p = prog(f, start + delay, start + delay + 16, ease.in);
    const vec: Record<string, [number, number]> = {
      "chevron-left": [-1, 0.1],
      "chevron-right": [1, -0.1],
      "arc-top": [0.1, -1],
      "arc-bottom": [-0.1, 1],
    };
    const [vx, vy] = vec[part];
    return { dx: vx * dist * p, dy: vy * dist * p, o: 1 - clamp(p * 1.5 - 0.5) };
  };

export const SonylumLogo: React.FC<{
  f: number;
  width: number;
  x: number; // centro
  y: number;
  id: string;
  parts?: PartFn;
  wordmark?: boolean;
  color?: string;
}> = ({ f, width, x, y, id, parts, wordmark = true, color = C.ink }) => {
  const sc = width / SONY_W;
  const h = SONY_H * sc;
  const st = (ff: number, name: string, i: number) => parts?.(ff, name, i) ?? { dx: 0, dy: 0, o: 1 };
  const layer = (name: string): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    backgroundColor: color,
    WebkitMaskImage: `url(${asset(`brands/sonylum-parts/${name}.png`)})`,
    WebkitMaskSize: "100% 100%",
    maskImage: `url(${asset(`brands/sonylum-parts/${name}.png`)})`,
    maskSize: "100% 100%",
  });
  const box: React.CSSProperties = { position: "absolute", left: x - width / 2, top: y - h / 2, width, height: h };
  return (
    <>
      {SYMBOL.map((name, i) => {
        const s = st(f, name, i);
        const pv = st(f - 1, name, i);
        if (s.o <= 0) return null;
        return (
          <Blur key={name} id={`${id}-${name}`} vx={s.dx - pv.dx} vy={s.dy - pv.dy} k={0.5}>
            <div style={{ ...box, opacity: s.o, transform: `translate(${s.dx}px, ${s.dy}px)` }}>
              <div style={layer(name)} />
            </div>
          </Blur>
        );
      })}
      {wordmark
        ? LETTERS.map((name, i) => {
            const s = st(f, name, i);
            return (
              <div
                key={name}
                style={{ ...box, clipPath: `inset(${SONY_WORD_TOP * 100}% 0 0 0)`, opacity: s.o }}
              >
                <div style={{ position: "absolute", inset: 0, transform: `translate(${s.dx}px, ${s.dy * sc}px)` }}>
                  <div style={layer(name)} />
                </div>
              </div>
            );
          })
        : null}
    </>
  );
};

/* ───────────────────── CREANDO CONTENIDOS ───────────────────── */

export const CC_AR = 894 / 564;

/** El visor se cierra sobre el texto: esquinas y bloque tipográfico por separado. */
export const CreandoLogo: React.FC<{
  width: number;
  color?: string;
  spread?: number; // px que se abren las esquinas
  typeP?: number; // 0→1 revelado del texto
  style?: React.CSSProperties;
}> = ({ width, color = C.ink, spread = 0, typeP = 1, style }) => {
  const h = width / CC_AR;
  const part = (name: string, dx: number, dy: number, extra?: React.CSSProperties) => (
    <div
      key={name}
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${dx}px, ${dy}px)`,
        backgroundColor: color,
        WebkitMaskImage: `url(${asset(`brands/creando-parts/${name}.png`)})`,
        WebkitMaskSize: "100% 100%",
        ...extra,
      }}
    />
  );
  const q = clamp(typeP);
  return (
    <div style={{ position: "relative", width, height: h, ...style }}>
      {part("corner-tl", -spread, -spread)}
      {part("corner-tr", spread, -spread)}
      {part("corner-bl", -spread, spread)}
      {part("corner-br", spread, spread)}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - q) * 50}% 0 ${(1 - q) * 50}%)` }}>
        {part("type", 0, 0, { opacity: q > 0 ? 1 : 0 })}
      </div>
    </div>
  );
};

/* ───────────────────────── TEFILMO ───────────────────────── */

const tefilmoFile = () =>
  getStaticFiles().find((s) => /^brands\/tefilmo\.(png|svg|webp)$/i.test(s.name));

/**
 * Logo TEFILMO. Si existe public/brands/tefilmo.(png|svg|webp) se usa el
 * original (object-fit: contain, sin deformar). Si no, una marca tipográfica
 * provisoria con la misma voz editorial.
 */
export const TefilmoLogo: React.FC<{ width: number; p?: number; color?: string }> = ({
  width,
  p = 1,
  color = C.ink,
}) => {
  const file = tefilmoFile();
  const q = clamp(p);
  if (file) {
    return (
      <div style={{ width, clipPath: `inset(0 ${(1 - q) * 100}% 0 0)` }}>
        <Img src={file.src} style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }} />
      </div>
    );
  }
  const fs = width / 7.6;
  return (
    <div style={{ width, textAlign: "center", color }}>
      <div
        style={{
          height: 2,
          background: color,
          margin: "0 auto",
          width: `${q * 100}%`,
          opacity: 0.8,
        }}
      />
      <div
        style={{
          fontFamily: F.serif,
          fontWeight: 500,
          fontSize: fs,
          letterSpacing: "0.3em",
          marginRight: "-0.3em",
          lineHeight: 1.25,
          clipPath: `inset(0 ${(1 - q) * 50}% 0 ${(1 - q) * 50}%)`,
        }}
      >
        TEFILMO
      </div>
      <div
        style={{
          height: 2,
          background: color,
          margin: "0 auto",
          width: `${q * 100}%`,
          opacity: 0.8,
        }}
      />
    </div>
  );
};
