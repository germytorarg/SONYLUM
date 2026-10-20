import React from "react";
import { AbsoluteFill, Img, random } from "remotion";
import { camTransform } from "../camera";
import { clamp, ease, prog } from "../lib/anim";
import { T } from "../timeline";
import { C, F, H, W } from "../theme";
import { Cross, Rule } from "./Strokes";
import { asset } from "../lib/asset";

/** Capa que sigue a la cámara con su propia profundidad (parallax 2.5D). */
export const CameraLayer: React.FC<{ f: number; depth?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  f,
  depth = 1,
  children,
  style,
}) => (
  <AbsoluteFill style={{ transformOrigin: "0 0", transform: camTransform(f, depth), ...style }}>{children}</AbsoluteFill>
);

/** Papel marfil con fibras. Sobredimensionado para soportar zoom-out. */
export const PaperBackground: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: C.paper }} />
    <Img
      src={asset("textures/paper.jpg")}
      style={{ position: "absolute", left: -140, top: -240, width: W + 280, height: H + 480, objectFit: "cover" }}
    />
  </>
);

/** Grano fotográfico muy fino + viñeta cálida + respiración de exposición. */
export const AnalogOverlay: React.FC<{ f: number; boost?: number }> = ({ f, boost = 0 }) => {
  const tile = Math.floor(f / 2) % 3;
  const ox = Math.floor(random(`gx-${Math.floor(f / 2)}`) * 540);
  const oy = Math.floor(random(`gy-${Math.floor(f / 2)}`) * 960);
  const flicker = (random(`fl-${f}`) - 0.5) * (0.012 + boost * 0.05);
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${asset(`textures/grain-${tile}.jpg`)})`,
          backgroundSize: "540px 960px",
          backgroundPosition: `${ox}px ${oy}px`,
          mixBlendMode: "overlay",
          opacity: 0.16 + boost * 0.2,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 85% at 50% 45%, rgba(0,0,0,0) 55%, rgba(70,50,30,0.16) 100%)",
        }}
      />
      <AbsoluteFill style={{ background: flicker > 0 ? "#fff" : "#2a1d12", opacity: Math.abs(flicker) }} />
    </>
  );
};

/* ───────────── Marcas técnicas (plano de dibujo, como en la referencia) ───────────── */

type Mark =
  | { k: "rule"; x: number; y: number; len: number; angle?: number; a: number; b: number }
  | { k: "cross"; x: number; y: number; a: number; b: number; ink?: boolean }
  | { k: "label"; x: number; y: number; text: string; a: number; b: number }
  | { k: "circle"; x: number; y: number; r: number; a: number; b: number };

const MARKS: Mark[] = [
  // La idea
  { k: "rule", x: 70, y: 470, len: 360, a: 10, b: T.proceso + 10 },
  { k: "rule", x: 650, y: 1720, len: 360, a: 20, b: T.proceso + 10 },
  { k: "cross", x: 120, y: 560, a: 16, b: T.pushIn },
  { k: "cross", x: 980, y: 1180, a: 24, b: T.pushIn },
  { k: "label", x: 74, y: 430, text: "X1 · 0.00", a: 14, b: T.proceso + 6 },
  { k: "label", x: 860, y: 1745, text: "FIG. 01", a: 26, b: T.proceso + 6 },
  { k: "circle", x: 540, y: 1330, r: 520, a: 50, b: T.proceso },
  // El proceso
  { k: "rule", x: 70, y: 1300, len: 280, a: T.lineMirada, b: T.pushIn },
  { k: "label", x: 74, y: 1260, text: "01 · MIRAR", a: T.lineMirada + 4, b: T.pushIn },
  { k: "label", x: 74, y: 1330, text: "02 · PREGUNTAR", a: T.linePregunta + 4, b: T.pushIn },
  { k: "label", x: 74, y: 1400, text: "03 · IDEAR", a: T.lineIdea + 4, b: T.pushIn },
  // Transformación
  { k: "rule", x: 0, y: 1330, len: 1080, a: T.cut3 + 8, b: T.sweep + 8 },
  { k: "rule", x: 0, y: 590, len: 1080, a: T.cut3 + 12, b: T.sweep + 8 },
  { k: "cross", x: 540, y: 600, a: T.cut3 + 18, b: T.sweep + 8 },
  { k: "cross", x: 540, y: 1300, a: T.cut3 + 22, b: T.sweep + 8 },
  { k: "label", x: 74, y: 550, text: "XZ", a: T.cut3 + 16, b: T.sweep + 8 },
  { k: "label", x: 960, y: 1350, text: "X4", a: T.cut3 + 20, b: T.sweep + 8 },
  // Sonylum
  { k: "cross", x: 140, y: 420, a: T.logo + 8, b: T.cut },
  { k: "cross", x: 940, y: 1640, a: T.logo + 12, b: T.cut },
  { k: "rule", x: 70, y: 1105, len: 940, a: T.verb1 - 6, b: T.cut },
  // Idea central
  { k: "rule", x: 70, y: 470, len: 300, a: T.noSeTrata - 4, b: T.retire },
  { k: "cross", x: 960, y: 470, a: T.noSeTrata, b: T.retire },
  { k: "label", x: 74, y: 430, text: "NOTA AL MARGEN", a: T.noSeTrata, b: T.retire },
  { k: "circle", x: 540, y: 1130, r: 600, a: T.recordar, b: T.retire + 10 },
];

export const DraftMarks: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    {MARKS.map((m, i) => {
      if (f < m.a - 1 || f > m.b + 20) return null;
      const pin = prog(f, m.a, m.a + 20, ease.out);
      const pout = prog(f, m.b, m.b + 14, ease.in);
      if (m.k === "rule")
        return <Rule key={i} x={m.x} y={m.y} len={m.len} p={pin} out={pout} thick={1.5} color={C.rule} angle={m.angle} />;
      if (m.k === "cross")
        return <Cross key={i} x={m.x} y={m.y} o={pin * (1 - pout)} color={m.ink ? C.ink : C.terra} size={24} />;
      if (m.k === "circle") {
        const len = 2 * Math.PI * m.r;
        return (
          <svg key={i} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={W} height={H}>
            <circle
              cx={m.x}
              cy={m.y}
              r={m.r}
              fill="none"
              stroke={C.hair}
              strokeWidth={1.5}
              strokeDasharray={`${len * pin * (1 - pout)} ${len}`}
              transform={`rotate(-90 ${m.x} ${m.y})`}
            />
          </svg>
        );
      }
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: m.x,
            top: m.y,
            fontFamily: F.mono,
            fontSize: 20,
            letterSpacing: "0.12em",
            color: C.inkSoft,
            opacity: 0.75 * pin * (1 - pout),
            clipPath: `inset(0 ${(1 - pin) * 100}% 0 0)`,
          }}
        >
          {m.text}
        </div>
      );
    })}
  </AbsoluteFill>
);

/* ───────────── HUD editorial fijo a pantalla ───────────── */

const CHAPTERS: [number, string][] = [
  [0, "01 — LA IDEA"],
  [T.proceso, "02 — EL PROCESO"],
  [T.cut3, "03 — LA TRANSFORMACIÓN"],
  [T.logo, "04 — SONYLUM"],
  [T.cut + 20, "05 — EL ECOSISTEMA"],
  [T.clear + 10, "06 — LA IDEA CENTRAL"],
  [T.retire + 10, "07 — CIERRE"],
];

const tc = (f: number) => {
  const s = Math.floor(f / 30);
  const fr = f % 30;
  return `00:00:${String(s).padStart(2, "0")}:${String(fr).padStart(2, "0")}`;
};

export const Hud: React.FC<{ f: number }> = ({ f }) => {
  const idx = CHAPTERS.reduce((acc, [a], i) => (f >= a ? i : acc), 0);
  const [a, label] = CHAPTERS[idx];
  const p = prog(f, a, a + 14, ease.out);
  const fadeOut = 1 - prog(f, T.fade - 30, T.fade - 6, ease.inOut);
  const intro = prog(f, 2, 22, ease.out);
  const o = intro * fadeOut;
  const base: React.CSSProperties = {
    position: "absolute",
    fontFamily: F.mono,
    fontSize: 21,
    letterSpacing: "0.14em",
    color: C.inkSoft,
    opacity: o,
  };
  return (
    <AbsoluteFill>
      <div style={{ ...base, left: 70, top: 92 }}>SONYLUM® — CUADERNO DE IDEAS</div>
      <div style={{ ...base, right: 70, top: 92, overflow: "hidden", height: 26 }}>
        <div style={{ transform: `translateY(${(1 - p) * 100}%)` }}>{label}</div>
      </div>
      <div style={{ ...base, left: 70, bottom: 92 }}>{tc(f)}</div>
      <div style={{ ...base, right: 70, bottom: 92 }}>BUENOS AIRES · 2026</div>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          bottom: 78,
          height: 1.5,
          background: C.hair,
          opacity: o,
        }}
      >
        <div style={{ width: `${clamp(f / T.end) * 100}%`, height: "100%", background: C.terra }} />
      </div>
    </AbsoluteFill>
  );
};
