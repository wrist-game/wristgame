import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { site } from '../config/site';

interface SeoOptions {
  /** Page title; the brand name is appended automatically. Omit on the home page. */
  title?: string;
  description?: string;
  /** Absolute or root-relative image used for social sharing. */
  image?: string;
  /** Optional schema.org JSON-LD for this page (e.g. a Product). */
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
}

const HOME_TITLE = `${site.name} — Wear the Game | Watches, Style & Lifestyle`;

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

const absolute = (path: string) => (/^https?:/.test(path) ? path : `${site.url || window.location.origin}${path}`);

/** Keeps <title>, description, canonical, Open Graph / Twitter tags and JSON-LD in sync with the current page. */
export function useSeo({ title, description = site.description, image = '/og-image.jpg', jsonLd, noIndex }: SeoOptions = {}) {
  const { pathname } = useLocation();
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const fullTitle = title ? `${title} | ${site.name}` : HOME_TITLE;
    document.title = fullTitle;

    setMeta('name', 'description', description);
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', absolute(image));
    setMeta('property', 'og:url', absolute(pathname));
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', absolute(image));

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = absolute(pathname);

    const existing = document.getElementById('page-jsonld');
    if (existing) existing.remove();
    if (jsonLdString) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'page-jsonld';
      script.textContent = jsonLdString;
      document.head.appendChild(script);
    }
  }, [title, description, image, jsonLdString, noIndex, pathname]);
}
