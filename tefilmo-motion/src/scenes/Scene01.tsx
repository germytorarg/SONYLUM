import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {bezierPoint, ease, prog, tw, wobble} from '../anim';
import {ASSETS} from '../assets';
import {Bokeh, Glint, IvoryBackdrop} from '../components/Atmosphere';
import {Cutout} from '../components/Cutout';
import {GoldRule, KineticText} from '../components/KineticText';
import {COLORS} from '../config';
import {SYNC} from '../timing';

// ESCENA 01 | 0-149 | DOS CAMINOS — assets 01, 02, 03.
export const MEET: [number, number] = [540, 840];
const LEFT: [number, number][] = [[-40, 1330], [240, 1320], [250, 930], [MEET[0] - 70, MEET[1] + 20]];
const RIGHT: [number, number][] = [[1120, 420], [860, 410], [880, 780], [MEET[0] + 70, MEET[1] - 20]];

const pathD = (p: [number, number][]) =>
  `M ${p[0][0]} ${p[0][1]} C ${p[1][0]} ${p[1][1]}, ${p[2][0]} ${p[2][1]}, ${p[3][0]} ${p[3][1]}`;

const GoldPath: React.FC<{pts: [number, number][]; t: number; fade: number; id: string}> = ({pts, t, fade, id}) => {
  const len = 1600;
  const head = bezierPoint(Math.max(0.001, t), pts[0], pts[1], pts[2], pts[3]);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: fade}}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={COLORS.goldDeep} stopOpacity="0" />
            <stop offset="0.35" stopColor={COLORS.gold} />
            <stop offset="1" stopColor={COLORS.goldLight} />
          </linearGradient>
        </defs>
        <path
          d={pathD(pts)}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={4}
          strokeLinecap="round"
          pathLength={len}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - t)}
        />
        <path
          d={pathD(pts)}
          fill="none"
          stroke={COLORS.goldLight}
          strokeWidth={16}
          strokeLinecap="round"
          pathLength={len}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - t)}
          opacity={0.4}
          style={{filter: 'blur(7px)'}}
        />
      </svg>
      {t > 0.01 && t < 0.995 ? <Glint x={head[0]} y={head[1]} size={70} opacity={fade} rotate={t * 90} /> : null}
    </>
  );
};

export const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= 150) return null;

  const camScale = tw(frame, 0, 150, 1.0, 1.07, ease.inOut);
  const lineT = prog(frame, 6, 70, ease.inOut);
  const lineFade = 1 - prog(frame, 92, 126, ease.soft);

  // Anillos 01: entran desde la profundidad hacia el punto de encuentro.
  const ringIn = prog(frame, 52, SYNC.ringsLand + 6, ease.out);
  const ringScale = 0.5 + 0.5 * ringIn + tw(frame, 80, 150, 0, 0.06, ease.soft);
  const ringBlur = (1 - ringIn) * 22;
  // Giro sugerido: leve oscilación de escala horizontal + barrido especular.
  const sway = wobble(frame, 'ring', 1.4);
  const ringScaleX = 0.965 + 0.035 * Math.cos(frame * 0.045);
  const sheen = tw(frame, 82, 128, -0.4, 1.4, ease.inOut);

  // Anillo 02: elemento de profundidad (foreground desenfocado + fondo lejano).
  const fgRingX = tw(frame, 10, 150, 1180, 760, ease.soft);
  const fgRingO = prog(frame, 14, 50) * 0.42;
  const bgRingO = prog(frame, 30, 70) * 0.28 * (1 - prog(frame, 110, 140));

  // Destellos 03 al aterrizar los anillos.
  const sparkle = prog(frame, SYNC.ringsLand - 4, SYNC.ringsLand + 16) * (1 - prog(frame, 132, 150));
  const flick = 0.75 + 0.25 * Math.sin(frame * 0.9) * Math.sin(frame * 0.37);

  const ringW = 640;
  const ringH = (ringW * ASSETS.anillosEntrelazados.h) / ASSETS.anillosEntrelazados.w;

  return (
    <AbsoluteFill>
      <IvoryBackdrop glowX={MEET[0]} glowY={MEET[1]} glow={0.25 + 0.55 * prog(frame, 40, 120)} />
      <Bokeh seed="s1" count={14} opacity={0.35 + 0.45 * prog(frame, 0, 30)} drift={[0.05, -0.25]} />

      <AbsoluteFill style={{transform: `scale(${camScale})`, transformOrigin: `${MEET[0]}px ${MEET[1]}px`}}>
        {/* plano lejano: solitario desenfocado */}
        <Cutout
          asset={ASSETS.anilloSolitario}
          x={250 + frame * 0.25}
          y={470}
          width={210}
          blur={7}
          opacity={bgRingO}
          rotate={-14 + frame * 0.03}
        />

        <GoldPath pts={LEFT} t={lineT} fade={lineFade} id="gl" />
        <GoldPath pts={RIGHT} t={lineT} fade={lineFade} id="gr" />

        {/* sombra de contacto suave */}
        <div
          style={{
            position: 'absolute',
            left: MEET[0] - 260,
            top: MEET[1] + ringH * 0.36,
            width: 520,
            height: 60,
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(120,84,36,0.22), rgba(120,84,36,0))',
            opacity: ringIn,
            transform: `scale(${ringScale})`,
          }}
        />

        <Cutout
          asset={ASSETS.anillosEntrelazados}
          x={MEET[0]}
          y={MEET[1] + (1 - ringIn) * 60}
          width={ringW}
          scale={ringScale}
          scaleX={ringScaleX}
          rotate={-6 * (1 - ringIn) + sway * 1.6}
          opacity={ringIn}
          blur={ringBlur}
          shadow
        >
          {/* barrido especular enmascarado por la propia silueta */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              WebkitMaskImage: `url(${ASSETS.anillosEntrelazados.src})`,
              WebkitMaskSize: '100% 100%',
              maskImage: `url(${ASSETS.anillosEntrelazados.src})`,
              maskSize: '100% 100%',
              background: `linear-gradient(105deg, rgba(255,255,255,0) ${sheen * 100 - 18}%, rgba(255,250,232,0.75) ${
                sheen * 100
              }%, rgba(255,255,255,0) ${sheen * 100 + 18}%)`,
              mixBlendMode: 'screen',
            }}
          />
        </Cutout>

        <Cutout
          asset={ASSETS.destellos}
          x={MEET[0] + 30}
          y={MEET[1] - 150}
          width={700}
          opacity={sparkle * flick}
          blend="screen"
          scale={0.95 + 0.08 * sparkle}
        />
        <Glint x={MEET[0] + 128} y={MEET[1] + 40} size={120} opacity={sparkle * (0.5 + 0.5 * Math.sin(frame * 0.3))} rotate={frame} />
        <Glint x={MEET[0] - 190} y={MEET[1] - 80} size={80} opacity={sparkle * (0.5 + 0.5 * Math.sin(frame * 0.23 + 2))} />
      </AbsoluteFill>

      {/* plano cercano: solitario muy desenfocado cruzando (parallax) */}
      <Cutout asset={ASSETS.anilloSolitario} x={fgRingX} y={1560} width={560} blur={16} opacity={fgRingO} rotate={18 - frame * 0.08} />

      <KineticText text="Dos caminos." start={20} exit={124} y={1250} size={104} />
      <KineticText text="Un encuentro." start={SYNC.ringsLand - 4} exit={128} y={1372} size={104} italic weight={400} color={COLORS.goldDeep} />
      <GoldRule y={1460} start={92} exit={124} />
    </AbsoluteFill>
  );
};
