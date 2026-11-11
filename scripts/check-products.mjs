// `npm run check` — looks for mistakes in src/data/products.ts and for missing photo files or photo sizes.
// Runs automatically before every build, so a broken catalogue never gets published.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { load } from './bundle.mjs';

let catalogue;
try {
  catalogue = await load(`
    export { products, categories, catalogSettings } from './src/data/products';
    export { validateCatalog } from './src/lib/validateCatalog';
    export { imageVariant, IMAGE_SIZES } from './src/lib/catalog';
  `);
} catch (error) {
  console.error('\n✖ src/data/products.ts could not be read. This is usually a missing comma, quote or bracket.\n');
  console.error(String(error.message ?? error).split('\n').slice(0, 6).join('\n'));
  process.exit(1);
}

const { products, categories, catalogSettings, validateCatalog, imageVariant, IMAGE_SIZES } = catalogue;
const problems = validateCatalog(products, categories);

// Photo files: every local path must exist in /public (full http(s) URLs are not checked).
const missing = (path) => typeof path === 'string' && path.startsWith('/') && !existsSync(join('public', path));
const checkPhoto = (owner, path) => {
  if (missing(path)) problems.push(`${owner}: photo not found at public${path}`);
  else if (typeof path === 'string') {
    // A photo named "…-lg" needs its smaller copies (-md, -sm, -xs) for phones.
    const absent = Object.keys(IMAGE_SIZES).map((size) => imageVariant(path, size)).filter((copy) => copy !== path && missing(copy));
    if (absent.length > 0) problems.push(`${owner}: "${path}" is missing its smaller copies (${absent.map((copy) => copy.split('/').pop()).join(', ')}). Run "npm run images" to make them.`);
  }
};
for (const product of products) for (const path of [product.image, ...(product.gallery ?? [])]) checkPhoto(product.name || product.id, path);
for (const category of categories) checkPhoto(`Category ${category.name || category.id}`, category.image);

if (problems.length > 0) {
  console.error(`\n✖ ${problems.length} problem${problems.length === 1 ? '' : 's'} in src/data/products.ts:\n`);
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error('');
  process.exit(1);
}

const orderable = products.filter((p) => p.available && p.stock > 0).length;
console.log(`✔ Catalogue OK: ${products.length} products in ${categories.length} categories, ${orderable} can be ordered.`);
if (catalogSettings.demoPrices) console.log('  Note: demoPrices is on, so prices are labelled "Demo price". Set it to false in src/data/products.ts once prices are real.');
