import { Component, type ErrorInfo, type ReactNode } from 'react';

interface PageBoundaryProps {
  children: ReactNode;
}

/**
 * Safety net around every page. If a page cannot be shown (its code did not
 * download, or it hit an unexpected error), the visitor gets a clear message and
 * a way forward. The header, footer and cart stay usable. Without this, one
 * failed download would leave the whole site blank.
 */
export class PageBoundary extends Component<PageBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[WristGame] This page could not be shown.', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="page-error" role="alert">
        <div className="container container--narrow">
          <h1 className="display-title">This page did not load</h1>
          <span className="gold-rule" aria-hidden="true" />
          <p className="lead">Your connection may have dropped for a moment. Your cart is safe. Please try again.</p>
          <div className="button-row button-row--center">
            <button type="button" className="btn btn--primary btn--md" onClick={() => window.location.reload()}>
              <span className="btn__label">Try again</span>
            </button>
            {/* A plain link (full page load) on purpose: it also recovers when the site was updated while the tab was open. */}
            <a className="btn btn--outline btn--md" href="/">
              <span className="btn__label">Back to home</span>
            </a>
          </div>
        </div>
      </section>
    );
  }
}
