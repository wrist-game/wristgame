import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, CloseIcon } from '../components/ui/Icons';

interface ToastOptions {
  message: string;
  action?: { label: string; to: string };
}

interface ToastState extends ToastOptions {
  id: number;
}

const ToastContext = createContext<((toast: ToastOptions) => void) | null>(null);

const DURATION = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number>();

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    window.clearTimeout(timer.current);
    setToast({ ...options, id: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), DURATION);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="toast" key={toast.id}>
            <span className="toast__icon" aria-hidden="true">
              <CheckIcon />
            </span>
            <p className="toast__message">{toast.message}</p>
            {toast.action && (
              <Link className="toast__action" to={toast.action.to} onClick={dismiss}>
                {toast.action.label}
              </Link>
            )}
            <button type="button" className="toast__close" onClick={dismiss} aria-label="Dismiss notification">
              <CloseIcon />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
