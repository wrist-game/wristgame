import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  crumbs?: Crumb[];
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/">Home</Link>
        </li>
        {crumbs.map((crumb, index) => (
          <li key={crumb.label} aria-current={index === crumbs.length - 1 ? 'page' : undefined}>
            {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Banner at the top of every inner page. */
export function PageHeader({ eyebrow, title, intro, crumbs }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__glow" aria-hidden="true" />
      <div className="container">
        {crumbs && <Breadcrumbs crumbs={crumbs} />}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-header__title">{title}</h1>
        <span className="gold-rule" aria-hidden="true" />
        {intro && <p className="page-header__intro">{intro}</p>}
      </div>
    </header>
  );
}
