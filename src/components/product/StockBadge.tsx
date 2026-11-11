import { getAvailability } from '../../lib/catalog';
import type { Product } from '../../types';

/** "In stock", "Only 3 left", "Out of stock" or "Currently unavailable", from the product's stock and available fields. */
export function StockBadge({ product, className = '' }: { product: Product; className?: string }) {
  const { status, label } = getAvailability(product);
  return (
    <span className={`stock-badge stock-badge--${status} ${className}`}>
      <span className="stock-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
