import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories, products } from '../../data/products';
import { useOverlay } from '../../hooks/useOverlay';
import { categoryName, getAvailability, matchesSearch, productPath, thumbnail } from '../../lib/catalog';
import { Price } from '../product/Price';
import { ArrowRightIcon, CloseIcon, SearchIcon } from '../ui/Icons';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/** Suggested searches come from the category names, so they always return results. */
const SUGGESTIONS = categories.map((category) => category.name);

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  useOverlay(open, onClose, panelRef);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    // Wait for the panel to become visible before focusing.
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  const trimmed = query.trim();
  const results = useMemo(() => (trimmed ? products.filter((p) => matchesSearch(p, trimmed)).slice(0, 5) : []), [trimmed]);

  const goToResults = () => {
    navigate(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : '/shop');
    onClose();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    goToResults();
  };

  return (
    <div className={`search-overlay ${open ? 'is-open' : ''}`} aria-hidden={!open} {...(!open ? { inert: '' } : {})}>
      <div className="search-overlay__backdrop" onClick={onClose} />
      <div className="search-overlay__panel" ref={panelRef} role="dialog" aria-modal="true" aria-label="Search watches">
        <div className="container container--narrow">
          <form className="search-overlay__form" role="search" onSubmit={onSubmit}>
            <SearchIcon />
            <label className="sr-only" htmlFor="site-search">
              Search watches
            </label>
            <input
              id="site-search"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search watches…"
              autoComplete="off"
              enterKeyHint="search"
            />
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close search">
              <CloseIcon />
            </button>
          </form>

          <div className="search-overlay__body" aria-live="polite">
            {!trimmed && (
              <div className="search-overlay__suggestions">
                <p className="eyebrow">Popular searches</p>
                <ul>
                  {SUGGESTIONS.map((term) => (
                    <li key={term}>
                      <button type="button" className="chip" onClick={() => setQuery(term)}>
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {trimmed && results.length === 0 && (
              <p className="search-overlay__empty">
                No watches match “{trimmed}”. <Link to="/shop" onClick={onClose} className="text-link">Browse the full shop</Link>
              </p>
            )}

            {results.length > 0 && (
              <>
                <ul className="search-results">
                  {results.map((product) => (
                    <li key={product.id}>
                      <Link to={productPath(product)} className="search-result" onClick={onClose}>
                        <img src={thumbnail(product.image)} alt="" width={64} height={64} loading="lazy" />
                        <span className="search-result__text">
                          <span className="search-result__name">{product.name}</span>
                          <span className="search-result__meta">
                            {categoryName(product)} · <Price as="span" amount={product.price} />
                            {!getAvailability(product).purchasable && ` · ${getAvailability(product).label}`}
                          </span>
                        </span>
                        <ArrowRightIcon />
                      </Link>
                    </li>
                  ))}
                </ul>
                <button type="button" className="text-link search-overlay__all" onClick={goToResults}>
                  See all results for “{trimmed}”
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
