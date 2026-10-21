import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog, tw} from '../anim';
import {COLORS, FONTS} from '../config';
import {WIDTH} from '../timing';

/** Escala global de la tipografía de las escenas (lectura en móvil). */
const TYPE_SCALE = 1.12;

type Props = {
  text: string;
  /** Frame en que empieza a revelarse la primera letra. */
  start: number;
  /** Frame en que empieza la salida. */
  exit: number;
  y: number;
  size?: number;
  italic?: boolean;
  weight?: number;
  color?: string;
  tracking?: number;
  /** Frames entre letra y letra. */
  stagger?: number;
  /** Duración de entrada por letra. */
  letterIn?: number;
  exitDur?: number;
  font?: 'serif' | 'sans';
  uppercase?: boolean;
  shadow?: string;
  gradient?: string;
};

/**
 * Tipografía cinética: cada letra entra con desenfoque, subida y apertura de
 * tracking; la línea sale con un soplo hacia arriba y blur.
 */
export const KineticText: React.FC<Props> = ({
  text,
  start,
  exit,
  y,
  size = 100,
  italic = false,
  weight = 300,
  color = COLORS.ink,
  tracking = 0.01,
  stagger = 1.6,
  letterIn = 22,
  exitDur = 16,
  font = 'serif',
  uppercase = false,
  shadow,
  gradient,
}) => {
  const frame = useCurrentFrame();
  if (frame < start - 1 || frame > exit + exitDur + 1) return null;
  const out = prog(frame, exit, exit + exitDur, ease.in);
  size *= TYPE_SCALE;
  const chars = Array.from(text);
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        width: WIDTH - 180,
        top: y,
        transform: `translateY(-50%) translateY(${-out * 26}px)`,
        textAlign: 'center',
        fontFamily: FONTS[font],
        fontStyle: italic ? 'italic' : 'normal',
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: `${tracking + out * 0.06}em`,
        color,
        textTransform: uppercase ? 'uppercase' : undefined,
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 10}px)` : undefined,
        textShadow: shadow,
        whiteSpace: 'pre-wrap',
      }}
    >
      {chars.map((c, i) => {
        const f0 = start + i * stagger;
        const p = prog(frame, f0, f0 + letterIn, ease.out);
        const blur = tw(frame, f0, f0 + letterIn * 0.8, 12, 0, ease.out);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 0.32 * size}px) scale(${0.92 + 0.08 * p})`,
              filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
              backgroundImage: gradient,
              WebkitBackgroundClip: gradient ? 'text' : undefined,
              backgroundClip: gradient ? 'text' : undefined,
              WebkitTextFillColor: gradient ? 'transparent' : undefined,
              whiteSpace: 'pre',
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};

/** Filete dorado que se dibuja desde el centro. */
export const GoldRule: React.FC<{y: number; start: number; exit: number; width?: number}> = ({
  y,
  start,
  exit,
  width = 220,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, start, start + 26) * (1 - prog(frame, exit, exit + 14, ease.in));
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: WIDTH / 2 - (width * p) / 2,
        top: y,
        width: width * p,
        height: 1.5,
        background: `linear-gradient(90deg, rgba(195,160,98,0), ${COLORS.gold} 30%, ${COLORS.goldLight} 50%, ${COLORS.gold} 70%, rgba(195,160,98,0))`,
        opacity: p,
      }}
    />
  );
};
