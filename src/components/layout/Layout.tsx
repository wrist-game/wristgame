import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { PageBoundary } from './PageBoundary';

/** Page shell: skip link, sticky header, animated page container, footer. */
export function Layout() {
  const { pathname, hash, key, state } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Every followed link → start at the top (or at the #anchor) and move focus to the content for keyboard /
  // screen-reader users. This also covers links to the page you are already on (for example a footer link),
  // which would otherwise look like nothing happened. In-page updates that pass `keepScroll` (the shop
  // filters, which rewrite the address as you type) are left alone.
  const keepScroll = (state as { keepScroll?: boolean } | null)?.keepScroll === true;
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (keepScroll) return;
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    mainRef.current?.focus({ preventScroll: true });
    // `key` changes on every navigation, including one to the same address.
  }, [key]);

  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1} className="site-main">
        {/* key = pathname replays the page-enter animation on every navigation */}
        <div className="page" key={pathname}>
          {/* Inside the keyed container, so an error on one page is cleared by moving to another. */}
          <PageBoundary>
            <Suspense fallback={<div className="page-loading" aria-busy="true" aria-label="Loading page" />}>
              <Outlet />
            </Suspense>
          </PageBoundary>
        </div>
      </main>
      <Footer />
    </div>
  );
}
