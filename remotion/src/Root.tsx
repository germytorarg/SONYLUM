import {Composition} from 'remotion';
import {Reel} from './Reel';
import {demo} from './demo';
import type {ReelProps} from './types';

const FPS = 30;

export const RemotionRoot: React.FC = () => (
	<Composition
		id="Reel"
		component={Reel}
		width={1080}
		height={1920}
		fps={FPS}
		durationInFrames={300}
		defaultProps={demo}
		calculateMetadata={({props}: {props: ReelProps}) => {
			const lastMs = Math.max(...props.words.map((w) => w.endMs), 1000);
			return {durationInFrames: Math.ceil(((lastMs + 300) / 1000) * FPS)};
		}}
	/>
);
