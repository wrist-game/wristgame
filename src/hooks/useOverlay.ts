import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Fired on `window` when an overlay opens or closes, so heavy background work (the 3D watch) can pause. */
export const OVERLAY_EVENT = 'wristgame:overlay';
let openOverlays = 0;

export const isOverlayOpen = () => openOverlays > 0;

function announce(change: number) {
  openOverlays = Math.max(0, openOverlays + change);
  window.dispatchEvent(new CustomEvent(OVERLAY_EVENT, { detail: { open: openOverlays > 0 } }));
}

/**
 * Shared behaviour for modal overlays (mobile menu, search):
 * locks page scroll, moves focus into the panel, closes on Escape,
 * traps Tab focus inside the panel, and returns focus to whatever opened it.
 */
export function useOverlay(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    announce(1);

    // Move focus into the panel so keyboard and screen-reader users land in the dialog, not behind it.
    // (Skipped when the overlay has already focused something itself, such as the search field.)
    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel || panel.contains(document.activeElement)) return;
      const first = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).find((element) => element.offsetParent !== null);
      (first ?? panel).focus({ preventScroll: true });
    }, 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      announce(-1);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, panelRef]);
}
