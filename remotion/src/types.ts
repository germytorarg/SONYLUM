export type WordStyle = 'normal' | 'big' | 'script';
export type WordColor = 'white' | 'gold' | 'red' | 'blue';

export type Word = {
	text: string;
	startMs: number;
	endMs: number;
	style?: WordStyle;
	color?: WordColor;
	/** Starts a new caption page (the previous one disappears). */
	newPage?: boolean;
	/** Big words also punch the camera in. */
	punch?: boolean;
};

export type Sticker = {
	/** Folder name inside public/stickers (see manifest.json). */
	name: string;
	startMs: number;
	endMs: number;
	/** Center position as a fraction of the frame (0-1). */
	x: number;
	y: number;
	size?: number;
	rotate?: number;
};

export type ReelProps = {
	/** Path inside public/, e.g. "demo/encerrado.mp4". */
	video: string;
	words: Word[];
	stickers: Sticker[];
	/** White flash transitions, in ms. */
	flashesMs: number[];
	/** Vertical position of captions as a fraction of the height. */
	captionY: number;
	/** Horizontal focus when cropping a 16:9 video to 9:16 (0 left, 1 right). */
	focusX: number;
};
