// `npm run export:catalogue` — writes server/catalogue.json from src/data/products.ts.
// The payment backend prices every order from this file, never from what the browser sends.
// Run it again (and redeploy the backend) whenever products, prices or stock change.
import { writeFileSync } from 'node:fs';
import { load } from './bundle.mjs';

const { products, catalogSettings, site } = await load(`
  export { products, catalogSettings } from './src/data/products';
  export { site } from './src/config/site';
`);

const catalogue = {
  generatedFrom: 'src/data/products.ts',
  currency: site.currency.code,
  demoPrices: catalogSettings.demoPrices,
  maxPerOrder: catalogSettings.maxPerOrder,
  products: products.map(({ id, name, price, stock, available }) => ({ id, name, price, stock, available })),
};

writeFileSync('server/catalogue.json', `${JSON.stringify(catalogue, null, 2)}\n`);
console.log(`✔ server/catalogue.json written: ${catalogue.products.length} products, currency ${catalogue.currency}.`);
if (catalogue.demoPrices) console.log('  Note: these are still DEMO prices. Do not take real payments until demoPrices is false.');
