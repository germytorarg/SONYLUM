import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog, tw, wobble} from '../anim';
import {ASSETS} from '../assets';
import {Bokeh, IvoryBackdrop} from '../components/Atmosphere';
import {Cutout} from '../components/Cutout';
import {KineticText} from '../components/KineticText';
import {COLORS} from '../config';
import {SYNC} from '../timing';

// ESCENA 02 | 150-299 | ENCUENTRO — assets 04, 05, 06.
const wipeMask = (p: number, keep: 'before' | 'after') => {
  const c = p * 140 - 20; // recorre la diagonal completa
  return keep === 'before'
    ? `linear-gradient(100deg, #000 ${c - 9}%, transparent ${c + 9}%)`
    : `linear-gradient(100deg, transparent ${c - 9}%, #000 ${c + 9}%)`;
};

export const Scene02: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 150 || frame > 304) return null;

  const sceneOpacity = 1 - prog(frame, 290, 304, ease.soft);
  const wipe = prog(frame, SYNC.lightWipe, SYNC.lightWipe + 36, ease.inOut);
  const toWalk = prog(frame, 250, 262, ease.inOut);

  // 04 en contraluz: push-in lento.
  const silScale = tw(frame, 150, 236, 1.0, 1.08, ease.soft);
  // 05: entra por el wipe y respira.
  const frontScale = tw(frame, 198, 262, 1.0, 1.05, ease.soft);
  // 06: avanza hacia cámara (parallax con primer plano y fondo).
  const walkP = prog(frame, 246, 304, ease.linear);
  const walkScale = 1.02 + 0.16 * walkP;
  const bob = Math.sin(frame * 0.42) * 4 * toWalk;

  const bandX = (wipe * 140 - 20) / 100;
  const bandO = Math.sin(Math.PI * wipe);

  return (
    <AbsoluteFill style={{opacity: sceneOpacity}}>
      <IvoryBackdrop
        glowX={tw(frame, 150, 300, 600, 520)}
        glowY={700}
        glow={0.95 - 0.35 * wipe}
        tint="255, 214, 150"
        top="#FBEFD9"
        bottom="#EBDCC4"
      />
      {/* fondo: halo de sol, se mueve lento (plano lejano del parallax) */}
      <div
        style={{
          position: 'absolute',
          left: 260 - walkP * 30,
          top: 380,
          width: 620,
          height: 620,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(255,250,230,0.95), rgba(255,226,170,0.35) 60%, rgba(255,226,170,0))',
          opacity: 0.9 - 0.4 * toWalk,
        }}
      />
      <Bokeh seed="s2far" count={10} opacity={0.55} drift={[-0.1 - walkP * 0.3, -0.12]} sizeScale={0.6} />

      {/* 04 · silueta */}
      <AbsoluteFill style={{WebkitMaskImage: wipeMask(wipe, 'after'), maskImage: wipeMask(wipe, 'after')}}>
        <Cutout
          asset={ASSETS.siluetaEncuentro}
          x={560 + wobble(frame, 'sil') * 6}
          y={1580}
          anchor="bottom"
          width={880}
          scale={silScale}
          maskImage="linear-gradient(180deg, #000 76%, transparent 99%)"
          glow="rgba(255, 220, 160, 0.55)"
        />
        {/* bloom de contraluz entre ambos rostros */}
        <div
          style={{
            position: 'absolute',
            left: 540 - 170,
            top: 700 - 170,
            width: 340,
            height: 340,
            borderRadius: '50%',
            mixBlendMode: 'screen',
            background: 'radial-gradient(closest-side, rgba(255,246,222,0.9), rgba(255,220,160,0.3) 55%, rgba(255,220,160,0))',
            opacity: 0.7 + 0.3 * Math.sin(frame * 0.08),
          }}
        />
      </AbsoluteFill>

      {/* 05 → 06 · revelado por wipe de luz */}
      <AbsoluteFill style={{WebkitMaskImage: wipeMask(wipe, 'before'), maskImage: wipeMask(wipe, 'before')}}>
        {/* sombra de piso */}
        <div
          style={{
            position: 'absolute',
            left: 540 - 380,
            top: 1560 + walkP * 70,
            width: 760,
            height: 90,
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(110,78,38,0.28), rgba(110,78,38,0))',
            transform: `scale(${walkScale})`,
          }}
        />
        <Cutout
          asset={ASSETS.noviosDeFrente}
          x={540 - toWalk * 30}
          y={1610}
          anchor="bottom"
          width={780}
          scale={frontScale}
          opacity={1 - toWalk}
          shadow
        />
        <Cutout
          asset={ASSETS.noviosCaminando}
          x={540 + 14 * (1 - toWalk)}
          y={1610 + walkP * 90 + bob}
          anchor="bottom"
          width={610}
          scale={walkScale}
          opacity={toWalk}
          blur={(1 - toWalk) * 3}
          shadow
        />
      </AbsoluteFill>

      {/* banda de luz del wipe */}
      {bandO > 0.01 ? (
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: bandO,
            background: `linear-gradient(100deg, rgba(255,240,205,0) ${bandX * 100 - 16}%, rgba(255,248,230,0.95) ${
              bandX * 100
            }%, rgba(255,240,205,0) ${bandX * 100 + 16}%)`,
          }}
        />
      ) : null}

      {/* primer plano: bokeh grande y rápido (parallax) */}
      <Bokeh seed="s2near" count={7} opacity={0.5 * toWalk} drift={[-1.6, 0.1]} sizeScale={2.2} />

      <KineticText text="Una historia" start={172} exit={272} y={300} size={98} color={COLORS.ink} />
      <KineticText text="empieza" start={190} exit={276} y={410} size={112} italic weight={400} color={COLORS.goldDeep} />
    </AbsoluteFill>
  );
};
