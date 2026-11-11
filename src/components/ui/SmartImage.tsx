import { useState, type ImgHTMLAttributes } from 'react';
import type { ProductImage } from '../../types';

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'alt'> {
  image: ProductImage;
  /** `sizes` attribute: how wide the image renders, so the browser can pick the smallest file that looks sharp. Default suits the shop grid. */
  sizes?: string;
  /** Load immediately (images near the top of a page). `'high'` also asks the browser to fetch it first: use it for the one main photo. Everything else is lazy. */
  priority?: boolean | 'high';
}

/** Responsive, lazy-loaded image that fades in once decoded. */
export function SmartImage({ image, sizes = '(min-width: 1180px) 23vw, (min-width: 700px) 31vw, 46vw', priority, className = '', ...rest }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      className={`smart-image ${loaded ? 'is-loaded' : ''} ${className}`.trim()}
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.srcSet ? sizes : undefined}
      alt={image.alt}
      width={1024}
      height={1024}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      // The first photo on a page is fetched ahead of everything else below it.
      {...(priority === 'high' ? { fetchpriority: 'high' } : {})}
      // Cached images can finish before React attaches onLoad.
      ref={(node) => {
        if (node?.complete && node.naturalWidth > 0 && !loaded) setLoaded(true);
      }}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      {...rest}
    />
  );
}
