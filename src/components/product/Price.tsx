import type { ReactNode } from 'react';
import { catalogSettings } from '../../data/products';
import { formatPrice } from '../../lib/format';
import { InfoIcon } from '../ui/Icons';

export const DEMO_PRICE_LABEL = 'Demo price';

/** The small "Demo price" tag. Renders nothing once `demoPrices` is false in src/data/products.ts. */
export function DemoPriceFlag({ children = DEMO_PRICE_LABEL }: { children?: ReactNode }) {
  if (!catalogSettings.demoPrices) return null;
  return <span className="demo-flag">{children}</span>;
}

interface PriceProps {
  /** Amount in the store currency, or null for "Price on request". */
  amount: number | null;
  className?: string;
  /** Text after the amount, e.g. " each". */
  suffix?: string;
  /** Set to false where a nearby label already says the price is a demo. */
  flag?: boolean;
  as?: 'p' | 'span';
}

/**
 * The one way prices are shown anywhere in the store. While the catalogue holds
 * placeholder prices, every amount carries a "Demo price" tag.
 */
export function Price({ amount, className = '', suffix, flag = true, as: Tag = 'p' }: PriceProps) {
  return (
    <Tag className={`price ${className} ${amount === null ? 'is-request' : ''}`}>
      <span className="price__amount">
        {formatPrice(amount)}
        {amount !== null && suffix}
      </span>
      {flag && amount !== null && <DemoPriceFlag />}
    </Tag>
  );
}

/** A notice for pages that show prices. Renders nothing once `demoPrices` is false. */
export function DemoNotice({ children, className = '' }: { children?: ReactNode; className?: string }) {
  if (!catalogSettings.demoPrices) return null;
  return (
    <p className={`demo-notice ${className}`} role="note">
      <InfoIcon />
      <span>
        <strong>Demo prices.</strong>{' '}
        {children ?? 'The products, prices and stock levels shown are placeholders for preview. They are not real WristGame prices.'}
      </span>
    </p>
  );
}
