import React from 'react';
import {Composition, Sequence} from 'remotion';
import {Tefilmo} from './Tefilmo';
import {DURATION, FPS, HEIGHT, SCENES, WIDTH} from './timing';

// Vista previa por escena: la misma secuencia maestra recortada a la ventana
// de cada escena (las escenas trabajan con frames absolutos).
const sceneComp = (key: keyof typeof SCENES) => {
  const {from, to} = SCENES[key];
  const Comp: React.FC = () => (
    <Sequence from={-from}>
      <Tefilmo />
    </Sequence>
  );
  Comp.displayName = `Preview_${key}`;
  return {Comp, duration: to - from + 1};
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Tefilmo" component={Tefilmo} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    {(Object.keys(SCENES) as (keyof typeof SCENES)[]).map((k) => {
      const {Comp, duration} = sceneComp(k);
      return (
        <Composition
          key={k}
          id={`Escena${k.slice(1)}`}
          component={Comp}
          durationInFrames={duration}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      );
    })}
  </>
);
