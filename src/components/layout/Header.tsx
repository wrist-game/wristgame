import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { BagIcon, MenuIcon, SearchIcon } from '../ui/Icons';
import { Logo } from '../ui/Logo';
import { MobileNav } from './MobileNav';
import { NAV_LINKS } from './navigation';
import { SearchOverlay } from './SearchOverlay';

export function Header() {
  const { totals } = useCart();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Any navigation closes open overlays.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const cartLabel = totals.itemCount === 0 ? 'Shopping cart, empty' : `Shopping cart, ${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'}`;

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container site-header__inner">
          <button
            type="button"
            className="icon-btn site-header__menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>

          <Link to="/" className="site-header__brand" aria-label="WristGame home">
            <Logo variant="primary" height={64} eager decorative />
          </Link>

          <nav className="primary-nav" aria-label="Primary">
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} className="primary-nav__link">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-header__actions">
            <button type="button" className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search watches" aria-haspopup="dialog">
              <SearchIcon />
            </button>
            <Link to="/cart" className="icon-btn cart-link" aria-label={cartLabel}>
              <BagIcon />
              {totals.itemCount > 0 && (
                <span className="cart-link__count" key={totals.itemCount} aria-hidden="true">
                  {totals.itemCount > 99 ? '99+' : totals.itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <MobileNav open={menuOpen} onClose={closeMenu} />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
