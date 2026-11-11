// Prices an order on the SERVER from server/catalogue.json.
// The browser sends product IDs and quantities only; any price it might send is ignored.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export class OrderError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function loadCatalogue(path = fileURLToPath(new URL('../catalogue.json', import.meta.url))) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new OrderError('catalogue_missing', 'server/catalogue.json is missing. Run "npm run export:catalogue" in the website folder.');
  }
}

const MAX_LINES = 50;

/**
 * Checks every line against the catalogue and returns the amount to charge.
 * Throws OrderError for anything that cannot be sold exactly as requested.
 */
export function priceOrder(items, catalogue) {
  if (!Array.isArray(items) || items.length === 0) throw new OrderError('empty_order', 'The order has no items.');
  if (items.length > MAX_LINES) throw new OrderError('too_many_lines', 'The order has too many lines.');

  const perProduct = new Map();
  const lines = [];

  for (const item of items) {
    const productId = typeof item?.productId === 'string' ? item.productId : '';
    const quantity = item?.quantity;
    const color = typeof item?.color === 'string' ? item.color.slice(0, 60) : '';
    const product = catalogue.products.find((p) => p.id === productId);

    if (!product) throw new OrderError('unknown_product', `Unknown product: ${productId.slice(0, 40) || '(none)'}.`);
    if (!Number.isInteger(quantity) || quantity < 1) throw new OrderError('bad_quantity', `Bad quantity for ${product.id}.`);
    if (!product.available || product.stock < 1) throw new OrderError('unavailable', `${product.name} is not available.`);
    if (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price <= 0) {
      throw new OrderError('no_price', `${product.name} has no price and cannot be paid for online.`);
    }

    const total = (perProduct.get(product.id) ?? 0) + quantity;
    if (total > Math.min(product.stock, catalogue.maxPerOrder)) throw new OrderError('over_limit', `Only ${Math.min(product.stock, catalogue.maxPerOrder)} of ${product.name} can be ordered.`);
    perProduct.set(product.id, total);

    lines.push({ productId: product.id, name: product.name, color, quantity, unitPrice: product.price, lineTotal: product.price * quantity });
  }

  return { currency: catalogue.currency, lines, total: lines.reduce((sum, line) => sum + line.lineTotal, 0) };
}

/** Name, phone and address are required; everything is trimmed and length-limited. */
export function cleanCustomer(customer) {
  const text = (value, max) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');
  const clean = { name: text(customer?.name, 80), phone: text(customer?.phone, 20), address: text(customer?.address, 300), notes: text(customer?.notes, 500) };
  const digits = clean.phone.replace(/\D/g, '');
  if (clean.name.length < 2 || digits.length < 7 || digits.length > 15 || clean.address.length < 5) {
    throw new OrderError('bad_customer', 'Customer name, phone number and delivery address are required.');
  }
  return clean;
}
