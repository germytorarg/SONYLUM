import '@fontsource/anton/400.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/montserrat/900.css';
import {
	AbsoluteFill,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Video} from '@remotion/media';
import manifest from '../public/stickers/manifest.json';
import type {ReelProps, Sticker, Word, WordColor} from './types';

const GRADIENTS: Record<WordColor, string> = {
	white: 'linear-gradient(180deg, #ffffff 0%, #e1e6f0 100%)',
	gold: 'linear-gradient(180deg, #fff478 0%, #ffd600 45%, #ff8c00 100%)',
	red: 'linear-gradient(180deg, #ff7878 0%, #eb1e2d 50%, #a00014 100%)',
	blue: 'linear-gradient(180deg, #96f5ff 0%, #00beff 50%, #005ae6 100%)',
};
const GLOWS: Record<WordColor, string> = {
	white: 'rgba(200,215,255,0.8)',
	gold: 'rgba(255,150,0,0.9)',
	red: 'rgba(255,0,30,0.9)',
	blue: 'rgba(0,160,255,0.9)',
};

const pages = (words: Word[]): Word[][] => {
	const out: Word[][] = [];
	for (const w of words) {
		if (w.newPage || out.length === 0) out.push([]);
		out[out.length - 1].push(w);
	}
	return out;
};

const CaptionWord: React.FC<{word: Word; ms: number}> = ({word, ms}) => {
	const {fps} = useVideoConfig();
	const dt = ms - word.startMs;
	const style = word.style ?? 'normal';
	const color = word.color ?? 'white';
	const shown = dt >= 0;
	const k = shown ? spring({frame: (dt / 1000) * fps, fps, config: {damping: 11, stiffness: 180}}) : 0;

	const font =
		style === 'big'
			? {fontFamily: 'Anton', fontSize: 210, lineHeight: 1, letterSpacing: 1}
			: style === 'script'
				? {fontFamily: 'Great Vibes', fontSize: 180, lineHeight: 1.1}
				: {fontFamily: 'Montserrat', fontWeight: 900, fontSize: 78, lineHeight: 1.15};
	const scale = style === 'big' ? interpolate(k, [0, 1], [2.2, 1]) : interpolate(k, [0, 1], [0.6, 1]);
	// Script words "write themselves" left to right.
	const wipe = style === 'script' ? interpolate(dt, [0, 450], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 100;

	return (
		<span
			style={{
				...font,
				display: 'inline-block',
				margin: '0 14px',
				opacity: shown ? Math.min(1, dt / 80) : 0,
				transform: `scale(${scale})`,
				backgroundImage: GRADIENTS[color],
				WebkitBackgroundClip: 'text',
				backgroundClip: 'text',
				color: 'transparent',
				filter: `drop-shadow(0 6px 8px rgba(0,0,0,0.75)) drop-shadow(0 0 ${style === 'normal' ? 6 : 22}px ${GLOWS[color]})`,
				clipPath: `inset(-40% ${100 - wipe}% -40% -10%)`,
				padding: style === 'script' ? '0 24px' : 0,
			}}
		>
			{word.text}
		</span>
	);
};

const StickerView: React.FC<{s: Sticker; ms: number}> = ({s, ms}) => {
	const {fps, width, height} = useVideoConfig();
	const dt = ms - s.startMs;
	if (dt < 0 || ms > s.endMs) return null;
	const frames = (manifest as Record<string, number>)[s.name] ?? 1;
	const idx = Math.floor((dt / 1000) * 30) % frames;
	const pop = spring({frame: (dt / 1000) * fps, fps, config: {damping: 7, stiffness: 160}});
	const size = s.size ?? 220;
	const rot = (s.rotate ?? 0) + 7 * Math.sin((dt / 1000) * 5.5);
	const bob = 9 * Math.sin((dt / 1000) * 4);
	return (
		<Img
			src={staticFile(`stickers/${s.name}/${String(idx).padStart(3, '0')}.png`)}
			style={{
				position: 'absolute',
				width: size,
				height: size,
				left: s.x * width - size / 2,
				top: s.y * height - size / 2 + bob,
				transform: `scale(${pop}) rotate(${rot}deg)`,
				filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.5))',
			}}
		/>
	);
};

export const Reel: React.FC<ReelProps> = ({video, words, stickers, flashesMs, captionY, focusX}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const ms = (frame / fps) * 1000;

	// Camera: slow push in plus punch-ins and shake on "punch" words.
	let zoom = 1 + 0.06 * (frame / durationInFrames);
	let shake = 0;
	for (const w of words) {
		const d = (ms - w.startMs) / 1000;
		if (w.punch && d >= 0 && d < 0.5) zoom += 0.07 * Math.exp(-d * 9);
		if (w.punch && d >= 0 && d < 0.3) shake = Math.max(shake, 20 * (1 - d / 0.3));
	}
	const sx = shake * Math.sin(frame * 12.9898);
	const sy = shake * Math.cos(frame * 78.233);

	const flash = Math.max(
		0,
		...flashesMs.map((f) => interpolate(ms - f, [-60, 0, 300], [0, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})),
	);

	const allPages = pages(words);
	const pageIdx = allPages.findIndex((p, i) => {
		const start = p[0].startMs;
		const end = i + 1 < allPages.length ? allPages[i + 1][0].startMs : p[p.length - 1].endMs + 400;
		return ms >= start && ms < end;
	});

	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${zoom})`}}>
				<Video
					src={staticFile(video)}
					style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${focusX * 100}% 50%`, filter: 'contrast(1.1) saturate(1.05)'}}
				/>
			</AbsoluteFill>
			{/* vignette */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
			{pageIdx >= 0 && (
				<AbsoluteFill style={{top: `${captionY * 100}%`, height: 'auto', alignItems: 'center', padding: '0 50px'}}>
					<div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
						{allPages[pageIdx].map((w) => (
							<CaptionWord key={`${w.startMs}-${w.text}`} word={w} ms={ms} />
						))}
					</div>
				</AbsoluteFill>
			)}
			{stickers.map((s) => (
				<StickerView key={`${s.name}-${s.startMs}`} s={s} ms={ms} />
			))}
			<AbsoluteFill style={{backgroundColor: 'white', opacity: flash}} />
		</AbsoluteFill>
	);
};
