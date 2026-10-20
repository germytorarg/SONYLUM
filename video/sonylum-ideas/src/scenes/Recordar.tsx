import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Blur } from "../components/Blur";
import { morphLayout } from "../components/Morph";
import { SonylumLogo, sonylumAssemble } from "../components/Logos";
import { Rule } from "../components/Strokes";
import { Typewriter, Words } from "../components/Type";
import { clamp, ease, lerp, prog, spr, tw } from "../lib/anim";
import { T } from "../timeline";
import { C, F } from "../theme";

/*
 * 00:23–00:30 · LA IDEA CENTRAL + CIERRE
 * La frase llega en tres tiempos y cada tiempo empuja la composición.
 * RECORDAR ocupa el ancho y deja ecos: la memoria como huella.
 * Después todo se retira por su cuenta y queda la marca.
 */

const REC = { text: "RECORDAR", fs: 250, cx: 540, cy: 1170 };
const GLYPHS = morphLayout(REC);

const Recordar: React.FC<{ f: number }> = ({ f }) => {
  const g = (ff: number, i: number) => {
    const at = T.recordar + i * 1.6;
    const s = spr(ff, at, { damping: 13, stiffness: 150 });
    // retiro: cada letra cae con su propia gravedad y giro
    const order = Math.floor(random(`rec-ord-${i}`) * 8);
    const r0 = T.retire + 4 + order * 1.4;
    const t = Math.max(0, ff - r0);
    const fall = 3.4 * t * t;
    return {
      y: GLYPHS[i].y + (1 - s) * 300 + fall,
      x: GLYPHS[i].x + t * (random(`rec-dx-${i}`) - 0.5) * 14,
      rot: (random(`rec-r-${i}`) - 0.5) * 50 * clamp(t / 14),
      o: clamp(s * 3),
    };
  };
  return (
    <>
      {/* ecos */}
      {[1, 2, 3].map((k) => {
        const p = prog(f, T.recordar + 6 + k * 4, T.recordar + 26 + k * 4, ease.out);
        const out = prog(f, T.retire - 2 + k, T.retire + 10 + k, ease.in);
        const dy = lerp(0, REC.fs * 0.62 * k, p) + out * 80;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: REC.cy - REC.fs / 2 + dy,
              height: REC.fs,
              textAlign: "center",
              fontFamily: F.impact,
              fontSize: REC.fs,
              lineHeight: `${REC.fs}px`,
              letterSpacing: `${0.012}em`,
              color: "transparent",
              WebkitTextStroke: `2px ${k === 1 ? C.terra : C.ink}`,
              opacity: p * (0.4 / k) * (1 - out),
              clipPath: `inset(0 0 ${k === 3 ? 45 : 0}% 0)`,
            }}
          >
            {REC.text}
          </div>
        );
      })}
      {GLYPHS.map((gl, i) => {
        if (f < T.recordar + i * 1.6) return null;
        const c = g(f, i);
        const pv = g(f - 1, i);
        if (c.y > 2400) return null;
        return (
          <Blur key={i} id={`rec-${i}`} vx={c.x - pv.x} vy={c.y - pv.y} k={0.45}>
            <div
              style={{
                position: "absolute",
                left: c.x - gl.w / 2,
                top: c.y - gl.fs / 2,
                width: gl.w,
                height: gl.fs,
                fontFamily: F.impact,
                fontSize: gl.fs,
                lineHeight: `${gl.fs}px`,
                textAlign: "center",
                color: C.ink,
                opacity: c.o,
                transform: `rotate(${c.rot}deg)`,
              }}
            >
              {gl.ch}
            </div>
          </Blur>
        );
      })}
    </>
  );
};

export const IdeaCentral: React.FC<{ f: number }> = ({ f }) => {
  // cada nueva frase empuja hacia arriba a las anteriores
  const push = tw(f, [T.deMostrar, T.deMostrar + 14], [0, -26], ease.out) + tw(f, [T.recordar, T.recordar + 16], [0, -30], ease.out);
  const strike = prog(f, T.deMostrar + 16, T.deMostrar + 26, ease.whip);
  const out = T.retire;
  const strikeOut = prog(f, out, out + 8, ease.in);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 560 + push, textAlign: "center" }}>
        <Words
          text="NO SE TRATA"
          f={f}
          start={T.noSeTrata}
          stagger={4}
          out={out}
          style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 104, letterSpacing: "0.05em", color: C.ink }}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 690 + push, textAlign: "center" }}>
        <Words
          text="de mostrar."
          f={f}
          start={T.deMostrar}
          stagger={4}
          out={out + 2}
          style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 500, fontSize: 132, color: C.ink }}
        />
      </div>
      <Rule x={396} y={790 + push} len={420} p={strike} out={strikeOut} thick={7} angle={-3} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 900 + push, textAlign: "center", opacity: 1 - prog(f, out + 4, out + 12) }}>
        <Typewriter text="SE TRATA DE" f={f} start={T.seTrataDe} cps={1.1} size={50} seed="setrata" style={{ fontWeight: 700, letterSpacing: "0.3em" }} />
      </div>
      <Recordar f={f} />
    </AbsoluteFill>
  );
};

export const Cierre: React.FC<{ f: number }> = ({ f }) => {
  const fade = 1 - prog(f, T.fade, T.end - 1, ease.inOut);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SonylumLogo f={f} id="final" width={520} x={540} y={850} parts={sonylumAssemble(T.finalLogo, 480, 14)} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1200, textAlign: "center" }}>
        <Words
          text="LAS IDEAS TAMBIÉN"
          f={f}
          start={T.tagline}
          stagger={3}
          style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 70, letterSpacing: "0.12em", color: C.ink }}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1290, textAlign: "center" }}>
        <Words
          text="TIENEN VIDA."
          f={f}
          start={T.tagline + 8}
          stagger={4}
          style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 70, letterSpacing: "0.12em", color: C.ink }}
          wordStyle={(i) => (i === 1 ? { color: C.terra, fontStyle: "italic" } : undefined)}
        />
      </div>
    </AbsoluteFill>
  );
};
