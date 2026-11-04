import React from 'react';
import {Composition} from 'remotion';
import {Mirinda} from './Mirinda';
import {DURATION, FPS} from './timing';

export const RemotionRoot: React.FC = () => (
  <Composition id="Mirinda" component={Mirinda} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
