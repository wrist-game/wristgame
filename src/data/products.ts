import type { Category, Product } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  WRISTGAME — PRODUCT CATALOGUE
 *  The single place where product information lives. Product cards, product
 *  pages, search, category filters, the cart, checkout and WhatsApp orders
 *  all read from this file. Edit here and the whole store follows.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  ⚠  EVERYTHING BELOW IS DEMO DATA.
 *     The four watches, their prices, stock numbers, descriptions and photos
 *     are placeholders so the store can be tried end to end. None of it is
 *     real WristGame inventory or pricing.
 *
 *  HOW TO REPLACE THE DEMO DATA WITH YOUR REAL PRODUCTS
 *  1. Edit a product in the `products` list (or copy a whole { … } block to
 *     add one, delete a block to remove one). Each product needs:
 *
 *       id           unique product ID, e.g. 'WG-005'
 *       name         product name
 *       price        price in BDT as a plain number: 2500 (not '2,500' or '৳2500')
 *                    — use null to show "Price on request"
 *       description  product description
 *       category     the id of a category from the `categories` list
 *       image        main photo, e.g. '/images/products/my-watch.jpg'
 *       stock        how many you have: 0 shows "Out of stock"
 *       available    true = on sale, false = shown as "Currently unavailable"
 *
 *     Optional extras (slug, shortDescription, gallery, highlights, specs,
 *     colors, featured) are explained in src/types.ts.
 *
 *  2. Photos: put the files in /public/images/products and write the path
 *     starting with /images/products/. Square photos (1:1) fit best.
 *     Naming tip: save each photo as "<name>-lg.webp" (1024 px wide), then run
 *     `npm run images`. It makes the smaller copies phones download (-md, -sm,
 *     -xm, -xs). Any other file name is used as is, at its full size.
 *
 *  3. When the prices are real, set `demoPrices: false` just below. Every
 *     "Demo price" label and demo notice disappears from the site.
 *
 *  4. Run `npm run check` (it also runs before every build). It reports
 *     duplicate IDs, unknown categories, bad prices or stock, and missing
 *     photo files, in plain language.
 */

export const catalogSettings = {
  /**
   * true  → every price is labelled "Demo price" and demo notices are shown.
   * false → labels and notices are removed. Switch this once prices are real.
   */
  demoPrices: true,
  /** At or below this many units the site shows "Only N left". */
  lowStockThreshold: 3,
  /** The most units of one product a customer can put in a single order. */
  maxPerOrder: 10,
};

/** Categories power the shop filter, the Collections page and the footer links. */
export const categories: Category[] = [
  {
    id: 'gold',
    name: 'Gold',
    tagline: 'Warm and classic',
    description: 'Gold-tone watches with a warm, classic presence.',
    image: '/images/products/classic-gold-watch-2-lg.webp',
  },
  {
    id: 'black',
    name: 'Black',
    tagline: 'Dark and bold',
    description: 'Black-finished watches, from understated to statement.',
    image: '/images/products/royal-black-edition-2-lg.webp',
  },
  {
    id: 'steel',
    name: 'Steel',
    tagline: 'Clean and versatile',
    description: 'Steel-tone watches that go with everything.',
    image: '/images/products/silver-steel-watch-2-lg.webp',
  },
];

export const products: Product[] = [
  {
    id: 'WG-001',
    name: 'Classic Gold Watch',
    price: 2500, // DEMO PRICE in BDT — replace with the real price
    description:
      'A gold-tone bracelet watch with a fluted bezel and a deep black dial. A classic shape with enough presence to carry an outfit on its own.',
    category: 'gold',
    image: '/images/products/classic-gold-watch-1-lg.webp',
    stock: 10, // DEMO STOCK — replace with the real quantity
    available: true,

    shortDescription: 'Gold-tone bracelet watch with a deep black dial.',
    gallery: ['/images/products/classic-gold-watch-detail-lg.webp', '/images/products/classic-gold-watch-2-lg.webp'],
    highlights: ['Gold-tone case and bracelet', 'Fluted bezel', 'Black dial with gold-tone markers'],
    featured: true,
  },
  {
    id: 'WG-002',
    name: 'Midnight Black Watch',
    price: 1500, // DEMO PRICE in BDT — replace with the real price
    description:
      'A slim all-black watch on a fine mesh bracelet. The matte black dial carries thin gold-tone markers and hands, and nothing else.',
    category: 'black',
    image: '/images/products/midnight-black-watch-1-lg.webp',
    stock: 8, // DEMO STOCK — replace with the real quantity
    available: true,

    shortDescription: 'Slim all-black watch on a mesh bracelet.',
    gallery: ['/images/products/midnight-black-watch-detail-lg.webp', '/images/products/midnight-black-watch-2-lg.webp'],
    highlights: ['Slim black case', 'Black mesh bracelet', 'Minimal dial with gold-tone markers'],
    featured: true,
  },
  {
    id: 'WG-003',
    name: 'Silver Steel Watch',
    price: 2000, // DEMO PRICE in BDT — replace with the real price
    description:
      'A steel-tone bracelet watch with a silver sunburst dial. Clean lines and a polished bezel make it an easy match for every day.',
    category: 'steel',
    image: '/images/products/silver-steel-watch-1-lg.webp',
    stock: 3, // DEMO STOCK — replace with the real quantity
    available: true,

    shortDescription: 'Steel-tone bracelet watch with a silver dial.',
    gallery: ['/images/products/silver-steel-watch-detail-lg.webp', '/images/products/silver-steel-watch-2-lg.webp'],
    highlights: ['Steel-tone case and bracelet', 'Polished bezel', 'Silver sunburst dial'],
    featured: true,
  },
  {
    id: 'WG-004',
    name: 'Royal Black Edition',
    price: 3000, // DEMO PRICE in BDT — replace with the real price
    description:
      'A black bracelet watch finished with gold-tone accents: a gold ring around the black dial, gold markers and hands. Black and gold, the WristGame way.',
    category: 'black',
    image: '/images/products/royal-black-edition-1-lg.webp',
    stock: 5, // DEMO STOCK — replace with the real quantity
    available: true,

    shortDescription: 'Black bracelet watch with gold-tone accents.',
    gallery: ['/images/products/royal-black-edition-detail-lg.webp', '/images/products/royal-black-edition-2-lg.webp'],
    highlights: ['Black case and bracelet', 'Gold-tone dial ring, markers and hands', 'Black dial'],
    featured: true,
  },
];
