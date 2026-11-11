import { Link } from 'react-router-dom';
import { site } from '../../config/site';
import { categories } from '../../data/products';
import { generalEnquiryMessage, whatsappLink } from '../../lib/whatsapp';
import { ConfigValue, SocialLinks } from '../ui/Contact';
import { Logo } from '../ui/Logo';

export function Footer() {
  const { contact } = site;
  return (
    <footer className="site-footer">
      <div className="site-footer__glow" aria-hidden="true" />
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Link to="/" aria-label="WristGame home">
              <Logo variant="full" height={150} />
            </Link>
            <p className="site-footer__tagline">{site.tagline}</p>
            <p className="site-footer__blurb">Watches, style and lifestyle for modern men and women.</p>
            <SocialLinks />
          </div>

          <nav className="site-footer__col" aria-label="Shop">
            <h2 className="site-footer__heading">Shop</h2>
            <ul>
              <li>
                <Link to="/shop">All Watches</Link>
              </li>
              {categories.map((collection) => (
                <li key={collection.id}>
                  <Link to={`/shop?category=${collection.id}`}>{collection.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer__col" aria-label="Company">
            <h2 className="site-footer__heading">WristGame</h2>
            <ul>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/collections">Collections</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/cart">Cart</Link>
              </li>
            </ul>
          </nav>

          <div className="site-footer__col">
            <h2 className="site-footer__heading">Contact</h2>
            <ul>
              <li>
                <a href={whatsappLink(generalEnquiryMessage())} target="_blank" rel="noopener noreferrer">
                  WhatsApp us
                </a>
              </li>
              <li>
                <ConfigValue value={contact.phone} placeholder="Phone — to be added" href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} />
              </li>
              <li>
                <ConfigValue value={contact.email} placeholder="Email — to be added" href={`mailto:${contact.email}`} />
              </li>
              <li>
                <ConfigValue value={contact.address} placeholder="Address — to be added" />
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p className="site-footer__descriptor">{site.descriptor.join(' · ')}</p>
        </div>
      </div>
    </footer>
  );
}
