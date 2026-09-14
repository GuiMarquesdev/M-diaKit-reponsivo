import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateFavicons() {
  const svgPath = path.resolve('public', 'favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate 16x16 PNG
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  fs.writeFileSync(path.resolve('public', 'favicon-16x16.png'), png16);

  // Generate 32x32 PNG
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.resolve('public', 'favicon-32x32.png'), png32);

  // Generate 48x48 PNG
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  fs.writeFileSync(path.resolve('public', 'favicon-48x48.png'), png48);

  // Generate 180x180 Apple Touch Icon
  const appleTouch = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.resolve('public', 'apple-touch-icon.png'), appleTouch);

  // Generate 192x192 Android Chrome
  const icon192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.resolve('public', 'android-chrome-192x192.png'), icon192);

  // Generate 512x512 Android Chrome
  const icon512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.resolve('public', 'android-chrome-512x512.png'), icon512);

  // Generate multi-size ICO containing 16x16, 32x32, 48x48
  // Standard ICO format with PNG payloads:
  const images = [
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 }
  ];

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(images.length, 4); // Number of images

  let offset = 6 + images.length * 16;
  const entries = [];
  const buffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width, 0); // Width
    entry.writeUInt8(img.height, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Size
    entry.writeUInt32LE(offset, 12); // Offset

    entries.push(entry);
    buffers.push(img.buffer);
    offset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...buffers]);
  fs.writeFileSync(path.resolve('public', 'favicon.ico'), icoBuffer);

  console.log('Successfully generated all favicons (ico, pngs, apple-touch)!');
}

generateFavicons().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
