import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Blur, liftShadow } from "../components/Blur";
import { Obj, Pose } from "../components/Obj";
import { Paper } from "../components/Paper";
import { HandCircle, Rule } from "../components/Strokes";
import { Reveal, Typewriter, Words } from "../components/Type";
import { clamp, drift, ease, lerp, prog, spr, tw } from "../lib/anim";
import { T } from "../timeline";
import { C, F } from "../theme";

/*
 * 00:00–00:08 · LA IDEA + EL PROCESO
 * Una sola hoja atraviesa ambos momentos: cae, recibe la frase, se desplaza
 * y se convierte en la superficie donde se tipea el proceso.
 */

export const SHEET_W = 780;
export const SHEET_H = 780 / (677 / 429);

/** Pose de la hoja protagonista (centro, rotación, escala). */
export const sheetPose = (f: number): Pose => {
  const p = spr(f, T.sheetFall, { damping: 18, stiffness: 58, mass: 1.15 });
  const fall = 1 - clamp(p);
  const q = prog(f, T.proceso, T.proceso + 30, ease.glide);
  return {
    x: 540 - 90 * fall + Math.sin(f * 0.22) * 46 * fall - 30 * q + drift(f, "sh-x", 2),
    y: lerp(-460, 870, p) - 130 * q,
    rot: lerp(-34, -4, p) + 7 * q + drift(f, "sh-r", 0.25),
    rx: 58 * fall,
    ry: Math.sin(f * 0.27) * 24 * fall,
    s: 1 + 0.12 * q,
    elev: 0.04 + 0.95 * fall,
  };
};

/** Línea tipeada sobre la hoja (coordenadas locales de la hoja). */
const LINE = { left: 66, size: 54, tops: [92, 186, 280] };
const CH = LINE.size * 0.62;

const Sheet: React.FC<{ f: number }> = ({ f }) => {
  const p = sheetPose(f);
  const prev = sheetPose(f - 1);
  // Clip que muerde la esquina de la hoja
  const clipP = spr(f, T.coffeeIn + 16, { damping: 14, stiffness: 150 });
  // cinta terracota bajo "IDEA."
  const tape = prog(f, T.lineIdea + 10, T.lineIdea + 20, ease.out);
  const circle = prog(f, T.linePregunta + 22, T.linePregunta + 40, ease.inOut);
  const titleOut = T.proceso;
  return (
    <Blur id="sheet" vx={p.x - prev.x} vy={p.y - prev.y} extraFilter={liftShadow(p.elev ?? 0)}>
      <div
        style={{
          position: "absolute",
          left: p.x,
          top: p.y,
          width: SHEET_W,
          height: SHEET_H,
          transform: `translate(-50%,-50%) perspective(1800px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rot}deg) scale(${p.s})`,
        }}
      >
        <Img src={staticFile("objects/torn-paper.png")} style={{ width: "100%", height: "100%" }} />

        {/* TODO EMPIEZA */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 128, textAlign: "center" }}>
          <Words
            text="TODO EMPIEZA"
            f={f}
            start={T.todoEmpieza}
            stagger={5}
            dur={18}
            out={titleOut}
            style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 92, letterSpacing: "0.05em", color: C.ink }}
          />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 246, textAlign: "center" }}>
          <Words
            text="con una"
            f={f}
            start={T.todoEmpieza + 12}
            stagger={4}
            dur={16}
            out={titleOut + 2}
            style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 500, fontSize: 70, color: C.terra }}
          />
        </div>

        {/* EL PROCESO: tres líneas mecanografiadas */}
        {tape > 0 ? (
          <div
            style={{
              position: "absolute",
              left: LINE.left + 4 * CH - 16,
              top: LINE.tops[2] - 6,
              clipPath: `inset(0 ${(1 - tape) * 100}% 0 0)`,
            }}
          >
            <Paper w={5 * CH + 34} h={78} seed="tape" color={C.terra} rim="#C58A70" rough={6} texture={0.35} sides={{ left: true, right: true }} />
          </div>
        ) : null}
        {[
          ["UNA MIRADA.", T.lineMirada],
          ["UNA PREGUNTA.", T.linePregunta],
          ["UNA IDEA.", T.lineIdea],
        ].map(([text, start], i) => (
          <div key={i} style={{ position: "absolute", left: LINE.left, top: LINE.tops[i] }}>
            <Typewriter
              text={text as string}
              f={f}
              start={start as number}
              size={LINE.size}
              seed={`tw${i}`}
              caret={i === 2 || f < (i === 0 ? T.linePregunta : T.lineIdea)}
              charStyle={(ci) => (i === 2 && ci >= 4 && tape > 0.6 ? { color: C.paperLight } : undefined)}
            />
          </div>
        ))}
        <HandCircle
          w={9 * CH + 40}
          h={96}
          p={circle}
          seed="preg"
          width={4.5}
          style={{ left: LINE.left + 4 * CH - 22, top: LINE.tops[1] - 16 }}
        />

        {/* clip mordiendo la esquina superior izquierda */}
        {f >= T.coffeeIn + 14 ? (
          <div
            style={{
              position: "absolute",
              left: 40,
              top: -66,
              width: 120,
              transform: `rotate(-14deg) scale(${lerp(1.5, 1, clamp(clipP))}) translateY(${(1 - clamp(clipP)) * -40}px)`,
              opacity: clamp(clipP * 4),
              filter: liftShadow(0.1 + (1 - clamp(clipP)) * 0.8),
            }}
          >
            <Img src={staticFile("objects/binder-clip.png")} style={{ width: "100%" }} />
          </div>
        ) : null}
      </div>
    </Blur>
  );
};

/** IDEA: entra enorme, con foco que se ajusta y un leve overshoot. */
const BigIdea: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.ideaHit - 1) return null;
  const s = spr(f, T.ideaHit, { damping: 12, stiffness: 150 });
  const scale = lerp(1.55, 1, s);
  const blur = tw(f, [T.ideaHit, T.ideaHit + 10], [30, 0], ease.out);
  const o = prog(f, T.ideaHit, T.ideaHit + 5, ease.linear);
  // salida: cae fuera de cuadro cuando la hoja se desplaza
  const exitY = (ff: number) => tw(ff, [T.proceso, T.proceso + 18], [0, 1100], ease.in);
  const exitR = tw(f, [T.proceso, T.proceso + 18], [0, 7], ease.in);
  const vy = exitY(f) - exitY(f - 1);
  const rule = prog(f, T.ideaRule, T.ideaRule + 14, ease.whip);
  const ruleOut = prog(f, T.proceso - 4, T.proceso + 8, ease.in);
  return (
    <>
      <Blur id="bigidea" vy={vy} focus={blur}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1330 - 300,
            height: 600,
            textAlign: "center",
            fontFamily: F.impact,
            fontSize: 560,
            lineHeight: "600px",
            color: C.ink,
            letterSpacing: "0.005em",
            opacity: o,
            transform: `translateY(${exitY(f)}px) rotate(${exitR}deg) scale(${scale})`,
          }}
        >
          IDEA
        </div>
      </Blur>
      <Rule x={70} y={1598} len={940} p={rule} out={ruleOut} thick={6} glow />
    </>
  );
};

/** Notas al pie: tipografía secundaria a escala mínima (contraste extremo). */
const Footnotes: React.FC<{ f: number }> = ({ f }) => {
  const out = T.proceso + 4;
  const st: React.CSSProperties = { fontFamily: F.mono, fontSize: 23, lineHeight: 1.45, color: C.inkSoft };
  const line = (text: string, a: number, i: number) => (
    <div key={i}>
      <Reveal p={prog(f, a, a + 14) * (1 - prog(f, out + i * 2, out + i * 2 + 10, ease.in))}>{text}</Reveal>
    </div>
  );
  return (
    <>
      <div style={{ position: "absolute", left: 70, top: 1660, ...st }}>
        {line("idea (f.) —", T.ideaHit + 20, 0)}
        {line("representación de algo", T.ideaHit + 24, 1)}
        {line("que todavía no existe.", T.ideaHit + 28, 2)}
      </div>
    </>
  );
};

/** Recortes de papel que acompañan cada cambio de línea. */
const Scraps: React.FC<{ f: number }> = ({ f }) => {
  const scrap = (
    key: string,
    at: number,
    from: [number, number, number],
    to: [number, number, number],
    w: number,
    h: number,
    color: string,
    content: React.ReactNode,
  ) => {
    if (f < at) return null;
    const pose = (ff: number) => {
      const p = spr(ff, at, { damping: 20, stiffness: 90 });
      return {
        x: lerp(from[0], to[0], p),
        y: lerp(from[1], to[1], p),
        r: lerp(from[2], to[2], p),
        e: 1 - clamp(p),
      };
    };
    const p = pose(f);
    const pv = pose(f - 1);
    return (
      <Blur key={key} id={`scrap-${key}`} vx={p.x - pv.x} vy={p.y - pv.y} extraFilter={liftShadow(0.05 + p.e * 0.7)}>
        <div style={{ position: "absolute", left: p.x - w / 2, top: p.y - h / 2, transform: `rotate(${p.r}deg)` }}>
          <Paper w={w} h={h} seed={key} color={color} rough={7}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>{content}</div>
          </Paper>
        </div>
      </Blur>
    );
  };
  return (
    <>
      {scrap(
        "mirar",
        T.lineMirada + 6,
        [-260, 1260, -30],
        [262, 1222, -5],
        380,
        118,
        C.paperLight,
        <span style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 58, color: C.ink }}>mirar despacio.</span>,
      )}
      {scrap(
        "pregunta",
        T.linePregunta + 6,
        [1340, 1150, 28],
        [818, 1188, 6],
        300,
        150,
        C.paperDeep,
        <span style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 500, fontSize: 84, color: C.terra }}>¿y si…?</span>,
      )}
    </>
  );
};

export const Cuaderno: React.FC<{ f: number }> = ({ f }) => {
  // al final, la cámara se mete en "IDEA" y todo pierde foco
  const outBlur = tw(f, [T.cut3 - 10, T.cut3], [0, 16], ease.in);
  const outO = 1 - prog(f, T.cut3 - 4, T.cut3 + 2, ease.linear);

  const glasses = (ff: number): Pose => {
    const p = prog(ff, T.glassesCross, T.glassesCross + 42, ease.glide);
    const nudge = prog(ff, T.lineMirada, T.lineMirada + 18, ease.out);
    return {
      x: lerp(-420, 846, p) - 28 * nudge + drift(ff, "gl", 2),
      y: lerp(820, 372, p) - Math.sin(Math.PI * p) * 170,
      rot: lerp(-48, 15, p) + 6 * nudge,
      ry: lerp(78, 0, p),
      rx: lerp(28, 0, p),
      s: lerp(1.4, 1, p),
      elev: lerp(1, 0.07, p),
      o: ff < T.glassesCross ? 0 : 1,
    };
  };
  const coffee = (ff: number): Pose => {
    const p = prog(ff, T.coffeeIn, T.coffeeIn + 30, ease.glide);
    return {
      x: lerp(1440, 892, p),
      y: lerp(1560, 1470, p),
      rot: lerp(70, 12, p) + drift(ff, "cf", 0.6),
      elev: lerp(0.5, 0.06, p),
      o: ff < T.coffeeIn ? 0 : 1,
    };
  };
  const crumpled = (ff: number): Pose => {
    const p = prog(ff, T.linePregunta + 4, T.linePregunta + 32, ease.out);
    const x = lerp(-300, 186, p);
    return { x, y: 1600, rot: ((x + 300) / 140) * 57.3, elev: 0.08, o: ff < T.linePregunta ? 0 : 1 };
  };

  return (
    <AbsoluteFill style={{ filter: outBlur > 0.2 ? `blur(${outBlur}px)` : undefined, opacity: outO }}>
      <Footnotes f={f} />
      <Obj name="coffee" w={500} f={f} pose={coffee} />
      <Obj name="crumpled" w={300} f={f} pose={crumpled} />
      <Scraps f={f} />
      <Sheet f={f} />
      <BigIdea f={f} />
      <Obj name="glasses" w={600} f={f} pose={glasses} />
    </AbsoluteFill>
  );
};

/** Punto de la palabra IDEA tipeada en coordenadas de escena (para la cámara). */
export const ideaTypedPoint = () => {
  const p = sheetPose(T.pushIn);
  const lx = LINE.left + 4 * CH + 2.5 * CH - SHEET_W / 2;
  const ly = LINE.tops[2] + LINE.size * 0.55 - SHEET_H / 2;
  const a = ((p.rot ?? 0) * Math.PI) / 180;
  const s = p.s ?? 1;
  return { x: p.x + s * (lx * Math.cos(a) - ly * Math.sin(a)), y: p.y + s * (lx * Math.sin(a) + ly * Math.cos(a)) };
};
