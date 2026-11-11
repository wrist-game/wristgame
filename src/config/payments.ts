/**
 * WRISTGAME — PAYMENT SETTINGS (public)
 * ---------------------------------------------------------------------------
 * Which payment methods the checkout offers, and the text shown for each.
 * The checkout screen reads this file; it contains no payment logic itself.
 *
 * ⚠  NEVER PUT SECRETS IN THIS FILE, or anywhere under src/.
 *    Everything here is downloaded by every visitor's browser. Merchant
 *    passwords, API secrets, store passwords and signature keys belong only in
 *    the backend's environment (see server/.env.example and PAYMENTS.md).
 *    `npm run check` scans for secrets by mistake and stops the build if it
 *    finds any.
 *
 * NOTHING HERE TAKES MONEY. Cash on Delivery and manual payment are offline
 * methods: the order is sent on WhatsApp and payment happens outside the
 * website. The online gateway is switched off until a real merchant account
 * and a backend are in place.
 */
export const payments = {
  /** The method selected when the checkout opens. Falls back to the first available one. */
  defaultMethod: 'cod',

  /** Cash on Delivery: the customer pays in cash when the order arrives. */
  cashOnDelivery: {
    enabled: true,
    /**
     * true  → shown with a "Demo option" tag, because WristGame has not yet confirmed
     *         that it offers Cash on Delivery. Set to false once it is a real service.
     */
    demo: true,
    label: 'Cash on Delivery',
    description: 'Pay in cash when your order is delivered. Nothing is paid now.',
  },

  /**
   * Manual payment: bank transfer, mobile banking or any way you take money by hand.
   * Edit the text freely. Nothing here is checked or processed by the website.
   */
  manual: {
    enabled: true,
    label: 'Manual payment',
    description: 'Bank transfer or mobile banking, arranged directly with WristGame.',
    /** Shown as steps when this method is selected. One sentence per line. */
    instructions: [
      'Send your order on WhatsApp first. Do not send money before WristGame replies.',
      'WristGame replies with the final total, including delivery, and the payment details.',
      'Pay using those details, then send your payment reference on WhatsApp.',
    ],
    /**
     * Optional account details shown under the steps, e.g.
     *   { label: 'Bank', value: 'Your bank name' },
     *   { label: 'Account name', value: 'Your account name' },
     *   { label: 'Account number', value: 'Your account number' },
     * Rows with an empty value are shown as "to be added". Leave the list
     * empty to show no account details at all (they are then shared on WhatsApp).
     */
    details: [] as { label: string; value: string }[],
  },

  /**
   * Online payment through a payment gateway. NOT CONNECTED.
   * Keep `enabled: false` until all of these exist:
   *   1. a merchant account with a payment provider,
   *   2. the backend in /server deployed with that provider's credentials in ITS environment,
   *   3. `apiBaseUrl` and `allowedRedirectHosts` filled in below.
   * Only public values go here: an address and a list of host names. No keys.
   */
  gateway: {
    enabled: false,
    label: 'Online payment',
    description: 'Card or mobile wallet, on the payment provider’s secure page.',
    /** Show the option greyed out with a "Not available yet" tag while it is off. false hides it completely. */
    showWhenUnavailable: true,
    /** Address of YOUR backend (the /server app), e.g. 'https://api.your-domain.com'. Public, not a secret. */
    apiBaseUrl: '',
    /**
     * Host names of the payment provider's hosted payment page. The site only ever
     * sends a customer to an https address on one of these hosts.
     */
    allowedRedirectHosts: [] as string[],
  },
};

export type PaymentSettings = typeof payments;
