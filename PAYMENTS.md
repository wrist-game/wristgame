# WristGame — Payments

**Status: no payment gateway is connected.** The website takes no money, stores no card
details and never shows a payment as successful. This document explains what exists today,
how it is laid out, and exactly what is needed to connect a real gateway later.

---

## 1. What customers see today

At checkout the customer picks a payment method, then sends the order on WhatsApp.

| Method | State | What happens |
|---|---|---|
| **Cash on Delivery** | On, tagged "Demo option" | The order is sent on WhatsApp. Nothing is paid on the website. |
| **Manual payment** | On | The order is sent on WhatsApp. Your instructions are shown. Payment is arranged by hand. |
| **Online payment** | Off, shown as "Not available yet" | Cannot be selected. No code path can reach a payment provider. |

The WhatsApp order message includes the chosen method and always says `Status: Not paid`.

## 2. Things you can edit now — `src/config/payments.ts`

That one file controls the payment options. It holds **public** text and switches only.

| You want to… | Change |
|---|---|
| Edit the manual payment steps | `manual.instructions` (one sentence per line) |
| Show bank or mobile-banking account details | add rows to `manual.details`, e.g. `{ label: 'Account number', value: '…' }` |
| Confirm Cash on Delivery is a real service | `cashOnDelivery.demo: false` (removes the "Demo option" tag) |
| Turn a method off | `enabled: false` on that method |
| Change which method is pre-selected | `defaultMethod` (`'cod'` or `'manual'`) |
| Hide the greyed-out online option | `gateway.showWhenUnavailable: false` |
| Rename or re-describe a method | its `label` and `description` |

Run `npm run build` after any change.

Account numbers for manual payment are fine to publish there (customers need them).
**Passwords, API keys and secrets are never fine** — see section 6.

## 3. How the code is laid out

```
PUBLIC WEBSITE (everything here is downloaded by every visitor)
  src/config/payments.ts                 settings: methods, text, the backend's public address
  src/lib/payments/types.ts              the shapes of data exchanged with the backend
  src/lib/payments/methods.ts            turns settings into the list of options
  src/lib/payments/gatewayClient.ts      the ONLY code that calls the backend (inert while off)
  src/components/checkout/PaymentMethodSelector.tsx   the selection UI. No logic, no card fields
  src/pages/Checkout.tsx                 uses the three above
  src/pages/PaymentReturn.tsx            /payment/return — shows the status the backend verified

PRIVATE BACKEND (runs on a server you control; never shipped to browsers)
  server/index.mjs                       the three payment routes. All answer 501 for now
  server/lib/config.mjs                  reads credentials from environment variables
  server/lib/pricing.mjs                 prices an order from the server's own catalogue
  server/providers/example-provider.mjs  template for the payment provider adapter (not connected)
  server/.env.example                    the names of the settings and secrets (all empty)
  server/catalogue.json                  product prices for the backend (npm run export:catalogue)
```

The UI knows nothing about any gateway: it receives a list of options and reports which one
was picked. The gateway settings live in `src/config/payments.ts` (public part) and
`server/.env` (secret part). Swapping or adding a provider touches only `server/providers/`.

## 4. The flow once a gateway is connected

```
Customer        Website (browser)            Your backend                 Payment provider
   │  Pay online      │                           │                              │
   ├─────────────────►│  POST /api/payments/session                              │
   │                  │  { items: id + quantity,  │                              │
   │                  │    customer }             │                              │
   │                  ├──────────────────────────►│ prices the order itself      │
   │                  │                           │ saves it as "pending"        │
   │                  │                           ├─ create payment (secret) ───►│
   │                  │   { orderId, redirectUrl }│◄──────── hosted page address ┤
   │                  │◄──────────────────────────┤                              │
   │  redirected to the provider's own page (only if its host is on the approved list)
   ├────────────────────────────────────────────────────────────────────────────►│
   │  card / wallet details are typed THERE, never on wristgame                  │
   │                                              │◄── signed notification ──────┤
   │                                              │ verifies signature, amount,  │
   │                                              │ currency, order → "paid"     │
   │  sent back to /payment/return?order=<id>     │                              │
   ├─────────────────►│  GET /api/payments/status?order=<id>                     │
   │                  ├──────────────────────────►│                              │
   │  sees the        │◄──── { orderId, status } ─┤                              │
   │  verified status │                           │                              │
```

### The contract between website and backend

| Route | Request | Answer |
|---|---|---|
| `POST /api/payments/session` | `{ items: [{ productId, quantity, color }], customer: { name, phone, address, notes } }` | `{ orderId, redirectUrl }` |
| `GET /api/payments/status?order=<orderId>` | — | `{ orderId, status }` where status is `paid`, `pending`, `failed`, `cancelled` or `unknown` |
| `POST /api/payments/webhook` | sent by the provider, not by the website | — |

The website treats any error, unreadable answer, or answer for a different order as
**"could not confirm"**. It never treats it as paid.

## 5. Connecting a real gateway — checklist

Nothing below has been done. It starts when you have a merchant account.

**You provide**

1. A **merchant account** with a payment provider that serves Bangladesh, approved for your business.
2. From that provider: the **sandbox (test) credentials** first, then the live ones; the address of
   its **hosted payment page**; and its **API and notification (webhook/IPN) documentation**.
3. A **server** to run the backend on, with HTTPS, and its address (for example `https://api.your-domain.com`).
4. A **database** (even a small one) so orders and payment states survive a restart.
5. Your **real prices**, with `demoPrices: false` in `src/data/products.ts`.

**Then a developer**

1. Copies `server/.env.example` to `server/.env` **on the server** and fills in the credentials.
2. Copies `server/providers/example-provider.mjs` to `<provider>.mjs` and implements
   `createSession`, `verifyNotification` and `queryPayment` with the provider's official API.
3. Completes the three "TO BUILD" places in `server/index.mjs` (save the order, call the adapter,
   answer the status from the database, handle the webhook) and adds rate limiting.
4. Runs `npm run export:catalogue` and deploys the backend with `server/catalogue.json`.
5. Tests everything in the provider's **sandbox**: success, failure, cancel, closing the tab
   mid-payment, a duplicated notification, a notification with a wrong amount, a forged notification.
6. Only then edits `src/config/payments.ts`: `gateway.apiBaseUrl`, `gateway.allowedRedirectHosts`
   (the provider's payment-page host) and `gateway.enabled: true`, and rebuilds the website.
7. Switches to live credentials and makes one small real payment and refund before announcing it.

Until step 6 the online option stays greyed out, whatever else has been done.

## 6. Security rules (please keep these)

1. **No secrets in the website.** Nothing under `src/`, `public/` or `index.html`, and no
   variable starting with `VITE_`, may hold a merchant password, API secret, store password or
   signing key. `npm run check` (part of every build) scans for these and stops the build.
2. **Secrets live only in the backend's environment** (`server/.env`, which is in `.gitignore`).
   Never commit them, never log them, never send them to the browser.
3. **No card details on this website. Ever.** Customers type card and wallet details on the
   provider's hosted page. The site has no card fields and stores nothing about payment in the
   browser. This keeps you out of the heavier card-security (PCI DSS) obligations; confirm your
   exact obligations with your provider.
4. **The server sets the price.** The browser sends product IDs and quantities; the backend
   prices them from `server/catalogue.json`. A price sent by a browser is ignored.
5. **Only the backend decides "paid"**, and only after verifying the provider's notification:
   signature, amount, currency and order reference. The return page never reads a result from
   the address bar.
6. **Never simulate success.** No test buttons, no "mark as paid" shortcuts, no default of
   "paid" when something is unclear. Unclear means "could not confirm".
7. **Redirect only to approved hosts** over https (`gateway.allowedRedirectHosts`).
8. **The backend answers only your website** (`FRONTEND_ORIGIN`), over HTTPS.
9. **If a secret is ever exposed**, ask the provider for a new one immediately. Deleting it
   from the code is not enough.

## 7. What is checked automatically

- `npm run check` — secret scan of the public code (plus the product and WhatsApp checks).
- `npm test` — includes: the online option is off as shipped; the gateway client refuses to run
  while off; only approved https hosts are accepted for redirects; a status is "paid" only on a
  clear answer for the same order; the order message says "Not paid"; the backend ignores
  browser prices and refuses unknown, unavailable or over-stock items.

## 8. Honest limits of what exists

- The backend is a **skeleton**. It has no database, no provider adapter and no rate limiting,
  and it has never talked to a payment provider. Every payment route answers `501`.
- No provider has been chosen, so the adapter template is generic. Some providers need small
  changes to the flow above (for example an embedded checkout instead of a redirect).
- Cash on Delivery is labelled a demo option because it has not been confirmed as a real service.
- Refunds, invoices, order emails and an order admin screen are not part of this preparation.
