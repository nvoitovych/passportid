#!/usr/bin/env node

/**
 * Generate PWA icons from SVG
 * Requires: sharp (npm install --save-dev sharp)
 * 
 * Usage: node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if sharp is available
let sharp;
try {
	sharp = (await import('sharp')).default;
} catch (error) {
	console.error('❌ Error: sharp is not installed.');
	console.error('Please install it: npm install --save-dev sharp');
	process.exit(1);
}

const staticDir = path.join(__dirname, '../static');
const svgPath = path.join(staticDir, 'icon-app.svg');
const faviconSvgPath = path.join(staticDir, 'favicon.svg');

// Check if SVG exists
if (!fs.existsSync(svgPath)) {
	console.error(`❌ Error: ${svgPath} not found`);
	process.exit(1);
}

console.log('📸 Generating PWA icons from SVG...');

// Read SVG
const svgBuffer = fs.readFileSync(svgPath);

// Generate 192x192 icon
const icon192 = await sharp(svgBuffer)
	.resize(192, 192, {
		fit: 'contain',
		background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
	})
	.png()
	.toBuffer();

fs.writeFileSync(path.join(staticDir, 'icon-192.png'), icon192);
console.log('✅ Generated icon-192.png (192x192)');

// Generate 512x512 icon
const icon512 = await sharp(svgBuffer)
	.resize(512, 512, {
		fit: 'contain',
		background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
	})
	.png()
	.toBuffer();

fs.writeFileSync(path.join(staticDir, 'icon-512.png'), icon512);
console.log('✅ Generated icon-512.png (512x512)');

// Also generate favicon (32x32) from favicon.svg if it exists
if (fs.existsSync(faviconSvgPath)) {
	const faviconSvgBuffer = fs.readFileSync(faviconSvgPath);
	const favicon = await sharp(faviconSvgBuffer)
		.resize(32, 32, {
			fit: 'contain',
			background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
		})
		.png()
		.toBuffer();

	fs.writeFileSync(path.join(staticDir, 'favicon.png'), favicon);
	console.log('✅ Generated favicon.png (32x32) from favicon.svg');
} else {
	// Fallback: generate from main icon
	const favicon = await sharp(svgBuffer)
		.resize(32, 32, {
			fit: 'contain',
			background: { r: 255, g: 255, b: 255, alpha: 0 }
		})
		.png()
		.toBuffer();

	fs.writeFileSync(path.join(staticDir, 'favicon.png'), favicon);
	console.log('✅ Generated favicon.png (32x32)');
}

console.log('\n🎉 All icons generated successfully!');
console.log('📁 Icons saved to:', staticDir);

