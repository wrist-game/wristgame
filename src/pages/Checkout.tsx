import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PaymentMethodSelector } from '../components/checkout/PaymentMethodSelector';
import { DemoNotice } from '../components/product/Price';
import { Button } from '../components/ui/Button';
import { TextAreaField, TextField } from '../components/ui/Field';
import { ArrowRightIcon, CheckIcon, InfoIcon, WhatsAppIcon } from '../components/ui/Icons';
import { PageHeader } from '../components/ui/PageHeader';
import { site } from '../config/site';
import { useCart } from '../context/CartContext';
import { policies } from '../data/content';
import { useSeo } from '../hooks/useSeo';
import { thumbnail } from '../lib/catalog';
import { formatPrice } from '../lib/format';
import { buildOrderMessage, cleanCustomer, EMPTY_CUSTOMER, ORDER_FIELD_LIMITS, validateCustomer, type OrderCustomer, type OrderErrors } from '../lib/order';
import { createPaymentSession } from '../lib/payments/gatewayClient';
import { getDefaultMethodId, getPaymentMethods } from '../lib/payments/methods';
import type { PaymentMethodId } from '../lib/payments/types';
import { hasWhatsAppNumber, whatsappLink } from '../lib/whatsapp';
import { OrderSummaryRows } from './Cart';

/** The order in which invalid fields receive focus. */
const REQUIRED_FIELDS: (keyof OrderCustomer)[] = ['name', 'phone', 'address'];

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or clipboard access blocked: fall back to a hidden text box.
    try {
      const box = document.createElement('textarea');
      box.value = text;
      box.setAttribute('readonly', '');
      box.style.position = 'fixed';
      box.style.opacity = '0';
      document.body.appendChild(box);
      box.select();
      const ok = document.execCommand('copy');
      box.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Checkout = WhatsApp order request.
 * The customer fills in the form, chooses how they will pay, and presses "Order on WhatsApp".
 * WhatsApp opens with the order written out, and the customer sends it. There is deliberately
 * no card form and no "order confirmed" screen: this page cannot know whether the message was
 * sent, and an order only exists once the business replies.
 *
 * Payment methods come from src/config/payments.ts. Cash on Delivery and manual payment are
 * offline: nothing is charged here. The online gateway is switched off; when it is connected,
 * this page hands the order to the backend and sends the customer to the provider's own page
 * (src/lib/payments/gatewayClient.ts). No card details are ever typed or stored on this site.
 */
export default function Checkout() {
  useSeo({ title: 'Checkout', noIndex: true });
  const { lines, totals, clear } = useCart();
  const [values, setValues] = useState<OrderCustomer>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<OrderErrors>({});
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null);

  const methods = useMemo(() => getPaymentMethods(), []);
  const [methodId, setMethodId] = useState<PaymentMethodId | null>(() => getDefaultMethodId(methods));
  const [methodError, setMethodError] = useState<string>();
  const [gatewayState, setGatewayState] = useState<'idle' | 'starting' | 'failed'>('idle');
  const method = methods.find((option) => option.id === methodId && option.available);
  const mustChoose = methods.some((option) => option.available);
  const payOnline = method?.kind === 'gateway';

  const message = useMemo(
    () => buildOrderMessage(lines, totals, values, method && method.kind === 'offline' ? { method: method.messageLabel } : undefined),
    [lines, totals, values, method],
  );
  const link = whatsappLink(message);
  const numberIsSet = hasWhatsAppNumber();

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(null), 2600);
    return () => window.clearTimeout(id);
  }, [copied]);

  const set = (key: keyof OrderCustomer) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const choose = (id: PaymentMethodId) => {
    setMethodId(id);
    setMethodError(undefined);
    setGatewayState('idle');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateCustomer(values);
    setErrors(found);
    const firstInvalid = REQUIRED_FIELDS.find((key) => found[key]);
    if (firstInvalid) {
      document.getElementById(`checkout-${firstInvalid}`)?.focus();
      return;
    }
    if (mustChoose && !method) {
      setMethodError('Please choose a payment method.');
      document.querySelector<HTMLInputElement>('.pay-method input:not(:disabled)')?.focus();
      return;
    }

    if (payOnline) {
      // Online payment: the backend creates the order and the payment session, then the customer
      // continues on the provider's page. Reaching that page does not mean anything was paid.
      setGatewayState('starting');
      try {
        const session = await createPaymentSession({
          items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity, color: line.color })),
          customer: cleanCustomer(values),
        });
        window.location.assign(session.redirectUrl);
      } catch {
        setGatewayState('failed');
      }
      return;
    }

    window.open(link, '_blank', 'noopener,noreferrer');
    setOpened(true);
  };

  const onCopy = async () => setCopied((await copyText(message)) ? 'yes' : 'failed');

  if (lines.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Checkout" title="Checkout" crumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
        <section className="section section--flush-top">
          <div className="container container--narrow empty-state">
            <h2 className="display-title display-title--sm">{opened ? 'Your cart has been cleared' : 'There is nothing to order yet'}</h2>
            <p>{opened ? 'If you sent your order on WhatsApp, WristGame will reply there. An order is only confirmed in that reply.' : 'Add a watch to your cart first.'}</p>
            <Button to="/shop" icon={<ArrowRightIcon />}>
              Shop Collection
            </Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title="Order on WhatsApp"
        intro="Fill in your details, then send your order to WristGame on WhatsApp. Nothing is confirmed or charged on this website."
        crumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]}
      />

      <section className="section section--flush-top" aria-label="Checkout">
        <div className="container cart-layout">
          <div className="panel">
            <h2 className="display-title display-title--sm">Your details</h2>
            <form className="form" onSubmit={onSubmit} noValidate>
              <div className="form__row">
                <TextField
                  id="checkout-name"
                  label="Customer name"
                  value={values.name}
                  onChange={set('name')}
                  error={errors.name}
                  autoComplete="name"
                  maxLength={ORDER_FIELD_LIMITS.name}
                  required
                />
                <TextField
                  id="checkout-phone"
                  label="Phone number"
                  type="tel"
                  inputMode="tel"
                  value={values.phone}
                  onChange={set('phone')}
                  error={errors.phone}
                  autoComplete="tel"
                  maxLength={ORDER_FIELD_LIMITS.phone}
                  required
                />
              </div>
              <TextAreaField
                id="checkout-address"
                label="Delivery address"
                rows={3}
                value={values.address}
                onChange={set('address')}
                error={errors.address}
                hint="House, road, area and city."
                autoComplete="street-address"
                maxLength={ORDER_FIELD_LIMITS.address}
                required
              />
              <TextAreaField
                id="checkout-notes"
                label="Order notes"
                rows={3}
                value={values.notes}
                onChange={set('notes')}
                hint="Anything we should know, such as a preferred delivery time."
                maxLength={ORDER_FIELD_LIMITS.notes}
                optional
              />

              {methods.length > 0 && <PaymentMethodSelector methods={methods} value={methodId} onChange={choose} error={methodError} />}

              <div className="payment-note">
                <h3>Payment</h3>
                <p>{policies.payment}</p>
              </div>

              {!numberIsSet && !payOnline && (
                <p className="demo-notice order-alert" role="note">
                  <InfoIcon />
                  <span>
                    <strong>WhatsApp number not set.</strong> This store&rsquo;s WhatsApp number is still a placeholder, so the order message opens in WhatsApp
                    without a recipient and cannot reach {site.name} yet.
                    {site.showSetupNotes && (
                      <>
                        {' '}
                        Store owner: add your number to <code>contact.whatsapp</code> in <code>src/config/site.ts</code>.
                      </>
                    )}
                  </span>
                </p>
              )}

              <div className="form__actions">
                {payOnline ? (
                  <Button type="submit" size="lg" icon={<ArrowRightIcon />} className="order-button" disabled={gatewayState === 'starting'}>
                    {gatewayState === 'starting' ? 'Opening secure payment…' : 'Continue to secure payment'}
                  </Button>
                ) : (
                  <Button type="submit" variant="whatsapp" size="lg" icon={<WhatsAppIcon />} iconPosition="start" className="order-button">
                    Order on WhatsApp
                  </Button>
                )}
                <Link to="/cart" className="text-link">
                  Back to cart
                </Link>
              </div>

              {payOnline && gatewayState === 'failed' && (
                <p className="form__status form__status--error" role="alert">
                  Online payment could not be started, so nothing has been paid. Please try again, or choose another payment method.
                </p>
              )}

              <details className="order-preview" hidden={payOnline}>
                <summary>Preview the WhatsApp message</summary>
                <pre className="order-preview__text" tabIndex={0} aria-label="Order message preview">
                  {message}
                </pre>
                <p className="order-preview__hint">Words between *stars* appear in bold in WhatsApp.</p>
              </details>

              <div aria-live="polite">
                {opened && (
                  <div className="form__status order-status">
                    <p>
                      WhatsApp has opened in a new tab with your order written out. <strong>Press Send in WhatsApp to submit it.</strong>
                    </p>
                    <p>
                      Your order has not been placed, confirmed or paid on this page. {site.name} will reply on WhatsApp about availability, delivery and payment.
                    </p>
                    <div className="order-status__actions">
                      <a className="text-link" href={link} target="_blank" rel="noopener noreferrer">
                        WhatsApp did not open? Open it again
                      </a>
                      <button type="button" className="text-link" onClick={onCopy}>
                        {copied === 'yes' ? (
                          <>
                            <CheckIcon /> Message copied
                          </>
                        ) : copied === 'failed' ? (
                          'Could not copy. Use the preview above'
                        ) : (
                          'Copy the order message'
                        )}
                      </button>
                      <button type="button" className="text-link text-link--muted order-status__clear" onClick={clear}>
                        I have sent it. Clear my cart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          <section className="panel order-summary" aria-labelledby="checkout-summary">
            <h2 className="display-title display-title--sm" id="checkout-summary">
              Order summary
            </h2>
            <ul className="summary-lines">
              {lines.map((line) => (
                <li key={line.key}>
                  <img src={thumbnail(line.product.image)} alt="" width={64} height={64} loading="lazy" decoding="async" />
                  <div>
                    <p className="summary-lines__name">{line.product.name}</p>
                    <p className="summary-lines__meta">
                      {line.color ? `${line.color} · ` : ''}
                      {line.quantity} × {formatPrice(line.product.price)}
                    </p>
                  </div>
                  <p className={`summary-lines__price ${line.lineTotal === null ? 'is-request' : ''}`}>{formatPrice(line.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <OrderSummaryRows totals={totals} />
            {method && (
              <dl className="summary-rows summary-rows--payment">
                <div>
                  <dt>Payment</dt>
                  <dd>{method.label}</dd>
                </div>
                <div>
                  <dt>Payment status</dt>
                  <dd className="is-muted">Not paid</dd>
                </div>
              </dl>
            )}
            <DemoNotice>Totals are calculated from placeholder prices and are not real amounts.</DemoNotice>
            {totals.unpricedCount > 0 && <p className="order-summary__note">Prices on request are confirmed with you before anything is charged.</p>}
            <p className="order-summary__note">
              <Link to="/cart" className="text-link">
                Edit cart
              </Link>
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
