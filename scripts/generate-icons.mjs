import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Ensure public directory exists
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Read the SVG source
const svgPath = join(publicDir, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

// Icon sizes to generate
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-maskable-192x192.png', size: 192, maskable: true },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
];

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const { name, size, maskable } of sizes) {
    const outputPath = join(publicDir, name);

    if (maskable) {
      // For maskable icons, add padding (10% safe zone)
      const padding = Math.floor(size * 0.1);
      const innerSize = size - (padding * 2);

      await sharp(svgBuffer)
        .resize(innerSize, innerSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 79, g: 70, b: 229, alpha: 1 } // Match gradient start color
        })
        .png()
        .toFile(outputPath);
    } else {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
    }

    console.log(`  Generated: ${name} (${size}x${size})`);
  }

  // Generate favicon.ico (multi-size ICO file using 32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  console.log('  Generated: favicon.ico');

  console.log('Done!');
}

generateIcons().catch(console.error);
