// Reads the backend's settings from environment variables (see ../.env.example).
// Secrets are read here and nowhere else, and are never sent to the browser or written to logs.

const REQUIRED_FOR_GATEWAY = ['FRONTEND_ORIGIN', 'PUBLIC_API_URL', 'PAYMENT_PROVIDER', 'PAYMENT_MERCHANT_ID', 'PAYMENT_MERCHANT_SECRET', 'PAYMENT_WEBHOOK_SECRET'];

export function loadConfig(env = process.env) {
  const read = (name) => String(env[name] ?? '').trim();
  const missing = REQUIRED_FOR_GATEWAY.filter((name) => read(name) === '');
  return {
    port: Number(read('PORT')) || 8787,
    frontendOrigin: read('FRONTEND_ORIGIN'),
    publicApiUrl: read('PUBLIC_API_URL'),
    provider: read('PAYMENT_PROVIDER'),
    sandbox: read('PAYMENT_SANDBOX').toLowerCase() !== 'false',
    /** Names of the settings that are still empty. Names only, never values. */
    missing,
    /** True once every credential has been provided. */
    credentialsPresent: missing.length === 0,
    /** Call only where a secret is actually needed, and never log the result. */
    secrets: () => ({
      merchantId: read('PAYMENT_MERCHANT_ID'),
      merchantSecret: read('PAYMENT_MERCHANT_SECRET'),
      webhookSecret: read('PAYMENT_WEBHOOK_SECRET'),
    }),
  };
}
