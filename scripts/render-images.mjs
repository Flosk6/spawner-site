/**
 * Renders the images of public/:
 *
 * - og.png, the social card (1200x630), from scripts/images/og.html;
 * - icon-512.png, the mark on its dark square, from scripts/images/icon.html,
 *   then icon-192.png and apple-touch-icon.png (180) from it;
 * - favicon.ico, the mark of public/favicon.svg at 16, 32 and 48 pixels,
 *   for the clients that ask for /favicon.ico whatever the page says.
 *
 * The HTML pages are screenshots of a local Chrome or Chromium (CHROME to
 * point to one that is not the macOS default); sharp resizes and renders
 * the SVG. `node scripts/render-images.mjs icons` renders the icons only,
 * `og` the social card only.
 */
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const only = process.argv[2];
const publicDir = path.resolve('public');

/** Screenshots an HTML page of scripts/images/ at its size, into public/. */
async function screenshot(page, out, width, height) {
  await run(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    '--virtual-time-budget=3000',
    `--screenshot=${path.join(publicDir, out)}`,
    pathToFileURL(path.resolve('scripts/images', page)).href,
  ]);
  console.log(`public/${out}`);
}

/**
 * An ICO file holding PNG images, which every browser reads: a header, one
 * directory entry per image (its size, 0 meaning 256, and where its bytes
 * are), then the PNG files themselves.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

if (!only || only === 'og') {
  await screenshot('og.html', 'og.png', 1200, 630);
}

if (!only || only === 'icons') {
  await screenshot('icon.html', 'icon-512.png', 512, 512);
  const icon = await readFile(path.join(publicDir, 'icon-512.png'));
  for (const [out, size] of [
    ['icon-192.png', 192],
    ['apple-touch-icon.png', 180],
  ]) {
    await sharp(icon).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(path.join(publicDir, out));
    console.log(`public/${out}`);
  }

  const mark = await readFile(path.join(publicDir, 'favicon.svg'));
  const images = [];
  for (const size of [16, 32, 48]) {
    const png = await sharp(mark, { density: 1152 }).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    images.push({ size, png });
  }
  await writeFile(path.join(publicDir, 'favicon.ico'), ico(images));
  console.log('public/favicon.ico (16, 32, 48)');
}
