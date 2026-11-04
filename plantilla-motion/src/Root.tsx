import React from 'react';
import {Composition} from 'remotion';
import {Escena} from './Escena';

// Misma escena en tres formatos. La escena trabaja en una base de 1080 px de
// ancho y se escala, así el 4K sale nítido sin reescribir medidas.
export const Root: React.FC = () => (
  <>
    <Composition id="Vertical" component={Escena} durationInFrames={300} fps={30} width={1080} height={1920} />
    <Composition id="Vertical4K" component={Escena} durationInFrames={300} fps={30} width={2160} height={3840} />
    <Composition id="Horizontal4K" component={Escena} durationInFrames={300} fps={30} width={3840} height={2160} />
  </>
);
