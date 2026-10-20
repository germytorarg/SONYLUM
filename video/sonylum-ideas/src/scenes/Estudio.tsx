import React from "react";
import { AbsoluteFill } from "remotion";
import { camera } from "../camera";
import { Blur, liftShadow } from "../components/Blur";
import { CC_AR, CreandoLogo, SonylumLogo, sonylumAssemble, TefilmoLogo } from "../components/Logos";
import { Obj, Pose } from "../components/Obj";
import { Paper } from "../components/Paper";
import { Rule } from "../components/Strokes";
import { Reveal, Typewriter } from "../components/Type";
import { clamp, drift, ease, lerp, prog, spr, tw } from "../lib/anim";
import { T } from "../timeline";
import { ANTON_ADV, C, F, H, W } from "../theme";

/*
 * 00:13–00:23 · SONYLUM + EL ECOSISTEMA
 * La composición de SONYLUM se recorta como una página de revista y se
 * convierte en la primera pieza de un collage donde las tres marcas
 * quedan enhebradas: estudio madre → contenido vertical → bodas.
 */

const LOGO = { x: 540, y: 720, w: 560 };
const VERB_Y = [1148, 1288, 1424];
const CUT = { x: 90, y: 386, w: 900, h: 1220 };
const CARD_S = 0.44;
const CARD1 = { x: 540, y: 490, rot: -4 };
const CARD2 = { x: 556, y: 1000, rot: 3, w: 600, h: 400 };
const CARD3 = { x: 524, y: 1480, rot: -2, w: 640, h: 330 };

const antonWidth = (t: string, fs: number) => t.split("").reduce((a, c) => a + (ANTON_ADV[c] ?? 0.48) * fs, 0);

/* ───────────── verbos ───────────── */

const Verb: React.FC<{
  f: number;
  at: number;
  y: number;
  from: "left" | "right" | "bottom";
  n: string;
  children: React.ReactNode;
  style: React.CSSProperties;
}> = ({ f, at, y, from, n, children, style }) => {
  const move = (ff: number) => tw(ff, [at, at + 20], [1, 0], ease.out);
  const m = move(f);
  const v = move(f) - move(f - 1);
  const dx = from === "left" ? -420 * m : from === "right" ? 420 * m : 0;
  const dy = from === "bottom" ? 160 * m : 0;
  const wipe = prog(f, at, at + 14, ease.out);
  const clip =
    from === "left"
      ? `inset(-20% ${(1 - wipe) * 100}% -20% 0)`
      : from === "right"
        ? `inset(-20% 0 -20% ${(1 - wipe) * 100}%)`
        : `inset(${(1 - wipe) * 100}% 0 -20% 0)`;
  if (f < at) return null;
  return (
    <>
      <Blur id={`verb-${n}`} vx={from === "bottom" ? 0 : v * 420} vy={from === "bottom" ? v * 160 : 0} k={0.5}>
        <div style={{ position: "absolute", left: 0, right: 0, top: y, height: 0, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
          <div style={{ transform: `translate(${dx}px, calc(-50% + ${dy}px))`, clipPath: clip, ...style }}>{children}</div>
        </div>
      </Blur>
      <div style={{ position: "absolute", left: 92, top: y - 14, fontFamily: F.mono, fontSize: 22, letterSpacing: "0.12em", color: C.inkSoft }}>
        <Reveal p={prog(f, at + 4, at + 16)} dir="up" blur={false}>
          {n}
        </Reveal>
      </div>
    </>
  );
};

/* ───────────── composición SONYLUM (luego tarjeta 1) ───────────── */

const PEN_TIP = { dx: -266, dy: 112 }; // punta de la lapicera respecto de su centro (w=560)
const LINE_Y = VERB_Y[2] + 76;
const LINE_X0 = 540 - antonWidth("CREAMOS.", 128) / 2 - 12;
const LINE_X1 = 540 + antonWidth("CREAMOS.", 128) / 2 + 12;

const penTipX = (f: number) => tw(f, [T.penLine, T.penLine + 22], [LINE_X0, LINE_X1], ease.inOut);

const penPose = (f: number): Pose => {
  const enter = prog(f, T.penLine - 20, T.penLine, ease.glide);
  const exit = prog(f, T.penLine + 26, T.penLine + 44, ease.in);
  const tipX = penTipX(f);
  const tipY = LINE_Y + Math.sin(f * 1.3) * 1.5 * prog(f, T.penLine, T.penLine + 3);
  return {
    x: tipX - PEN_TIP.dx + lerp(520, 0, enter) + exit * 700,
    y: tipY - PEN_TIP.dy + lerp(420, 0, enter) - exit * 520,
    rot: lerp(14, 0, enter) - exit * 8,
    elev: 0.12 + (1 - enter) * 0.6 + exit * 0.6,
    o: f < T.penLine - 20 ? 0 : 1,
  };
};

const SonylumPage: React.FC<{ f: number }> = ({ f }) => (
  <>
    <SonylumLogo f={f} id="s4logo" width={LOGO.w} x={LOGO.x} y={LOGO.y} parts={sonylumAssemble(T.logo)} />
    <Verb f={f} at={T.verb1} y={VERB_Y[0]} from="left" n="01" style={{ fontFamily: F.impact, fontSize: 128, lineHeight: 1, color: C.ink }}>
      DISEÑAMOS.
    </Verb>
    <Verb
      f={f}
      at={T.verb2}
      y={VERB_Y[1]}
      from="right"
      n="02"
      style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 500, fontSize: 158, lineHeight: 1, color: C.ink }}
    >
      filmamos.
    </Verb>
    <Verb f={f} at={T.verb3} y={VERB_Y[2]} from="bottom" n="03" style={{ fontFamily: F.impact, fontSize: 128, lineHeight: 1, color: C.terra }}>
      CREAMOS.
    </Verb>
    {f >= T.penLine ? (
      <div
        style={{
          position: "absolute",
          left: LINE_X0,
          top: LINE_Y - 2.5,
          width: Math.max(0, penTipX(f) - LINE_X0),
          height: 5,
          background: C.ink,
          borderRadius: 3,
        }}
      />
    ) : null}
    <div style={{ position: "absolute", left: 0, right: 0, top: CUT.y + CUT.h - 56, textAlign: "center" }}>
      <Typewriter text="ESTUDIO CREATIVO · VILLA LURO, BUENOS AIRES" f={f} start={T.penLine + 8} cps={0.7} size={22} color={C.inkSoft} caret={false} />
    </div>
  </>
);

/** Línea de corte punteada (tijera de revista). */
const CutLine: React.FC<{ p: number; o: number }> = ({ p, o }) => {
  const len = 2 * (CUT.w + CUT.h);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <defs>
        <mask id="cutmask">
          <rect
            x={CUT.x}
            y={CUT.y}
            width={CUT.w}
            height={CUT.h}
            fill="none"
            stroke="#fff"
            strokeWidth={8}
            strokeDasharray={`${len * p} ${len}`}
          />
        </mask>
      </defs>
      <rect
        x={CUT.x}
        y={CUT.y}
        width={CUT.w}
        height={CUT.h}
        fill="none"
        stroke={C.ink}
        strokeWidth={2.5}
        strokeDasharray="16 12"
        mask="url(#cutmask)"
      />
    </svg>
  );
};

/* ───────────── foco: desenfoque por distancia a la cámara ───────────── */

const dof = (f: number, y: number) => {
  const c = camera(f);
  const focusY = H / 2 + c.y;
  const zoomK = clamp((c.z - 1) / 0.24);
  return Math.min(7, (Math.abs(y - focusY) / 140) * zoomK);
};

/* ───────────── escena ───────────── */

export const Estudio: React.FC<{ f: number }> = ({ f }) => {
  // recorte: cut-line → se levanta → viaja a su lugar en el collage
  const cutDraw = prog(f, T.cut, T.cut + 14, ease.inOut);
  const lift = prog(f, T.cut + 12, T.cut + 20, ease.out);
  const travel = (ff: number) => prog(ff, T.cut + 18, T.cut + 44, ease.glide);
  const tr = travel(f);
  const clear = (ff: number) => prog(ff, T.clear + 2, T.clear + 20, ease.in);
  const cx = CUT.x + CUT.w / 2;
  const cy = CUT.y + CUT.h / 2;
  const g = (ff: number) => {
    const t = travel(ff);
    return {
      x: lerp(cx, CARD1.x, t) + clear(ff) * 1500,
      y: lerp(cy, CARD1.y, t) + Math.sin(Math.PI * t) * -60 - clear(ff) * 200,
      s: lerp(1, CARD_S, t),
      r: lerp(0, CARD1.rot, t) + Math.sin(Math.PI * t) * -5 + clear(ff) * 24,
    };
  };
  const G = g(f);
  const Gp = g(f - 1);
  const card1Elev = lift * 0.75 * (1 - tr) + tr * 0.12 + Math.sin(Math.PI * tr) * 0.3;

  // tarjeta 2 · CREANDO CONTENIDOS
  const c2 = (ff: number) => {
    const p = spr(ff, T.cardCC, { damping: 19, stiffness: 80 });
    return {
      x: lerp(1560, CARD2.x, p) + clear(ff - 3) * 1500,
      y: lerp(1180, CARD2.y, p) - clear(ff - 3) * 60,
      r: lerp(28, CARD2.rot, p) + clear(ff - 3) * 30,
      e: (1 - clamp(p)) * 0.8 + 0.1,
    };
  };
  const P2 = c2(f);
  const P2p = c2(f - 1);
  const ccSpread = lerp(120, 0, clamp(spr(f, T.cardCC + 12, { damping: 15, stiffness: 120 })));
  const ccType = prog(f, T.cardCC + 16, T.cardCC + 30, ease.out);

  // tarjeta 3 · TEFILMO
  const c3 = (ff: number) => {
    const p = spr(ff, T.cardTefilmo, { damping: 19, stiffness: 80 });
    return {
      x: lerp(380, CARD3.x, p) + clear(ff - 6) * 1500,
      y: lerp(2380, CARD3.y, p) + clear(ff - 6) * 120,
      r: lerp(-22, CARD3.rot, p) + clear(ff - 6) * 20,
      e: (1 - clamp(p)) * 0.8 + 0.1,
    };
  };
  const P3 = c3(f);
  const P3p = c3(f - 1);
  const tefP = prog(f, T.cardTefilmo + 14, T.cardTefilmo + 32, ease.out);

  const clipPose = (ff: number): Pose => {
    const s = spr(ff, T.cardCC + 18, { damping: 14, stiffness: 160 });
    const c = c2(ff);
    return {
      x: c.x - 170,
      y: c.y - CARD2.h / 2 + 10,
      rot: c.r - 8,
      s: lerp(1.6, 1, clamp(s)),
      elev: 0.05 + (1 - clamp(s)) * 0.9,
      o: ff < T.cardCC + 18 ? 0 : clamp(s * 4),
    };
  };
  const eucaPose = (ff: number): Pose => {
    const p = prog(ff, T.cardTefilmo + 8, T.cardTefilmo + 36, ease.glide);
    const c = c3(ff);
    return {
      x: lerp(1380, 900, p) + clear(ff - 6) * 900,
      y: lerp(1900, 1380, p) + drift(ff, "eu", 4),
      rot: lerp(60, 28, p) + drift(ff, "eur", 1.5),
      elev: 0.06,
      o: ff < T.cardTefilmo + 8 ? 0 : 1,
      focus: dof(ff, c.y),
    };
  };

  // hilo que relaciona las marcas
  const thread1 = prog(f, T.cardCC + 24, T.cardCC + 44, ease.inOut);
  const thread2 = prog(f, T.cardTefilmo + 24, T.cardTefilmo + 44, ease.inOut);
  const threadOut = prog(f, T.clear, T.clear + 10, ease.in);
  const TX = 118;

  const label = (text: string, y: number, at: number) => (
    <div
      style={{
        position: "absolute",
        left: TX + 10,
        top: y,
        fontFamily: F.mono,
        fontSize: 21,
        letterSpacing: "0.14em",
        color: C.terra,
        transformOrigin: "0 0",
        transform: "rotate(-90deg)",
        whiteSpace: "nowrap",
        opacity: 1 - threadOut,
      }}
    >
      <Typewriter text={text} f={f} start={at} cps={0.9} size={21} color={C.terra} caret={false} />
    </div>
  );
  const node = (y: number, at: number) => {
    const s = spr(f, at, { damping: 13, stiffness: 180 });
    return (
      <div
        style={{
          position: "absolute",
          left: TX - 9,
          top: y - 9,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: C.terra,
          transform: `scale(${clamp(s, 0, 1.2) * (1 - threadOut)})`,
        }}
      />
    );
  };

  const showCards = f >= T.cut;
  return (
    <AbsoluteFill>
      {/* hilo y etiquetas */}
      {showCards ? (
        <>
          <Rule x={TX} y={CARD1.y} len={CARD2.y - CARD1.y} p={thread1} out={threadOut} angle={90} thick={3} />
          <Rule x={TX} y={CARD2.y} len={CARD3.y - CARD2.y} p={thread2} out={threadOut} angle={90} thick={3} />
          {node(CARD1.y, T.cut + 40)}
          {node(CARD2.y, T.cardCC + 30)}
          {node(CARD3.y, T.cardTefilmo + 30)}
          {f >= T.cut + 44 ? label("01 · ESTUDIO MADRE", CARD1.y - 30, T.cut + 44) : null}
          {f >= T.cardCC + 30 ? label("02 · CONTENIDO 9:16", CARD2.y - 30, T.cardCC + 30) : null}
          {f >= T.cardTefilmo + 30 ? label("03 · BODAS & CINE", CARD3.y - 30, T.cardTefilmo + 30) : null}
        </>
      ) : null}

      {/* tarjeta 1: la página SONYLUM recortada */}
      <Blur id="card1" vx={G.x - Gp.x} vy={G.y - Gp.y} focus={dof(f, G.y)} extraFilter={showCards ? liftShadow(card1Elev) : undefined}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            transformOrigin: `${cx}px ${cy}px`,
            transform: `translate(${G.x - cx}px, ${G.y - cy}px) rotate(${G.r}deg) scale(${G.s})`,
          }}
        >
          {showCards && lift > 0 ? (
            <div style={{ position: "absolute", left: CUT.x, top: CUT.y }}>
              <Paper w={CUT.w} h={CUT.h} seed="card1" color={C.paperLight} rough={3} texture={0.4} rim="#FBF9F4" />
            </div>
          ) : null}
          <SonylumPage f={f} />
        </div>
      </Blur>
      {f < T.cut + 20 ? <CutLine p={cutDraw} o={1 - lift} /> : null}

      {/* tarjeta 2 */}
      {f >= T.cardCC ? (
        <Blur id="card2" vx={P2.x - P2p.x} vy={P2.y - P2p.y} focus={dof(f, P2.y)} extraFilter={liftShadow(P2.e)}>
          <div
            style={{
              position: "absolute",
              left: P2.x - CARD2.w / 2,
              top: P2.y - CARD2.h / 2,
              transform: `rotate(${P2.r}deg)`,
            }}
          >
            <Paper w={CARD2.w} h={CARD2.h} seed="card2" color={C.ink} rim="#3b3631" rough={3} texture={0.18}>
              <div style={{ position: "absolute", left: (CARD2.w - 430) / 2, top: (CARD2.h - 430 / CC_AR) / 2 }}>
                <CreandoLogo width={430} color={C.paper} spread={ccSpread} typeP={ccType} />
              </div>
            </Paper>
          </div>
        </Blur>
      ) : null}
      <Obj name="clip" id="eco-clip" w={130} f={f} pose={clipPose} />

      {/* tarjeta 3 */}
      <Obj name="eucalyptus" id="eco-euca" w={270} f={f} pose={eucaPose} />
      {f >= T.cardTefilmo ? (
        <Blur id="card3" vx={P3.x - P3p.x} vy={P3.y - P3p.y} focus={dof(f, P3.y)} extraFilter={liftShadow(P3.e)}>
          <div
            style={{
              position: "absolute",
              left: P3.x - CARD3.w / 2,
              top: P3.y - CARD3.h / 2,
              transform: `rotate(${P3.r}deg)`,
            }}
          >
            <Paper w={CARD3.w} h={CARD3.h} seed="card3" color={C.paperLight} rough={12} sides={{ top: true, bottom: true }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TefilmoLogo width={440} p={tefP} />
              </div>
            </Paper>
          </div>
        </Blur>
      ) : null}

      <Obj name="pen" id="s4-pen" w={560} f={f} pose={penPose} />
    </AbsoluteFill>
  );
};
