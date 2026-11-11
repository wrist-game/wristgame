import { Link } from 'react-router-dom';
import { DemoNotice, DemoPriceFlag, Price } from '../components/product/Price';
import { Button } from '../components/ui/Button';
import { ArrowRightIcon, BagIcon, TrashIcon } from '../components/ui/Icons';
import { PageHeader } from '../components/ui/PageHeader';
import { QuantitySelector } from '../components/ui/QuantitySelector';
import { site } from '../config/site';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSeo } from '../hooks/useSeo';
import { describeSubtotal, type CartTotals, type DetailedLine } from '../lib/cart';
import { productPath, thumbnail } from '../lib/catalog';
import { pluralize } from '../lib/format';

const lineLabel = (line: DetailedLine) => `${line.product.name}${line.color ? `, ${line.color}` : ''}`;

/** Shared by the cart and checkout pages. */
export function OrderSummaryRows({ totals }: { totals: CartTotals }) {
  return (
    <dl className="summary-rows">
      <div>
        <dt>Subtotal ({pluralize(totals.itemCount, 'item')})</dt>
        <dd>{describeSubtotal(totals)}</dd>
      </div>
      <div>
        <dt>Delivery</dt>
        <dd className="is-muted">Confirmed on WhatsApp</dd>
      </div>
      <div className="summary-rows__total">
        <dt>
          Estimated total ({site.currency.code})
          {totals.unpricedCount < totals.itemCount && <DemoPriceFlag>Demo prices</DemoPriceFlag>}
        </dt>
        <dd>{describeSubtotal(totals)}</dd>
      </div>
    </dl>
  );
}

export default function Cart() {
  useSeo({ title: 'Your Cart', noIndex: true });
  const { lines, totals, setQuantity, removeItem, clear } = useCart();
  const toast = useToast();

  if (lines.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Shopping cart" title="Your cart" crumbs={[{ label: 'Cart' }]} />
        <section className="section section--flush-top">
          <div className="container container--narrow empty-state">
            <span className="empty-state__icon" aria-hidden="true">
              <BagIcon />
            </span>
            <h2 className="display-title display-title--sm">Your cart is empty</h2>
            <p>Nothing here yet. Find a watch that matches your pace.</p>
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
      <PageHeader eyebrow="Shopping cart" title="Your cart" intro={`${pluralize(totals.itemCount, 'item')} ready when you are.`} crumbs={[{ label: 'Cart' }]} />

      <section className="section section--flush-top" aria-label="Cart contents">
        <div className="container cart-layout">
          <div>
            <ul className="cart-lines">
              {lines.map((line) => (
                <li key={line.key} className="cart-line">
                  <Link to={productPath(line.product)} className="cart-line__image" tabIndex={-1} aria-hidden="true">
                    <img src={thumbnail(line.product.image)} alt="" width={160} height={160} loading="lazy" decoding="async" />
                  </Link>
                  <div className="cart-line__info">
                    <h2 className="cart-line__name">
                      <Link to={productPath(line.product)}>{line.product.name}</Link>
                    </h2>
                    <p className="cart-line__meta">
                      {line.product.id}
                      {line.color && ` · ${line.color}`}
                    </p>
                    <Price amount={line.product.price} suffix=" each" className="cart-line__meta cart-line__unit" />
                    {line.limitReason && (
                      <p className="cart-line__meta cart-line__limit">
                        {line.limitReason === 'stock' ? 'That is all we have in stock.' : 'Maximum per order reached.'}
                      </p>
                    )}
                  </div>
                  <div className="cart-line__controls">
                    <QuantitySelector size="sm" value={line.quantity} max={line.maxQuantity} onChange={(value) => setQuantity(line.key, value)} label={lineLabel(line)} />
                    <button
                      type="button"
                      className="cart-line__remove"
                      onClick={() => {
                        removeItem(line.key);
                        toast({ message: `${line.product.name} removed from your cart` });
                      }}
                      aria-label={`Remove ${lineLabel(line)} from cart`}
                    >
                      <TrashIcon />
                      <span>Remove</span>
                    </button>
                  </div>
                  <div className="cart-line__total-wrap">
                    <span className="sr-only">Line total: </span>
                    <Price amount={line.lineTotal} flag={false} className="cart-line__total" />
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-actions">
              <Link to="/shop" className="text-link">
                ← Continue shopping
              </Link>
              <button type="button" className="text-link text-link--muted" onClick={clear}>
                Clear cart
              </button>
            </div>
          </div>

          <section className="panel order-summary" aria-labelledby="summary-title">
            <h2 className="display-title display-title--sm" id="summary-title">
              Order summary
            </h2>
            <OrderSummaryRows totals={totals} />
            <DemoNotice>Totals are calculated from placeholder prices and are not real amounts.</DemoNotice>
            {totals.unpricedCount > 0 && (
              <p className="order-summary__note">
                {totals.unpricedCount === totals.itemCount ? 'Prices' : 'Some prices'} are on request — the final amount is confirmed with you before anything is charged.
              </p>
            )}
            <Button to="/checkout" size="lg" block icon={<ArrowRightIcon />}>
              Checkout
            </Button>
            <p className="order-summary__note">Next you enter your delivery details and send the order on WhatsApp. No payment is taken on this website.</p>
          </section>
        </div>
      </section>
    </>
  );
}
