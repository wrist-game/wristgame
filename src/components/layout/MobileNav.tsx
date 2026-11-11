import { useRef, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { site } from '../../config/site';
import { useOverlay } from '../../hooks/useOverlay';
import { SocialLinks, WhatsAppButton } from '../ui/Contact';
import { CloseIcon } from '../ui/Icons';
import { Logo } from '../ui/Logo';
import { NAV_LINKS } from './navigation';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panelRef);

  return (
    <div className={`mobile-nav ${open ? 'is-open' : ''}`} aria-hidden={!open} {...(!open ? { inert: '' } : {})}>
      <div className="mobile-nav__backdrop" onClick={onClose} />
      <div className="mobile-nav__panel" ref={panelRef} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="mobile-nav__top">
          <Logo variant="primary" height={56} decorative />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Mobile">
          <ul className="mobile-nav__list">
            {NAV_LINKS.map((link, index) => (
              <li key={link.to} style={{ '--i': index } as CSSProperties}>
                <NavLink to={link.to} end={link.end} className="mobile-nav__link" onClick={onClose}>
                  <span className="mobile-nav__index">0{index + 1}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li style={{ '--i': NAV_LINKS.length } as CSSProperties}>
              <NavLink to="/cart" className="mobile-nav__link" onClick={onClose}>
                <span className="mobile-nav__index">0{NAV_LINKS.length + 1}</span>
                Cart
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="mobile-nav__footer">
          <WhatsAppButton block variant="outline" />
          <SocialLinks />
          <p className="mobile-nav__tagline">{site.tagline}</p>
        </div>
      </div>
    </div>
  );
}
