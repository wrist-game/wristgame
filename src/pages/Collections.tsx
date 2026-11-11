import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowRightIcon } from '../components/ui/Icons';
import { PageHeader } from '../components/ui/PageHeader';
import { Reveal } from '../components/ui/Reveal';
import { SmartImage } from '../components/ui/SmartImage';
import { categories } from '../data/products';
import { useSeo } from '../hooks/useSeo';
import { productPath, productsInCategory, toImage } from '../lib/catalog';
import { pluralize } from '../lib/format';

export default function Collections() {
  useSeo({
    title: 'Collections',
    description: `Explore WristGame watches by category: ${categories.map((c) => c.name).join(', ')}.`,
  });

  return (
    <>
      <PageHeader
        eyebrow="Collections"
        title="Ways to wear the game"
        intro="Browse the range by category. Every piece shares the same black-and-gold standard."
        crumbs={[{ label: 'Collections' }]}
      />

      <section className="section section--flush-top" aria-label="All collections">
        <div className="container">
          <ul className="collection-list">
            {categories.map((collection, index) => {
              const items = productsInCategory(collection.id);
              const href = `/shop?category=${collection.id}`;
              return (
                <Reveal as="li" key={collection.id} className={`collection-row ${index % 2 ? 'collection-row--flip' : ''}`}>
                  <Link to={href} className="collection-row__media" tabIndex={-1} aria-hidden="true">
                    <SmartImage image={toImage(collection.image, '')} sizes="(min-width: 800px) 50vw, 100vw" priority={index === 0 ? 'high' : false} />
                  </Link>
                  <div className="collection-row__body">
                    <p className="collection-row__index" aria-hidden="true">
                      0{index + 1}
                    </p>
                    <p className="eyebrow">{collection.tagline}</p>
                    <h2 className="display-title">{collection.name}</h2>
                    <span className="gold-rule gold-rule--start" aria-hidden="true" />
                    <p className="lead">{collection.description}</p>
                    <ul className="collection-row__items">
                      {items.map((item) => (
                        <li key={item.id}>
                          <Link to={productPath(item)} className="text-link">
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Button to={href} variant="outline" icon={<ArrowRightIcon />}>
                      Shop {collection.name} · {pluralize(items.length, 'watch', 'watches')}
                    </Button>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
