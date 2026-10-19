import type {ReelProps} from './types';

// Example: the "encerrado en una caja" reel.
export const demo: ReelProps = {
	video: 'demo/encerrado.mp4',
	captionY: 0.6,
	focusX: 0.5,
	flashesMs: [2740],
	words: [
		{text: 'Sí,', startMs: 220, endMs: 400, newPage: true},
		{text: 'estoy', startMs: 520, endMs: 680},
		{text: 'encerrado', startMs: 680, endMs: 1100},
		{text: 'en una', startMs: 1100, endMs: 1420, style: 'script', color: 'gold'},
		{text: 'CAJA', startMs: 1420, endMs: 1840, style: 'big', color: 'gold', punch: true},
		{text: '¿Qué es lo que', startMs: 1940, endMs: 2440, newPage: true},
		{text: 'esperas?', startMs: 2440, endMs: 3000, style: 'script', color: 'red'},
		{text: 'La', startMs: 3220, endMs: 3400, newPage: true},
		{text: 'SOLEDAD', startMs: 3400, endMs: 3680, style: 'big'},
		{text: 'me acompaña', startMs: 3680, endMs: 5000, style: 'script'},
		{text: 'la', startMs: 5120, endMs: 5360, newPage: true},
		{text: 'tortuosa', startMs: 5360, endMs: 6100, style: 'script', color: 'blue'},
		{text: 'saña', startMs: 6100, endMs: 6960},
		{text: 'idea de un', startMs: 7360, endMs: 7960, newPage: true},
		{text: 'CARTÓN', startMs: 7960, endMs: 8400, style: 'big', color: 'gold', punch: true},
		{text: 'corrugado', startMs: 8400, endMs: 9080, style: 'script'},
		{text: 'me', startMs: 9080, endMs: 9180, newPage: true, style: 'script'},
		{text: 'ATORMENTA', startMs: 9180, endMs: 10000, style: 'big', color: 'red', punch: true},
	],
	stickers: [
		{name: 'box', startMs: 1450, endMs: 1920, x: 0.85, y: 0.55, rotate: -10},
		{name: 'interrobang', startMs: 2500, endMs: 3100, x: 0.85, y: 0.55, rotate: 12},
		{name: 'rose', startMs: 3960, endMs: 5080, x: 0.85, y: 0.55, rotate: 10},
		{name: 'broken-heart', startMs: 5500, endMs: 7150, x: 0.15, y: 0.75, rotate: -10},
		{name: 'exclamation', startMs: 8000, endMs: 9060, x: 0.88, y: 0.58, rotate: 14},
		{name: 'scream', startMs: 9200, endMs: 10000, x: 0.5, y: 0.82, size: 280},
		{name: 'double-exclamation', startMs: 9350, endMs: 10000, x: 0.86, y: 0.55, rotate: 14},
		{name: 'double-exclamation', startMs: 9450, endMs: 10000, x: 0.14, y: 0.55, rotate: -14},
	],
};
