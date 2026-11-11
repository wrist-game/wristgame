import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { home } from '../../data/content';
import { imageSrcSet } from '../../lib/catalog';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Button } from '../ui/Button';
import { ArrowRightIcon } from '../ui/Icons';

const FALLBACK_PHOTO = '/images/products/classic-gold-watch-1-lg.webp';

// React Three Fiber, Drei and three.js load on demand, after the page has painted.
const WatchExperience = lazy(() => import('./WatchExperience'));

/** Checked before the 3D bundle is requested, so unsupported devices never download it. */
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

/** Visitors who switched on "data saver" get the photo instead of the 3D download (about 250 kB). */
function prefersLessData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/** Product photo with CSS motion — used when WebGL is unavailable, data saver is on, or the 3D scene fails. */
function WatchFallback() {
  return (
    <div className="watch-fallback">
      <img
        src={FALLBACK_PHOTO}
        srcSet={imageSrcSet(FALLBACK_PHOTO)}
        sizes="(min-width: 1000px) 40vw, min(92vw, 560px)"
        alt="Gold-tone wristwatch with a black dial"
        width={1024}
        height={1024}
        decoding="async"
      />
      <span className="watch-fallback__shine" aria-hidden="true" />
    </div>
  );
}

function WatchLoader() {
  return (
    <div className="watch-loader" role="status">
      <span className="watch-loader__ring" aria-hidden="true" />
      <span className="sr-only">Loading 3D watch…</span>
    </div>
  );
}

class WatchBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('[WristGame] 3D watch unavailable, showing image fallback.', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Hero() {
  const { hero } = home;
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [use3d] = useState(() => !prefersLessData() && supportsWebGL());
  const [load3d, setLoad3d] = useState(false);
  const [live, setLive] = useState(false);
  // Phones can take the graphics context away (low memory, a long time in the background).
  // The scene cannot draw after that, so the product photo takes its place.
  const [lost3d, setLost3d] = useState(false);

  // The 3D code is requested only after the page itself has loaded and the browser is idle.
  // On a slow phone connection the text, fonts and photos therefore always arrive first.
  useEffect(() => {
    if (!use3d) return;
    let idle = 0;
    let timer = 0;
    const start = () => {
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(() => setLoad3d(true), { timeout: 1500 });
      else timer = window.setTimeout(() => setLoad3d(true), 200);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [use3d]);

  // Scroll progress through the hero (0 → 1) drives the headline parting in CSS.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (reducedMotion) {
      section.style.removeProperty('--hero-p');
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.min(Math.max(window.scrollY / Math.max(section.offsetHeight * 0.85, 1), 0), 1);
      section.style.setProperty('--hero-p', progress.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return (
    <section className={`hero${live ? ' is-live' : ''}`} ref={sectionRef} aria-labelledby="hero-title">
      <div className="hero__backdrop" aria-hidden="true">
        <span className="hero__beam" />
        <span className="hero__streak hero__streak--a" />
        <span className="hero__streak hero__streak--b" />
        <span className="hero__grain" />
      </div>

      <p className="eyebrow hero__eyebrow">{hero.eyebrow}</p>

      <h1 className="hero__title" id="hero-title">
        <span className="hero__title-line hero__title-line--lead">{hero.headline[0]}</span>{' '}
        <span className="hero__title-line hero__title-line--gold">{hero.headline[1]}</span>
      </h1>

      <div className="hero__stage">
        <span className="hero__halo" aria-hidden="true" />
        <span className="hero__ring hero__ring--outer" aria-hidden="true" />
        <span className="hero__ring hero__ring--inner" aria-hidden="true" />
        {use3d && !lost3d ? (
          <WatchBoundary fallback={<WatchFallback />}>
            <Suspense fallback={<WatchLoader />}>
              {load3d ? (
                <WatchExperience
                  onReady={() => setLive(true)}
                  onContextLost={() => {
                    setLive(false);
                    setLost3d(true);
                  }}
                />
              ) : (
                <WatchLoader />
              )}
            </Suspense>
          </WatchBoundary>
        ) : (
          <WatchFallback />
        )}
        {live && (
          <p className="hero__hint" aria-hidden="true">
            <span className="hero__hint-line" /> Drag to rotate
          </p>
        )}
      </div>

      <div className="hero__copy">
        <p className="hero__subtitle">{hero.subtitle}</p>
        <div className="hero__actions">
          <Button to="/shop" size="lg" icon={<ArrowRightIcon />} className="hero__cta">
            {hero.primaryCta}
          </Button>
          <Button to="/about" size="lg" variant="outline">
            {hero.secondaryCta}
          </Button>
        </div>
      </div>

      <a className="hero__scroll" href="#featured">
        <span>Scroll</span>
        <span className="hero__scroll-line" aria-hidden="true" />
      </a>
    </section>
  );
}
