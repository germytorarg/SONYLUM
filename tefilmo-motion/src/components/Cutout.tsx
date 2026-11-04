import React from 'react';
import {Img} from 'remotion';

type Asset = {src: string; w: number; h: number};

export type CutoutProps = {
  asset: Asset;
  /** Centro horizontal en px del lienzo. */
  x: number;
  /** Centro vertical (anchor center) o base (anchor bottom) en px. */
  y: number;
  /** Ancho de display en px (el alto respeta la proporción). */
  width: number;
  anchor?: 'center' | 'bottom';
  scale?: number;
  scaleX?: number;
  rotate?: number;
  opacity?: number;
  blur?: number;
  brightness?: number;
  saturate?: number;
  /** Sombra cálida de contacto/ambiente. */
  shadow?: boolean;
  glow?: string;
  flipX?: boolean;
  /** Estela de desenfoque direccional (px recorridos en el frame). */
  trail?: {dx: number; dy: number; samples?: number};
  maskImage?: string;
  clipPath?: string;
  blend?: React.CSSProperties['mixBlendMode'];
  transformOrigin?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const Cutout: React.FC<CutoutProps> = ({
  asset,
  x,
  y,
  width,
  anchor = 'center',
  scale = 1,
  scaleX = 1,
  rotate = 0,
  opacity = 1,
  blur = 0,
  brightness = 1,
  saturate = 1,
  shadow = false,
  glow,
  flipX = false,
  trail,
  maskImage,
  clipPath,
  blend,
  transformOrigin,
  style,
  children,
}) => {
  if (opacity <= 0.001) return null;
  const height = (width * asset.h) / asset.w;
  const left = x - width / 2;
  const top = anchor === 'center' ? y - height / 2 : y - height;
  const filters = [
    blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '',
    brightness !== 1 ? `brightness(${brightness.toFixed(3)})` : '',
    saturate !== 1 ? `saturate(${saturate.toFixed(3)})` : '',
    shadow ? 'drop-shadow(0px 24px 28px rgba(92, 64, 28, 0.22))' : '',
    glow ? `drop-shadow(0 0 22px ${glow})` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const base: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    transform: `scale(${scale * (flipX ? -scaleX : scaleX)}, ${scale}) rotate(${rotate}deg)`,
    transformOrigin: transformOrigin ?? (anchor === 'bottom' ? '50% 100%' : '50% 50%'),
    mixBlendMode: blend,
    WebkitMaskImage: maskImage,
    maskImage,
    clipPath,
    ...style,
  };

  const img = (extraFilter = '', key?: string, o = 1, dx = 0, dy = 0) => (
    <div
      key={key}
      style={{
        ...base,
        opacity: opacity * o,
        filter: [filters, extraFilter].filter(Boolean).join(' ') || undefined,
        translate: dx || dy ? `${dx}px ${dy}px` : undefined,
      }}
    >
      <Img src={asset.src} style={{width: '100%', height: '100%', display: 'block'}} />
      {children}
    </div>
  );

  if (trail && (Math.abs(trail.dx) > 1 || Math.abs(trail.dy) > 1)) {
    const n = trail.samples ?? 6;
    const copies = [];
    for (let i = n; i >= 1; i--) {
      const t = i / n;
      copies.push(img('', `t${i}`, 0.38 * (1 - t * 0.85), -trail.dx * t, -trail.dy * t));
    }
    return (
      <>
        {copies}
        {img()}
      </>
    );
  }
  return img();
};
