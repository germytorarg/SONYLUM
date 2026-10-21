import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {ease, prog, tw, wobble} from '../anim';
import {ASSETS} from '../assets';
import {Bokeh, IvoryBackdrop} from '../components/Atmosphere';
import {Cutout} from '../components/Cutout';
import {KineticText} from '../components/KineticText';
import {COLORS} from '../config';

// ESCENA 03 | 300-419 | EXPECTATIVA — assets 07 (transición), 08, 09, 10.

/** Pétalos 09 recortados individualmente: trayectorias propias. */
const PETALS = new Array(11).fill(0).map((_, i) => {
  const r = (k: string) => random(`petal-${i}-${k}`);
  const depth = r('z'); // 0 lejos, 1 cerca
  return {
    asset: ASSETS.petalos[i % 4],
    x0: 80 + r('x') * 920,
    start: 292 + r('t') * 70,
    speed: 7 + depth * 10,
    width: 70 + depth * 120,
    sway: 30 + r('s') * 70,
    swayFreq: 0.04 + r('f') * 0.05,
    spin: (r('r') - 0.5) * 3,
    flipFreq: 0.05 + r('p') * 0.06,
    blur: depth > 0.75 ? (depth - 0.75) * 20 : depth < 0.25 ? (0.25 - depth) * 10 : 0,
    depth,
  };
});

const Petals: React.FC<{frame: number; layer: 'back' | 'front'}> = ({frame, layer}) => (
  <>
    {PETALS.filter((p) => (layer === 'front' ? p.depth > 0.6 : p.depth <= 0.6)).map((p, i) => {
      const t = frame - p.start;
      if (t < 0) return null;
      const y = -160 + t * p.speed;
      if (y > 2100) return null;
      const x = p.x0 + Math.sin(t * p.swayFreq) * p.sway + t * 0.6;
      // Volteo del pétalo (cara/dorso) sin llegar a desaparecer de canto.
      const c = Math.cos(t * p.flipFreq);
      const flip = Math.sign(c || 1) * Math.max(Math.abs(c), 0.18);
      return (
        <Cutout
          key={i}
          asset={p.asset}
          x={x}
          y={y}
          width={p.width}
          rotate={t * p.spin + Math.sin(t * 0.05) * 20}
          scaleX={flip}
          blur={p.blur}
          opacity={prog(t, 0, 12) * 0.95}
          shadow={p.depth > 0.4}
        />
      );
    })}
  </>
);

export const Scene03: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 288 || frame > 440) return null;

  const sceneIn = prog(frame, 288, 306, ease.soft);
  const brideIn = prog(frame, 300, 344, ease.out);
  const bloom = prog(frame, 314, 372, ease.out);
  const cam = tw(frame, 300, 440, 1.0, 1.06, ease.inOut);

  return (
    <AbsoluteFill style={{opacity: sceneIn}}>
      <IvoryBackdrop glowX={640} glowY={820} glow={0.6} tint="252, 222, 206" top="#FCF5EC" bottom="#F0E1D3" />
      <Bokeh seed="s3" count={12} opacity={0.45} drift={[0.05, 0.25]} sizeScale={0.8} />

      <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '540px 900px'}}>
        {/* 10 · novia en segundo plano, profundidad de campo */}
        <Cutout
          asset={ASSETS.noviaSola}
          x={tw(frame, 300, 440, 700, 670, ease.soft)}
          y={1660}
          anchor="bottom"
          width={560}
          scale={0.96 + 0.05 * brideIn}
          opacity={brideIn * 0.92}
          blur={tw(frame, 300, 360, 9, 2.4, ease.out)}
          brightness={1.04}
          maskImage="linear-gradient(180deg, #000 82%, transparent 100%)"
        />
        <Petals frame={frame} layer="back" />

        {/* 08 · rosa que florece (escala sutil + leve giro) */}
        <Cutout
          asset={ASSETS.rosa}
          x={330 + wobble(frame, 'rose') * 5}
          y={1360}
          width={430}
          scale={0.78 + 0.22 * bloom + tw(frame, 372, 440, 0, 0.03, ease.soft)}
          rotate={-10 * (1 - bloom) + wobble(frame, 'roser') * 1.5}
          opacity={prog(frame, 310, 330)}
          blur={(1 - bloom) * 6}
          brightness={0.96 + 0.08 * bloom}
          shadow
        />
      </AbsoluteFill>

      <Petals frame={frame} layer="front" />

      <KineticText text="El día" start={326} exit={396} y={300} size={98} />
      <KineticText text="que soñaron" start={340} exit={400} y={410} size={112} italic weight={400} color={COLORS.goldDeep} />
    </AbsoluteFill>
  );
};
