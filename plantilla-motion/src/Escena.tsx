import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const Escena: React.FC = () => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const s = width / 1080; // escala respecto de la base de 1080 px
  const o = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#0b0b0c', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{color: '#fff', fontSize: 120 * s, fontFamily: 'sans-serif', opacity: o}}>Título</div>
    </AbsoluteFill>
  );
};
