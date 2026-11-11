/**
 * Cart rules as plain functions (no React, no storage), so they are easy to test.
 * Stock is enforced here: a cart can never hold more units of a product than
 * `limitFor(productId)` allows, counted across all colours of that product.
 */
import type { CartLine, Product } from '../types';
import { formatPrice } from './format';

/** Returns the most units of a product one cart may hold (0 = cannot be ordered). */
export type LimitFor = (productId: string) => number;

export interface DetailedLine extends CartLine {
  key: string;
  product: Product;
  /** price × quantity, or null when the product has no price yet. */
  lineTotal: number | null;
  /** The highest quantity this line can be raised to (stock minus other colours of the same product). */
  maxQuantity: number;
  /** Why the quantity cannot go higher: all stock is in the cart, or the per-order maximum is reached. */
  limitReason: 'stock' | 'order-max' | null;
}

export interface CartTotals {
  itemCount: number;
  /** Sum of all lines that have a price. */
  subtotal: number;
  /** Number of units whose price is still "on request". */
  unpricedCount: number;
}

export const lineKey = (productId: string, color: string) => `${productId}::${color}`;

const wholeNumber = (value: number, fallback: number) => (Number.isFinite(value) ? Math.round(value) : fallback);

/** Units of one product in the cart, across all its colours. */
export const unitsInCart = (lines: CartLine[], productId: string) =>
  lines.reduce((sum, line) => (line.productId === productId ? sum + line.quantity : sum), 0);

/** How many units a single line may hold: the product limit minus what other colours already take. */
function roomFor(lines: CartLine[], line: Pick<CartLine, 'productId' | 'color'>, limitFor: LimitFor): number {
  const others = lines.reduce((sum, l) => (l.productId === line.productId && l.color !== line.color ? sum + l.quantity : sum), 0);
  return Math.max(0, Math.floor(limitFor(line.productId)) - others);
}

/** Adds units to the cart, stopping at the stock limit. Returns the same array when nothing could be added. */
export function addLine(lines: CartLine[], productId: string, color: string, quantity: number, limitFor: LimitFor): CartLine[] {
  const wanted = Math.max(1, wholeNumber(quantity, 1));
  const room = roomFor(lines, { productId, color }, limitFor);
  const existing = lines.find((l) => l.productId === productId && l.color === color);
  const next = Math.min(room, (existing?.quantity ?? 0) + wanted);

  if (existing) {
    if (next === existing.quantity) return lines;
    if (next <= 0) return lines.filter((l) => l !== existing);
    return lines.map((l) => (l === existing ? { ...l, quantity: next } : l));
  }
  return next <= 0 ? lines : [...lines, { productId, color, quantity: next }];
}

/** Sets a line to an exact quantity, kept between 1 and what stock allows. */
export function setLineQuantity(lines: CartLine[], key: string, quantity: number, limitFor: LimitFor): CartLine[] {
  const line = lines.find((l) => lineKey(l.productId, l.color) === key);
  if (!line) return lines;
  const room = roomFor(lines, line, limitFor);
  if (room <= 0) return lines.filter((l) => l !== line);
  const next = Math.min(room, Math.max(1, wholeNumber(quantity, 1)));
  return next === line.quantity ? lines : lines.map((l) => (l === line ? { ...l, quantity: next } : l));
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((l) => lineKey(l.productId, l.color) !== key);
}

export function detailLines(lines: CartLine[], findProduct: (id: string) => Product | undefined, limitFor: LimitFor): DetailedLine[] {
  const detailed: DetailedLine[] = [];
  for (const line of lines) {
    const product = findProduct(line.productId);
    if (!product) continue; // product removed from the catalogue since it was added
    const maxQuantity = Math.max(line.quantity, roomFor(lines, line, limitFor));
    const atLimit = line.quantity >= maxQuantity;
    detailed.push({
      ...line,
      key: lineKey(line.productId, line.color),
      product,
      lineTotal: product.price === null ? null : product.price * line.quantity,
      maxQuantity,
      limitReason: !atLimit ? null : unitsInCart(lines, line.productId) >= product.stock ? 'stock' : 'order-max',
    });
  }
  return detailed;
}

export function getTotals(lines: DetailedLine[]): CartTotals {
  return lines.reduce<CartTotals>(
    (totals, line) => ({
      itemCount: totals.itemCount + line.quantity,
      subtotal: totals.subtotal + (line.lineTotal ?? 0),
      unpricedCount: totals.unpricedCount + (line.lineTotal === null ? line.quantity : 0),
    }),
    { itemCount: 0, subtotal: 0, unpricedCount: 0 },
  );
}

/** Human-readable subtotal that stays honest while some (or all) prices are missing. */
export function describeSubtotal(totals: CartTotals): string {
  if (totals.itemCount === 0) return formatPrice(0);
  if (totals.unpricedCount === 0) return formatPrice(totals.subtotal);
  if (totals.unpricedCount === totals.itemCount) return 'To be confirmed';
  return `${formatPrice(totals.subtotal)} + ${totals.unpricedCount} on request`;
}

/**
 * Validates whatever was found in localStorage so a corrupted value can never break the page.
 * Products that no longer exist or can no longer be ordered are dropped, and quantities are
 * brought down to the current stock.
 */
export function sanitizeStoredLines(value: unknown, limitFor: LimitFor): CartLine[] {
  if (!Array.isArray(value)) return [];
  const clean: CartLine[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const { productId, color, quantity } = entry as Record<string, unknown>;
    if (typeof productId !== 'string' || typeof color !== 'string' || typeof quantity !== 'number') continue;
    if (clean.some((l) => l.productId === productId && l.color === color)) continue;
    const room = Math.floor(limitFor(productId)) - unitsInCart(clean, productId);
    if (!(room > 0)) continue;
    clean.push({ productId, color, quantity: Math.min(room, Math.max(1, wholeNumber(quantity, 1))) });
  }
  return clean;
}
