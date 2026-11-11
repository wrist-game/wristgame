/**
 * Shapes shared by the payment code. The frontend/backend contract at the bottom
 * is mirrored by the backend skeleton in /server and described in PAYMENTS.md.
 */

export type PaymentMethodId = 'cod' | 'manual' | 'online';

/**
 * offline → payment happens outside the website; the order is sent on WhatsApp.
 * gateway → the customer is sent to the payment provider's own page by the backend.
 */
export type PaymentKind = 'offline' | 'gateway';

export interface PaymentMethodOption {
  id: PaymentMethodId;
  kind: PaymentKind;
  label: string;
  description: string;
  /** Small tag next to the label, e.g. "Demo option" or "Not available yet". */
  badge?: string;
  /** Whether the customer can choose it. */
  available: boolean;
  /** Steps shown when the method is selected. */
  instructions: string[];
  /** Account details shown under the steps. Empty values render as "to be added". */
  details: { label: string; value: string }[];
  /** How the method is written in the WhatsApp order message. */
  messageLabel: string;
}

// ── Frontend ⇄ backend contract (used only when the gateway is switched on) ──

/**
 * What the browser sends to the backend to start an online payment.
 * Deliberately contains NO prices and NO totals: the backend looks the prices up
 * itself, so a tampered browser cannot change what is charged. It also contains
 * no card data — the website never sees any.
 */
export interface PaymentSessionRequest {
  items: { productId: string; quantity: number; color: string }[];
  customer: { name: string; phone: string; address: string; notes: string };
}

/** The backend's answer: its order reference and the provider's hosted payment page. */
export interface PaymentSessionResponse {
  orderId: string;
  redirectUrl: string;
}

/**
 * Payment state as verified by the BACKEND with the payment provider.
 * The browser never decides this, and never reads it from the address bar.
 */
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'cancelled' | 'unknown';

export interface PaymentStatusResponse {
  orderId: string;
  status: PaymentStatus;
}
