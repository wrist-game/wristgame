import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { WhatsAppButton } from '../components/ui/Contact';
import { ArrowRightIcon } from '../components/ui/Icons';
import { PageHeader } from '../components/ui/PageHeader';
import { site } from '../config/site';
import { useCart } from '../context/CartContext';
import { useSeo } from '../hooks/useSeo';
import { getPaymentStatus } from '../lib/payments/gatewayClient';
import { isGatewayReady } from '../lib/payments/methods';
import type { PaymentStatus } from '../lib/payments/types';

type View = PaymentStatus | 'checking' | 'unavailable' | 'no-reference';

const COPY: Record<Exclude<View, 'checking'>, { title: string; text: string }> = {
  paid: {
    title: 'Payment received',
    text: 'The payment provider has confirmed this payment. WristGame will contact you about delivery.',
  },
  pending: {
    title: 'Payment is still being checked',
    text: 'The payment provider has not confirmed this payment yet. Please do not pay again. Check again in a moment.',
  },
  failed: {
    title: 'Payment was not completed',
    text: 'The payment provider reported that this payment did not go through. Your order has not been paid.',
  },
  cancelled: {
    title: 'Payment was cancelled',
    text: 'The payment was cancelled before it was completed. Your order has not been paid.',
  },
  unknown: {
    title: 'We could not confirm this payment',
    text: 'We could not get an answer about this payment. That does not mean it succeeded or failed. Please do not pay again: check again in a moment, or contact WristGame with your order reference.',
  },
  unavailable: {
    title: 'Online payment is not available',
    text: 'This website does not take online payments yet, so no payment has been made here. Orders are placed on WhatsApp.',
  },
  'no-reference': {
    title: 'No order to check',
    text: 'This page needs an order reference to check a payment, and none was given. No payment has been made here.',
  },
};

/**
 * Where a payment provider sends the customer back to after its hosted page:
 *   /payment/return?order=<the backend's order reference>
 *
 * The page shows ONLY what the backend reports after verifying with the provider.
 * It never reads a result from the address bar (a "status=success" there would be
 * trivial to fake), and anything unclear is shown as "could not confirm".
 */
export default function PaymentReturn() {
  useSeo({ title: 'Payment status', noIndex: true });
  const [params] = useSearchParams();
  const orderId = (params.get('order') ?? '').trim().slice(0, 80);
  const ready = isGatewayReady();
  const { clear } = useCart();
  const [view, setView] = useState<View>(!ready ? 'unavailable' : !orderId ? 'no-reference' : 'checking');

  const check = useCallback(async () => {
    if (!ready || !orderId) return;
    setView('checking');
    try {
      setView(await getPaymentStatus(orderId));
    } catch {
      setView('unknown');
    }
  }, [ready, orderId]);

  useEffect(() => {
    void check();
  }, [check]);

  // The cart is emptied only once the backend says the order is paid.
  useEffect(() => {
    if (view === 'paid') clear();
  }, [view, clear]);

  const copy = view === 'checking' ? { title: 'Checking your payment…', text: 'Asking the payment service what happened. This takes a moment.' } : COPY[view];
  const canRetry = view === 'pending' || view === 'unknown';

  return (
    <>
      <PageHeader eyebrow="Payment" title="Payment status" crumbs={[{ label: 'Payment status' }]} />
      <section className="section section--flush-top">
        <div className="container container--narrow empty-state payment-status" aria-live="polite" data-status={view}>
          <h2 className="display-title display-title--sm">{copy.title}</h2>
          <p>{copy.text}</p>
          {orderId && view !== 'unavailable' && (
            <p className="payment-status__ref">
              Order reference: <strong>{orderId}</strong>
            </p>
          )}
          <div className="button-row payment-status__actions">
            {canRetry && (
              <Button onClick={() => void check()} variant="outline">
                Check again
              </Button>
            )}
            {view !== 'paid' && view !== 'checking' && view !== 'unavailable' && view !== 'no-reference' && (
              <WhatsAppButton message={`Hello ${site.name}! I have a question about the payment for order ${orderId}.`} variant="outline">
                Ask on WhatsApp
              </WhatsAppButton>
            )}
            {view !== 'checking' && (
              <Button to={view === 'paid' ? '/shop' : '/cart'} icon={<ArrowRightIcon />}>
                {view === 'paid' ? 'Continue shopping' : 'Back to cart'}
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
