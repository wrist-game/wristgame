import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DemoNotice } from '../components/product/Price';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { SetupNote } from '../components/ui/Contact';
import { CloseIcon, SearchIcon } from '../components/ui/Icons';
import { PageHeader } from '../components/ui/PageHeader';
import { categories, products } from '../data/products';
import { useSeo } from '../hooks/useSeo';
import { getCategory, queryProducts, SORT_OPTIONS, STOCK_FILTERS, type SortKey, type StockFilter } from '../lib/catalog';
import { pluralize } from '../lib/format';

/** Filter changes rewrite the address without adding a history entry, moving the page or stealing focus from the field in use. */
const KEEP_PLACE = { replace: true, preventScrollReset: true, state: { keepScroll: true } } as const;

export default function Shop() {
  // Filters live in the URL (?category=black&stock=in-stock&sort=price-asc&q=gold) so results can be shared and survive a refresh.
  const [params, setParams] = useSearchParams();

  // An unknown category in the address falls back to "all" instead of an empty page.
  const category = getCategory(params.get('category'))?.id ?? 'all';
  const stock = (STOCK_FILTERS.find((o) => o.value === params.get('stock'))?.value ?? 'all') as StockFilter;
  const sort = (SORT_OPTIONS.find((o) => o.value === params.get('sort'))?.value ?? 'featured') as SortKey;
  const search = params.get('q') ?? '';

  function update(key: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (!value || value === 'all' || (key === 'sort' && value === 'featured')) next.delete(key);
        else next.set(key, value);
        return next;
      },
      KEEP_PLACE,
    );
  }

  const results = useMemo(() => queryProducts(products, { search, category, stock, sort }), [search, category, stock, sort]);

  const activeCategory = category === 'all' ? undefined : getCategory(category);
  const hasFilters = category !== 'all' || stock !== 'all' || search.trim() !== '';
  const anyPriced = products.some((p) => p.price !== null);

  useSeo({
    title: activeCategory ? `${activeCategory.name} Watches` : 'Shop Watches',
    description: activeCategory
      ? `${activeCategory.description} Shop WristGame ${activeCategory.name} watches.`
      : `Shop the full WristGame range: ${categories.map((c) => c.name.toLowerCase()).join(', ')} watches and more.`,
  });

  return (
    <>
      <PageHeader
        eyebrow="The Shop"
        title={activeCategory ? `${activeCategory.name} Watches` : 'All Watches'}
        intro={activeCategory ? activeCategory.description : 'Every WristGame piece in one place. Filter by category, search by name or style, and find the one.'}
        crumbs={[{ label: 'Shop' }]}
      />

      <section className="section section--flush-top" aria-label="Products">
        <div className="container">
          <div className="shop-toolbar">
            <form className="search-field" role="search" onSubmit={(event) => event.preventDefault()}>
              <SearchIcon />
              <label className="sr-only" htmlFor="shop-search">
                Search products
              </label>
              <input
                id="shop-search"
                type="search"
                value={search}
                onChange={(event) => update('q', event.target.value)}
                placeholder="Search by name, colour or style"
                autoComplete="off"
              />
              {search && (
                <button type="button" className="search-field__clear" onClick={() => update('q', '')} aria-label="Clear search">
                  <CloseIcon />
                </button>
              )}
            </form>

            <div className="shop-toolbar__selects">
              <div className="select-field">
                <label htmlFor="shop-stock">Show</label>
                <select id="shop-stock" value={stock} onChange={(event) => update('stock', event.target.value)}>
                  {STOCK_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="select-field">
                <label htmlFor="shop-sort">Sort</label>
                <select id="shop-sort" value={sort} onChange={(event) => update('sort', event.target.value)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="chip-row" role="group" aria-label="Filter by category">
            <button type="button" className={`chip ${category === 'all' ? 'is-active' : ''}`} aria-pressed={category === 'all'} onClick={() => update('category', 'all')}>
              All
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`chip ${category === item.id ? 'is-active' : ''}`}
                aria-pressed={category === item.id}
                onClick={() => update('category', item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="shop-meta">
            <p role="status" aria-live="polite">
              Showing {pluralize(results.length, 'watch', 'watches')}
              {search.trim() && <> for “{search.trim()}”</>}
            </p>
            {hasFilters && (
              <button type="button" className="text-link" onClick={() => setParams(sort === 'featured' ? {} : { sort }, KEEP_PLACE)}>
                Clear filters
              </button>
            )}
          </div>

          <DemoNotice className="shop-demo-notice" />

          {sort.startsWith('price') && !anyPriced && (
            <SetupNote>
              Prices have not been added yet, so price sorting has nothing to reorder. Add a <code>price</code> to each product in{' '}
              <code>src/data/products.ts</code> and it takes effect straight away.
            </SetupNote>
          )}

          {results.length > 0 ? (
            <ul className="product-grid">
              {results.map((product, index) => (
                <li key={product.id} className="fade-in-item" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
                  <ProductCard product={product} quickAdd priority={index < 4} headingLevel="h2" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <h2 className="display-title display-title--sm">No watches found</h2>
              <p>Nothing matches those filters. Try a different search, or view the whole range.</p>
              <Button variant="outline" onClick={() => setParams({}, KEEP_PLACE)}>
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
