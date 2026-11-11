import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { categoryName, getAvailability, productImages, productPath, shortDescription } from '../../lib/catalog';
import type { Product } from '../../types';
import { ArrowRightIcon, BagIcon } from '../ui/Icons';
import { SmartImage } from '../ui/SmartImage';
import { Price } from './Price';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: Product;
  /** Show a quick "add to cart" button (used on the shop grid). */
  quickAdd?: boolean;
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
  /** How wide the photo renders in this grid (an HTML `sizes` value). Leave out for the shop grid. */
  imageSizes?: string;
}

/**
 * The reusable product card. Give it any product from src/data/products.ts and it
 * shows the photo, category, name, price, description and stock state.
 */
export function ProductCard({ product, quickAdd = false, priority, headingLevel: Heading = 'h3', imageSizes }: ProductCardProps) {
  const { addItem } = useCart();
  const toast = useToast();
  const href = productPath(product);
  const [image, hoverImage] = productImages(product);
  const availability = getAvailability(product);

  const onQuickAdd = () => {
    const added = addItem(product.id, product.colors?.[0]?.name ?? '', 1);
    toast(
      added > 0
        ? { message: `${product.name} added to your cart`, action: { label: 'View cart', to: '/cart' } }
        : { message: `All available ${product.name} stock is already in your cart`, action: { label: 'View cart', to: '/cart' } },
    );
  };

  return (
    <article className={`product-card ${availability.purchasable ? '' : 'is-unavailable'}`}>
      <div className="product-card__media">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="product-card__image-link">
          <SmartImage image={image} priority={priority} sizes={imageSizes} />
          {hoverImage && <SmartImage image={{ ...hoverImage, alt: '' }} className="product-card__image-alt" sizes={imageSizes} />}
        </Link>
        <span className="product-card__tag">{categoryName(product)}</span>
        {!availability.purchasable && <span className="product-card__soldout">{availability.label}</span>}
        {quickAdd && availability.purchasable && (
          <button type="button" className="product-card__quick" onClick={onQuickAdd} aria-label={`Add ${product.name} to cart`}>
            <BagIcon />
            <span>Add to cart</span>
          </button>
        )}
      </div>

      <div className="product-card__body">
        <div className="product-card__head">
          <Heading className="product-card__name">
            <Link to={href}>{product.name}</Link>
          </Heading>
          <Price amount={product.price} className="product-card__price" />
        </div>
        <p className="product-card__desc">{shortDescription(product)}</p>
        <StockBadge product={product} className="product-card__stock" />
        <Link to={href} className="product-card__cta" aria-label={`View details: ${product.name}`}>
          View Details
          <ArrowRightIcon />
        </Link>
      </div>
    </article>
  );
}
