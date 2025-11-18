import { writable } from 'svelte/store';

export interface PhotoState {
	originalImage?: HTMLImageElement | ImageBitmap;
	alignedImage?: HTMLImageElement | ImageBitmap | HTMLCanvasElement;
	editedImage?: HTMLImageElement | ImageBitmap | HTMLCanvasElement;
	canvas?: HTMLCanvasElement;
	canvasWithoutBg?: HTMLCanvasElement;
}

export const photoState = writable<PhotoState>({});

