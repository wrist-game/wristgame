import { lazy, type ComponentType } from 'react';

/**
 * Like React's `lazy`, but a page whose code fails to download is tried once more
 * before giving up. A dropped mobile connection is the usual cause, and a second
 * attempt normally succeeds. If it still fails, `PageBoundary` shows a
 * "page did not load" message with a reload button instead of a blank screen.
 */
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() => load().catch(() => new Promise<{ default: T }>((resolve, reject) => window.setTimeout(() => load().then(resolve, reject), 700))));
}
