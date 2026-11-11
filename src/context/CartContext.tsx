import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  addLine,
  detailLines,
  getTotals,
  removeLine,
  sanitizeStoredLines,
  setLineQuantity,
  unitsInCart,
  type CartTotals,
  type DetailedLine,
} from '../lib/cart';
import { getProductById, purchaseLimit } from '../lib/catalog';
import type { CartLine } from '../types';

/** v2: product IDs changed with the reusable catalogue, so carts saved by the first version are not reused. */
const STORAGE_KEY = 'wristgame.cart.v2';

function parseStored(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    return sanitizeStoredLines(JSON.parse(raw), purchaseLimit);
  } catch {
    return [];
  }
}

function loadCart(): CartLine[] {
  try {
    return parseStored(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return []; // storage blocked (private mode etc.) — the cart still works for this visit
  }
}

interface CartContextValue {
  lines: DetailedLine[];
  totals: CartTotals;
  /** Adds units up to the stock limit and returns how many were actually added (0 when none could be). */
  addItem: (productId: string, color: string, quantity?: number) => number;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  /** Units of a product already in the cart, across all its colours. */
  quantityOf: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [rawLines, setRawLines] = useState<CartLine[]>(loadCart);
  // The ref always holds the latest cart, so two quick clicks cannot both read a stale copy.
  const latest = useRef(rawLines);

  const commit = useCallback((next: CartLine[]) => {
    if (next === latest.current) return;
    latest.current = next;
    setRawLines(next);
  }, []);

  // Persist on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rawLines));
    } catch {
      /* storage unavailable — ignore */
    }
  }, [rawLines]);

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) commit(parseStored(event.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [commit]);

  const addItem = useCallback(
    (productId: string, color: string, quantity = 1) => {
      const before = unitsInCart(latest.current, productId);
      const next = addLine(latest.current, productId, color, quantity, purchaseLimit);
      commit(next);
      return unitsInCart(next, productId) - before;
    },
    [commit],
  );
  const setQuantity = useCallback((key: string, quantity: number) => commit(setLineQuantity(latest.current, key, quantity, purchaseLimit)), [commit]);
  const removeItem = useCallback((key: string) => commit(removeLine(latest.current, key)), [commit]);
  const clear = useCallback(() => commit([]), [commit]);

  const value = useMemo<CartContextValue>(() => {
    const lines = detailLines(rawLines, getProductById, purchaseLimit);
    return {
      lines,
      totals: getTotals(lines),
      addItem,
      setQuantity,
      removeItem,
      clear,
      quantityOf: (productId: string) => unitsInCart(rawLines, productId),
    };
  }, [rawLines, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
