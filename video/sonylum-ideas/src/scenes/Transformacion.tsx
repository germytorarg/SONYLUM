import React from "react";
import { AbsoluteFill } from "remotion";
import { Morph, MorphWord } from "../components/Morph";
import { Obj, ObjName, Pose } from "../components/Obj";
import { Corners, Rule } from "../components/Strokes";
import { Reveal } from "../components/Type";
import { clamp, drift, ease, lerp, prog, spr, tw } from "../lib/anim";
import { MORPH_DUR, T, whipX } from "../timeline";
import { ANTON_ADV, ANTON_CAP, C, F } from "../theme";

/*
 * 00:08–00:13 · LA TRANSFORMACIÓN
 * IDEA → IMAGEN → MOVIMIENTO → HISTORIA. Las letras compartidas viajan,
 * las que sobran se parten en bloques. MOVIMIENTO se mueve de verdad:
 * da un latigazo y arrastra los objetos de la mesa.
 */

const CY = 950;
const WORDS: MorphWord[] = [
  { text: "IDEA", fs: 520, cx: 540, cy: CY },
  { text: "IMAGEN", fs: 330, cx: 540, cy: CY },
  { text: "MOVIMIENTO", fs: 206, cx: 540, cy: CY },
  { text: "HISTORIA", fs: 292, cx: 540, cy: CY },
];
const AT = [T.imagen, T.movimiento, T.historia];
const DUR = [MORPH_DUR, MORPH_DUR, MORPH_DUR];

const wordWidth = (w: MorphWord) =>
  w.text.split("").reduce((a, c) => a + (ANTON_ADV[c] ?? 0.48) * w.fs, 0) + 0.012 * w.fs * (w.text.length - 1);

const ANNOT: { article: string; note: string; idx: string }[] = [
  { article: "la", note: "lo invisible.", idx: "01 / 04" },
  { article: "la", note: "lo que se ve.", idx: "02 / 04" },
  { article: "el", note: "lo que cambia.", idx: "03 / 04" },
  { article: "la", note: "lo que queda.", idx: "04 / 04" },
];

/** Artículo arriba, nota abajo: cambian con máscara en cada transición. */
const Annotations: React.FC<{ f: number }> = ({ f }) => (
  <>
    {WORDS.map((w, k) => {
      const a = k === 0 ? T.cut3 + 8 : AT[k - 1] + MORPH_DUR * 0.55;
      const b = k < AT.length ? AT[k] : T.sweep + 6;
      const pin = prog(f, a, a + 14);
      const pout = prog(f, b, b + 9, ease.in);
      if (f < a || f > b + 10) return null;
      const cap = w.fs * ANTON_CAP;
      const shift = k === 2 ? whipX(f - 6) * 0.25 : 0;
      const p = pout > 0 ? 1 - pout : pin;
      return (
        <React.Fragment key={k}>
          <div
            style={{
              position: "absolute",
              left: 540 - wordWidth(w) / 2 + shift,
              top: CY - cap / 2 - 132,
              fontFamily: F.serif,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 88,
              color: C.terra,
            }}
          >
            <Reveal p={p} dir={pout > 0 ? "down" : "up"}>
              {ANNOT[k].article}
            </Reveal>
          </div>
          <div
            style={{
              position: "absolute",
              right: 540 - wordWidth(w) / 2 - shift,
              top: CY + cap / 2 + 26,
              fontFamily: F.serif,
              fontStyle: "italic",
              fontSize: 62,
              color: C.ink,
              textAlign: "right",
            }}
          >
            <Reveal p={p} dir={pout > 0 ? "down" : "up"}>
              {ANNOT[k].note}
            </Reveal>
          </div>
          <div
            style={{
              position: "absolute",
              left: 540 - wordWidth(w) / 2 + shift,
              top: CY + cap / 2 + 50,
              fontFamily: F.mono,
              fontSize: 24,
              letterSpacing: "0.14em",
              color: C.inkSoft,
            }}
          >
            <Reveal p={p} dir="left" blur={false}>
              {ANNOT[k].idx}
            </Reveal>
          </div>
        </React.Fragment>
      );
    })}
  </>
);

/** Objetos que el latigazo de MOVIMIENTO arrastra (cada uno con su inercia). */
type Dragged = {
  name: ObjName;
  w: number;
  base: [number, number, number];
  from: [number, number, number];
  enter: number;
  drag: number; // factor de arrastre
  lag: number; // frames de retraso
  spin: number; // grados extra durante el arrastre
};
const DRAGGED: Dragged[] = [
  { name: "crumpled", w: 270, base: [168, 430, 10], from: [-260, 300, -120], enter: T.cut3 + 6, drag: 0.55, lag: 4, spin: -210 },
  { name: "coffee", w: 470, base: [1010, 330, 24], from: [1420, 180, 70], enter: T.cut3 + 2, drag: 0.42, lag: 6, spin: -16 },
  { name: "eucalyptus", w: 300, base: [985, 1560, -14], from: [1220, 2140, -40], enter: T.cut3 + 10, drag: 0.6, lag: 5, spin: -24 },
  { name: "pen", w: 620, base: [360, 1440, -28], from: [-380, 1640, -50], enter: T.imagen + 4, drag: 1.0, lag: 1, spin: 20 },
  { name: "clip", w: 136, base: [760, 1290, 16], from: [760, 1290, 16], enter: T.imagen + 16, drag: 0.85, lag: 2, spin: 70 },
];

const draggedPose =
  (d: Dragged) =>
  (f: number): Pose => {
    const isDrop = d.name === "clip";
    const p = isDrop ? 1 : prog(f, d.enter, d.enter + 26, ease.glide);
    const drop = isDrop ? spr(f, d.enter, { damping: 14, stiffness: 160 }) : 1;
    const dx = whipX(f - d.lag) * d.drag;
    const dragP = clamp(dx / (-470 * d.drag));
    const exit = prog(f, T.sweep + 4, T.sweep + 20, ease.in);
    return {
      x: lerp(d.from[0], d.base[0], p) + dx + drift(f, `${d.name}-x`, 3),
      y: lerp(d.from[1], d.base[1], p) + drift(f, `${d.name}-y`, 3),
      rot: lerp(d.from[2], d.base[2], p) + dragP * d.spin,
      s: isDrop ? lerp(1.6, 1, clamp(drop)) : 1,
      elev: isDrop ? (1 - clamp(drop)) * 0.9 + 0.05 : 0.05 + (1 - p) * 0.5 + Math.sin(Math.PI * dragP) * 0.35,
      o: (f < d.enter ? 0 : isDrop ? clamp(drop * 4) : 1) * (1 - exit),
    };
  };

/** Líneas de velocidad durante el latigazo. */
const SpeedLines: React.FC<{ f: number }> = ({ f }) => (
  <>
    {[
      [CY - 150, 0, 760],
      [CY - 40, 2, 980],
      [CY + 70, 1, 640],
      [CY + 160, 3, 860],
    ].map(([y, d, len], i) => {
      const a = T.whip + d;
      const p = prog(f, a, a + 7, ease.out);
      const o = prog(f, a + 6, a + 14, ease.in);
      return <Rule key={i} x={1080 - len - 40} y={y} len={len} p={p} out={o} thick={2} color={C.ink} />;
    })}
  </>
);

export const Transformacion: React.FC<{ f: number }> = ({ f }) => {
  // Entrada: foco que se ajusta, en continuidad con el push-in de la escena anterior
  const inBlur = tw(f, [T.cut3 - 2, T.cut3 + 12], [26, 0], ease.out);
  const inScale = tw(f, [T.cut3 - 2, T.cut3 + 16], [1.22, 1], ease.out);
  const inO = prog(f, T.cut3 - 2, T.cut3 + 4, ease.linear);

  // IMAGEN: un visor se cierra sobre la palabra
  const wI = wordWidth(WORDS[1]);
  const capI = WORDS[1].fs * ANTON_CAP;
  const close = spr(f, T.imagen + MORPH_DUR - 6, { damping: 16, stiffness: 120 });
  const open = prog(f, T.movimiento, T.movimiento + 10, ease.in);
  const spread = lerp(160, 0, clamp(close)) + open * 260;
  const cornersO = clamp(close * 3) * (1 - open);

  return (
    <AbsoluteFill>
      {DRAGGED.map((d) => (
        <Obj key={d.name} id={`tr-${d.name}`} name={d.name} w={d.w} f={f} pose={draggedPose(d)} />
      ))}
      <Corners
        x={540 - wI / 2 - 30}
        y={CY - capI / 2 - 34}
        w={wI + 60}
        h={capI + 68}
        size={70}
        thick={7}
        color={C.terra}
        spread={spread}
        o={f > T.imagen ? cornersO : 0}
      />
      <SpeedLines f={f} />
      <AbsoluteFill
        style={{
          opacity: inO,
          transform: `scale(${inScale})`,
          filter: inBlur > 0.2 ? `blur(${inBlur}px)` : undefined,
        }}
      >
        <Morph
          f={f}
          id="tr"
          words={WORDS}
          at={AT}
          dur={DUR}
          offset={(ff, k, i) => (k === 2 ? { x: whipX(ff - i * 0.9), y: 0 } : { x: 0, y: 0 })}
        />
      </AbsoluteFill>
      <Annotations f={f} />
    </AbsoluteFill>
  );
};
