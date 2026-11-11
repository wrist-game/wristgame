import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Delay in milliseconds — handy for staggering items in a row. */
  delay?: number;
  /** Animation flavour. */
  variant?: 'up' | 'fade' | 'scale';
}

/**
 * Fades content in the first time it scrolls into view.
 * Purely progressive: without IntersectionObserver, or with reduced motion,
 * content is simply visible (see .reveal rules in styles/base.css).
 */
export function Reveal({ children, as: Tag = 'div', className = '', delay = 0, variant = 'up' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined;

  return (
    <Tag ref={ref} className={`reveal reveal--${variant} ${visible ? 'is-visible' : ''} ${className}`.trim()} style={style}>
      {children}
    </Tag>
  );
}
