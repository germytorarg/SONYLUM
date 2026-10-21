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
export const PlaceTag: React.FC<{n: string; name: string; area: string; start: number; end: number; areaFrom?: number; y?: number}> = ({
  n,
  name,
  area,
  start,
  end,
  areaFrom,
  y = 1330,
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
        top: y,
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

/* ------------------------------------------------------------------ 3D / perspectiva */

type RingProps = {
  f: number;
  /** Eje del Obelisco por frame: [[cx, ancho] a 22 %, 30 %, 38 % de alto]. */
  axis: [number, number][][];
  text: string;
  layer: 'back' | 'front';
  yRel?: number;
  turns?: number; // vueltas durante la toma
  size?: number;
  goldFrom?: number; // índice desde el que las letras van en dorado
  goldTo?: number;
};

/**
 * Anillo de texto girando alrededor del Obelisco. Cada letra se ubica sobre un
 * cilindro y se proyecta: la mitad trasera va DETRÁS del recorte (layer back),
 * la delantera por encima (layer front). El ancho aparente de cada letra es
 * cos(θ), así se ve enrollada y espejada cuando pasa por detrás.
 */
export const ObeliskRing: React.FC<RingProps> = ({f, axis, text, layer, yRel = 0.28, turns = 0.9, size = 96, goldFrom = -1, goldTo = -1}) => {
  const k = Math.max(0, Math.min(axis.length - 1, f));
  const a = axis[k];
  // interpolación del eje a la altura del anillo (entre 22 % y 30 %)
  const t = (yRel - 0.22) / 0.08;
  const cx = lerp(a[0][0], a[1][0], t);
  const w = lerp(a[0][1], a[1][1], t);
  const R = w / 2 + 210;
  const ry = R * 0.22;
  const yc = yRel * 1920;
  const chars = Array.from(text);
  const n = chars.length;
  const theta0 = (-f / axis.length) * turns * Math.PI * 2;
  const intro = prog(f, 0, 10);
  return (
    <>
      {chars.map((c, i) => {
        const th = theta0 + (i / n) * Math.PI * 2;
        const cos = Math.cos(th);
        const front = cos >= 0;
        if ((layer === 'front') !== front) return null;
        const x = cx + R * Math.sin(th) * intro;
        const y = yc - ry * cos;
        const depth = 1 + 0.22 * cos;
        const rot = (Math.atan2(ry * Math.sin(th), R * Math.abs(cos) + 1e-3) * 180) / Math.PI;
        const gold = i >= goldFrom && i < goldTo;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${cos * depth}, ${depth})`,
              fontFamily: ANTON,
              fontSize: size,
              lineHeight: 1,
              color: gold ? GOLD : '#fff',
              opacity: (front ? 1 : 0.6) * intro,
              textShadow: front ? '0 6px 18px rgba(0,0,0,0.45)' : undefined,
              whiteSpace: 'pre',
            }}
          >
            {c}
          </div>
        );
      })}
    </>
  );
};

type WallProps = {
  f: number;
  start: number;
  end: number;
  text: string;
  side: 'left' | 'right';
  /** Punto de fuga de la toma (px). */
  vp: [number, number];
  y: number;
  size?: number;
  angle?: number;
  speed?: number;
  color?: string;
  outline?: boolean;
};

/** Subtítulo corriendo de costado sobre una pared en perspectiva (fuga real de la toma). */
export const WallTicker: React.FC<WallProps> = ({f, start, end, text, side, vp, y, size = 170, angle = 72, speed = 26, color = '#fff', outline}) => {
  if (f < start || f > end) return null;
  const k = f - start;
  const inP = prog(f, start, start + 6);
  const out = prog(f, end - 3, end, easeIn);
  const strip = new Array(8).fill(text).join('   ');
  const left = side === 'left';
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 820, perspectiveOrigin: `${vp[0]}px ${vp[1]}px`, overflow: 'hidden', opacity: 1 - out}}>
      <div
        style={{
          position: 'absolute',
          top: y - size * 0.6,
          left: left ? 0 : undefined,
          right: left ? undefined : 0,
          width: 4200,
          height: size * 1.2,
          transformOrigin: left ? '0% 50%' : '100% 50%',
          transform: `rotateY(${(left ? 1 : -1) * angle * inP}deg)`,
          WebkitMaskImage: `linear-gradient(${left ? 90 : 270}deg, #000 40%, transparent 85%)`,
          maskImage: `linear-gradient(${left ? 90 : 270}deg, #000 40%, transparent 85%)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            [left ? 'left' : 'right']: 0,
            transform: `translateX(${(left ? -1 : 1) * ((k * speed) % 1400)}px)`,
            fontFamily: ANTON,
            fontSize: size,
            lineHeight: 1.2,
            whiteSpace: 'pre',
            color: outline ? 'transparent' : color,
            WebkitTextStroke: outline ? `4px ${color}` : undefined,
            textShadow: outline ? undefined : '0 8px 26px rgba(0,0,0,0.45)',
            direction: 'ltr',
          }}
        >
          {strip}
        </div>
      </div>
    </div>
  );
};

/** Líneas que avanzan hacia cámara sobre el piso / el agua (crawl en perspectiva). */
export const FloorCrawl: React.FC<{f: number; start: number; end: number; lines: string[]; vp: [number, number]; horizon: number; size?: number}> = ({
  f,
  start,
  end,
  lines,
  vp,
  horizon,
  size = 150,
}) => {
  if (f < start || f > end) return null;
  const k = f - start;
  const out = prog(f, end - 3, end, easeIn);
  const gapPx = size * 1.25;
  const travel = k * 9;
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 700, perspectiveOrigin: `${vp[0]}px ${vp[1]}px`, overflow: 'hidden', opacity: (1 - out) * prog(f, start, start + 5)}}>
      <div
        style={{
          position: 'absolute',
          left: -1460,
          width: 4000,
          top: horizon,
          height: 2600,
          transformOrigin: '50% 0%',
          transform: 'rotateX(78deg)',
          // aparece en el horizonte y se apaga antes de agigantarse en primer plano
          // (en px del plano: a ~700 px de profundidad el plano llega a la cámara)
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0px, #000 70px, #000 300px, transparent 430px)',
          maskImage: 'linear-gradient(180deg, transparent 0px, #000 70px, #000 300px, transparent 430px)',
        }}
      >
        {new Array(12).fill(0).map((_, i) => {
          const yy = ((i * gapPx + travel) % (12 * gapPx)) - 2 * gapPx;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                width: 4000,
                top: yy,
                textAlign: 'center',
                fontFamily: ANTON,
                fontSize: size,
                lineHeight: 1,
                color: i % 2 ? GOLD : '#fff',
                textShadow: '0 0 30px rgba(0,0,0,0.35)',
              }}
            >
              {lines[i % lines.length]}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Banda inclinada en perspectiva que cruza el cuadro. */
export const PerspectiveBand: React.FC<{f: number; start: number; end: number; text: string; y: number; rotY?: number; rotZ?: number; size?: number; dark?: boolean}> = ({
  f,
  start,
  end,
  text,
  y,
  rotY = -38,
  rotZ = -9,
  size = 120,
  dark,
}) => {
  if (f < start || f > end) return null;
  const k = f - start;
  const inP = prog(f, start, start + 6);
  const out = prog(f, end - 3, end, easeIn);
  const strip = new Array(10).fill(text).join('  ·  ');
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 1000, overflow: 'hidden', opacity: 1 - out}}>
      <div
        style={{
          position: 'absolute',
          left: -900,
          width: 2880,
          top: y - size * 0.7,
          height: size * 1.4,
          background: dark ? 'rgba(11,11,12,0.88)' : GOLD,
          transform: `rotateZ(${rotZ}deg) rotateY(${rotY}deg) scaleX(${inP})`,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: size * 0.18,
            left: 0,
            transform: `translateX(${-((k * 22) % 1600)}px)`,
            fontFamily: ANTON,
            fontSize: size,
            lineHeight: 1,
            whiteSpace: 'pre',
            color: dark ? GOLD : INK,
          }}
        >
          {strip}
        </div>
      </div>
    </div>
  );
};
