// WristGame payment backend — SKELETON. No payment gateway is connected.
//
// What works today: request checks, CORS for the website only, and server-side pricing of an order.
// What is deliberately missing: any call to a payment provider. Every payment route answers
// "501 gateway_not_connected", so this server can never report a payment as started or successful.
//
// Run:  node --env-file=.env index.mjs      (Node 20.6 or newer; no packages to install)
// Read: ../PAYMENTS.md for the full design and the list of what to build once you have credentials.
import http from 'node:http';
import { loadConfig } from './lib/config.mjs';
import { cleanCustomer, loadCatalogue, OrderError, priceOrder } from './lib/pricing.mjs';

const config = loadConfig();
const MAX_BODY_BYTES = 20_000;

const NOT_CONNECTED = {
  error: 'gateway_not_connected',
  message: 'No payment gateway is connected. Nothing was charged and no payment was started.',
};

function send(res, status, body, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  // Only the configured website may read answers from this API.
  if (config.frontendOrigin && origin === config.frontendOrigin) {
    headers['Access-Control-Allow-Origin'] = config.frontendOrigin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        // Stop keeping the data; the handler answers 413 and then closes the connection.
        chunks.length = 0;
        reject(new OrderError('too_large', 'Request is too large.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'));
      } catch {
        reject(new OrderError('bad_json', 'Request is not valid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

async function createSession(req, res, origin) {
  const body = await readJson(req);
  // 1. Validate the customer and price the order from the server's own catalogue.
  //    Any price or total sent by the browser is ignored.
  const customer = cleanCustomer(body?.customer);
  const order = priceOrder(body?.items, loadCatalogue());
  void customer;
  void order;

  // 2. TO BUILD once a merchant account exists (see PAYMENTS.md, section 5 "Connecting a real gateway — checklist"):
  //      a. Save the order (reference, lines, total, customer, status "pending") in a database.
  //      b. Load providers/<PAYMENT_PROVIDER>.mjs and call createSession(order, context).
  //      c. Answer { orderId, redirectUrl } so the website can send the customer to the provider.
  //    Until then, refuse. Never answer with a redirectUrl that was not issued by the provider.
  send(res, 501, NOT_CONNECTED, origin);
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin ?? '';
  const url = new URL(req.url ?? '/', 'http://localhost');

  try {
    if (req.method === 'OPTIONS') {
      const allowed = config.frontendOrigin && origin === config.frontendOrigin;
      res.writeHead(allowed ? 204 : 403, allowed ? { 'Access-Control-Allow-Origin': config.frontendOrigin, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600', Vary: 'Origin' } : {});
      res.end();
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      // Reports which setting NAMES are still empty. Values are never included.
      send(res, 200, { ok: true, gateway: 'not_connected', credentialsPresent: config.credentialsPresent, missingSettings: config.missing }, origin);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/payments/session') {
      await createSession(req, res, origin);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/payments/status') {
      // TO BUILD: look the order up in the database and answer { orderId, status } with the status
      // that was verified with the provider. The website shows any error here as "could not confirm".
      send(res, 501, NOT_CONNECTED, origin);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/payments/webhook') {
      // TO BUILD: call verifyNotification() from the provider adapter (signature + amount + currency +
      // order reference), then update the order. This is the ONLY place an order may become "paid".
      send(res, 501, NOT_CONNECTED, origin);
      return;
    }

    send(res, 404, { error: 'not_found' }, origin);
  } catch (error) {
    if (error instanceof OrderError && error.code === 'too_large') {
      res.once('finish', () => req.destroy());
      send(res, 413, { error: error.code, message: error.message }, origin);
    } else if (error instanceof OrderError) send(res, error.code === 'catalogue_missing' ? 500 : 422, { error: error.code, message: error.message }, origin);
    else {
      console.error('Unexpected error:', error instanceof Error ? error.message : 'unknown');
      send(res, 500, { error: 'server_error' }, origin);
    }
  }
});

server.listen(config.port, () => {
  console.log(`WristGame payment backend (skeleton) on port ${config.port}.`);
  console.log('Payment gateway: NOT CONNECTED. Every payment route answers 501.');
  if (!config.credentialsPresent) console.log(`Settings still empty: ${config.missing.join(', ')}`);
});
