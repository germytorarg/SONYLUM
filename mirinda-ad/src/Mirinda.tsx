import React from 'react';
import {AbsoluteFill, Audio, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {Can3D} from './Can3D';
import {loadFonts} from './fonts';
import {T, canScreen, canState, easeIn, easeInOut, prog} from './timing';

loadFonts();

const ORANGE = '#FF6A00';
const ORANGE_L = '#FF9A1F';
const CREAM = '#F4EBDD';
const ANTON = 'Anton, Impact, sans-serif';
const MONT = 'Montserrat, Arial, sans-serif';
// Firma del estudio (como en la referencia). Poner false para quitarla.
const SHOW_CREDIT = true;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ fondo */
const Backdrop: React.FC<{f: number}> = ({f}) => {
  const c = canScreen(canState(f));
  const beat = f >= T.impact ? Math.exp(-((f - T.impact) % 15) / 5) : 0;
  const glow = prog(f, 0, 30) * (0.55 + 0.25 * beat) + 0.5 * prog(f, T.logo - 2, T.logo + 4) * (1 - prog(f, T.logo + 4, T.logo + 30));
  return (
    <AbsoluteFill style={{background: '#070707'}}>
      {/* textura de concreto oscuro */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.32}}>
        <filter id="concrete">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.04" numOctaves="5" seed={4} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.09  0 0 0 0 0.085  0 0 0 0 0.08  0 0 0 2.2 -0.85" />
        </filter>
        <rect width="100%" height="100%" filter="url(#concrete)" />
      </svg>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.35, mixBlendMode: 'screen'}}>
        <filter id="speck">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed={9} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.6  0 0 0 0 0.6  0 0 0 9 -7.6" />
        </filter>
        <rect width="100%" height="100%" filter="url(#speck)" />
      </svg>
      {/* halo naranja detrás de la lata */}
      <div
        style={{
          position: 'absolute',
          left: c.cx - 700,
          top: c.cy - 900,
          width: 1400,
          height: 1800,
          background: `radial-gradient(closest-side, rgba(255,106,0,${0.5 * glow}), rgba(255,80,0,${0.18 * glow}) 45%, rgba(255,80,0,0) 75%)`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(120% 70% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)'}} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------- palabras gigantes detrás */
type Word = {text: string; from: number; to: number; y: number; size: number; outline?: boolean; color?: string};
const WORDS: Word[] = [
  // arriba y abajo de la lata, metidas en parte por detrás
  {text: 'HELADA.', from: 58, to: 100, y: 330, size: 290},
  {text: 'BURBUJEANTE', from: 104, to: 147, y: 1580, size: 186, outline: true},
  {text: 'SABOR', from: 156, to: 202, y: 330, size: 290},
  {text: 'NARANJA', from: 162, to: 202, y: 1580, size: 270, color: ORANGE},
  {text: 'PURA', from: 206, to: 258, y: 285, size: 290, outline: true},
  {text: 'FRESCURA', from: 210, to: 258, y: 1640, size: 236, color: ORANGE},
];

const BigWord: React.FC<{f: number; w: Word}> = ({f, w}) => {
  if (f < w.from || f > w.to) return null;
  const k = f - w.from;
  const p = prog(f, w.from, w.from + 8);
  const out = prog(f, w.to - 5, w.to, easeIn);
  const slide = (k * 1.4) % 4000;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: 1080,
        top: w.y,
        transform: `translateY(-50%) scale(${lerp(1.5, 1, p) * (1 + out * 0.4)}) translateX(${-slide * 0.5 + 20}px)`,
        textAlign: 'center',
        fontFamily: ANTON,
        fontSize: w.size,
        lineHeight: 1,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        color: w.outline ? 'transparent' : w.color ?? CREAM,
        WebkitTextStroke: w.outline ? `5px ${ORANGE_L}` : undefined,
        opacity: p * (1 - out),
        filter: `blur(${(1 - p) * 12 + out * 10}px)`,
        textShadow: w.outline ? undefined : `0 0 60px ${w.color ? 'rgba(255,106,0,0.45)' : 'rgba(255,170,90,0.25)'}`,
      }}
    >
      {w.text}
    </div>
  );
};

/* ------------------------------------------------ gotas que corren por la lata */
const Drops: React.FC<{f: number}> = ({f}) => {
  // solo en los tramos de giro lento (en el giro rápido no se sostendrían)
  const vis = Math.min(prog(f, T.impact + 20, T.impact + 35), 1 - prog(f, T.spinFrom - 8, T.spinFrom)) + Math.min(prog(f, T.spinTo + 8, T.spinTo + 20), 1 - prog(f, T.end, T.end + 8));
  if (vis <= 0.01) return null;
  const c = canScreen(canState(f));
  const w = c.h * 0.29; // medio ancho aparente
  return (
    <>
      {new Array(9).fill(0).map((_, i) => {
        const r = (k: string) => random(`drop${i}${k}`);
        const period = 70 + r('p') * 60;
        const t = (f + r('o') * period) % period;
        const slide = Math.max(0, t - 18) / (period - 18); // quieta, luego cae
        const u = (r('u') - 0.5) * 1.3;
        const v0 = -0.35 + r('v') * 0.4;
        const x = c.cx + u * w;
        const y = c.cy + (v0 + slide * 0.7) * c.h * 0.5;
        const size = (10 + r('s') * 12) * (c.h / 1000);
        const a = vis * (1 - prog(slide, 0.85, 1, (q) => q)) * (1 - Math.abs(u) * 0.5);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: x - size * 0.22,
                top: y - slide * c.h * 0.32,
                width: size * 0.44,
                height: slide * c.h * 0.32,
                background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,240,220,0.22))',
                borderRadius: size,
                opacity: a,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: x - size / 2,
                top: y - size * 0.6,
                width: size,
                height: size * 1.2,
                borderRadius: '50% 50% 50% 50% / 45% 45% 55% 55%',
                background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0 14%, rgba(255,220,180,0.25) 30%, rgba(120,30,0,0.35) 70%, rgba(255,255,255,0.55) 92%)',
                boxShadow: '0 2px 3px rgba(80,20,0,0.35)',
                opacity: a,
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------- vapor frío */
const Mist: React.FC<{f: number}> = ({f}) => {
  const c = canScreen(canState(f));
  const vis = prog(f, T.impact, T.impact + 20) * 0.8;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {new Array(10).fill(0).map((_, i) => {
        const r = (k: string) => random(`mist${i}${k}`);
        const life = 90 + r('l') * 60;
        const t = ((f + r('o') * life) % life) / life;
        const side = r('s') > 0.5 ? 1 : -1;
        const x = c.cx + side * (c.h * 0.22 + t * 160 + r('x') * 60);
        const y = c.cy - c.h * (0.35 - r('y') * 0.75) - t * 140;
        const size = 220 + t * 260;
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
              background: 'radial-gradient(closest-side, rgba(235,240,245,0.22), rgba(235,240,245,0))',
              filter: 'blur(18px)',
              opacity: vis * Math.sin(Math.PI * t),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- burbujas */
const Bubbles: React.FC<{f: number}> = ({f}) => (
  <>
    {new Array(34).fill(0).map((_, i) => {
      const r = (k: string) => random(`bub${i}${k}`);
      const z = r('z');
      const speed = 4 + z * 9;
      const period = 2100 / speed;
      const t = (f + r('o') * period) % period;
      const y = 1980 - t * speed;
      const x = r('x') * 1080 + Math.sin(t * 0.12 + i) * 10;
      const size = 6 + z * 26;
      const o = prog(f, T.impact, T.impact + 15) * (0.35 + z * 0.5);
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
            border: `${1 + z * 1.5}px solid rgba(255,190,120,0.75)`,
            background: 'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.9) 0 12%, rgba(255,140,40,0.12) 40%, rgba(255,140,40,0) 70%)',
            filter: z > 0.85 ? `blur(${(z - 0.85) * 20}px)` : undefined,
            opacity: o,
          }}
        />
      );
    })}
  </>
);

/* ------------------------------------------------ salpicadura en el impacto */
const Splash: React.FC<{f: number; at: number; scale?: number}> = ({f, at, scale = 1}) => {
  const k = f - at;
  if (k < 0 || k > 40) return null;
  const c = canScreen(canState(at));
  return (
    <>
      {/* onda expansiva */}
      <div
        style={{
          position: 'absolute',
          left: c.cx - k * 40 * scale,
          top: c.cy + c.h * 0.42 - k * 9 * scale,
          width: k * 80 * scale,
          height: k * 18 * scale,
          borderRadius: '50%',
          border: `${Math.max(1, 6 - k * 0.3)}px solid rgba(255,150,40,${Math.max(0, 0.8 - k / 22)})`,
        }}
      />
      {new Array(26).fill(0).map((_, i) => {
        const r = (q: string) => random(`spl${at}${i}${q}`);
        const ang = -Math.PI * (0.05 + r('a') * 0.9);
        const v = (18 + r('v') * 26) * scale;
        const x = c.cx + Math.cos(ang) * v * k * (r('s') > 0.5 ? 1 : -1);
        const y = c.cy + c.h * 0.4 + Math.sin(ang) * v * k + 0.9 * k * k;
        const size = (12 + r('z') * 30) * scale;
        const o = 1 - prog(k, 18, 40, (q) => q);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size * 1.15,
              borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
              background: 'radial-gradient(circle at 35% 30%, #fff 0 10%, #FFB347 25%, #FF6A00 60%, #C23B00 100%)',
              boxShadow: '0 0 12px rgba(255,106,0,0.6)',
              opacity: o,
            }}
          />
        );
      })}
    </>
  );
};

/* ------------------------------------------------- estelas del giro rápido */
const SpinStreaks: React.FC<{f: number}> = ({f}) => {
  const o = Math.sin(Math.PI * prog(f, T.spinFrom - 2, T.spinTo + 4, (q) => q));
  if (o <= 0.01) return null;
  const c = canScreen(canState(f));
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: o}}>
      {new Array(14).fill(0).map((_, i) => {
        const y = c.cy - c.h * 0.45 + (i / 13) * c.h * 0.9;
        const len = 300 + random(`ss${i}`) * 400;
        const dir = i % 2 ? 1 : -1;
        const x = c.cx + dir * (c.h * 0.3 + ((f * 55 + random(`sx${i}`) * 500) % 500));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: dir > 0 ? x : x - len,
              top: y,
              width: len,
              height: 4,
              background: `linear-gradient(${dir > 0 ? 90 : 270}deg, rgba(255,140,30,0.9), rgba(255,140,30,0))`,
              filter: 'blur(1px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------- destello anamórfico naranja */
const LightStreak: React.FC<{f: number}> = ({f}) => {
  const sweeps = [0, T.impact, T.spinTo, T.logo];
  return (
    <>
      {sweeps.map((s, i) => {
        const p = prog(f, s, s + 22, easeInOut);
        if (f < s || f > s + 24) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: -600 + p * 2200,
              top: (i === 3 ? 1450 : 960) - 3,
              width: 900,
              height: 6,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(90deg, rgba(255,106,0,0), rgba(255,200,140,1), rgba(255,106,0,0))',
              boxShadow: '0 0 30px 8px rgba(255,106,0,0.6)',
              opacity: Math.sin(Math.PI * p),
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------- cierre */
const EndCard: React.FC<{f: number}> = ({f}) => {
  if (f < T.logo - 2) return null;
  const k = f - T.logo;
  const p = prog(f, T.logo, T.logo + 8);
  const settle = k > 0 ? Math.exp(-k / 6) * Math.cos(k * 0.7) * 0.08 : 0;
  const sc = lerp(1.9, 1, p) + settle;
  const shine = prog(f, T.logo + 12, T.logo + 34, easeInOut) * 140 - 20;
  const tag = prog(f, T.logo + 14, T.logo + 26);
  const cred = prog(f, T.logo + 26, T.logo + 40);
  const logoW = 960;
  const logoH = (logoW * 663) / 2117;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 540 - logoW / 2,
          top: 1430 - logoH / 2,
          width: logoW,
          height: logoH,
          transform: `scale(${sc}) rotate(${(1 - p) * -6}deg)`,
          opacity: Math.min(1, p * 1.5),
          filter: `drop-shadow(0 18px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,106,0,0.35)) ${p < 0.9 ? `blur(${(1 - p) * 10}px)` : ''}`,
        }}
      >
        <Img src={staticFile('assets/mirinda_logo.png')} style={{width: '100%', height: '100%'}} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            WebkitMaskImage: `url(${staticFile('assets/mirinda_logo.png')})`,
            WebkitMaskSize: '100% 100%',
            maskImage: `url(${staticFile('assets/mirinda_logo.png')})`,
            maskSize: '100% 100%',
            background: `linear-gradient(105deg, rgba(255,255,255,0) ${shine - 10}%, rgba(255,255,240,0.75) ${shine}%, rgba(255,255,255,0) ${shine + 10}%)`,
            mixBlendMode: 'screen',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 1080,
          top: 1650,
          textAlign: 'center',
          fontFamily: ANTON,
          fontSize: 74,
          letterSpacing: '0.02em',
          color: CREAM,
          opacity: tag,
          transform: `translateY(${(1 - tag) * 30}px)`,
          textShadow: '0 6px 24px rgba(0,0,0,0.6)',
        }}
      >
        BIEN FRÍA. <span style={{color: ORANGE}}>BIEN NARANJA.</span>
      </div>
      {SHOW_CREDIT ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: 1080,
            top: 1780,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 26,
            opacity: cred * 0.85,
            fontFamily: MONT,
            color: CREAM,
          }}
        >
          <div style={{fontWeight: 800, fontSize: 22, lineHeight: 1.05, letterSpacing: '0.06em'}}>
            CREANDO
            <br />
            CONTENIDOS
          </div>
          <div style={{color: ORANGE, fontSize: 36, fontWeight: 600}}>×</div>
          <div style={{fontWeight: 600, fontSize: 30, letterSpacing: '0.28em'}}>SONYLUM</div>
        </div>
      ) : null}
    </>
  );
};

/* ------------------------------------------------- marco (referencia) */
const Frame: React.FC<{f: number}> = ({f}) => {
  const o = prog(f, 4, 24);
  const b = (style: React.CSSProperties) => <div style={{position: 'absolute', width: 64, height: 64, borderColor: ORANGE, borderStyle: 'solid', borderWidth: 0, ...style}} />;
  return (
    <div style={{opacity: o}}>
      {b({left: 40, top: 40, borderLeftWidth: 5, borderTopWidth: 5})}
      {b({right: 40, top: 40, borderRightWidth: 5, borderTopWidth: 5})}
      {b({left: 40, bottom: 40, borderLeftWidth: 5, borderBottomWidth: 5})}
      {b({right: 40, bottom: 40, borderRightWidth: 5, borderBottomWidth: 5})}
      <div style={{position: 'absolute', left: 150, right: 150, top: 72, height: 1, background: 'rgba(255,106,0,0.35)'}} />
      <div style={{position: 'absolute', left: 150, right: 150, bottom: 72, height: 1, background: 'rgba(255,106,0,0.35)'}} />
      <div style={{position: 'absolute', left: 532, top: 64, width: 16, height: 16, background: ORANGE}} />
      <div style={{position: 'absolute', left: 532, bottom: 64, width: 16, height: 16, background: ORANGE}} />
    </div>
  );
};

const Grain: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.12, pointerEvents: 'none'}}>
    <svg width={1080} height={1920}>
      <filter id={`g${f % 8}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 8} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#g${f % 8})`} />
    </svg>
  </AbsoluteFill>
);

export const Mirinda: React.FC = () => {
  const f = useCurrentFrame();
  const flash = Math.max(...[T.impact, T.logo].map((c) => (f >= c && f < c + 6 ? Math.exp(-(f - c) / 1.6) : 0)));
  const shake = f >= T.impact && f < T.impact + 10 ? 14 * Math.exp(-(f - T.impact) / 3) : f >= T.logo && f < T.logo + 10 ? 10 * Math.exp(-(f - T.logo) / 3) : 0;
  const sx = (random(`sx${f}`) - 0.5) * shake;
  const sy = (random(`sy${f}`) - 0.5) * shake;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        <Backdrop f={f} />
        {WORDS.map((w, i) => (
          <BigWord key={i} f={f} w={w} />
        ))}
        <Bubbles f={f} />
        <Can3D />
        <Drops f={f} />
        <Mist f={f} />
        <SpinStreaks f={f} />
        <Splash f={f} at={T.impact} />
        <Splash f={f} at={T.logo} scale={0.8} />
        <LightStreak f={f} />
        <EndCard f={f} />
      </AbsoluteFill>
      <Frame f={f} />
      <AbsoluteFill style={{background: '#FFE2C2', opacity: flash * 0.55, mixBlendMode: 'screen'}} />
      <Grain f={f} />
      <Audio src={staticFile('audio/mirinda.wav')} />
    </AbsoluteFill>
  );
};


