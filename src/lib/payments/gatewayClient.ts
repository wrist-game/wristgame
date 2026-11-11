/**
 * The ONLY place the website talks to the payment backend.
 *
 * Not in use yet: every function refuses to run until the gateway is switched on
 * and configured in src/config/payments.ts, and a backend (see /server) exists.
 *
 * Security rules this file keeps:
 *  • No secrets. The browser only knows the backend's public address.
 *  • No card data. The customer types card or wallet details on the payment
 *    provider's own page, never on this website.
 *  • No prices sent. The backend prices the order from its own product data.
 *  • No trust in the browser. Whether a payment succeeded is only ever read from
 *    the backend, which verifies it with the provider.
 */
import { payments, type PaymentSettings } from '../../config/payments';
import { isGatewayReady } from './methods';
import type { PaymentSessionRequest, PaymentSessionResponse, PaymentStatus, PaymentStatusResponse } from './types';

export type GatewayErrorCode = 'not_configured' | 'network' | 'rejected' | 'invalid_response';

export class PaymentGatewayError extends Error {
  constructor(
    public readonly code: GatewayErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}

const TIMEOUT_MS = 20000;
const STATUSES: PaymentStatus[] = ['paid', 'pending', 'failed', 'cancelled', 'unknown'];

const endpoint = (settings: PaymentSettings, path: string) => `${settings.gateway.apiBaseUrl.trim().replace(/\/+$/, '')}${path}`;

/** True only for an https address on one of the hosts listed in `allowedRedirectHosts`. */
export function isAllowedRedirect(url: string, settings: PaymentSettings = payments): boolean {
  try {
    const parsed = new URL(url);
    const hosts = settings.gateway.allowedRedirectHosts.map((host) => host.trim().toLowerCase()).filter(Boolean);
    return parsed.protocol === 'https:' && hosts.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

async function request(url: string, init: RequestInit, fetchImpl: typeof fetch): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    // credentials: 'omit' → no cookies are sent; the backend identifies an order by its own reference.
    response = await fetchImpl(url, { ...init, credentials: 'omit', signal: controller.signal });
  } catch {
    throw new PaymentGatewayError('network', 'The payment service could not be reached.');
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new PaymentGatewayError('rejected', `The payment service answered with status ${response.status}.`);
  try {
    return await response.json();
  } catch {
    throw new PaymentGatewayError('invalid_response', 'The payment service sent an unreadable answer.');
  }
}

/**
 * Asks the backend to create an order and a payment session.
 * Returns the address of the provider's hosted payment page; the caller sends the customer there.
 * Starting a session does not mean anything was paid.
 */
export async function createPaymentSession(
  order: PaymentSessionRequest,
  settings: PaymentSettings = payments,
  fetchImpl: typeof fetch = fetch,
): Promise<PaymentSessionResponse> {
  if (!isGatewayReady(settings)) throw new PaymentGatewayError('not_configured', 'Online payment is not connected.');

  const data = (await request(
    endpoint(settings, '/api/payments/session'),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) },
    fetchImpl,
  )) as Partial<PaymentSessionResponse> | null;

  if (!data || typeof data.orderId !== 'string' || !data.orderId || typeof data.redirectUrl !== 'string') {
    throw new PaymentGatewayError('invalid_response', 'The payment service sent an incomplete answer.');
  }
  if (!isAllowedRedirect(data.redirectUrl, settings)) {
    throw new PaymentGatewayError('invalid_response', 'The payment service sent an address that is not on the approved list.');
  }
  return { orderId: data.orderId, redirectUrl: data.redirectUrl };
}

/**
 * Asks the backend what happened to a payment. Anything other than a clear,
 * well-formed answer is reported as 'unknown' — never as 'paid'.
 */
export async function getPaymentStatus(orderId: string, settings: PaymentSettings = payments, fetchImpl: typeof fetch = fetch): Promise<PaymentStatus> {
  if (!isGatewayReady(settings)) throw new PaymentGatewayError('not_configured', 'Online payment is not connected.');
  const data = (await request(endpoint(settings, `/api/payments/status?order=${encodeURIComponent(orderId)}`), { method: 'GET' }, fetchImpl)) as Partial<PaymentStatusResponse> | null;
  if (!data || data.orderId !== orderId || !STATUSES.includes(data.status as PaymentStatus)) return 'unknown';
  return data.status as PaymentStatus;
}
