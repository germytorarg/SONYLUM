import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {COLORS} from '../config';
import {HEIGHT, WIDTH} from '../timing';

/** Fondo marfil por capas con luz champagne móvil. */
export const IvoryBackdrop: React.FC<{
  glowX?: number;
  glowY?: number;
  glow?: number;
  tint?: string;
  top?: string;
  bottom?: string;
  opacity?: number;
}> = ({glowX = 540, glowY = 860, glow = 0.6, tint = '255, 236, 196', top, bottom, opacity = 1}) => (
  <AbsoluteFill style={{opacity}}>
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${top ?? COLORS.cream} 0%, ${COLORS.ivory} 45%, ${
          bottom ?? COLORS.ivoryDeep
        } 100%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 900px at ${glowX}px ${glowY}px, rgba(${tint}, ${glow}) 0%, rgba(${tint}, ${
          glow * 0.35
        }) 38%, rgba(${tint}, 0) 70%)`,
      }}
    />
  </AbsoluteFill>
);

/** Grano fílmico animado (SVG turbulence). */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const frame = useCurrentFrame();
  const seed = frame % 12;
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity, pointerEvents: 'none'}}>
      <svg width={WIDTH} height={HEIGHT}>
        <filter id={`grain${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.22, color = '60, 42, 20'}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(130% 85% at 50% 48%, rgba(${color},0) 55%, rgba(${color},${strength}) 100%)`,
    }}
  />
);

/** Bokeh dorado por profundidad: el plano cercano se mueve más (parallax). */
export const Bokeh: React.FC<{
  seed: string;
  count?: number;
  opacity?: number;
  drift?: [number, number];
  area?: {x0: number; y0: number; x1: number; y1: number};
  color?: string;
  sizeScale?: number;
}> = ({seed, count = 18, opacity = 1, drift = [0.15, -0.5], area, color = '236, 204, 140', sizeScale = 1}) => {
  const frame = useCurrentFrame();
  const A = area ?? {x0: -60, y0: -60, x1: WIDTH + 60, y1: HEIGHT + 60};
  const w = A.x1 - A.x0;
  const h = A.y1 - A.y0;
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {new Array(count).fill(0).map((_, i) => {
        const z = random(`${seed}z${i}`); // 0 lejos -> 1 cerca
        const size = (10 + z * z * 90) * sizeScale;
        const speed = 0.35 + z * 1.6;
        const x = A.x0 + ((random(`${seed}x${i}`) * w + frame * drift[0] * speed * 2) % w + w) % w;
        const y = A.y0 + ((random(`${seed}y${i}`) * h + frame * drift[1] * speed * 2) % h + h) % h;
        const tw = 0.55 + 0.45 * Math.sin(frame * (0.04 + z * 0.05) + i * 2.1);
        const alpha = (0.18 + 0.5 * (1 - Math.abs(z - 0.45))) * tw;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${color},${alpha}) 0%, rgba(${color},${alpha * 0.5}) 45%, rgba(${color},0) 70%)`,
              filter: `blur(${(z > 0.7 ? (z - 0.7) * 14 : 0) + 0.5}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Destello de cuatro puntas (brillo de joya). */
export const Glint: React.FC<{x: number; y: number; size: number; opacity: number; rotate?: number}> = ({
  x,
  y,
  size,
  opacity,
  rotate = 0,
}) => {
  if (opacity <= 0.01) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        opacity,
        transform: `rotate(${rotate}deg)`,
        mixBlendMode: 'screen',
        overflow: 'visible',
      }}
    >
      <defs>
        <radialGradient id="glintCore">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.35" stopColor="#FFF1CF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#F3D9A0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="22" fill="url(#glintCore)" />
      <path d="M0 -50 L3 -3 L50 0 L3 3 L0 50 L-3 3 L-50 0 L-3 -3 Z" fill="#FFF8E8" />
      <path d="M0 -24 L1.6 -1.6 L24 0 L1.6 1.6 L0 24 L-1.6 1.6 L-24 0 L-1.6 -1.6 Z" fill="#fff" transform="rotate(45)" opacity="0.7" />
    </svg>
  );
};

/** Flare anamórfico + bloom cálido. */
export const Flare: React.FC<{x: number; y: number; intensity: number; whiteout?: number}> = ({
  x,
  y,
  intensity,
  whiteout = 0,
}) => {
  if (intensity <= 0.001 && whiteout <= 0.001) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          opacity: intensity,
          background: `radial-gradient(${300 + intensity * 700}px ${300 + intensity * 700}px at ${x}px ${y}px, rgba(255,250,235,1) 0%, rgba(255,226,170,0.75) 25%, rgba(240,196,120,0.25) 55%, rgba(240,196,120,0) 75%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - 1100,
          top: y - 18 - intensity * 10,
          width: 2200,
          height: 36 + intensity * 20,
          borderRadius: '50%',
          opacity: intensity,
          mixBlendMode: 'screen',
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(255,255,250,1) 0%, rgba(255,232,190,0.7) 30%, rgba(255,214,150,0) 100%)',
          filter: 'blur(6px)',
        }}
      />
      <AbsoluteFill style={{background: '#FFF8EC', opacity: whiteout}} />
    </AbsoluteFill>
  );
};
