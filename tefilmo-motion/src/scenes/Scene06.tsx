import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog, tw, wobble} from '../anim';
import {ASSETS, HOTSPOTS} from '../assets';
import {Bokeh, Glint} from '../components/Atmosphere';
import {Cutout} from '../components/Cutout';
import {KineticText} from '../components/KineticText';
import {COLORS, FONTS} from '../config';
import {SYNC} from '../timing';

// ESCENA 06 | 750-899 | RECUERDO / MARCA — assets 18, 19, 20, 21, 22.
// 21 y 22 nunca en pantalla a la vez. Sin logotipo inventado: marca tipográfica.

const CX = 540;
const CY = 900;
const RX = 495;
const RY = 140;
const TILT = -8;

const arc = (rx: number, ry: number, half: 'back' | 'front') =>
  half === 'back'
    ? `M ${CX - rx} ${CY} A ${rx} ${ry} 0 0 1 ${CX + rx} ${CY}`
    : `M ${CX + rx} ${CY} A ${rx} ${ry} 0 0 1 ${CX - rx} ${CY}`;

/** Cinta de cine vectorial que se enrolla alrededor del texto central. */
const FilmWrap: React.FC<{frame: number; half: 'back' | 'front'; t: number; run: number; o: number}> = ({
  half,
  t,
  run,
  o,
}) => {
  // t 0..1: primero se dibuja la mitad trasera, luego la delantera.
  const local = half === 'back' ? Math.min(1, t * 2) : Math.max(0, t * 2 - 1);
  if (local <= 0 || o <= 0) return null;
  const L = 1000;
  const dash = {pathLength: L, strokeDasharray: L, strokeDashoffset: L * (1 - local)};
  return (
    <svg
      width={1080}
      height={1920}
      style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: o, transform: `rotate(${TILT}deg)`, transformOrigin: `${CX}px ${CY}px`}}
    >
      <defs>
        <mask id={`reveal-${half}`}>
          <path d={arc(RX, RY, half)} stroke="#fff" strokeWidth={90} fill="none" {...dash} />
        </mask>
      </defs>
      <g mask={`url(#reveal-${half})`}>
        <path d={arc(RX, RY, half)} stroke="#241B13" strokeWidth={56} fill="none" opacity={half === 'back' ? 0.75 : 0.95} />
        <path d={arc(RX + 27, RY + 27, half)} stroke={COLORS.champagne} strokeWidth={2.2} fill="none" />
        <path d={arc(RX - 27, RY - 27, half)} stroke={COLORS.champagne} strokeWidth={2.2} fill="none" />
        {[19, -19].map((off) => (
          <path
            key={off}
            d={arc(RX + off, RY + off, half)}
            stroke="#F3E2BC"
            strokeOpacity={0.55}
            strokeWidth={6}
            fill="none"
            strokeDasharray="8 18"
            strokeDashoffset={-run}
          />
        ))}
        {/* fotogramas: brillo dorado interior */}
        <path d={arc(RX, RY, half)} stroke="url(#frameGlow)" strokeWidth={24} fill="none" strokeDasharray="70 8" strokeDashoffset={-run * 0.6} opacity={0.35} />
      </g>
      <defs>
        <linearGradient id="frameGlow" x1="0" x2="1">
          <stop offset="0" stopColor={COLORS.goldDeep} />
          <stop offset="0.5" stopColor={COLORS.goldLight} />
          <stop offset="1" stopColor={COLORS.goldDeep} />
        </linearGradient>
      </defs>
    </svg>
  );
};

const WORD = 'TEFILMO';
const BrandWord: React.FC<{frame: number}> = ({frame}) => {
  const start = SYNC.brand;
  const size = 140;
  const shine = tw(frame, 866, 892, -20, 120, ease.inOut);
  const letters = (anim: boolean) =>
    Array.from(WORD).map((c, i) => {
      const f0 = start + i * 2.4;
      const p = anim ? prog(frame, f0, f0 + 24) : 1;
      const blur = anim ? tw(frame, f0, f0 + 20, 14, 0) : 0;
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: p,
            transform: `translateY(${(1 - p) * 40}px)`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
          }}
        >
          {c}
        </span>
      );
    });
  const track = tw(frame, start, start + 40, 0.34, 0.16, ease.out);
  const common: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    width: 1080,
    top: CY,
    transform: 'translateY(-52%)',
    textAlign: 'center',
    fontFamily: FONTS.serif,
    fontWeight: 500,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${track}em`,
    paddingLeft: `${track}em`,
  };
  return (
    <>
      <div style={{...common, color: COLORS.champagne, textShadow: '0 0 40px rgba(217,190,134,0.35)'}}>{letters(true)}</div>
      {frame >= 864 ? (
        <div
          style={{
            ...common,
            backgroundImage: `linear-gradient(100deg, rgba(255,246,221,0) ${shine - 12}%, rgba(255,248,230,0.95) ${shine}%, rgba(255,246,221,0) ${
              shine + 12
            }%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {letters(false)}
        </div>
      ) : null}
    </>
  );
};

export const Scene06: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 724) return null;

  const sceneIn = prog(frame, 724, 760, ease.soft);
  const dusk = prog(frame, 808, 842, ease.inOut);

  // 18 · atardecer: plano de fondo en parallax lento.
  const seaX = tw(frame, 724, 850, 40, -40, ease.linear);
  const seaScale = tw(frame, 724, 850, 1.04, 1.14, ease.linear);

  // 21 · lazo (solo al inicio, sale antes de que entre 22).
  const bowO = prog(frame, 742, 764) * (1 - prog(frame, 782, 798, ease.in));

  // 19 · novios al atardecer → recuerdo enmarcado en 22.
  const coupleIn = prog(frame, 756, 796, ease.out);
  const framed = prog(frame, 792, 822, ease.out);
  const recede = prog(frame, 812, 846, ease.in);
  const photoO = coupleIn * (1 - recede);
  const coupleScale = (0.94 + 0.06 * coupleIn) * (1 - 0.25 * framed) * (1 - 0.12 * recede);
  const coupleW = 600;
  const coupleH = (coupleW * ASSETS.noviosAtardecer.h) / ASSETS.noviosAtardecer.w;
  const photoCY = 860 - 30 * recede;

  const frameW = 900;
  const frameH = (frameW * ASSETS.marco.h) / ASSETS.marco.w;
  const fi = HOTSPOTS.frameInterior;
  const frameCX = CX - ((fi.x0 + fi.x1) / 2 - 0.5) * frameW;
  const frameCY = photoCY - ((fi.y0 + fi.y1) / 2 - 0.5) * frameH;
  const interior = {
    left: frameCX - frameW / 2 + fi.x0 * frameW,
    top: frameCY - frameH / 2 + fi.y0 * frameH,
    width: (fi.x1 - fi.x0) * frameW,
    height: (fi.y1 - fi.y0) * frameH,
  };

  // 20 · cinta de cine atraviesa cámara y "se convierte" en la cinta vectorial.
  const filmP = prog(frame, SYNC.film - 2, 842, ease.inOut);
  const filmX = tw(filmP, 0, 1, 1420, CX);
  const filmY = tw(filmP, 0, 1, 1780, CY);
  const filmScale = tw(filmP, 0, 1, 2.6, 0.9);
  const filmO = prog(frame, SYNC.film - 2, SYNC.film + 6) * (1 - prog(frame, 832, 846));
  const prevX = tw(prog(frame - 1, SYNC.film - 2, 842, ease.inOut), 0, 1, 1420, CX);
  const prevY = tw(prog(frame - 1, SYNC.film - 2, 842, ease.inOut), 0, 1, 1780, CY);

  const wrapT = prog(frame, 832, 866, ease.inOut);
  const run = (frame - 832) * 4;
  const brandO = prog(frame, 826, 846);

  return (
    <AbsoluteFill style={{opacity: sceneIn}}>
      {/* cielo y mar por capas */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #E8B99A 0%, #F2C9A2 30%, #F6D7B4 46%, #D9B8A0 62%, #C7A892 100%)'}} />
      {/* placa de color: 18 muy desenfocado cubre todo el cuadro */}
      <Cutout asset={ASSETS.atardecer} x={CX + seaX * 0.4} y={960} width={3600} blur={60} opacity={0.9} />
      <Cutout
        asset={ASSETS.atardecer}
        x={CX + seaX}
        y={820}
        width={1560}
        scale={seaScale}
        blur={2.2}
        opacity={0.95}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(247,241,230,0.35) 0%, rgba(247,241,230,0) 25%, rgba(247,241,230,0) 70%, rgba(247,241,230,0.4) 100%)',
        }}
      />
      <Bokeh seed="s6" count={14} opacity={0.6 * (1 - dusk)} drift={[0.2, -0.3]} />

      {/* 21 · lazo satinado, primer plano */}
      <Cutout
        asset={ASSETS.lazo}
        x={tw(frame, 742, 798, 160, 40)}
        y={tw(frame, 742, 798, 300, 210)}
        width={400}
        rotate={-12 + wobble(frame, 'bow') * 4}
        blur={2.5}
        opacity={bowO}
        shadow
      />

      {/* 19 dentro del marco 22: el momento se vuelve recuerdo */}
      <AbsoluteFill style={{opacity: photoO}}>
        <div
          style={{
            position: 'absolute',
            ...interior,
            opacity: framed,
            overflow: 'hidden',
            background: '#F1C9A0',
          }}
        >
          <Cutout
            asset={ASSETS.atardecer}
            x={interior.width / 2}
            y={interior.height / 2}
            width={interior.width * 1.5}
            blur={1.5}
          />
        </div>
        <Cutout
          asset={ASSETS.noviosAtardecer}
          x={CX}
          y={photoCY + (1 - coupleIn) * 80}
          width={coupleW}
          scale={coupleScale}
          shadow={framed < 0.5}
          clipPath={
            framed > 0
              ? `inset(${Math.max(0, (coupleH - interior.height / coupleScale) / 2) * framed}px ${
                  Math.max(0, (coupleW - interior.width / coupleScale) / 2) * framed
                }px)`
              : undefined
          }
        />
        <Cutout
          asset={ASSETS.marco}
          x={frameCX}
          y={frameCY}
          width={frameW}
          scale={1.18 - 0.18 * framed}
          opacity={framed}
          blur={(1 - framed) * 8}
          shadow
        />
      </AbsoluteFill>

      {/* anochecer hacia negro suave para la marca */}
      <AbsoluteFill style={{background: COLORS.softBlack, opacity: dusk}} />
      <AbsoluteFill
        style={{
          opacity: dusk,
          background: 'radial-gradient(700px 520px at 540px 900px, rgba(195,160,98,0.22), rgba(195,160,98,0) 70%)',
        }}
      />
      <Bokeh seed="s6dark" count={16} opacity={0.5 * dusk} drift={[0.05, -0.2]} color="217, 190, 134" sizeScale={0.6} />

      {/* marca */}
      <FilmWrap frame={frame} half="back" t={wrapT} run={run} o={brandO} />
      <div style={{opacity: brandO}}>
        <BrandWord frame={frame} />
      </div>
      <FilmWrap frame={frame} half="front" t={wrapT} run={run} o={brandO} />

      <Cutout
        asset={ASSETS.cinta}
        x={filmX}
        y={filmY}
        width={720}
        scale={filmScale}
        rotate={tw(filmP, 0, 1, -24, -8)}
        opacity={filmO}
        blur={(1 - filmP) * 6}
        trail={{dx: filmX - prevX, dy: filmY - prevY, samples: 5}}
        shadow
      />
      <Glint x={CX + RX * 0.92} y={CY + 40} size={160} opacity={prog(frame, 858, 866) * (1 - prog(frame, 868, 884))} rotate={frame * 2} />

      <KineticText
        text="Tu historia merece quedarse"
        start={842}
        exit={2000}
        y={1190}
        size={64}
        italic
        weight={400}
        color="#EFE3CB"
        stagger={0.6}
      />
      <KineticText
        text="tefilmo.ar"
        start={858}
        exit={2000}
        y={1296}
        size={34}
        font="sans"
        weight={400}
        tracking={0.42}
        color={COLORS.goldLight}
        stagger={0.8}
      />
    </AbsoluteFill>
  );
};
