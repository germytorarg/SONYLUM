import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog, tw, wobble} from '../anim';
import {ASSETS, HOTSPOTS} from '../assets';
import {Bokeh, Glint, IvoryBackdrop} from '../components/Atmosphere';
import {Cutout} from '../components/Cutout';
import {KineticText} from '../components/KineticText';
import {COLORS} from '../config';
import {SYNC} from '../timing';

// ESCENA 04 | 420-599 | CEREMONIA — assets 11, 12, 13, 14, 23.

const Candles: React.FC<{frame: number; x: number; y: number; width: number; flip?: boolean; seed: string; o: number}> = ({
  frame,
  x,
  y,
  width,
  flip,
  seed,
  o,
}) => {
  const h = (width * ASSETS.velas.h) / ASSETS.velas.w;
  const flick = (k: number) => 0.75 + 0.25 * Math.sin(frame * (0.7 + k * 0.13) + k) * Math.sin(frame * 0.31 + k * 2);
  return (
    <>
      <Cutout
        asset={ASSETS.velas}
        x={x}
        y={y}
        width={width}
        flipX={flip}
        opacity={o}
        brightness={1 + 0.04 * wobble(frame, seed, 6)}
        shadow
      />
      {HOTSPOTS.candleFlames.map((p, k) => {
        const fx = x - width / 2 + (flip ? 1 - p.x : p.x) * width;
        const fy = y - h / 2 + p.y * h;
        const r = 70 + 18 * flick(k);
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: fx - r,
              top: fy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              mixBlendMode: 'screen',
              opacity: o * flick(k),
              background: 'radial-gradient(closest-side, rgba(255,220,150,0.75), rgba(255,190,110,0.2) 55%, rgba(255,190,110,0))',
            }}
          />
        );
      })}
    </>
  );
};

export const Scene04: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 404 || frame > 612) return null;

  const sceneIn = prog(frame, 404, 430, ease.soft);
  const sceneOut = 1 - prog(frame, 596, 610, ease.soft);
  const churchIn = prog(frame, 420, 476, ease.out);
  const aisle = prog(frame, 432, 490, ease.inOut);
  const arch = prog(frame, 456, 512, ease.out);
  const candles = prog(frame, SYNC.candles - 10, SYNC.candles + 20, ease.out);
  // Push-in digital continuo + empuje final hacia la escena siguiente.
  const push = tw(frame, 424, 584, 1.0, 1.12, ease.inOut) + tw(frame, 584, 610, 0, 0.5, ease.in);
  const pushBlur = tw(frame, 590, 610, 0, 8, ease.in);

  // 23 · sobre: dos capas (cerrado al frente, abierto detrás).
  const envCanvasW = 840;
  const closedIn = prog(frame, SYNC.envelope - 3, SYNC.seal, ease.out);
  const openIn = prog(frame, SYNC.seal + 4, SYNC.seal + 36, ease.out);
  const dim = prog(frame, SYNC.envelope, SYNC.envelope + 28, ease.soft) * 0.72;
  const envY = 1400 + (1 - closedIn) * 700;
  const envRot = -5 * (1 - closedIn) + wobble(frame, 'env') * 0.6;
  const sealGlint = prog(frame, SYNC.seal, SYNC.seal + 8) * (1 - prog(frame, SYNC.seal + 10, SYNC.seal + 26));
  const d = (1 - openIn) * 150;

  const envH = (envCanvasW * ASSETS.sobreCerrado.h) / ASSETS.sobreCerrado.w;

  return (
    <AbsoluteFill style={{opacity: sceneIn * sceneOut}}>
      <IvoryBackdrop glowX={540} glowY={760} glow={0.75} tint="255, 228, 182" top="#FBF4E8" bottom="#EFE2CC" />

      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: '540px 820px',
          filter: pushBlur > 0.1 ? `blur(${pushBlur}px)` : undefined,
        }}
      >
        {/* rayos de luz de la nave */}
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: 0.5 * churchIn,
            background:
              'conic-gradient(from 180deg at 540px -200px, rgba(255,240,210,0) 0deg, rgba(255,240,210,0.35) 6deg, rgba(255,240,210,0) 12deg, rgba(255,240,210,0) 18deg, rgba(255,240,210,0.25) 22deg, rgba(255,240,210,0) 27deg, rgba(255,240,210,0) 333deg, rgba(255,240,210,0.3) 338deg, rgba(255,240,210,0) 344deg)',
          }}
        />

        {/* 11 · iglesia al fondo */}
        <Cutout
          asset={ASSETS.iglesia}
          x={540}
          y={1150 + (1 - churchIn) * 60}
          anchor="bottom"
          width={540}
          opacity={churchIn * 0.95}
          blur={tw(frame, 420, 470, 8, 1.4)}
          saturate={0.85}
          brightness={1.05}
        />
        {/* bruma de profundidad */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 860,
            width: 1080,
            height: 420,
            background: 'linear-gradient(180deg, rgba(251,244,232,0) 0%, rgba(251,244,232,0.75) 70%, rgba(251,244,232,0))',
          }}
        />

        {/* 13 · pasillo en perspectiva: se despliega de cerca hacia lejos */}
        <Cutout
          asset={ASSETS.pasillo}
          x={540}
          y={1990}
          anchor="bottom"
          width={1300}
          scale={1.14 - 0.14 * aisle}
          opacity={prog(frame, 432, 446)}
          maskImage={`linear-gradient(0deg, #000 ${aisle * 100}%, transparent ${aisle * 100 + 14}%)`}
        />

        {/* 12 · arco floral que revela el altar */}
        <Cutout
          asset={ASSETS.arcoFloral}
          x={540}
          y={1290}
          anchor="bottom"
          width={640}
          scale={1.25 - 0.25 * arch}
          opacity={arch}
          blur={(1 - arch) * 12}
          shadow
          transformOrigin="50% 70%"
        />
        <Bokeh seed="s4" count={12} opacity={0.6 * churchIn} drift={[0.02, -0.35]} area={{x0: 100, y0: 300, x1: 980, y1: 1500}} sizeScale={0.7} />

        {/* 14 · velas con luz titilante */}
        <Candles frame={frame} x={150} y={1650} width={380} seed="cl" o={candles} />
        <Candles frame={frame} x={930} y={1660} width={360} flip seed="cr" o={candles} />
      </AbsoluteFill>

      {/* velo para despegar el sobre del fondo */}
      <AbsoluteFill style={{background: COLORS.cream, opacity: dim * sceneOut}} />

      {/* 23 · sobre de invitación por capas simuladas */}
      {closedIn > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 540 - envCanvasW / 2,
            top: envY - envH / 2,
            width: envCanvasW,
            height: envH,
            transform: `rotate(${envRot}deg) scale(${tw(frame, SYNC.seal, 600, 1, 1.05, ease.soft)})`,
          }}
        >
          <Cutout
            asset={ASSETS.sobreAbierto}
            x={envCanvasW / 2 + 0.17 * d}
            y={envH / 2 + d}
            width={envCanvasW}
            opacity={openIn}
            shadow
          />
          <Cutout asset={ASSETS.sobreCerrado} x={envCanvasW / 2} y={envH / 2} width={envCanvasW} opacity={closedIn} shadow />
          <Glint
            x={HOTSPOTS.waxSeal.x * envCanvasW}
            y={HOTSPOTS.waxSeal.y * envH}
            size={190}
            opacity={sealGlint}
            rotate={frame * 2}
          />
        </div>
      ) : null}

      <KineticText text="Un sí que lo" start={466} exit={574} y={170} size={86} />
      <KineticText text="cambia todo" start={484} exit={578} y={272} size={104} italic weight={400} color={COLORS.goldDeep} />
    </AbsoluteFill>
  );
};
