import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog, tw} from '../anim';
import {ASSETS} from '../assets';
import {Flare} from '../components/Atmosphere';
import {Cutout} from '../components/Cutout';
import {SYNC, TRANSITIONS} from '../timing';
import {MEET} from './Scene01';

/** 01 → 02: flare sobre los anillos que revela la silueta en contraluz. */
const FlareTransition: React.FC<{frame: number}> = ({frame}) => {
  const {from, to} = TRANSITIONS.flare;
  if (frame < from || frame > to) return null;
  const intensity = prog(frame, SYNC.flare, 150, ease.in) * (1 - prog(frame, 156, to, ease.out));
  const whiteout = prog(frame, 136, 150, ease.in) * (1 - prog(frame, 150, to, ease.out));
  const y = tw(frame, 140, to, MEET[1], 720, ease.soft);
  return <Flare x={MEET[0]} y={y} intensity={intensity} whiteout={whiteout} />;
};

/** 02 → 03: el ramo 07 barre el cuadro en primer plano con desenfoque de movimiento. */
const BouquetSweep: React.FC<{frame: number}> = ({frame}) => {
  const {from, to} = TRANSITIONS.bouquet;
  if (frame < from || frame > to) return null;
  const pos = (f: number) => prog(f, from, to, ease.inOut);
  const p = pos(frame);
  const x = tw(p, 0, 1, 1700, -620, ease.linear);
  const y = tw(p, 0, 1, 1180, 820, ease.linear) + Math.sin(p * Math.PI) * -60;
  const px = tw(pos(frame - 1), 0, 1, 1700, -620, ease.linear);
  return (
    <Cutout
      asset={ASSETS.ramo}
      x={x}
      y={y}
      width={1150}
      rotate={tw(p, 0, 1, 18, -14, ease.linear)}
      blur={2 + Math.sin(p * Math.PI) * 5}
      trail={{dx: (x - px) * 0.8, dy: 0, samples: 6}}
      shadow
    />
  );
};

/** 03 → 04: velo luminoso que desciende como tul y se disuelve. */
const VeilTransition: React.FC<{frame: number}> = ({frame}) => {
  const {from, to} = TRANSITIONS.veil;
  if (frame < from || frame > to) return null;
  const down = prog(frame, from, 420, ease.inOut);
  const lift = prog(frame, 420, to, ease.soft);
  const edge = -30 + down * 140;
  return (
    <AbsoluteFill style={{opacity: 1 - lift}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="tulle" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.03" numOctaves="2" seed={3} />
            <feDisplacementMap in="SourceGraphic" scale={60 + down * 40} />
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient id="veilGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFBF2" stopOpacity="0.98" />
            <stop offset={Math.max(0, Math.min(1, edge / 100 - 0.12))} stopColor="#FFF8EA" stopOpacity="0.96" />
            <stop offset={Math.max(0, Math.min(1, edge / 100))} stopColor="#FFF4E0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={-60} y={-60} width={1200} height={2040} fill="url(#veilGrad)" filter="url(#tulle)" />
      </svg>
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          background: `linear-gradient(180deg, rgba(255,236,200,0) ${edge - 14}%, rgba(255,242,215,0.8) ${edge - 2}%, rgba(255,236,200,0) ${edge + 6}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** 04 → 05: destello cálido al atravesar el arco. */
const ArchFlash: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 588 || frame > 620) return null;
  const o = prog(frame, 588, 600, ease.in) * (1 - prog(frame, 600, 620, ease.out));
  return <Flare x={540} y={900} intensity={o * 0.8} whiteout={o * 0.85} />;
};

/** 05 → 06: disolución cálida (lavado ámbar). */
const WarmDissolve: React.FC<{frame: number}> = ({frame}) => {
  const {from, to} = TRANSITIONS.warm;
  if (frame < from || frame > to) return null;
  const o = Math.sin(Math.PI * prog(frame, from, to, ease.inOut));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 45%, #FFD9A6, #F2B884)', mixBlendMode: 'soft-light', opacity: o}} />
      <AbsoluteFill style={{background: '#FBE3C2', opacity: o * 0.55}} />
    </AbsoluteFill>
  );
};

export const Transitions: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <FlareTransition frame={frame} />
      <BouquetSweep frame={frame} />
      <VeilTransition frame={frame} />
      <ArchFlash frame={frame} />
      <WarmDissolve frame={frame} />
    </>
  );
};
