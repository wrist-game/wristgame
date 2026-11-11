/**
 * Everything the site needs to READ the catalogue: look-ups, image helpers,
 * stock / availability rules, search, filtering and sorting.
 * The data itself is in src/data/products.ts.
 */
import { catalogSettings, categories, products } from '../data/products';
import type { Category, Product, ProductImage } from '../types';

// ── Look-ups ────────────────────────────────────────────────────────────────

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The product's place in the address bar: its own `slug`, or one made from the name. */
export const productSlug = (product: Product) => product.slug || slugify(product.name) || slugify(product.id);

export const productPath = (product: Product) => `/product/${productSlug(product)}`;

export const getProductById = (id: string) => products.find((p) => p.id === id);

export const getProductBySlug = (slug: string) => products.find((p) => productSlug(p) === slug);

export const getCategory = (id: string | null | undefined): Category | undefined => categories.find((c) => c.id === id);

export const categoryName = (product: Product) => getCategory(product.category)?.name ?? product.category;

export const productsInCategory = (categoryId: string) => products.filter((p) => p.category === categoryId);

/** Featured products for the home page. Falls back to the first products when none are flagged. */
export function getFeaturedProducts(limit = 4): Product[] {
  const featured = products.filter((p) => p.featured);
  return (featured.length > 0 ? featured : products).slice(0, limit);
}

/** Card text: the product's own short description, or the first sentence of the full one. */
export function shortDescription(product: Product): string {
  if (product.shortDescription) return product.shortDescription;
  const first = product.description.match(/^.*?[.!?](?=\s|$)/);
  return first ? first[0] : product.description;
}

// ── Images ──────────────────────────────────────────────────────────────────

const LARGE_VARIANT = /-lg(\.[a-z0-9]+)$/i;

/**
 * Every photo named "…-lg.ext" (1024 px) has three smaller copies made by `npm run images`.
 * The browser picks the smallest one that still looks sharp, so phones download small files.
 */
export const IMAGE_SIZES = { xs: 256, xm: 384, sm: 512, md: 768, lg: 1024 } as const;
export type ImageSize = keyof typeof IMAGE_SIZES;

/** The same photo at another size. Files not named "…-lg.ext" have no copies and are returned unchanged. */
export const imageVariant = (src: string, size: ImageSize) => src.replace(LARGE_VARIANT, `-${size}$1`);

/** Smallest (256 px) copy, for thumbnails up to about 120 px wide. */
export const thumbnail = (src: string) => imageVariant(src, 'xs');

/** All sizes of a photo, in the form the browser's `srcset` expects. */
export const imageSrcSet = (src: string) =>
  LARGE_VARIANT.test(src)
    ? (Object.keys(IMAGE_SIZES) as ImageSize[]).map((size) => `${imageVariant(src, size)} ${IMAGE_SIZES[size]}w`).join(', ')
    : undefined;

export function toImage(src: string, alt: string): ProductImage {
  const srcSet = imageSrcSet(src);
  return srcSet ? { src, srcSet, alt } : { src, alt };
}

/** Main photo first, then the gallery. */
export function productImages(product: Product): ProductImage[] {
  const main = toImage(product.image, product.imageAlt || product.name);
  const extra = (product.gallery ?? []).map((src, index) => toImage(src, `${product.name}, photo ${index + 2}`));
  return [main, ...extra];
}

// ── Stock and availability ──────────────────────────────────────────────────

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'unavailable';

export interface Availability {
  status: StockStatus;
  /** Text shown to customers, e.g. "In stock" or "Only 3 left". */
  label: string;
  /** Whether the product can be ordered at all. */
  purchasable: boolean;
  /** The most units one order may contain (0 when it cannot be ordered). */
  limit: number;
}

const wholeUnits = (stock: number) => (Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0);

export function getAvailability(product: Product): Availability {
  const stock = wholeUnits(product.stock);
  if (!product.available) return { status: 'unavailable', label: 'Currently unavailable', purchasable: false, limit: 0 };
  if (stock === 0) return { status: 'out-of-stock', label: 'Out of stock', purchasable: false, limit: 0 };
  const limit = Math.min(stock, Math.max(1, Math.floor(catalogSettings.maxPerOrder)));
  if (stock <= catalogSettings.lowStockThreshold) return { status: 'low-stock', label: `Only ${stock} left`, purchasable: true, limit };
  return { status: 'in-stock', label: 'In stock', purchasable: true, limit };
}

/** The most units of a product a cart may hold. Used by the cart as its stock rule. */
export const purchaseLimit = (productId: string) => {
  const product = getProductById(productId);
  return product ? getAvailability(product).limit : 0;
};

// ── Search, filter, sort ────────────────────────────────────────────────────

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

export type StockFilter = 'all' | 'in-stock';

export const STOCK_FILTERS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'All watches' },
  { value: 'in-stock', label: 'In stock only' },
];

export interface CatalogQuery {
  search?: string;
  /** A category id, or 'all'. */
  category?: string;
  stock?: StockFilter;
  sort?: SortKey;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** True when every word of the query appears somewhere in the product's searchable text. */
export function matchesSearch(product: Product, search: string): boolean {
  const terms = normalize(search).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalize(
    [
      product.name,
      product.id,
      product.category,
      categoryName(product),
      product.shortDescription ?? '',
      product.description,
      ...(product.highlights ?? []),
      ...(product.colors ?? []).map((c) => c.name),
    ].join(' '),
  );
  return terms.every((term) => haystack.includes(term));
}

/** Products without a price always sort after priced ones, in either direction. */
export function comparePrice(a: Product, b: Product, direction: 'asc' | 'desc'): number {
  if (a.price === null && b.price === null) return 0;
  if (a.price === null) return 1;
  if (b.price === null) return -1;
  return direction === 'asc' ? a.price - b.price : b.price - a.price;
}

export function queryProducts(all: Product[], query: CatalogQuery): Product[] {
  const { search = '', category = 'all', stock = 'all', sort = 'featured' } = query;

  const filtered = all.filter((product) => {
    if (category !== 'all' && product.category !== category) return false;
    if (stock === 'in-stock' && !getAvailability(product).purchasable) return false;
    return matchesSearch(product, search);
  });

  // Array.prototype.sort is stable, so ties keep the catalogue order.
  switch (sort) {
    case 'price-asc':
      return [...filtered].sort((a, b) => comparePrice(a, b, 'asc'));
    case 'price-desc':
      return [...filtered].sort((a, b) => comparePrice(a, b, 'desc'));
    case 'name-asc':
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    default:
      return [...filtered].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }
}
