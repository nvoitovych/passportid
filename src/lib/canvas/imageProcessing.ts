import type { Document } from '$lib/types/document';

/**
 * Crop image to document requirements
 * @param image - Source image (natural size)
 * @param doc - Document requirements
 * @param centerX - Frame center X in natural image coordinates
 * @param centerY - Frame center Y in natural image coordinates
 * @param frameWidthInNatural - Frame width in natural image coordinates (pixels)
 * @param frameHeightInNatural - Frame height in natural image coordinates (pixels)
 */
export function cropImageToDocument(
	image: HTMLImageElement | ImageBitmap,
	doc: Document,
	centerX: number,
	centerY: number,
	frameWidthInNatural: number,
	frameHeightInNatural: number
): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d', { alpha: true });
	if (!ctx) throw new Error('Could not get canvas context');

	// Calculate output size based on DPI
	const dpi = doc.requirements.dpi;
	const widthInches = doc.requirements.width / 72; // Assuming 72 DPI base
	const heightInches = doc.requirements.height / 72;
	const outputWidth = Math.round(widthInches * dpi);
	const outputHeight = Math.round(heightInches * dpi);

	// Get natural image dimensions
	const naturalWidth = image.width;
	const naturalHeight = image.height;

	// Calculate the scale factor: how much the frame in natural coordinates needs to be scaled to match output
	// frameWidthInNatural (natural pixels) should map to outputWidth (output pixels)
	const scaleFactor = outputWidth / frameWidthInNatural;

	// Calculate source rectangle in natural coordinates
	// The frame is centered at (centerX, centerY) with size (frameWidthInNatural, frameHeightInNatural)
	const sourceX = centerX - frameWidthInNatural / 2;
	const sourceY = centerY - frameHeightInNatural / 2;
	const sourceWidth = frameWidthInNatural;
	const sourceHeight = frameHeightInNatural;

	// Clamp source coordinates to image bounds
	const clampedSourceX = Math.max(0, Math.min(sourceX, naturalWidth));
	const clampedSourceY = Math.max(0, Math.min(sourceY, naturalHeight));
	const clampedSourceWidth = Math.min(sourceWidth, naturalWidth - clampedSourceX);
	const clampedSourceHeight = Math.min(sourceHeight, naturalHeight - clampedSourceY);

	// Create output canvas with exact document dimensions
	canvas.width = outputWidth;
	canvas.height = outputHeight;

	// Fill background if required
	if (doc.requirements.background === 'white') {
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	// Calculate uniform scale factor to map frame to output size
	// Use the width ratio to maintain aspect ratio
	const scale = outputWidth / frameWidthInNatural;

	// Calculate destination rectangle
	// Map the source region directly to output, preserving the exact frame region
	// If source was clamped (went outside image bounds), adjust destination accordingly
	const sourceOffsetX = clampedSourceX - sourceX; // How much we shifted left (negative if clamped)
	const sourceOffsetY = clampedSourceY - sourceY; // How much we shifted up (negative if clamped)
	
	// Calculate destination: map the actual source region to output
	// Start from (0,0) and offset by the clamping amount
	const destX = Math.max(0, -sourceOffsetX * scale);
	const destY = Math.max(0, -sourceOffsetY * scale);
	
	// Destination size: map the clamped source size to output using uniform scale
	const destWidth = clampedSourceWidth * scale;
	const destHeight = clampedSourceHeight * scale;

	// Draw the cropped region - this preserves the exact frame region
	ctx.drawImage(
		image,
		clampedSourceX,
		clampedSourceY,
		clampedSourceWidth,
		clampedSourceHeight,
		destX,
		destY,
		destWidth,
		destHeight
	);

	return canvas;
}

export function applyFilters(
	canvas: HTMLCanvasElement,
	brightness: number = 1,
	contrast: number = 1,
	exposure: number = 0
): HTMLCanvasElement {
	const output = document.createElement('canvas');
	output.width = canvas.width;
	output.height = canvas.height;
	const ctx = output.getContext('2d');
	if (!ctx) throw new Error('Could not get canvas context');

	ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
	ctx.drawImage(canvas, 0, 0);

	// Apply exposure adjustment
	if (exposure !== 0) {
		const imageData = ctx.getImageData(0, 0, output.width, output.height);
		const data = imageData.data;
		const factor = Math.pow(2, exposure);

		for (let i = 0; i < data.length; i += 4) {
			data[i] = Math.min(255, data[i] * factor); // R
			data[i + 1] = Math.min(255, data[i + 1] * factor); // G
			data[i + 2] = Math.min(255, data[i + 2] * factor); // B
		}

		ctx.putImageData(imageData, 0, 0);
	}

	return output;
}

export function replaceBackground(
	canvas: HTMLCanvasElement,
	backgroundColor: string | null
): HTMLCanvasElement {
	const output = document.createElement('canvas');
	output.width = canvas.width;
	output.height = canvas.height;
	const ctx = output.getContext('2d', { alpha: true });
	if (!ctx) throw new Error('Could not get canvas context');

	// Fill background only if color is specified
	if (backgroundColor !== null) {
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, output.width, output.height);
	}

	// Draw original image on top
	ctx.drawImage(canvas, 0, 0);

	return output;
}

