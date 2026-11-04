import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {ease, prog, tw, wobble} from '../anim';
import {ASSETS, HOTSPOTS} from '../assets';
import {Bokeh, Glint, IvoryBackdrop} from '../components/Atmosphere';
import {Cutout} from '../components/Cutout';
import {KineticText} from '../components/KineticText';
import {COLORS} from '../config';
import {SYNC} from '../timing';

// ESCENA 05 | 600-749 | PROMESA — assets 15, 01 (reuso), 16, 17, 24.
// Cortes rápidos, pero con cámara continua: todos los planos comparten
// una deriva lateral y se encadenan con wipes de luz verticales.

const lightCut = (frame: number, at: number) => {
  const p = prog(frame, at - 6, at + 8, ease.inOut);
  return Math.sin(Math.PI * p);
};

const Bubbles: React.FC<{frame: number; from: number; o: number}> = ({frame, from, o}) => (
  <>
    {new Array(26).fill(0).map((_, i) => {
      const r = (k: string) => random(`bub${i}${k}`);
      const t = frame - from - r('d') * 10;
      if (t < 0) return null;
      const size = 6 + r('s') * 16;
      const x = 380 + r('x') * 320 + Math.sin(t * 0.2 + i) * 6;
      const y = 1080 - t * (6 + r('v') * 8);
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,244,214,0.9)',
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(255,240,200,0.1) 60%)',
            opacity: o * (1 - prog(t, 14, 30)),
          }}
        />
      );
    })}
  </>
);

export const Scene05: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 592 || frame > 772) return null;

  const sceneIn = prog(frame, 594, 606, ease.soft);
  const driftX = tw(frame, 600, 750, 50, -50, ease.linear);

  // Plano A · manos 15 (600-648) con rack focus hacia los anillos 01.
  const handsFocus = prog(frame, SYNC.ringGlint + 4, SYNC.ringGlint + 22, ease.inOut);
  const handsO = 1 - prog(frame, SYNC.cutEmbrace - 6, SYNC.cutEmbrace + 2, ease.soft);
  const handsW = 1900;
  const handsH = (handsW * ASSETS.manos.h) / ASSETS.manos.w;
  const handsX = 540 + (0.5 - HOTSPOTS.ringOnHand.x) * handsW + driftX;
  const handsY = 860;
  const ringPx = handsX - handsW / 2 + HOTSPOTS.ringOnHand.x * handsW;
  const ringPy = handsY - handsH / 2 + HOTSPOTS.ringOnHand.y * handsH;
  const glint = prog(frame, SYNC.ringGlint - 8, SYNC.ringGlint) * (1 - prog(frame, SYNC.ringGlint + 4, SYNC.ringGlint + 18));

  // Plano B · 01 brillo (inserto, 634-664).
  const ringsO = prog(frame, SYNC.ringGlint + 4, SYNC.ringGlint + 18) * (1 - prog(frame, SYNC.cutEmbrace - 6, SYNC.cutEmbrace + 2));

  // Plano C · abrazo 16 (657-698).
  const embraceO = prog(frame, SYNC.cutEmbrace - 4, SYNC.cutEmbrace + 6) * (1 - prog(frame, SYNC.cutKiss - 4, SYNC.cutKiss + 8));
  // Plano D · beso 17 (690-734).
  const kissO = prog(frame, SYNC.cutKiss - 4, SYNC.cutKiss + 8) * (1 - prog(frame, SYNC.clink - 10, SYNC.clink - 2));
  // Plano E · brindis 24 (720-750).
  const toastO = prog(frame, SYNC.clink - 10, SYNC.clink - 2);
  const clinkBump = Math.exp(-Math.max(0, frame - SYNC.clink) / 5) * (frame >= SYNC.clink ? 1 : 0);

  const cutFlash = Math.max(lightCut(frame, SYNC.cutEmbrace), lightCut(frame, SYNC.cutKiss), lightCut(frame, SYNC.clink - 6));

  return (
    <AbsoluteFill style={{opacity: sceneIn}}>
      <IvoryBackdrop glowX={540} glowY={860} glow={0.75 + 0.15 * kissO} tint="255, 214, 160" top="#FBF0E0" bottom="#EADBC3" />
      <Bokeh seed="s5" count={16} opacity={0.65} drift={[-0.35, -0.2]} />

      {/* A · manos */}
      <Cutout
        asset={ASSETS.manos}
        x={handsX}
        y={handsY}
        width={handsW}
        scale={tw(frame, 600, 660, 1.0, 1.08, ease.soft) + 0.2 * handsFocus}
        transformOrigin={`${HOTSPOTS.ringOnHand.x * 100}% ${HOTSPOTS.ringOnHand.y * 100}%`}
        opacity={handsO * (1 - 0.55 * handsFocus)}
        blur={handsFocus * 14}
        shadow
      />
      <Glint x={ringPx} y={ringPy} size={260} opacity={glint} rotate={frame * 3} />

      {/* B · anillos 01 (reuso) en foco */}
      <Cutout
        asset={ASSETS.anillosEntrelazados}
        x={540 + driftX * 0.4}
        y={830 - ringsO * 20}
        width={700}
        scale={0.9 + 0.12 * prog(frame, SYNC.ringGlint + 4, SYNC.cutEmbrace)}
        rotate={-4 + wobble(frame, 'r5') * 2}
        opacity={ringsO}
        blur={(1 - prog(frame, SYNC.ringGlint + 4, SYNC.ringGlint + 20)) * 10}
        shadow
      />
      <Glint x={540 + 150} y={800} size={150} opacity={ringsO * (0.6 + 0.4 * Math.sin(frame * 0.4))} rotate={-frame * 2} />

      {/* C · abrazo 16 con eco desenfocado detrás (profundidad) */}
      <Cutout
        asset={ASSETS.abrazo}
        x={580 + driftX * 0.8}
        y={1380}
        anchor="bottom"
        width={480}
        scale={tw(frame, SYNC.cutEmbrace - 4, SYNC.cutKiss + 8, 1.0, 1.06, ease.soft)}
        opacity={embraceO}
        maskImage="linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 14%, #000 32%)"
        shadow
      />

      {/* D · beso 17 en contraluz */}
      <div
        style={{
          position: 'absolute',
          left: 300 - 420,
          top: 140 - 420,
          width: 840,
          height: 840,
          borderRadius: '50%',
          mixBlendMode: 'screen',
          opacity: kissO,
          background: 'radial-gradient(closest-side, rgba(255,240,205,0.95), rgba(255,214,150,0.35) 55%, rgba(255,214,150,0))',
        }}
      />
      {/* Plano cerrado: el PNG corta las cabezas arriba y la espalda a la izquierda;
          esos bordes quedan fuera de cuadro y la escala crece desde arriba. */}
      <Cutout
        asset={ASSETS.beso}
        x={600 + driftX * 0.6}
        y={-10 + (1280 * ASSETS.beso.h) / ASSETS.beso.w}
        anchor="bottom"
        width={1280}
        scale={tw(frame, SYNC.cutKiss - 4, SYNC.clink, 1.05, 1.0, ease.soft)}
        transformOrigin="50% 0%"
        opacity={kissO}
        glow="rgba(255, 222, 170, 0.45)"
      />

      {/* E · brindis 24 */}
      <Cutout
        asset={ASSETS.copas}
        x={540}
        y={900 + (1 - toastO) * 40}
        width={600}
        scale={0.96 + 0.04 * toastO + 0.035 * clinkBump}
        rotate={wobble(frame, 'toast') * 1.2}
        opacity={toastO}
        shadow
      />
      <Glint x={540} y={560} size={240 * (0.6 + clinkBump)} opacity={toastO * Math.min(1, clinkBump * 1.4)} rotate={frame * 2} />
      <Bubbles frame={frame} from={SYNC.clink} o={toastO} />

      {/* wipe de luz vertical en cada corte */}
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          opacity: cutFlash,
          background: 'linear-gradient(90deg, rgba(255,240,210,0) 20%, rgba(255,250,236,0.95) 50%, rgba(255,240,210,0) 80%)',
        }}
      />

      <KineticText text="Momentos" start={640} exit={738} y={1540} size={100} color={COLORS.ink} />
      <KineticText text="irrepetibles" start={654} exit={742} y={1650} size={116} italic weight={400} color={COLORS.goldDeep} />
    </AbsoluteFill>
  );
};
