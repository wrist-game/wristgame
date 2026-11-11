import { site } from '../config/site';

export const PRICE_ON_REQUEST = 'Price on request';

let formatter: Intl.NumberFormat | null = null;

function getFormatter(): Intl.NumberFormat {
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(site.currency.locale, {
        style: 'currency',
        currency: site.currency.code,
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: 0,
      });
    } catch {
      formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
    }
  }
  return formatter;
}

/** Formats a price in the store currency, or "Price on request" when no price is set. */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || Number.isNaN(price)) return PRICE_ON_REQUEST;
  return getFormatter().format(price);
}

let codeFormatter: Intl.NumberFormat | null = null;

/**
 * Price with the currency code instead of the symbol, e.g. "BDT 2,500".
 * Used in WhatsApp messages, where plain letters are safer than the ৳ sign.
 */
export function formatPriceWithCode(price: number): string {
  if (!codeFormatter) {
    try {
      codeFormatter = new Intl.NumberFormat(site.currency.locale, { maximumFractionDigits: 0 });
    } catch {
      codeFormatter = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
    }
  }
  return `${site.currency.code} ${codeFormatter.format(price)}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
