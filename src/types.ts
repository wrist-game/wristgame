/**
 * Shapes of the catalogue data. The data itself lives in src/data/products.ts.
 */

export interface ProductColor {
  name: string;
  /** CSS colour used for the swatch. */
  swatch: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  // ── Required ────────────────────────────────────────────────────────────
  /** Unique product ID, e.g. 'WG-001'. Never reuse an ID for a different watch. */
  id: string;
  name: string;
  /** Price in BDT as a plain number (2500, not '2,500'). Use null to show "Price on request". */
  price: number | null;
  description: string;
  /** The `id` of one of the categories defined in src/data/products.ts. */
  category: string;
  /** Main photo: a path inside /public (e.g. '/images/products/my-watch.jpg') or a full URL. */
  image: string;
  /** Units you have to sell. 0 shows "Out of stock" and blocks ordering. */
  stock: number;
  /** Master switch. false shows "Currently unavailable" and blocks ordering, whatever the stock. */
  available: boolean;

  // ── Optional ────────────────────────────────────────────────────────────
  /** Web address: /product/<slug>. Made from the name when left out. */
  slug?: string;
  /** One line for product cards. The first sentence of `description` is used when left out. */
  shortDescription?: string;
  /** Extra photos shown after the main one on the product page. */
  gallery?: string[];
  /** Describes the main photo for screen readers. The product name is used when left out. */
  imageAlt?: string;
  /** Bullet points on the product page. */
  highlights?: string[];
  /** Rows for the "Product information" table, e.g. { label: 'Movement', value: 'Quartz' }. */
  specs?: ProductSpec[];
  /** Colour choices. Stock is shared across the colours of one product. */
  colors?: ProductColor[];
  /** Featured watches appear on the home page and first in the shop. */
  featured?: boolean;
}

export interface Category {
  /** Used in product data and in the address: /shop?category=<id> */
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Cover photo for the home page and the Collections page. */
  image: string;
}

/** What the image components render. Built from the paths above by src/lib/catalog.ts. */
export interface ProductImage {
  src: string;
  /** Optional responsive sources, e.g. '/a-sm.webp 512w, /a-lg.webp 1024w'. */
  srcSet?: string;
  alt: string;
}

export interface CartLine {
  productId: string;
  /** Chosen colour name, or '' for products without colour choices. */
  color: string;
  quantity: number;
}
