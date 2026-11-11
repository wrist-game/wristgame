import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { thumbnail } from '../../lib/catalog';
import type { ProductImage } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, ZoomIcon } from '../ui/Icons';
import { SmartImage } from '../ui/SmartImage';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

/** Large image with hover / tap zoom, arrow-key navigation and a thumbnail strip. */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    setZoomed(false);
  }, [images]);

  const count = images.length;
  const go = (next: number) => {
    setIndex((next + count) % count);
    setZoomed(false);
  };

  const setOrigin = (event: { clientX: number; clientY: number }) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    stage.style.setProperty('--zoom-x', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
    stage.style.setProperty('--zoom-y', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1);
    }
  };

  return (
    <section className="gallery" aria-label={`${productName} photos`} onKeyDown={onKeyDown}>
      <div
        className={`gallery__stage ${zoomed ? 'is-zoomed' : ''}`}
        ref={stageRef}
        onPointerMove={setOrigin}
        // Moving the mouse away zooms back out. A finger "leaves" the photo every time it lifts,
        // so on touch screens the zoom stays until the photo is tapped again.
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') setZoomed(false);
        }}
      >
        <button
          type="button"
          className="gallery__zoom-target"
          onClick={(event) => {
            if (event.detail > 0) setOrigin(event); // keyboard activation keeps the centre
            setZoomed((value) => !value);
          }}
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          aria-pressed={zoomed}
        >
          <SmartImage key={images[index].src} image={images[index]} priority={index === 0 ? 'high' : true} sizes="(min-width: 900px) 50vw, 100vw" />
        </button>

        <span className="gallery__hint" aria-hidden="true">
          <ZoomIcon />
          {/* "Tap" on touch screens, "Click" with a mouse; the right word is picked in CSS. */}
          <span className="gallery__hint-touch">Tap</span>
          <span className="gallery__hint-mouse">Click</span> {zoomed ? 'to zoom out' : 'to zoom'}
        </span>

        {count > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" onClick={() => go(index - 1)} aria-label="Previous photo">
              <ChevronLeftIcon />
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" onClick={() => go(index + 1)} aria-label="Next photo">
              <ChevronRightIcon />
            </button>
            <span className="gallery__counter" aria-live="polite">
              <span className="sr-only">Photo </span>
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="gallery__thumbs">
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                className={`gallery__thumb ${i === index ? 'is-active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index ? 'true' : undefined}
              >
                <img src={thumbnail(image.src)} alt="" width={120} height={120} loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
