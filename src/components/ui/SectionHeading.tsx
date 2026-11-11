import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'center' | 'start';
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
}

export function SectionHeading({ eyebrow, title, intro, align = 'center', as: Heading = 'h2', id }: SectionHeadingProps) {
  return (
    <Reveal className={`section-heading section-heading--${align}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Heading className="section-heading__title" id={id}>
        {title}
      </Heading>
      <span className="gold-rule" aria-hidden="true" />
      {intro && <p className="section-heading__intro">{intro}</p>}
    </Reveal>
  );
}
