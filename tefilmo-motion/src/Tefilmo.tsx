import React from 'react';
import {AbsoluteFill, Audio, interpolate} from 'remotion';
import {MUSIC, VOICEOVER} from './assets';
import {Grain, Vignette} from './components/Atmosphere';
import {COLORS, CONFIG} from './config';
import {loadFonts} from './fonts';
import {Scene01} from './scenes/Scene01';
import {Scene02} from './scenes/Scene02';
import {Scene03} from './scenes/Scene03';
import {Scene04} from './scenes/Scene04';
import {Scene05} from './scenes/Scene05';
import {Scene06} from './scenes/Scene06';
import {Transitions} from './scenes/Transitions';
import {DURATION} from './timing';

loadFonts();

/** Secuencia maestra: 900 frames. Las escenas usan frames absolutos. */
export const Tefilmo: React.FC = () => {
  const musicVolume = (f: number) => {
    const base = CONFIG.voiceover ? CONFIG.musicVolumeUnderVoice : CONFIG.musicVolume;
    return base * interpolate(f, [0, 6, DURATION - 20, DURATION], [0, 1, 1, 0.9], {extrapolateRight: 'clamp'});
  };
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ivory, overflow: 'hidden'}}>
      <Scene01 />
      <Scene02 />
      <Scene03 />
      <Scene04 />
      <Scene05 />
      <Scene06 />
      <Transitions />
      <Vignette />
      {CONFIG.grain ? <Grain /> : null}
      {CONFIG.music ? <Audio src={MUSIC} volume={musicVolume} /> : null}
      {CONFIG.voiceover ? <Audio src={VOICEOVER} volume={CONFIG.voiceoverVolume} /> : null}
    </AbsoluteFill>
  );
};
