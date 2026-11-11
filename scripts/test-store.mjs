// `npm test` — checks the store rules that must never be wrong: cart maths, stock limits,
// search, category filtering, the catalogue checker, the WhatsApp order message and the payment
// safety rules. Uses the real code from src/ (and server/lib for the backend pricing).
import assert from 'node:assert/strict';
import { load } from './bundle.mjs';

const m = await load(`
  export * from './src/lib/cart';
  export * from './src/lib/catalog';
  export { validateCatalog } from './src/lib/validateCatalog';
  export { formatPrice } from './src/lib/format';
  export { products, categories, catalogSettings } from './src/data/products';
  export * from './src/lib/order';
  export * from './src/lib/whatsapp';
  export { site, WHATSAPP_NUMBER_PLACEHOLDER } from './src/config/site';
  export { payments } from './src/config/payments';
  export * from './src/lib/payments/methods';
  export * from './src/lib/payments/gatewayClient';
`);
const backend = await import('../server/lib/pricing.mjs');
const backendConfig = await import('../server/lib/config.mjs');

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✔ ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`  ✖ ${name}\n      ${String(error.message).split('\n').join('\n      ')}`);
  }
}

// A small made-up catalogue so the tests do not depend on what is in src/data/products.ts.
const make = (id, extra = {}) => ({ id, name: `Watch ${id}`, price: 1000, description: 'Test watch.', category: 'gold', image: '/x.jpg', stock: 5, available: true, ...extra });
const A = make('A', { price: 2500, stock: 10 });
const B = make('B', { price: 1500, stock: 3 });
const C = make('C', { price: null, stock: 4 });
const SOLD = make('SOLD', { stock: 0 });
const OFF = make('OFF', { stock: 9, available: false });
const all = [A, B, C, SOLD, OFF];
const find = (id) => all.find((p) => p.id === id);
const limit = (id) => (find(id) ? m.getAvailability(find(id)).limit : 0);
const cart = (lines) => {
  const detailed = m.detailLines(lines, find, limit);
  return { detailed, totals: m.getTotals(detailed) };
};

console.log('\nCart');
await test('adding a product creates a line', () => {
  assert.deepEqual(m.addLine([], 'A', '', 1, limit), [{ productId: 'A', color: '', quantity: 1 }]);
});
await test('adding the same product again increases its quantity', () => {
  const lines = m.addLine(m.addLine([], 'A', '', 1, limit), 'A', '', 2, limit);
  assert.deepEqual(lines, [{ productId: 'A', color: '', quantity: 3 }]);
});
await test('quantity can be updated up and down', () => {
  let lines = m.addLine([], 'A', '', 1, limit);
  lines = m.setLineQuantity(lines, m.lineKey('A', ''), 4, limit);
  assert.equal(lines[0].quantity, 4);
  lines = m.setLineQuantity(lines, m.lineKey('A', ''), 2, limit);
  assert.equal(lines[0].quantity, 2);
});
await test('quantity never drops below 1 and ignores nonsense values', () => {
  let lines = m.addLine([], 'A', '', 3, limit);
  assert.equal(m.setLineQuantity(lines, m.lineKey('A', ''), 0, limit)[0].quantity, 1);
  assert.equal(m.setLineQuantity(lines, m.lineKey('A', ''), -7, limit)[0].quantity, 1);
  assert.equal(m.setLineQuantity(lines, m.lineKey('A', ''), NaN, limit)[0].quantity, 1);
});
await test('a product can be removed, leaving the others', () => {
  let lines = m.addLine(m.addLine([], 'A', '', 1, limit), 'B', '', 2, limit);
  lines = m.removeLine(lines, m.lineKey('A', ''));
  assert.deepEqual(lines, [{ productId: 'B', color: '', quantity: 2 }]);
});

console.log('\nTotals');
await test('line total = price × quantity', () => {
  const { detailed } = cart([{ productId: 'A', color: '', quantity: 3 }]);
  assert.equal(detailed[0].lineTotal, 7500);
});
await test('subtotal = sum of line totals, item count = sum of quantities', () => {
  const { totals } = cart([
    { productId: 'A', color: '', quantity: 2 }, // 5000
    { productId: 'B', color: '', quantity: 3 }, // 4500
  ]);
  assert.deepEqual(totals, { itemCount: 5, subtotal: 9500, unpricedCount: 0 });
});
await test('totals follow every change: add, update, remove', () => {
  let lines = m.addLine([], 'A', '', 1, limit);
  assert.equal(cart(lines).totals.subtotal, 2500);
  lines = m.addLine(lines, 'B', '', 2, limit);
  assert.equal(cart(lines).totals.subtotal, 5500);
  lines = m.setLineQuantity(lines, m.lineKey('A', ''), 4, limit);
  assert.equal(cart(lines).totals.subtotal, 13000);
  lines = m.removeLine(lines, m.lineKey('B', ''));
  assert.deepEqual(cart(lines).totals, { itemCount: 4, subtotal: 10000, unpricedCount: 0 });
  lines = m.removeLine(lines, m.lineKey('A', ''));
  assert.deepEqual(cart(lines).totals, { itemCount: 0, subtotal: 0, unpricedCount: 0 });
});
await test('a product without a price is counted but never added to the subtotal', () => {
  const { detailed, totals } = cart([
    { productId: 'A', color: '', quantity: 1 },
    { productId: 'C', color: '', quantity: 2 },
  ]);
  assert.equal(detailed[1].lineTotal, null);
  assert.deepEqual(totals, { itemCount: 3, subtotal: 2500, unpricedCount: 2 });
  assert.match(m.describeSubtotal(totals), /2 on request/);
});
await test('prices are formatted in BDT', () => {
  const text = m.formatPrice(2500);
  assert.ok(/2,500/.test(text) && /৳|BDT/.test(text), `got "${text}"`);
  assert.equal(m.formatPrice(null), 'Price on request');
});

console.log('\nStock and availability');
await test('availability comes from the stock and available fields', () => {
  assert.equal(m.getAvailability(A).status, 'in-stock');
  assert.equal(m.getAvailability(B).status, 'low-stock');
  assert.equal(m.getAvailability(B).label, 'Only 3 left');
  assert.equal(m.getAvailability(SOLD).status, 'out-of-stock');
  assert.equal(m.getAvailability(OFF).status, 'unavailable');
  assert.equal(m.getAvailability(SOLD).purchasable, false);
  assert.equal(m.getAvailability(OFF).purchasable, false);
});
await test('a cart cannot hold more than the stock', () => {
  let lines = m.addLine([], 'B', '', 2, limit);
  lines = m.addLine(lines, 'B', '', 5, limit);
  assert.equal(lines[0].quantity, 3);
  assert.equal(m.setLineQuantity(lines, m.lineKey('B', ''), 99, limit)[0].quantity, 3);
  assert.equal(cart(lines).detailed[0].limitReason, 'stock');
});
await test('a cart cannot hold more than the per-order maximum', () => {
  const big = make('BIG', { stock: 500 });
  const bigLimit = () => m.getAvailability(big).limit;
  assert.equal(m.addLine([], 'BIG', '', 999, bigLimit)[0].quantity, m.catalogSettings.maxPerOrder);
});
await test('out-of-stock and unavailable products cannot be added', () => {
  assert.deepEqual(m.addLine([], 'SOLD', '', 1, limit), []);
  assert.deepEqual(m.addLine([], 'OFF', '', 1, limit), []);
});
await test('stock is shared across the colours of one product', () => {
  let lines = m.addLine([], 'B', 'Black', 2, limit);
  lines = m.addLine(lines, 'B', 'Gold', 2, limit);
  assert.equal(m.unitsInCart(lines, 'B'), 3);
  assert.equal(m.setLineQuantity(lines, m.lineKey('B', 'Gold'), 3, limit).find((l) => l.color === 'Gold').quantity, 1);
});
await test('a saved cart is repaired: unknown or unavailable products dropped, quantities cut to stock', () => {
  const stored = [
    { productId: 'GHOST', color: '', quantity: 2 },
    { productId: 'SOLD', color: '', quantity: 1 },
    { productId: 'B', color: '', quantity: 999 },
    { productId: 'A', color: '', quantity: 2 },
    { productId: 'A', color: '', quantity: 5 }, // duplicate line
    'rubbish',
    { productId: 'A', color: 7, quantity: 1 },
  ];
  assert.deepEqual(m.sanitizeStoredLines(stored, limit), [
    { productId: 'B', color: '', quantity: 3 },
    { productId: 'A', color: '', quantity: 2 },
  ]);
  assert.deepEqual(m.sanitizeStoredLines('not a cart', limit), []);
});

console.log('\nSearch and category filter');
const shop = [
  make('S1', { name: 'Classic Gold Watch', category: 'gold', description: 'Gold-tone bracelet.', price: 2500, featured: true }),
  make('S2', { name: 'Midnight Black Watch', category: 'black', description: 'Slim mesh bracelet.', price: 1500 }),
  make('S3', { name: 'Silver Steel Watch', category: 'steel', description: 'Sunburst dial.', price: 2000, stock: 0 }),
  make('S4', { name: 'Royal Black Edition', category: 'black', description: 'Black with gold-tone accents.', price: 3000 }),
];
const names = (list) => list.map((p) => p.name);
await test('search matches the product name', () => {
  assert.deepEqual(names(m.queryProducts(shop, { search: 'silver' })), ['Silver Steel Watch']);
});
await test('search ignores upper/lower case and matches every word', () => {
  assert.deepEqual(names(m.queryProducts(shop, { search: 'BLACK edition' })), ['Royal Black Edition']);
});
await test('search also looks in descriptions, categories and product IDs', () => {
  assert.deepEqual(names(m.queryProducts(shop, { search: 'mesh' })), ['Midnight Black Watch']);
  assert.deepEqual(names(m.queryProducts(shop, { search: 'steel' })), ['Silver Steel Watch']);
  assert.deepEqual(names(m.queryProducts(shop, { search: 's4' })), ['Royal Black Edition']);
});
await test('search with no match returns nothing; empty search returns everything', () => {
  assert.equal(m.queryProducts(shop, { search: 'zzzz' }).length, 0);
  assert.equal(m.queryProducts(shop, { search: '   ' }).length, 4);
});
await test('category filter returns only that category', () => {
  assert.deepEqual(names(m.queryProducts(shop, { category: 'black' })), ['Midnight Black Watch', 'Royal Black Edition']);
  assert.deepEqual(names(m.queryProducts(shop, { category: 'gold' })), ['Classic Gold Watch']);
  assert.equal(m.queryProducts(shop, { category: 'all' }).length, 4);
});
await test('search and category filter combine', () => {
  assert.deepEqual(names(m.queryProducts(shop, { category: 'black', search: 'gold' })), ['Royal Black Edition']);
  assert.equal(m.queryProducts(shop, { category: 'steel', search: 'gold' }).length, 0);
});
await test('"in stock only" hides products that cannot be ordered', () => {
  assert.deepEqual(names(m.queryProducts(shop, { stock: 'in-stock' })), ['Classic Gold Watch', 'Midnight Black Watch', 'Royal Black Edition']);
});
await test('price sorting works both ways', () => {
  assert.deepEqual(m.queryProducts(shop, { sort: 'price-asc' }).map((p) => p.price), [1500, 2000, 2500, 3000]);
  assert.deepEqual(m.queryProducts(shop, { sort: 'price-desc' }).map((p) => p.price), [3000, 2500, 2000, 1500]);
});

console.log('\nCatalogue data');
await test('the catalogue in src/data/products.ts has no mistakes', () => {
  assert.deepEqual(m.validateCatalog(m.products, m.categories), []);
});
await test('every product has the required fields', () => {
  for (const p of m.products) {
    assert.equal(typeof p.id, 'string');
    assert.equal(typeof p.name, 'string');
    assert.ok(p.price === null || typeof p.price === 'number');
    assert.equal(typeof p.description, 'string');
    assert.ok(m.getCategory(p.category), `${p.name}: unknown category`);
    assert.equal(typeof p.image, 'string');
    assert.ok(Number.isInteger(p.stock));
    assert.equal(typeof p.available, 'boolean');
  }
});
await test('every product has its own page address', () => {
  const slugs = m.products.map(m.productSlug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const p of m.products) assert.equal(m.getProductBySlug(m.productSlug(p)), p);
});
await test('the checker catches common editing mistakes', () => {
  const cats = [{ id: 'gold', name: 'Gold', tagline: '', description: '', image: '/x.jpg' }];
  const bad = [
    make('X1'),
    make('X1', { name: 'Other' }), // duplicate id
    make('X2', { price: '2,500' }), // price as text
    make('X3', { category: 'platinum' }), // unknown category
    make('X4', { stock: -1 }), // negative stock
    make('X5', { available: 'yes' }), // not true/false
  ];
  const problems = m.validateCatalog(bad, cats).join('\n');
  for (const expected of [/already used/, /price must be/, /does not exist/, /stock must be/, /available must be/]) assert.match(problems, expected);
  assert.deepEqual(m.validateCatalog([make('OK')], cats), []);
});

console.log('\nWhatsApp order');
const customer = { name: '  Rahim   Uddin ', phone: '01700 000000', address: 'House 1, Road 2\nDhanmondi\n\nDhaka', notes: 'Please call before delivery.' };
const orderLines = [
  { productId: 'A', color: '', quantity: 2 }, // 2 × 2,500 = 5,000
  { productId: 'B', color: '', quantity: 3 }, // 3 × 1,500 = 4,500
];
const order = cart(orderLines);
const text = m.buildOrderMessage(order.detailed, order.totals, customer);
await test('message contains the customer name, phone number and delivery address', () => {
  assert.match(text, /^Name: Rahim Uddin$/m);
  assert.match(text, /^Phone: 01700 000000$/m);
  assert.match(text, /^Delivery address: House 1, Road 2, Dhanmondi, Dhaka$/m);
});
await test('message lists every product with its name, quantity and price', () => {
  assert.match(text, /1\. \*Watch A\* \(A\)\n {3}Quantity: 2\n {3}Price: BDT 2,500 each\n {3}Line total: BDT 5,000/);
  assert.match(text, /2\. \*Watch B\* \(B\)\n {3}Quantity: 3\n {3}Price: BDT 1,500 each\n {3}Line total: BDT 4,500/);
});
await test('message contains the order subtotal in BDT', () => {
  assert.match(text, /^Items: 5$/m);
  assert.match(text, /^\*Subtotal: BDT 9,500\*$/m);
});
await test('message contains the order notes, or "None" when there are none', () => {
  assert.match(text, /\*Order notes\*\nPlease call before delivery\./);
  const empty = m.buildOrderMessage(order.detailed, order.totals, { ...customer, notes: '   ' });
  assert.match(empty, /\*Order notes\*\nNone/);
});
await test('message is worded as a request and never claims the order is confirmed or paid', () => {
  assert.match(text, /NEW ORDER REQUEST/);
  assert.match(text, /not confirmed or paid yet/);
  // Remove the two honest phrases, then make sure no claim is left anywhere else.
  const claims = text.replace(/not confirmed or paid yet/g, '').replace(/to be confirmed/g, '');
  assert.doesNotMatch(claims, /\b(confirmed|paid|payment received|order placed|thank you for your order)\b/i);
});
await test('products priced "on request" are shown honestly in the message', () => {
  const mixed = cart([{ productId: 'A', color: '', quantity: 1 }, { productId: 'C', color: '', quantity: 2 }]);
  const mixedText = m.buildOrderMessage(mixed.detailed, mixed.totals, customer);
  assert.match(mixedText, /\*Watch C\* \(C\)\n {3}Quantity: 2\n {3}Price: on request/);
  assert.match(mixedText, /\*Subtotal: BDT 2,500 \+ 2 items priced on request\*/);
});
await test('the form requires name, phone and address; notes are optional', () => {
  assert.deepEqual(Object.keys(m.validateCustomer(m.EMPTY_CUSTOMER)).sort(), ['address', 'name', 'phone']);
  assert.deepEqual(m.validateCustomer({ name: 'Rahim', phone: '01700000000', address: 'House 1, Dhaka', notes: '' }), {});
});
await test('the form rejects phone numbers that cannot be real', () => {
  const base = { name: 'Rahim', address: 'House 1, Dhaka', notes: '' };
  assert.ok(m.validateCustomer({ ...base, phone: '12345' }).phone);
  assert.ok(m.validateCustomer({ ...base, phone: 'call me' }).phone);
  assert.ok(m.validateCustomer({ ...base, phone: '0170000000012345678' }).phone);
  assert.equal(m.validateCustomer({ ...base, phone: '+880 1700-000000' }).phone, undefined);
});
await test('over-long text is cut so the WhatsApp link stays a safe length', () => {
  const long = m.cleanCustomer({ name: 'x'.repeat(500), phone: '01700000000', address: 'y'.repeat(2000), notes: 'z'.repeat(5000) });
  assert.equal(long.name.length, 80);
  assert.equal(long.address.length, 300);
  assert.equal(long.notes.length, 500);
});
await test('the shipped WhatsApp number is a placeholder, not an invented number', () => {
  assert.equal(m.site.contact.whatsapp, m.WHATSAPP_NUMBER_PLACEHOLDER);
  assert.equal(m.getWhatsAppNumber(), '');
  assert.equal(m.hasWhatsAppNumber(), false);
});
await test('a placeholder or unusable number never becomes a WhatsApp recipient', () => {
  for (const bad of ['', '   ', m.WHATSAPP_NUMBER_PLACEHOLDER, '+880 1XXX-XXXXXX', 'your number here', '12345', '1'.repeat(16)]) {
    assert.equal(m.normalizeWhatsAppNumber(bad), '', `"${bad}" should not be accepted`);
  }
});
// The numbers below are made-up test values (all zeros), not anyone's real number.
await test('a real number is accepted in the usual ways of writing it', () => {
  assert.equal(m.normalizeWhatsAppNumber('8801000000000'), '8801000000000');
  assert.equal(m.normalizeWhatsAppNumber('+880 1000-000000'), '8801000000000');
  assert.equal(m.normalizeWhatsAppNumber('008801000000000'), '8801000000000');
  assert.equal(m.normalizeWhatsAppNumber('01000000000', '880'), '8801000000000');
});
await test('the WhatsApp link carries the number and the whole message', () => {
  const url = m.buildWhatsAppLink('8801000000000', text);
  assert.ok(url.startsWith('https://wa.me/8801000000000?text='));
  assert.equal(decodeURIComponent(url.split('?text=')[1]), text);
  assert.ok(m.buildWhatsAppLink('', text).startsWith('https://wa.me/?text='));
});
await test('customer text cannot break out of the link', () => {
  const odd = m.buildOrderMessage(order.detailed, order.totals, { ...customer, notes: 'a&b=c #1 ?x=1 "quoted" 100% বাংলা' });
  const url = m.buildWhatsAppLink('8801000000000', odd);
  assert.equal(url.split('?').length, 2);
  assert.ok(!/[&#"\s]/.test(url.split('?text=')[1]));
  assert.equal(decodeURIComponent(url.split('?text=')[1]), odd);
});

console.log('\nPayments');
// Made-up settings for the tests: a gateway that LOOKS configured, pointing at addresses that do not exist.
const readySettings = {
  ...m.payments,
  gateway: { ...m.payments.gateway, enabled: true, apiBaseUrl: 'https://api.test.invalid/', allowedRedirectHosts: ['pay.test.invalid'] },
};
const sessionRequest = { items: [{ productId: 'WG-001', color: '', quantity: 1 }], customer: { name: 'Rahim', phone: '01700000000', address: 'House 1, Dhaka', notes: '' } };
const answer = (body, status = 200) => async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
const neverCalled = async () => {
  throw new Error('the network must not be used');
};
const rejectsWith = async (promise, code) => {
  try {
    await promise;
  } catch (error) {
    assert.equal(error.code, code);
    return;
  }
  assert.fail(`expected a "${code}" error`);
};

await test('as shipped: Cash on Delivery (demo) and manual payment can be chosen, online payment cannot', () => {
  const methods = m.getPaymentMethods();
  assert.deepEqual(methods.map((x) => [x.id, x.available]), [['cod', true], ['manual', true], ['online', false]]);
  assert.equal(methods[0].badge, 'Demo option');
  assert.equal(methods[2].badge, 'Not available yet');
  assert.equal(m.getDefaultMethodId(methods), 'cod');
  assert.equal(m.isGatewayReady(), false);
});
await test('as shipped: no gateway address, no redirect hosts, gateway switched off', () => {
  assert.equal(m.payments.gateway.enabled, false);
  assert.equal(m.payments.gateway.apiBaseUrl, '');
  assert.deepEqual(m.payments.gateway.allowedRedirectHosts, []);
});
await test('switching a method off removes it; an unavailable default falls back to an available one', () => {
  const noCod = m.getPaymentMethods({ ...m.payments, cashOnDelivery: { ...m.payments.cashOnDelivery, enabled: false } });
  assert.deepEqual(noCod.map((x) => x.id), ['manual', 'online']);
  assert.equal(m.getDefaultMethodId(noCod, 'cod'), 'manual');
  assert.equal(m.getDefaultMethodId(noCod, 'online'), 'manual');
  const hidden = m.getPaymentMethods({ ...m.payments, gateway: { ...m.payments.gateway, showWhenUnavailable: false } });
  assert.deepEqual(hidden.map((x) => x.id), ['cod', 'manual']);
  assert.equal(m.getDefaultMethodId([]), null);
});
await test('manual payment instructions and account details come from the settings file', () => {
  const edited = { ...m.payments, manual: { ...m.payments.manual, instructions: ['Step one', '  ', 'Step two'], details: [{ label: 'Account', value: '' }, { label: ' ', value: 'x' }] } };
  const manual = m.getPaymentMethods(edited).find((x) => x.id === 'manual');
  assert.deepEqual(manual.instructions, ['Step one', 'Step two']);
  assert.deepEqual(manual.details, [{ label: 'Account', value: '' }]);
});
await test('the gateway counts as ready only when switched on with an https address and a redirect host', () => {
  const g = (patch) => ({ ...m.payments, gateway: { ...readySettings.gateway, ...patch } });
  assert.equal(m.isGatewayReady(readySettings), true);
  assert.equal(m.isGatewayReady(g({ enabled: false })), false);
  assert.equal(m.isGatewayReady(g({ apiBaseUrl: '' })), false);
  assert.equal(m.isGatewayReady(g({ apiBaseUrl: 'http://api.test.invalid' })), false);
  assert.equal(m.isGatewayReady(g({ allowedRedirectHosts: [] })), false);
  assert.equal(m.isGatewayReady(g({ allowedRedirectHosts: ['  '] })), false);
});
await test('while the gateway is off, starting a payment or reading a status refuses without using the network', async () => {
  await rejectsWith(m.createPaymentSession(sessionRequest, m.payments, neverCalled), 'not_configured');
  await rejectsWith(m.getPaymentStatus('WG-1', m.payments, neverCalled), 'not_configured');
});
await test('customers are only ever sent to an approved https payment page', () => {
  assert.equal(m.isAllowedRedirect('https://pay.test.invalid/checkout/abc', readySettings), true);
  for (const bad of ['http://pay.test.invalid/x', 'https://evil.test.invalid/x', 'https://pay.test.invalid.evil.example/x', 'https://evil.example/?https://pay.test.invalid', 'javascript:alert(1)', '/payment/return?order=1', '']) {
    assert.equal(m.isAllowedRedirect(bad, readySettings), false, `"${bad}" must be refused`);
  }
  assert.equal(m.isAllowedRedirect('https://pay.test.invalid/x'), false, 'nothing is approved as shipped');
});
await test('a payment session answer is refused unless it is complete and points at an approved page', async () => {
  const ok = await m.createPaymentSession(sessionRequest, readySettings, answer({ orderId: 'WG-1', redirectUrl: 'https://pay.test.invalid/s/1' }));
  assert.deepEqual(ok, { orderId: 'WG-1', redirectUrl: 'https://pay.test.invalid/s/1' });
  await rejectsWith(m.createPaymentSession(sessionRequest, readySettings, answer({ orderId: 'WG-1', redirectUrl: 'https://evil.example/s/1' })), 'invalid_response');
  await rejectsWith(m.createPaymentSession(sessionRequest, readySettings, answer({ redirectUrl: 'https://pay.test.invalid/s/1' })), 'invalid_response');
  await rejectsWith(m.createPaymentSession(sessionRequest, readySettings, answer('not json')), 'invalid_response');
  await rejectsWith(m.createPaymentSession(sessionRequest, readySettings, answer({ error: 'gateway_not_connected' }, 501)), 'rejected');
  await rejectsWith(m.createPaymentSession(sessionRequest, readySettings, neverCalled), 'network');
});
await test('the request to the backend carries items and customer only: no prices, no card data, no cookies', async () => {
  let seen;
  const spy = async (url, init) => {
    seen = { url, init };
    return new Response(JSON.stringify({ orderId: 'WG-1', redirectUrl: 'https://pay.test.invalid/s/1' }));
  };
  await m.createPaymentSession(sessionRequest, readySettings, spy);
  assert.equal(seen.url, 'https://api.test.invalid/api/payments/session');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.credentials, 'omit');
  assert.deepEqual(JSON.parse(seen.init.body), sessionRequest);
  assert.doesNotMatch(seen.init.body, /price|total|amount|card|cvv|cvc|expiry/i);
});
await test('a payment is reported as paid only on a clear answer for the same order', async () => {
  assert.equal(await m.getPaymentStatus('WG-1', readySettings, answer({ orderId: 'WG-1', status: 'paid' })), 'paid');
  assert.equal(await m.getPaymentStatus('WG-1', readySettings, answer({ orderId: 'WG-2', status: 'paid' })), 'unknown');
  assert.equal(await m.getPaymentStatus('WG-1', readySettings, answer({ status: 'paid' })), 'unknown');
  assert.equal(await m.getPaymentStatus('WG-1', readySettings, answer({ orderId: 'WG-1', status: 'PAID' })), 'unknown');
  assert.equal(await m.getPaymentStatus('WG-1', readySettings, answer({ orderId: 'WG-1', status: 'success' })), 'unknown');
  assert.equal(await m.getPaymentStatus('WG-1', readySettings, answer({ orderId: 'WG-1', paid: true })), 'unknown');
  assert.equal(await m.getPaymentStatus('WG-1', readySettings, answer(null)), 'unknown');
  await rejectsWith(m.getPaymentStatus('WG-1', readySettings, answer({ orderId: 'WG-1', status: 'paid' }, 500)), 'rejected');
  await rejectsWith(m.getPaymentStatus('WG-1', readySettings, answer('<html>paid</html>')), 'invalid_response');
});
await test('the order message names the chosen payment method and says it is not paid', () => {
  for (const method of m.getPaymentMethods().filter((x) => x.kind === 'offline')) {
    const withPayment = m.buildOrderMessage(order.detailed, order.totals, customer, { method: method.messageLabel });
    assert.ok(withPayment.includes('*Payment*'));
    assert.ok(withPayment.includes(`Method: ${method.messageLabel}`));
    assert.ok(withPayment.includes('Status: Not paid'));
    assert.ok(withPayment.indexOf('*Payment*') < withPayment.indexOf('This is an order request'));
    // Apart from the honest phrases, nothing in the message may claim a payment or a confirmation.
    const claims = withPayment.replace(/not confirmed or paid yet/g, '').replace(/to be confirmed/g, '').replace(/Status: Not paid/g, '').replace(/please confirm it is available/g, '');
    assert.doesNotMatch(claims, /\b(confirmed|paid|payment received|order placed|thank you for your order)\b/i);
  }
  assert.ok(!text.includes('*Payment*'), 'no payment block when no method is passed');
});
await test('Cash on Delivery is labelled as a demo option in the order message', () => {
  const cod = m.getPaymentMethods().find((x) => x.id === 'cod');
  assert.match(m.buildOrderMessage(order.detailed, order.totals, customer, { method: cod.messageLabel }), /Method: Cash on Delivery \(demo option/);
});

console.log('\nPayment backend (server/lib)');
const backendCatalogue = { currency: 'BDT', maxPerOrder: 10, products: [
  { id: 'T-1', name: 'Test One', price: 2500, stock: 10, available: true },
  { id: 'T-2', name: 'Test Two', price: 2000, stock: 3, available: true },
  { id: 'T-3', name: 'Test Off', price: 1000, stock: 5, available: false },
  { id: 'T-4', name: 'Test No Price', price: null, stock: 5, available: true },
] };
const orderError = (fn, code) => assert.throws(fn, (error) => error.code === code);
await test('the backend prices an order from its own catalogue and ignores any price from the browser', () => {
  const priced = backend.priceOrder([{ productId: 'T-1', quantity: 2, price: 1, lineTotal: 1 }, { productId: 'T-2', quantity: 1, unitPrice: 0 }], backendCatalogue);
  assert.equal(priced.total, 7000);
  assert.equal(priced.currency, 'BDT');
  assert.deepEqual(priced.lines.map((line) => line.unitPrice), [2500, 2000]);
});
await test('the backend refuses orders it cannot sell exactly as requested', () => {
  orderError(() => backend.priceOrder([], backendCatalogue), 'empty_order');
  orderError(() => backend.priceOrder('x', backendCatalogue), 'empty_order');
  orderError(() => backend.priceOrder([{ productId: 'NOPE', quantity: 1 }], backendCatalogue), 'unknown_product');
  orderError(() => backend.priceOrder([{ productId: 'T-3', quantity: 1 }], backendCatalogue), 'unavailable');
  orderError(() => backend.priceOrder([{ productId: 'T-4', quantity: 1 }], backendCatalogue), 'no_price');
  orderError(() => backend.priceOrder([{ productId: 'T-2', quantity: 4 }], backendCatalogue), 'over_limit');
  orderError(() => backend.priceOrder([{ productId: 'T-2', quantity: 2 }, { productId: 'T-2', quantity: 2 }], backendCatalogue), 'over_limit');
  orderError(() => backend.priceOrder([{ productId: 'T-1', quantity: 11 }], backendCatalogue), 'over_limit');
  for (const quantity of [0, -1, 1.5, '2', null, NaN]) orderError(() => backend.priceOrder([{ productId: 'T-1', quantity }], backendCatalogue), 'bad_quantity');
});
await test('the backend requires a name, phone number and address', () => {
  assert.deepEqual(backend.cleanCustomer({ name: ' Rahim ', phone: '01700 000000', address: 'House 1,\nDhaka' }), { name: 'Rahim', phone: '01700 000000', address: 'House 1, Dhaka', notes: '' });
  orderError(() => backend.cleanCustomer(undefined), 'bad_customer');
  orderError(() => backend.cleanCustomer({ name: 'Rahim', phone: '123', address: 'House 1, Dhaka' }), 'bad_customer');
});
await test('backend settings: with nothing set, credentials are reported missing by name only', () => {
  const empty = backendConfig.loadConfig({});
  assert.equal(empty.credentialsPresent, false);
  assert.ok(empty.missing.includes('PAYMENT_MERCHANT_SECRET'));
  assert.equal(empty.sandbox, true);
  const filled = backendConfig.loadConfig({ FRONTEND_ORIGIN: 'https://a.test', PUBLIC_API_URL: 'https://b.test', PAYMENT_PROVIDER: 'x', PAYMENT_MERCHANT_ID: 'id', PAYMENT_MERCHANT_SECRET: 'not-a-real-value', PAYMENT_WEBHOOK_SECRET: 'not-a-real-value' });
  assert.equal(filled.credentialsPresent, true);
  assert.ok(!JSON.stringify(filled).includes('not-a-real-value'), 'secrets must not be part of the plain config object');
});

console.log(`\n${failures.length === 0 ? '✔' : '✖'} ${passed} passed, ${failures.length} failed\n`);
process.exit(failures.length === 0 ? 0 : 1);
