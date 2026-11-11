import { Link } from 'react-router-dom';
import { Hero } from '../components/hero/Hero';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { ArrowRightIcon } from '../components/ui/Icons';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { SmartImage } from '../components/ui/SmartImage';
import { site } from '../config/site';
import { home, lifestyleImages } from '../data/content';
import { categories } from '../data/products';
import { getFeaturedProducts, productsInCategory, toImage } from '../lib/catalog';
import { useSeo } from '../hooks/useSeo';
import { pluralize } from '../lib/format';

function Marquee() {
  const words = [...site.descriptor, site.tagline];
  const row = [...words, ...words, ...words];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <ul key={copy}>
            {row.map((word, index) => (
              <li key={`${copy}-${index}`}>{word}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  useSeo();

  return (
    <>
      <Hero />
      <Marquee />

      <section className="section" id="featured" aria-labelledby="featured-title">
        <div className="container">
          <SectionHeading eyebrow={home.featured.eyebrow} title={home.featured.title} intro={home.featured.intro} id="featured-title" />
          <ul className="product-grid product-grid--featured">
            {getFeaturedProducts(4).map((product, index) => (
              <Reveal as="li" key={product.id} delay={index * 90}>
                <ProductCard product={product} imageSizes="(min-width: 1000px) 23vw, 46vw" />
              </Reveal>
            ))}
          </ul>
          <Reveal className="section__footer">
            <Button to="/shop" variant="outline" icon={<ArrowRightIcon />}>
              View all watches
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="pillars-title">
        <div className="container">
          <h2 className="sr-only" id="pillars-title">
            What WristGame stands for
          </h2>
          <ul className="pillars">
            {home.pillars.map((pillar, index) => (
              <Reveal as="li" className="pillar" key={pillar.title} delay={index * 110}>
                <span className="pillar__index" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3 className="pillar__title">{pillar.title}</h3>
                <p>{pillar.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="collections-title">
        <div className="container">
          <SectionHeading eyebrow="Collections" title="Find your lane" intro="One standard, different looks. Start with the one that fits how you move." id="collections-title" />
          <ul className="collection-tiles">
            {categories.map((collection, index) => (
              <Reveal as="li" key={collection.id} delay={index * 90} variant="scale">
                <Link to={`/shop?category=${collection.id}`} className="collection-tile">
                  {/* Below 960px the tiles sit two to a row, and an odd last tile spans the full width. */}
                  <SmartImage
                    image={toImage(collection.image, '')}
                    sizes={index === categories.length - 1 && categories.length % 2 === 1 ? '(min-width: 960px) 33vw, 100vw' : '(min-width: 960px) 33vw, 50vw'}
                  />
                  <span className="collection-tile__body">
                    <span className="collection-tile__count">
                      {pluralize(productsInCategory(collection.id).length, 'watch', 'watches')}
                    </span>
                    <span className="collection-tile__name">{collection.name}</span>
                    <span className="collection-tile__tagline">{collection.tagline}</span>
                    <span className="collection-tile__cta">
                      Explore <ArrowRightIcon />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tint story" aria-labelledby="story-title">
        <div className="container story__grid">
          <Reveal className="story__media" variant="scale">
            <div className="framed-image">
              <SmartImage image={lifestyleImages.suit} sizes="(min-width: 900px) 44vw, 80vw" />
            </div>
            <div className="framed-image framed-image--offset">
              <SmartImage image={lifestyleImages.drive} sizes="(min-width: 960px) 22vw, 45vw" />
            </div>
          </Reveal>
          <Reveal className="story__copy">
            <p className="eyebrow">{home.story.eyebrow}</p>
            <h2 className="display-title" id="story-title">
              {home.story.title}
            </h2>
            <span className="gold-rule gold-rule--start" aria-hidden="true" />
            <p className="lead">{home.story.text}</p>
            <Button to="/about" variant="outline" icon={<ArrowRightIcon />}>
              {home.story.cta}
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <div className="cta-band__streak" aria-hidden="true" />
        <Reveal className="container cta-band__inner">
          <p className="eyebrow">{site.descriptor.join(' · ')}</p>
          <h2 className="cta-band__title" id="cta-title">
            {home.cta.title}
          </h2>
          <p className="cta-band__text">{home.cta.text}</p>
          <Button to="/shop" size="lg" icon={<ArrowRightIcon />}>
            {home.cta.button}
          </Button>
        </Reveal>
      </section>
    </>
  );
}
