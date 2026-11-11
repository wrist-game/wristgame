// `npm run images` — makes the smaller copies of every photo, so phones download small files.
//
// Put your photo in public/images/… as "<name>-lg.webp" (1024 px wide; .jpg and .png also work).
// This script then writes, next to it:
//   <name>-md  768 px   large phone screens
//   <name>-sm  512 px   product cards
//   <name>-xm  384 px   product cards on phones (two per row on a 2x screen)
//   <name>-xs  256 px   thumbnails (cart, checkout, gallery strip, search)
// Existing copies are kept unless the -lg file is newer. Use `npm run images -- --force` to redo all.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public/images';
const SIZES = [
  { suffix: 'md', width: 768, quality: 80 },
  { suffix: 'sm', width: 512, quality: 80 },
  { suffix: 'xm', width: 384, quality: 80 },
  { suffix: 'xs', width: 256, quality: 78 },
];
const LARGE = /-lg\.(webp|jpe?g|png)$/i;
const force = process.argv.includes('--force');

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (LARGE.test(entry)) yield path;
  }
}

let made = 0;
let kept = 0;
for (const source of existsSync(ROOT) ? walk(ROOT) : []) {
  const extension = source.match(LARGE)[1].toLowerCase();
  const { width: sourceWidth = 0 } = await sharp(source).metadata();
  if (sourceWidth < 1000) console.warn(`  ⚠ ${source} is only ${sourceWidth} px wide. 1024 px or more looks sharper.`);
  for (const { suffix, width, quality } of SIZES) {
    const target = source.replace(LARGE, `-${suffix}.${extension}`);
    if (!force && existsSync(target) && statSync(target).mtimeMs >= statSync(source).mtimeMs) {
      kept += 1;
      continue;
    }
    const image = sharp(source).resize({ width, withoutEnlargement: true });
    if (extension === 'webp') await image.webp({ quality, effort: 6 }).toFile(target);
    else if (extension === 'png') await image.png({ compressionLevel: 9, palette: false }).toFile(target);
    else await image.jpeg({ quality, mozjpeg: true }).toFile(target);
    made += 1;
    console.log(`  + ${target}  (${Math.round(statSync(target).size / 1024)} kB)`);
  }
}
console.log(`✔ Photo sizes: ${made} written, ${kept} already up to date.`);
