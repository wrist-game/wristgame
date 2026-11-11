import { Button } from '../components/ui/Button';
import { SetupNote } from '../components/ui/Contact';
import { ArrowRightIcon } from '../components/ui/Icons';
import { Logo } from '../components/ui/Logo';
import { PageHeader } from '../components/ui/PageHeader';
import { Reveal } from '../components/ui/Reveal';
import { SmartImage } from '../components/ui/SmartImage';
import { site } from '../config/site';
import { about, lifestyleImages } from '../data/content';
import { useSeo } from '../hooks/useSeo';

export default function About() {
  useSeo({
    title: 'About',
    description: about.lead,
  });

  return (
    <>
      <PageHeader eyebrow={about.eyebrow} title={about.title} intro={about.lead} crumbs={[{ label: 'About' }]} />

      <section className="section section--flush-top" aria-labelledby="story-heading">
        <div className="container about-story">
          <Reveal className="about-story__media" variant="scale">
            <div className="framed-image framed-image--tall">
              <SmartImage image={lifestyleImages.suit} sizes="(min-width: 900px) 42vw, 100vw" priority="high" />
            </div>
          </Reveal>
          <div className="about-story__copy">
            <h2 className="sr-only" id="story-heading">
              Our story
            </h2>
            {about.story.map((block, index) => (
              <Reveal key={block.heading} className="about-story__block" delay={index * 80}>
                <p className="about-story__index" aria-hidden="true">
                  0{index + 1}
                </p>
                <div>
                  <h3 className="display-title display-title--sm">{block.heading}</h3>
                  <p>{block.text}</p>
                </div>
              </Reveal>
            ))}
            <SetupNote>
              This is placeholder brand copy with no invented facts. Rewrite it in <code>src/data/content.ts</code>.
            </SetupNote>
          </div>
        </div>
      </section>

      <section className="quote-band" aria-label="Brand statement">
        <Reveal className="container container--narrow">
          <Logo variant="emblem" height={84} decorative />
          <blockquote>
            <p>“{about.quote}”</p>
          </blockquote>
          <p className="eyebrow">{site.tagline}</p>
        </Reveal>
      </section>

      <section className="section" aria-labelledby="values-heading">
        <div className="container about-values">
          <Reveal className="about-values__intro">
            <p className="eyebrow">What we stand for</p>
            <h2 className="display-title" id="values-heading">
              A premium lifestyle, kept simple
            </h2>
            <span className="gold-rule gold-rule--start" aria-hidden="true" />
            <div className="framed-image framed-image--wide">
              <SmartImage image={lifestyleImages.drive} sizes="(min-width: 960px) 40vw, 100vw" />
            </div>
          </Reveal>
          <ul className="value-list">
            {about.values.map((value, index) => (
              <Reveal as="li" key={value.title} className="value-card" delay={index * 80}>
                <span className="value-card__index" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="about-cta">
        <div className="cta-band__streak" aria-hidden="true" />
        <Reveal className="container cta-band__inner">
          <p className="eyebrow">{site.descriptor.join(' · ')}</p>
          <h2 className="cta-band__title" id="about-cta">
            Ready to elevate?
          </h2>
          <p className="cta-band__text">Explore the collection and find your next everyday signature.</p>
          <div className="button-row button-row--center">
            <Button to="/shop" size="lg" icon={<ArrowRightIcon />}>
              Shop Collection
            </Button>
            <Button to="/contact" size="lg" variant="outline">
              Get in touch
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
