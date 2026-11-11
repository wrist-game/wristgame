// Part of `npm run check` — looks at the business settings in src/config/site.ts.
// A missing WhatsApp number is a warning (the site still builds); a mistyped one stops the build.
import { load } from './bundle.mjs';

const { site, WHATSAPP_NUMBER_PLACEHOLDER, normalizeWhatsAppNumber } = await load(`
  export { site, WHATSAPP_NUMBER_PLACEHOLDER } from './src/config/site';
  export { normalizeWhatsAppNumber } from './src/lib/whatsapp';
`);

const raw = String(site.contact.whatsapp ?? '').trim();
const number = normalizeWhatsAppNumber(raw, site.contact.countryCode);

if (!raw || raw === WHATSAPP_NUMBER_PLACEHOLDER) {
  console.log('⚠ WhatsApp number: not set (still the placeholder).');
  console.log('  Orders open in WhatsApp without a recipient, and checkout shows a "number not set" notice.');
  console.log('  Add your number to contact.whatsapp in src/config/site.ts.');
} else if (!number) {
  console.error(`\n✖ WhatsApp number "${raw}" in src/config/site.ts is not a usable phone number.`);
  console.error('  Write it with the country code first, for example 880 followed by your mobile number without its leading 0.');
  console.error(`  To go back to "not set", use the placeholder ${WHATSAPP_NUMBER_PLACEHOLDER}.\n`);
  process.exit(1);
} else {
  console.log(`✔ WhatsApp orders go to +${number} (https://wa.me/${number}).`);
  if (number !== raw.replace(/\D/g, '')) console.log(`  (You typed "${raw}"; the country code was added automatically.)`);
}
