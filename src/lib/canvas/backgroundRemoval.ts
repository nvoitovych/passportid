import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs';

let segmenter: bodySegmentation.BodySegmenter | null = null;
let modelLoading = false;
let modelLoadPromise: Promise<bodySegmentation.BodySegmenter> | null = null;

/**
 * Load MediaPipeSelfieSegmentation model (lazy loading, cached)
 * This model is specifically designed for selfies/headshots - perfect for passport photos!
 */
async function loadModel(): Promise<bodySegmentation.BodySegmenter> {
	if (segmenter) {
		return segmenter;
	}

	if (modelLoadPromise) {
		return modelLoadPromise;
	}

	modelLoading = true;
	modelLoadPromise = bodySegmentation.createSegmenter(
		bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
		{
			runtime: 'tfjs'
		}
	);

	try {
		segmenter = await modelLoadPromise;
		modelLoading = false;
		return segmenter;
	} catch (error) {
		modelLoading = false;
		modelLoadPromise = null;
		throw error;
	}
}

/**
 * Remove background using MediaPipeSelfieSegmentation ML model
 * 
 * What it does (like remove.bg):
 * 1. Uses AI specifically trained for selfies/headshots to detect the person
 * 2. Creates a smooth mask separating person from background
 * 3. Keeps the person with full opacity
 * 4. Makes background transparent
 * 
 * Result: Person remains visible, background becomes transparent (like remove.bg)
 * 
 * Based on: https://github.com/AleksPetrakov/react-selfie-ai-background-remover
 */
export async function removeBackground(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
	try {
		const model = await loadModel();

		// Try using canvas directly, fallback to image if needed
		let inputSource: HTMLImageElement | HTMLCanvasElement = canvas;
		let inputWidth = canvas.width;
		let inputHeight = canvas.height;

		// segmentPeople accepts HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
		// Try canvas first for better performance
		let segmentation;
		try {
			segmentation = await model.segmentPeople(canvas, {
				multiSegmentation: false,
				segmentBodyParts: false
			});
		} catch (error) {
			// Fallback: convert canvas to image
			const img = new Image();
			img.src = canvas.toDataURL();
			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
			});
			inputSource = img;
			inputWidth = img.width;
			inputHeight = img.height;
			segmentation = await model.segmentPeople(img, {
				multiSegmentation: false,
				segmentBodyParts: false
			});
		}

		// Create binary mask with smooth edges
		// foreground = white (person), background = transparent
		const foreground = { r: 255, g: 255, b: 255, a: 255 };
		const background = { r: 0, g: 0, b: 0, a: 0 };

		const maskImageData = await bodySegmentation.toBinaryMask(
			segmentation,
			foreground,
			background,
			true // hasSmoothEdges - creates smooth transitions
		);

		// Create a canvas for the mask
		const maskCanvas = document.createElement('canvas');
		maskCanvas.width = inputWidth;
		maskCanvas.height = inputHeight;
		const maskCtx = maskCanvas.getContext('2d');
		if (!maskCtx) throw new Error('Could not get mask canvas context');
		maskCtx.putImageData(maskImageData, 0, 0);

		// Create output canvas
		const output = document.createElement('canvas');
		output.width = inputWidth;
		output.height = inputHeight;
		const ctx = output.getContext('2d', { alpha: true });
		if (!ctx) throw new Error('Could not get canvas context');

		// Draw the original image/canvas
		ctx.drawImage(inputSource, 0, 0);

		// Apply mask using composite operation
		// destination-in: keeps only pixels where mask is opaque
		ctx.globalCompositeOperation = 'destination-in';
		ctx.drawImage(maskCanvas, 0, 0);

		// Reset composite operation
		ctx.globalCompositeOperation = 'source-over';

		return output;
	} catch (error) {
		console.error('Background removal failed:', error);
		// Fallback to simple method if ML model fails
		return removeBackgroundSimple(canvas);
	}
}

/**
 * Simple fallback method using edge detection
 */
function removeBackgroundSimple(canvas: HTMLCanvasElement): HTMLCanvasElement {
	const output = document.createElement('canvas');
	output.width = canvas.width;
	output.height = canvas.height;
	const ctx = output.getContext('2d', { alpha: true });
	if (!ctx) throw new Error('Could not get canvas context');

	const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
	if (!imageData) throw new Error('Could not get image data');

	const data = imageData.data;
	const width = imageData.width;
	const height = imageData.height;

	// Create mask for background
	const mask = new Uint8Array(width * height);

	// Simple edge detection using Sobel operator
	const edges = detectEdges(data, width, height);

	// Flood fill from edges to identify background
	const corners = [
		[0, 0],
		[width - 1, 0],
		[0, height - 1],
		[width - 1, height - 1]
	];

	for (const [x, y] of corners) {
		if (mask[y * width + x] === 0 && edges[y * width + x] < 50) {
			floodFill(mask, width, height, x, y, edges, 50);
		}
	}

	// Create output with transparency
	const outputData = ctx.createImageData(width, height);
	for (let i = 0; i < data.length; i += 4) {
		const pixelIndex = i / 4;

		if (mask[pixelIndex] === 1) {
			// Background - make transparent
			outputData.data[i] = 0;
			outputData.data[i + 1] = 0;
			outputData.data[i + 2] = 0;
			outputData.data[i + 3] = 0;
		} else {
			// Foreground - keep original
			outputData.data[i] = data[i];
			outputData.data[i + 1] = data[i + 1];
			outputData.data[i + 2] = data[i + 2];
			outputData.data[i + 3] = data[i + 3];
		}
	}

	ctx.putImageData(outputData, 0, 0);
	return output;
}

function detectEdges(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
	const edges = new Uint8Array(width * height);
	const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
	const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			let gx = 0;
			let gy = 0;

			for (let ky = -1; ky <= 1; ky++) {
				for (let kx = -1; kx <= 1; kx++) {
					const idx = ((y + ky) * width + (x + kx)) * 4;
					const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
					const kernelIdx = (ky + 1) * 3 + (kx + 1);

					gx += gray * sobelX[kernelIdx];
					gy += gray * sobelY[kernelIdx];
				}
			}

			const magnitude = Math.sqrt(gx * gx + gy * gy);
			edges[y * width + x] = Math.min(255, magnitude);
		}
	}

	return edges;
}

function floodFill(
	mask: Uint8Array,
	width: number,
	height: number,
	startX: number,
	startY: number,
	edges: Uint8Array,
	threshold: number
): void {
	const stack: Array<[number, number]> = [[startX, startY]];

	while (stack.length > 0) {
		const [x, y] = stack.pop()!;
		const idx = y * width + x;

		if (x < 0 || x >= width || y < 0 || y >= height) continue;
		if (mask[idx] === 1) continue;
		if (edges[idx] > threshold) continue;

		mask[idx] = 1;

		stack.push([x + 1, y]);
		stack.push([x - 1, y]);
		stack.push([x, y + 1]);
		stack.push([x, y - 1]);
	}
}
