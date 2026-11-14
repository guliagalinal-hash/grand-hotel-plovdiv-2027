// Converts the originals in assets-src/images/** into optimized WebP files in public/images/** (same folder structure).
// Large illustrations (hero, Plovdiv) also get an 800px-wide variant for phones: name-800.webp
// Usage: npm run images   (needs the "sharp" dev dependency)
import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'assets-src/images';
const OUT = 'public/images';
// Delivered but intentionally NOT used on the site (see README): wedding originals, AI spa illustrations, hair salon.
const SKIP = new Set(['banquet-original-wedding-01', 'banquet-original-wedding-02', 'banquet-original-wedding-03',
  'spa-pool-ai-illustration', 'spa-sauna-ai-illustration', 'hotel-beauty-salon', 'hotel-reception-card']);
rmSync(OUT, { recursive: true, force: true });
let before = 0, after = 0;
for (const dir of readdirSync(SRC)) {
  mkdirSync(join(OUT, dir), { recursive: true });
  for (const file of readdirSync(join(SRC, dir))) {
    if (!/\.(jpe?g|png)$/i.test(file)) continue;
    const src = join(SRC, dir, file);
    const base = file.replace(/\.\w+$/, '');
    if (SKIP.has(base)) continue;
    const meta = await sharp(src).metadata();
    const out = join(OUT, dir, base + '.webp');
    await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 76 }).toFile(out);
    if ((meta.width ?? 0) > 1400) {
      await sharp(src).rotate().resize({ width: 800 }).webp({ quality: 74 }).toFile(join(OUT, dir, base + '-800.webp'));
    }
    before += statSync(src).size; after += statSync(out).size;
  }
}
console.log(`images: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB (main files)`);
