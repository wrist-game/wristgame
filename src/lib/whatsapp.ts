/**
 * WhatsApp links and the business number.
 * The number itself is set in src/config/site.ts (contact.whatsapp).
 */
import { site, WHATSAPP_NUMBER_PLACEHOLDER } from '../config/site';
import { catalogSettings } from '../data/products';
import { productPath } from './catalog';
import { formatPriceWithCode } from './format';
import type { Product } from '../types';

/**
 * Turns whatever was typed in the settings into the digits WhatsApp needs
 * (country code first, no +). Returns '' when there is no usable number:
 * the placeholder, an empty value, or something that cannot be a phone number.
 */
export function normalizeWhatsAppNumber(raw: string, countryCode = '880'): string {
  const value = String(raw ?? '').trim();
  if (!value || value === WHATSAPP_NUMBER_PLACEHOLDER) return '';
  if (/[a-z]/i.test(value)) return ''; // still contains placeholder letters such as X
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2); // 00880… → 880…
  else if (digits.startsWith('0')) digits = countryCode.replace(/\D/g, '') + digits.slice(1); // 017… → 88017…
  return digits.length >= 8 && digits.length <= 15 ? digits : '';
}

/** The business number, ready for a WhatsApp link, or '' while it is still the placeholder. */
export const getWhatsAppNumber = () => normalizeWhatsAppNumber(site.contact.whatsapp, site.contact.countryCode);

export const hasWhatsAppNumber = () => getWhatsAppNumber() !== '';

/** WhatsApp click-to-chat link with a pre-filled message. With no number, WhatsApp asks the sender to pick a contact. */
export const buildWhatsAppLink = (number: string, message: string) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

/**
 * Link to the business number with a pre-filled message. Until a real number is
 * set in src/config/site.ts the link opens WhatsApp's "choose a contact" screen,
 * so the flow can still be tried end to end.
 */
export const whatsappLink = (message: string) => buildWhatsAppLink(getWhatsAppNumber(), message);

export const pageUrl = (path: string) => {
  const base = site.url || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${path}`;
};

/** Added to order messages while the catalogue still carries placeholder prices. */
export const DEMO_PRICE_NOTE = 'Note: the prices on the website are demo prices. Please confirm the real price.';

/** Quick single-product order from a product page (no customer form). */
export function productOrderMessage(product: Product, color: string, quantity: number): string {
  const lines = [`Hello ${site.name}! I would like to order:`, '', `*${product.name}* (${product.id})`];
  if (color) lines.push(`Colour: ${color}`);
  lines.push(`Quantity: ${quantity}`);
  if (product.price === null) lines.push('Price: on request');
  else {
    lines.push(`Price: ${formatPriceWithCode(product.price)} each`);
    if (quantity > 1) lines.push(`Total: ${formatPriceWithCode(product.price * quantity)}`);
    if (catalogSettings.demoPrices) lines.push('', DEMO_PRICE_NOTE);
  }
  lines.push('', 'Please confirm availability, delivery charge and the final total.', '', pageUrl(productPath(product)));
  return lines.join('\n');
}

/** For products that are out of stock or switched off. */
export function availabilityEnquiryMessage(product: Product): string {
  return [`Hello ${site.name}! Is the ${product.name} (${product.id}) available?`, '', pageUrl(productPath(product))].join('\n');
}

export const generalEnquiryMessage = () => `Hello ${site.name}! I have a question.`;
