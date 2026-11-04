import React from 'react';
import {Composition} from 'remotion';
import {LocalBA} from './LocalBA';
import {DURATION, FPS} from './timing';

export const RemotionRoot: React.FC = () => (
  <Composition id="LocalBA" component={LocalBA} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
