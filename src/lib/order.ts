/**
 * The WhatsApp order: the customer form rules and the message that is sent.
 * Plain functions (no React), so they are easy to test and to reword.
 *
 * To change the wording of the order message, edit `buildOrderMessage` below.
 * The business WhatsApp number is set in src/config/site.ts.
 */
import { site } from '../config/site';
import { catalogSettings } from '../data/products';
import type { CartTotals, DetailedLine } from './cart';
import { formatPriceWithCode, pluralize } from './format';
import { DEMO_PRICE_NOTE, whatsappLink } from './whatsapp';

export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
  /** Optional. */
  notes: string;
}

/** The payment method the customer chose, as written in the order message. */
export interface OrderPayment {
  method: string;
}

export const EMPTY_CUSTOMER: OrderCustomer = { name: '', phone: '', address: '', notes: '' };

/** Longest text accepted per field. Keeps the WhatsApp link to a safe length. */
export const ORDER_FIELD_LIMITS: Record<keyof OrderCustomer, number> = { name: 80, phone: 20, address: 300, notes: 500 };

export type OrderErrors = Partial<Record<keyof OrderCustomer, string>>;

const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();

/** Trims every field. Name, phone and address become single lines; notes keep their line breaks. */
export function cleanCustomer(values: OrderCustomer): OrderCustomer {
  return {
    name: oneLine(values.name).slice(0, ORDER_FIELD_LIMITS.name),
    phone: oneLine(values.phone).slice(0, ORDER_FIELD_LIMITS.phone),
    address: values.address
      .split(/\n+/)
      .map(oneLine)
      .filter(Boolean)
      .join(', ')
      .slice(0, ORDER_FIELD_LIMITS.address),
    notes: values.notes
      .split('\n')
      .map(oneLine)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, ORDER_FIELD_LIMITS.notes),
  };
}

/** Name, phone and address are required; notes are optional. Returns an empty object when everything is fine. */
export function validateCustomer(values: OrderCustomer): OrderErrors {
  const clean = cleanCustomer(values);
  const errors: OrderErrors = {};
  if (clean.name.length < 2) errors.name = 'Please enter your name.';
  const digits = clean.phone.replace(/\D/g, '');
  if (!clean.phone) errors.phone = 'Please enter your phone number.';
  else if (/[^\d\s()+.-]/.test(clean.phone)) errors.phone = 'Use digits only, for example 01XXXXXXXXX.';
  else if (digits.length < 7 || digits.length > 15) errors.phone = 'That phone number looks incomplete. Please check it.';
  if (clean.address.length < 5) errors.address = 'Please enter your delivery address.';
  return errors;
}

function subtotalText(totals: CartTotals): string {
  if (totals.unpricedCount === 0) return formatPriceWithCode(totals.subtotal);
  if (totals.unpricedCount === totals.itemCount) return 'to be confirmed (prices on request)';
  return `${formatPriceWithCode(totals.subtotal)} + ${pluralize(totals.unpricedCount, 'item')} priced on request`;
}

/**
 * The message the customer sends to the business. *Stars* show as bold in WhatsApp.
 * It is worded as a request: nothing in it says the order is confirmed or paid.
 */
export function buildOrderMessage(lines: DetailedLine[], totals: CartTotals, customer: OrderCustomer, payment?: OrderPayment): string {
  const details = cleanCustomer(customer);
  const message: string[] = [
    `*NEW ORDER REQUEST — ${site.name}*`,
    '',
    '*Customer*',
    `Name: ${details.name}`,
    `Phone: ${details.phone}`,
    `Delivery address: ${details.address}`,
    '',
    '*Order*',
  ];

  lines.forEach((line, index) => {
    message.push(`${index + 1}. *${line.product.name}* (${line.product.id})`);
    if (line.color) message.push(`   Colour: ${line.color}`);
    message.push(`   Quantity: ${line.quantity}`);
    if (line.product.price === null || line.lineTotal === null) message.push('   Price: on request');
    else message.push(`   Price: ${formatPriceWithCode(line.product.price)} each`, `   Line total: ${formatPriceWithCode(line.lineTotal)}`);
  });

  message.push(
    '',
    `Items: ${totals.itemCount}`,
    `*Subtotal: ${subtotalText(totals)}*`,
    'Delivery charge: to be confirmed',
    '',
    '*Order notes*',
    details.notes || 'None',
    '',
  );
  // Offline methods only: the website takes no money, so the status is always "Not paid".
  if (payment) message.push('*Payment*', `Method: ${payment.method}`, 'Status: Not paid', '');
  message.push(
    'This is an order request. It is not confirmed or paid yet. Please confirm availability, the delivery charge and the final total.',
  );
  if (catalogSettings.demoPrices && totals.unpricedCount < totals.itemCount) message.push(DEMO_PRICE_NOTE);

  return message.join('\n');
}

/** The WhatsApp link that opens the business chat with the order message filled in. */
export const orderLink = (lines: DetailedLine[], totals: CartTotals, customer: OrderCustomer, payment?: OrderPayment) =>
  whatsappLink(buildOrderMessage(lines, totals, customer, payment));
