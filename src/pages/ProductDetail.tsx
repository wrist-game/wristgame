import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ColorSwatches } from '../components/product/ColorSwatches';
import { DemoNotice, Price } from '../components/product/Price';
import { ProductCard } from '../components/product/ProductCard';
import { ProductGallery } from '../components/product/ProductGallery';
import { StockBadge } from '../components/product/StockBadge';
import { Button } from '../components/ui/Button';
import { WhatsAppButton } from '../components/ui/Contact';
import { BagIcon, CheckIcon } from '../components/ui/Icons';
import { Breadcrumbs } from '../components/ui/PageHeader';
import { QuantitySelector } from '../components/ui/QuantitySelector';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { site } from '../config/site';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { policies } from '../data/content';
import { catalogSettings, products } from '../data/products';
import { useSeo } from '../hooks/useSeo';
import { getAvailability, getCategory, getProductBySlug, productImages, productPath, shortDescription } from '../lib/catalog';
import { pluralize } from '../lib/format';
import { availabilityEnquiryMessage, productOrderMessage } from '../lib/whatsapp';
import type { Product } from '../types';
import NotFound from './NotFound';

/**
 * The reusable product page: /product/<slug> works for every product in
 * src/data/products.ts. Nothing here is specific to one watch.
 */
export default function ProductDetail() {
  const { slug = '' } = useParams();
  const product = getProductBySlug(slug);
  if (!product) {
    return <NotFound title="Watch not found" message="That watch is not in the collection (anymore). Have a look at what is." />;
  }
  // key resets colour / quantity when moving between products
  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const { addItem, quantityOf } = useCart();
  const toast = useToast();
  const colors = product.colors ?? [];
  const [color, setColor] = useState(colors[0]?.name ?? '');
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const category = getCategory(product.category);
  const images = productImages(product);
  const availability = getAvailability(product);
  const inCart = quantityOf(product.id);
  /** Units that can still be added, after what is already in the cart. */
  const remaining = Math.max(0, availability.limit - inCart);
  const canAdd = availability.purchasable && remaining > 0;
  const chosen = Math.min(quantity, Math.max(1, remaining));

  const related = [
    ...products.filter((p) => p.id !== product.id && p.category === product.category),
    ...products.filter((p) => p.id !== product.id && p.category !== product.category),
  ].slice(0, 4);

  const origin = site.url || window.location.origin;
  // An offer is only published for a real price: never for a demo price, never for "price on request".
  const publishOffer = product.price !== null && !catalogSettings.demoPrices;

  useSeo({
    title: `${product.name}${category ? ` — ${category.name} Watch` : ''}`,
    description: `${shortDescription(product)} ${product.description}`.slice(0, 300),
    image: product.image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      sku: product.id,
      category: 'Watches',
      brand: { '@type': 'Brand', name: site.name },
      image: images.map((image) => (image.src.startsWith('/') ? `${origin}${image.src}` : image.src)),
      ...(colors.length > 0 ? { color: colors.map((c) => c.name).join(', ') } : {}),
      ...(publishOffer
        ? {
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: site.currency.code,
              availability: availability.purchasable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: `${origin}${productPath(product)}`,
            },
          }
        : {}),
    },
  });

  useEffect(() => {
    if (!justAdded) return;
    const id = window.setTimeout(() => setJustAdded(false), 2200);
    return () => window.clearTimeout(id);
  }, [justAdded]);

  const onAdd = () => {
    const added = addItem(product.id, color, chosen);
    if (added === 0) {
      toast({ message: `All available ${product.name} stock is already in your cart`, action: { label: 'View cart', to: '/cart' } });
      return;
    }
    setJustAdded(true);
    setQuantity(1);
    toast({ message: `${added} × ${product.name} added to your cart`, action: { label: 'View cart', to: '/cart' } });
  };

  return (
    <>
      <div className="container product-page__crumbs">
        <Breadcrumbs
          crumbs={[
            { label: 'Shop', to: '/shop' },
            ...(category ? [{ label: category.name, to: `/shop?category=${category.id}` }] : []),
            { label: product.name },
          ]}
        />
      </div>

      <article className="container product-page">
        <ProductGallery images={images} productName={product.name} />

        <div className="product-info">
          <p className="eyebrow">
            {category ? `${category.name} · ` : ''}
            {product.id}
          </p>
          <h1 className="product-info__name">{product.name}</h1>
          <Price amount={product.price} className="product-info__price" />
          {product.price === null && <p className="product-info__price-note">Message us for the current price and availability.</p>}
          <p className="product-info__stock">
            <StockBadge product={product} />
            {inCart > 0 && <span className="product-info__in-cart">{inCart} in your cart</span>}
          </p>
          <span className="gold-rule gold-rule--start" aria-hidden="true" />

          <p className="product-info__description">{product.description}</p>

          {product.highlights && product.highlights.length > 0 && (
            <ul className="product-info__highlights">
              {product.highlights.map((highlight) => (
                <li key={highlight}>
                  <CheckIcon />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          {colors.length > 0 && <ColorSwatches colors={colors} value={color} onChange={setColor} name={`color-${product.id}`} />}
          {colors.length > 0 && color !== colors[0].name && <p className="product-info__note">Photos show {colors[0].name}.</p>}

          <div className="product-info__buy">
            <div>
              <p className="field-label" id="qty-label">
                Quantity
              </p>
              <QuantitySelector value={chosen} onChange={(value) => setQuantity(Math.min(Math.max(1, value), Math.max(1, remaining)))} label={product.name} max={Math.max(1, remaining)} disabled={!canAdd} />
            </div>
            <Button size="lg" onClick={onAdd} disabled={!canAdd} icon={justAdded ? <CheckIcon /> : <BagIcon />} iconPosition="start" className="product-info__add">
              {!availability.purchasable ? availability.label : justAdded ? 'Added to cart' : remaining === 0 ? 'All stock in cart' : 'Add to cart'}
            </Button>
          </div>
          {availability.purchasable && remaining === 0 && (
            <p className="product-info__note">You have all {pluralize(availability.limit, 'available unit')} of this watch in your cart.</p>
          )}
          {availability.purchasable && remaining > 0 && chosen >= remaining && remaining < catalogSettings.maxPerOrder && (
            <p className="product-info__note">
              {inCart > 0 ? `${pluralize(remaining, 'more unit')} available.` : `${pluralize(remaining, 'unit')} available.`}
            </p>
          )}

          {availability.purchasable ? (
            <WhatsAppButton message={productOrderMessage(product, color, chosen)} size="lg" block>
              Order on WhatsApp
            </WhatsAppButton>
          ) : (
            <WhatsAppButton message={availabilityEnquiryMessage(product)} size="lg" block>
              Ask when it is back
            </WhatsAppButton>
          )}
          <DemoNotice>This amount is a placeholder for preview, not a real WristGame price. Stock shown is also demo data.</DemoNotice>
          <p className="product-info__note">{policies.payment}</p>
        </div>
      </article>

      <section className="section section--tint" aria-labelledby="info-title">
        <div className="container product-details">
          <Reveal className="product-details__specs">
            <h2 className="display-title display-title--sm" id="info-title">
              Product information
            </h2>
            <dl className="spec-list">
              <div className="spec-list__row">
                <dt>Product ID</dt>
                <dd>{product.id}</dd>
              </div>
              <div className="spec-list__row">
                <dt>Category</dt>
                <dd>{category?.name ?? product.category}</dd>
              </div>
              <div className="spec-list__row">
                <dt>Availability</dt>
                <dd>{availability.label}</dd>
              </div>
              {(product.specs ?? []).map((spec) => (
                <div key={spec.label} className="spec-list__row">
                  <dt>{spec.label}</dt>
                  <dd className={spec.value === 'To be confirmed' ? 'is-tbc' : ''}>{spec.value}</dd>
                </div>
              ))}
              {colors.length > 0 && (
                <div className="spec-list__row">
                  <dt>Colours</dt>
                  <dd>{colors.map((c) => c.name).join(' · ')}</dd>
                </div>
              )}
            </dl>
          </Reveal>

          <Reveal className="product-details__policies" delay={120}>
            <h2 className="display-title display-title--sm">Delivery &amp; returns</h2>
            <div className="policy">
              <h3>Delivery</h3>
              <p>{policies.delivery}</p>
            </div>
            <div className="policy">
              <h3>Returns &amp; exchanges</h3>
              <p>{policies.returns}</p>
            </div>
            <div className="policy">
              <h3>Questions?</h3>
              <p>Ask us anything about this watch before you order.</p>
              <WhatsAppButton message={`Hello ${site.name}! I have a question about the ${product.name}.`} variant="outline" size="sm">
                Ask on WhatsApp
              </WhatsAppButton>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="related-title">
        <div className="container">
          <SectionHeading eyebrow="Keep exploring" title="You may also like" id="related-title" />
          <ul className={`product-grid product-grid--featured ${related.length === 3 ? 'product-grid--trio' : ''}`}>
            {related.map((item, index) => (
              <Reveal as="li" key={item.id} delay={index * 80}>
                <ProductCard product={item} imageSizes="(min-width: 700px) 31vw, 43vw" />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
