import React from 'react';
import {Easing, interpolate, random, useCurrentFrame} from 'remotion';

export const GOLD = '#F5C542';
export const INK = '#0B0B0C';
export const ANTON = 'Anton, Impact, sans-serif';
export const MONT = 'Montserrat, Arial, sans-serif';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const prog = (f: number, a: number, b: number, e = easeOut) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Sombra legible + aberración cromática que decae tras el golpe. */
export const punchShadow = (split: number) =>
  [
    split > 0.3 ? `${-split}px 0 0 rgba(255,40,90,0.85)` : '',
    split > 0.3 ? `${split}px 0 0 rgba(0,220,255,0.85)` : '',
    '0 10px 34px rgba(0,0,0,0.55)',
    '0 2px 6px rgba(0,0,0,0.35)',
  ]
    .filter(Boolean)
    .join(', ');

type SlamProps = {
  text: string;
  start: number;
  end: number;
  y: number;
  size: number;
  font?: string;
  weight?: number;
  color?: string;
  italic?: boolean;
  tracking?: number;
  /** Entrada: golpe desde grande, subida o desde un costado. */
  from?: 'big' | 'up' | 'left' | 'right';
  /** Letras con escalonado (frames). 0 = la línea entra entera. */
  stagger?: number;
  box?: string; // fondo de caja (resaltado)
  boxColor?: string;
  x?: number;
  align?: 'center' | 'left' | 'right';
  exit?: 'zoom' | 'up' | 'cut';
  drift?: number; // escala lenta durante el hold
};

/** Título de impacto: golpe con escala, blur y aberración; salida rápida. */
export const Slam: React.FC<SlamProps> = ({
  text,
  start,
  end,
  y,
  size,
  font = ANTON,
  weight = 400,
  color = '#fff',
  italic,
  tracking = 0,
  from = 'big',
  stagger = 0,
  box,
  boxColor = INK,
  x = 540,
  align = 'center',
  exit = 'zoom',
  drift = 0.04,
}) => {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const outP = exit === 'cut' ? 0 : prog(f, end - 4, end, easeIn);
  const hold = prog(f, start, end, (t) => t);
  const letters = Array.from(text);
  const anchor = align === 'center' ? '-50%' : align === 'left' ? '0%' : '-100%';
  const lineIn = prog(f, start, start + 7);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${anchor}, -50%) scale(${(1 + drift * hold) * (exit === 'zoom' ? 1 + outP * 0.6 : 1)}) translateY(${
          exit === 'up' ? -outP * 80 : 0
        }px)`,
        transformOrigin: align === 'center' ? '50% 50%' : align === 'left' ? '0% 50%' : '100% 50%',
        opacity: 1 - outP,
        filter: outP > 0.02 ? `blur(${outP * 14}px)` : undefined,
        whiteSpace: 'nowrap',
        fontFamily: font,
        fontWeight: weight,
        fontStyle: italic ? 'italic' : 'normal',
        fontSize: size,
        lineHeight: 1,
        letterSpacing: `${tracking}em`,
        color: box ? boxColor : color,
        textTransform: 'uppercase',
        background: box,
        padding: box ? `${size * 0.12}px ${size * 0.22}px ${size * 0.06}px` : undefined,
        clipPath: box ? `inset(0 ${(1 - lineIn) * 100}% 0 0)` : undefined,
      }}
    >
      {letters.map((c, i) => {
        const s0 = start + i * stagger;
        const p = prog(f, s0, s0 + 7);
        const split = (1 - prog(f, s0, s0 + 9)) * size * 0.08;
        let t = '';
        if (from === 'big') t = `scale(${lerp(1.9, 1, p)})`;
        if (from === 'up') t = `translateY(${(1 - p) * size * 0.7}px)`;
        if (from === 'left') t = `translateX(${(1 - p) * -size * 1.2}px)`;
        if (from === 'right') t = `translateX(${(1 - p) * size * 1.2}px)`;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: Math.min(1, p * 1.6),
              transform: t,
              filter: p < 0.85 ? `blur(${(1 - p) * 10}px)` : undefined,
              textShadow: box ? undefined : punchShadow(split),
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

export const PinIcon: React.FC<{size: number; color?: string}> = ({size, color = GOLD}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M12 2C7.6 2 4 5.5 4 9.9 4 15.4 12 22 12 22s8-6.6 8-12.1C20 5.5 16.4 2 12 2zm0 10.8a3 3 0 110-6 3 3 0 010 6z" fill={color} />
  </svg>
);

export const PhoneIcon: React.FC<{size: number; color?: string}> = ({size, color = GOLD}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path
      d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"
      fill={color}
    />
  </svg>
);

export const BookmarkIcon: React.FC<{size: number; color?: string}> = ({size, color = GOLD}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M6 2h12a1 1 0 011 1v19l-7-4.5L5 22V3a1 1 0 011-1z" fill={color} />
  </svg>
);

/** Etiqueta de lugar numerada (01 · NOMBRE · barrio). */
export const PlaceTag: React.FC<{n: string; name: string; area: string; start: number; end: number; areaFrom?: number}> = ({
  n,
  name,
  area,
  start,
  end,
  areaFrom,
}) => {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const boxP = prog(f, start, start + 6);
  const nameP = prog(f, start + 2, start + 10);
  const areaP = prog(f, (areaFrom ?? start) + 5, (areaFrom ?? start) + 12);
  const out = prog(f, end - 4, end, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        top: 1330,
        transform: `translateX(${-out * 700}px)`,
        opacity: 1 - out * 0.6,
        filter: out > 0.05 ? `blur(${out * 6}px)` : undefined,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div
          style={{
            background: GOLD,
            color: INK,
            fontFamily: ANTON,
            fontSize: 70,
            lineHeight: 1,
            padding: '10px 16px 4px',
            transform: `scale(${lerp(0.2, 1, boxP)}) rotate(${(1 - boxP) * -20}deg)`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          }}
        >
          {n}
        </div>
        <div
          style={{
            fontFamily: ANTON,
            fontSize: name.length > 14 ? 84 : 100,
            lineHeight: 1,
            color: '#fff',
            textTransform: 'uppercase',
            clipPath: `inset(-20% ${(1 - nameP) * 100}% -20% 0)`,
            transform: `translateX(${(1 - nameP) * -40}px)`,
            textShadow: punchShadow((1 - nameP) * 8),
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 16,
          marginLeft: 4,
          opacity: areaP,
          transform: `translateY(${(1 - areaP) * 24}px)`,
          fontFamily: MONT,
          fontWeight: 800,
          fontSize: 40,
          letterSpacing: '0.08em',
          color: GOLD,
          textTransform: 'uppercase',
          textShadow: '0 4px 18px rgba(0,0,0,0.6)',
        }}
      >
        <PinIcon size={42} />
        {area}
      </div>
    </div>
  );
};

/** Glitch RGB por franjas para un bloque de texto. */
export const GlitchText: React.FC<{text: string; start: number; end: number; y: number; size: number}> = ({text, start, end, y, size}) => {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const k = f - start;
  const base: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    width: 1080,
    top: y,
    transform: 'translateY(-50%)',
    textAlign: 'center',
    fontFamily: ANTON,
    fontSize: size,
    lineHeight: 1,
    color: '#fff',
    whiteSpace: 'nowrap',
  };
  const slices = 7;
  return (
    <>
      {new Array(slices).fill(0).map((_, i) => {
        const a = (i / slices) * 100;
        const b = 100 - ((i + 1) / slices) * 100;
        const dx = (random(`g${k}-${i}`) - 0.5) * (random(`gg${k}`) > 0.45 ? 70 : 10);
        return (
          <React.Fragment key={i}>
            <div style={{...base, color: 'rgba(255,40,90,0.9)', clipPath: `inset(${a}% 0 ${b}% 0)`, translate: `${dx - 9}px 0`}}>{text}</div>
            <div style={{...base, color: 'rgba(0,220,255,0.9)', clipPath: `inset(${a}% 0 ${b}% 0)`, translate: `${dx + 9}px 0`}}>{text}</div>
            <div style={{...base, clipPath: `inset(${a}% 0 ${b}% 0)`, translate: `${dx}px 0`, mixBlendMode: 'normal'}}>{text}</div>
          </React.Fragment>
        );
      })}
    </>
  );
};
