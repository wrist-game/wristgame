// PAYMENT PROVIDER ADAPTER — TEMPLATE. Not connected to anything.
//
// When you have a merchant account, copy this file to "<your-provider>.mjs", implement the
// three functions with that provider's official API, and set PAYMENT_PROVIDER=<your-provider>
// in server/.env. Until then every function refuses to run, so no payment can be faked.
//
// `context` gives each function: { secrets: { merchantId, merchantSecret, webhookSecret },
// sandbox: boolean, publicApiUrl: string, frontendOrigin: string }.

class NotConnected extends Error {
  constructor() {
    super('No payment provider is connected.');
    this.code = 'gateway_not_connected';
  }
}

/**
 * Start a payment for an order priced by the server.
 * @param {{ orderId: string, total: number, currency: string, customer: object, lines: object[] }} order
 * @returns {Promise<{ redirectUrl: string, providerReference: string }>} the provider's hosted payment page
 *
 * Send the customer back to `${context.frontendOrigin}/payment/return?order=${order.orderId}` and point the
 * provider's server-to-server notification at `${context.publicApiUrl}/api/payments/webhook`.
 */
export async function createSession(order, context) {
  void order;
  void context;
  throw new NotConnected();
}

/**
 * Check a notification (webhook / IPN) from the provider.
 * Must verify the signature with the webhook secret AND confirm the amount, currency and order
 * reference with the provider's own API before trusting it.
 * @returns {Promise<{ orderId: string, status: 'paid' | 'failed' | 'cancelled' | 'pending', amount: number, currency: string }>}
 */
export async function verifyNotification(request, context) {
  void request;
  void context;
  throw new NotConnected();
}

/**
 * Ask the provider directly for the state of a payment (used when a notification is late or lost).
 * @returns {Promise<'paid' | 'failed' | 'cancelled' | 'pending'>}
 */
export async function queryPayment(providerReference, context) {
  void providerReference;
  void context;
  throw new NotConnected();
}
