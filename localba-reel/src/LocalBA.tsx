import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, random, staticFile, useCurrentFrame} from 'remotion';
import {ANTON, BookmarkIcon, GOLD, GlitchText, INK, MONT, PhoneIcon, PlaceTag, Slam, easeIn, lerp, prog} from './components';
import {loadFonts} from './fonts';
import {CUT, MATTE_DAY, MATTE_NIGHT, SHIFT, SLOW_END, srcFrame} from './timing';

loadFonts();

const VIDEO = staticFile('video/localba_src.mp4');
const pad = (n: number) => String(n).padStart(4, '0');
const bgFrame = (k: number) => staticFile(`bg/bg_${pad(k)}.jpg`);
const fgFrame = (k: number) => staticFile(`fg/fg_${pad(k)}.webp`);
const FULL: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%'};

// Golpes de zoom en los cortes (más fuertes en los acentos principales).
const PUNCHES: [number, number][] = [
  [0, 0.1],
  [CUT.avenida, 0.12],
  [CUT.auto, 0.08],
  [CUT.floralis, 0.1],
  [CUT.floralisCerca, 0.06],
  [CUT.planetario, 0.07],
  [CUT.lagos, 0.07],
  [CUT.palacio, 0.12],
  [CUT.mansion, 0.07],
  [CUT.madero, 0.08],
  [CUT.puente, 0.06],
  [CUT.caminito, 0.08],
  [CUT.tango, 0.16],
  [CUT.skyline, 0.08],
  [CUT.obeliscoNoche, 0.12],
];
const FLASHES = [CUT.avenida, CUT.floralis, CUT.palacio, CUT.tango, CUT.obeliscoNoche, CUT.logo];

const punch = (f: number) => {
  let s = 1;
  for (const [c, a] of PUNCHES) if (f >= c) s *= 1 + a * Math.exp(-(f - c) / 3.2);
  return s;
};
const shake = (f: number) => {
  const a = f >= CUT.tango && f < CUT.tango + 10 ? 16 * Math.exp(-(f - CUT.tango) / 3) : 0;
  return [(random(`sx${f}`) - 0.5) * a, (random(`sy${f}`) - 0.5) * a];
};

/** Toma con título detrás: fondo + título + recorte de primer plano. */
const Matted: React.FC<{k: number; children: React.ReactNode}> = ({k, children}) => (
  <>
    <Img src={bgFrame(k)} style={FULL} />
    {children}
    <Img src={fgFrame(k)} style={FULL} />
  </>
);

/** Rayas de velocidad para el auto. */
const SpeedLines: React.FC<{f: number; from: number; to: number}> = ({f, from, to}) => {
  if (f < from || f > to) return null;
  const o = Math.sin(Math.PI * prog(f, from, to, (t) => t));
  return (
    <AbsoluteFill style={{opacity: o * 0.55, mixBlendMode: 'screen'}}>
      {new Array(16).fill(0).map((_, i) => {
        const side = i % 2 ? 1 : -1;
        const y = 300 + random(`sl${i}`) * 1300;
        const len = 160 + random(`sll${i}`) * 260;
        const x = side < 0 ? ((f * 70 + random(`slx${i}`) * 600) % 620) - 300 : 1080 - (((f * 70 + random(`slx${i}`) * 600) % 620) - 300) - len;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: len, height: 3, background: 'linear-gradient(90deg, rgba(255,255,255,0), #fff, rgba(255,255,255,0))'}} />;
      })}
    </AbsoluteFill>
  );
};

// Seguimiento del auto (medido sobre el original, en proporción del cuadro).
const CAR: [number, number, number, number][] = [
  // frame salida, centro x, centro y, ancho
  [57, 0.505, 0.575, 0.17],
  [61.5, 0.51, 0.58, 0.22],
  [66, 0.51, 0.585, 0.26],
  [70.5, 0.52, 0.59, 0.38],
  [75, 0.535, 0.63, 0.61],
  [78, 0.54, 0.65, 0.75],
];
const carAt = (f: number) => {
  let i = 0;
  while (i < CAR.length - 2 && f > CAR[i + 1][0]) i++;
  const [f0, x0, y0, w0] = CAR[i];
  const [f1, x1, y1, w1] = CAR[i + 1];
  const t = Math.max(0, Math.min(1, (f - f0) / (f1 - f0)));
  return {cx: lerp(x0, x1, t) * 1080, cy: lerp(y0, y1, t) * 1920, w: lerp(w0, w1, t) * 1080};
};

/** «SIN VUELTAS» a los laterales del auto, empujado hacia afuera cuando se acerca. */
const CarLateral: React.FC<{f: number}> = ({f}) => {
  const from = CUT.auto;
  const to = CUT.floralis - 1;
  if (f < from || f > to) return null;
  const car = carAt(f);
  const inP = prog(f, from, from + 6);
  const out = prog(f, to - 3, to, easeIn);
  const gap = 26;
  const size = 108 * (1 + 0.22 * prog(f, from, to, (t) => t));
  const common: React.CSSProperties = {
    position: 'absolute',
    top: car.cy,
    fontFamily: ANTON,
    fontSize: size,
    lineHeight: 1,
    color: '#fff',
    whiteSpace: 'nowrap',
    textShadow: '0 10px 30px rgba(0,0,0,0.55)',
    opacity: inP * (1 - out),
  };
  return (
    <>
      <div style={{...common, left: car.cx - car.w / 2 - gap, transform: `translate(-100%, -50%) translateX(${(1 - inP) * -300}px)`}}>SIN</div>
      <div style={{...common, left: car.cx + car.w / 2 + gap, color: GOLD, transform: `translate(0, -50%) translateX(${(1 - inP) * 300}px)`}}>
        VUELTAS
      </div>
    </>
  );
};

export const LocalBA: React.FC = () => {
  const f = useCurrentFrame();
  const [sx, sy] = shake(f);
  const flash = Math.max(...FLASHES.map((c) => (f >= c && f < c + 5 ? Math.exp(-(f - c) / 1.4) : 0)));
  const nightMatted = f >= MATTE_NIGHT.from && f <= MATTE_NIGHT.to;
  const holdLogo = prog(f, CUT.logoFin - 8, CUT.logoFin);

  const buenosAires = (
    <>
      {/* sale desde detrás del Obelisco hacia la derecha y queda legible */}
      <Slam text="BUENOS" start={3} end={35} y={800} size={196} drift={0.05} exit="cut" x={lerp(700, 1050, prog(f, 3, 15))} align="right" from="up" />
      <Slam text="AIRES" start={5} end={35} y={1020} size={240} color={GOLD} drift={0.05} exit="cut" x={lerp(640, 1050, prog(f, 5, 17))} align="right" from="up" />
    </>
  );
  const arrancamos = <Slam text="¿ARRANCAMOS?" start={MATTE_NIGHT.from} end={MATTE_NIGHT.to} y={640} size={170} exit="cut" drift={0.05} />;

  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      {/* ---------------- imagen ---------------- */}
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${punch(f) * (f >= CUT.logo ? 0.84 : 1)})`}}>
        {f < SLOW_END ? (
          <Matted k={srcFrame(f)}>{buenosAires}</Matted>
        ) : (
          <Sequence from={SLOW_END} layout="none">
            <OffthreadVideo src={VIDEO} trimBefore={SHIFT} muted style={FULL} />
          </Sequence>
        )}
        {nightMatted ? <Matted k={srcFrame(f)}>{arrancamos}</Matted> : null}
        <Img src={staticFile('bg/logo_hold.png')} style={{...FULL, opacity: holdLogo}} />
      </AbsoluteFill>

      {/* viñeta para lectura */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.5) 100%)',
          opacity: f < CUT.logo ? 1 : 0,
        }}
      />

      {/* ---------------- títulos ---------------- */}
      {/* 1 · Obelisco: VIVÍ (adelante) + BUENOS AIRES (detrás, en Matted) */}
      <Slam text="VIVÍ" start={2} end={35} y={430} size={78} font={MONT} weight={900} box={GOLD} tracking={0.06} from="up" exit="cut" />

      {/* 2 · Avenida */}
      <Slam text="COMO UN" start={CUT.avenida} end={CUT.auto - 1} y={800} size={86} font={MONT} weight={900} tracking={0.04} from="up" />
      <Slam text="LOCAL" start={CUT.avenida + 3} end={CUT.auto - 1} y={1040} size={390} color={GOLD} stagger={1.5} />

      {/* 3 · Auto: lateral */}
      <SpeedLines f={f} from={CUT.auto} to={CUT.floralis} />
      <CarLateral f={f} />

      {/* 4 · Contador de lugares */}
      {[
        [CUT.floralis, CUT.palacio - 1],
        [CUT.madero, CUT.tango - 1],
      ].map(([a, b], i) => (
        <Slam key={i} text="¿CUÁNTOS CONOCÉS?" start={a} end={b} y={300} size={104} from="up" stagger={0.6} drift={0.02} exit="up" />
      ))}
      <PlaceTag n="01" name="Floralis Genérica" area="Recoleta" start={CUT.floralis + 2} end={CUT.planetario - 1} />
      <PlaceTag n="02" name="Planetario" area="Palermo" start={CUT.planetario + 1} end={CUT.lagos - 1} />
      <PlaceTag n="03" name="Bosques de Palermo" area="Palermo" start={CUT.lagos + 1} end={CUT.palacio - 1} />
      <PlaceTag n="04" name="Puerto Madero" area="Puente de la Mujer" start={CUT.madero + 2} end={CUT.caminito - 1} areaFrom={CUT.puente} />
      <PlaceTag n="05" name="Caminito" area="La Boca" start={CUT.caminito + 1} end={CUT.tango - 1} />

      {/* 5 · Hook de guardado */}
      <BookmarkPop f={f} start={CUT.palacio + 2} end={CUT.madero - 1} />
      <Slam text="GUARDÁ" start={CUT.palacio} end={CUT.madero - 1} y={830} size={250} />
      <Slam text="ESTE VIDEO" start={CUT.palacio + 4} end={CUT.madero - 1} y={1040} size={150} color={GOLD} stagger={1} />
      <Slam
        text="para tu próximo viaje"
        start={CUT.mansion}
        end={CUT.madero - 1}
        y={1170}
        size={54}
        font={MONT}
        weight={800}
        italic
        from="up"
        stagger={0.5}
        drift={0.02}
      />

      {/* 6 · Tango */}
      <TangoTitle f={f} />

      {/* 7 · Skyline */}
      <Slam text="TU PRÓXIMA HISTORIA" start={CUT.skyline} end={CUT.obeliscoNoche - 1} y={420} size={70} font={MONT} weight={900} from="up" stagger={0.6} />
      <Slam text="EMPIEZA ACÁ" start={CUT.skyline + 4} end={CUT.obeliscoNoche - 1} y={570} size={180} color={GOLD} stagger={1.2} />

      {/* 8 · Obelisco de noche: detrás (Matted) y luego glitch adelante */}
      <GlitchText text="¿ARRANCAMOS?" start={MATTE_NIGHT.to + 1} end={CUT.logo - 1} y={640} size={170 * 1.05} />

      {/* 9 · CTA */}
      <Cta f={f} />

      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.75, pointerEvents: 'none'}} />

      {/* ---------------- audio ---------------- */}
      <Sequence from={SHIFT}>
        <Audio src={VIDEO} volume={(fr) => (fr < 6 ? fr / 6 : 1)} />
      </Sequence>
      <Audio src={staticFile('audio/sfx.wav')} volume={0.85} />
    </AbsoluteFill>
  );
};

const BookmarkPop: React.FC<{f: number; start: number; end: number}> = ({f, start, end}) => {
  if (f < start || f > end) return null;
  const p = prog(f, start, start + 8);
  const out = prog(f, end - 4, end, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        left: 540 - 60,
        top: 560,
        transform: `scale(${lerp(0.2, 1, p) * (1 + out * 0.5)}) rotate(${(1 - p) * -25}deg)`,
        opacity: p * (1 - out),
        filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.5))',
      }}
    >
      <BookmarkIcon size={120} />
    </div>
  );
};

const TangoTitle: React.FC<{f: number}> = ({f}) => {
  const a = CUT.tango;
  const b = CUT.skyline - 1;
  if (f < a || f > b) return null;
  const k = f - a;
  const out = prog(f, b - 4, b, easeIn);
  const base: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    width: 1080,
    top: 520,
    transform: 'translateY(-50%)',
    textAlign: 'center',
    fontFamily: ANTON,
    fontSize: 400,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  };
  return (
    <div style={{opacity: 1 - out, filter: out > 0.05 ? `blur(${out * 12}px)` : undefined}}>
      {[3, 2, 1].map((i) => {
        const s = 1 + i * 0.08 * prog(k, 0, 10) + i * 0.02;
        return (
          <div
            key={i}
            style={{
              ...base,
              color: 'transparent',
              WebkitTextStroke: `3px rgba(245,197,66,${0.55 - i * 0.14})`,
              transform: `translateY(-50%) scale(${s})`,
            }}
          >
            TANGO
          </div>
        );
      })}
      <div
        style={{
          ...base,
          color: GOLD,
          transform: `translateY(-50%) scale(${lerp(2.2, 1, prog(k, 0, 6))})`,
          textShadow: '0 14px 40px rgba(0,0,0,0.55)',
        }}
      >
        TANGO
      </div>
    </div>
  );
};

const Cta: React.FC<{f: number}> = ({f}) => {
  const s = CUT.logo + 14;
  if (f < s) return null;
  const line = (i: number) => prog(f, s + 8 + i * 10, s + 18 + i * 10);
  const kick = line(0);
  const phone = line(1);
  const handle = line(2);
  const pulse = 1 + 0.03 * Math.sin((f - s) * 0.25) * prog(f, s + 40, s + 50);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 1080,
          top: 640,
          textAlign: 'center',
          fontFamily: ANTON,
          fontSize: 92,
          color: '#fff',
          opacity: prog(f, s, s + 8),
          transform: `translateY(${(1 - prog(f, s, s + 8)) * 40}px)`,
          letterSpacing: '0.01em',
        }}
      >
        RESERVÁ TU EXPERIENCIA
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 1080,
          top: 1090,
          textAlign: 'center',
          fontFamily: MONT,
          fontWeight: 800,
          fontSize: 38,
          letterSpacing: '0.32em',
          color: GOLD,
          opacity: kick,
          transform: `translateY(${(1 - kick) * 30}px)`,
          paddingLeft: '0.32em',
        }}
      >
        ESCRIBINOS
      </div>
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: 1235,
          transform: `translate(-50%, -50%) scale(${lerp(1.6, 1, phone) * pulse})`,
          opacity: phone,
          filter: phone < 0.9 ? `blur(${(1 - phone) * 10}px)` : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          background: GOLD,
          padding: '18px 40px 12px 30px',
          borderRadius: 999,
          boxShadow: '0 16px 50px rgba(245,197,66,0.28)',
        }}
      >
        <PhoneIcon size={78} color={INK} />
        <span style={{fontFamily: ANTON, fontSize: 112, lineHeight: 1, color: INK, whiteSpace: 'nowrap'}}>11 5765-2200</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 1080,
          top: 1370,
          textAlign: 'center',
          fontFamily: MONT,
          fontWeight: 800,
          fontSize: 54,
          color: '#fff',
          opacity: handle,
          transform: `translateY(${(1 - handle) * 30}px)`,
        }}
      >
        @localba
        <span style={{color: GOLD, margin: '0 22px'}}>·</span>
        <span style={{fontWeight: 700, color: 'rgba(255,255,255,0.85)'}}>localba.ar</span>
      </div>
    </>
  );
};
