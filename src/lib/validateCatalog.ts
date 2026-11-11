import type { Category, Product } from '../types';
import { productSlug } from './catalog';

/**
 * Checks the catalogue for mistakes that are easy to make while editing it.
 * Returns a list of plain-language problems (empty when everything is fine).
 * Used by `npm run check` and, during development, printed in the browser console.
 */
export function validateCatalog(products: Product[], categories: Category[]): string[] {
  const problems: string[] = [];
  const categoryIds = new Set<string>();

  categories.forEach((category, index) => {
    const where = `Category #${index + 1}${category.name ? ` (${category.name})` : ''}`;
    if (!category.id || typeof category.id !== 'string') problems.push(`${where}: needs an id.`);
    else if (categoryIds.has(category.id)) problems.push(`${where}: the id "${category.id}" is used by more than one category.`);
    else categoryIds.add(category.id);
    if (!category.name) problems.push(`${where}: needs a name.`);
    if (!category.image) problems.push(`${where}: needs an image.`);
  });

  const ids = new Map<string, string>();
  const slugs = new Map<string, string>();

  products.forEach((product, index) => {
    const where = `Product #${index + 1}${product.name ? ` (${product.name})` : ''}`;

    if (!product.id || typeof product.id !== 'string') problems.push(`${where}: needs an id.`);
    else if (ids.has(product.id)) problems.push(`${where}: the id "${product.id}" is already used by ${ids.get(product.id)}. Every product needs its own id.`);
    else ids.set(product.id, product.name || `product #${index + 1}`);

    if (!product.name || typeof product.name !== 'string') problems.push(`${where}: needs a name.`);
    else {
      const slug = productSlug(product);
      if (slugs.has(slug)) problems.push(`${where}: its web address "/product/${slug}" is the same as ${slugs.get(slug)}. Give one of them a different name or a "slug".`);
      else slugs.set(slug, product.name);
    }

    if (product.price !== null && (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0)) {
      problems.push(`${where}: price must be a plain number such as 2500 (no quotes, commas or currency sign), or null for "Price on request".`);
    }

    if (!product.description || typeof product.description !== 'string') problems.push(`${where}: needs a description.`);

    if (!categoryIds.has(product.category)) {
      problems.push(`${where}: category "${product.category}" does not exist. Use one of: ${[...categoryIds].join(', ') || '(no categories defined)'}.`);
    }

    if (!product.image || typeof product.image !== 'string') problems.push(`${where}: needs an image.`);

    if (typeof product.stock !== 'number' || !Number.isInteger(product.stock) || product.stock < 0) {
      problems.push(`${where}: stock must be a whole number, 0 or more.`);
    }

    if (typeof product.available !== 'boolean') problems.push(`${where}: available must be true or false (no quotes).`);

    const colorNames = (product.colors ?? []).map((c) => c.name);
    if (new Set(colorNames).size !== colorNames.length) problems.push(`${where}: two colours share the same name.`);
  });

  return problems;
}
