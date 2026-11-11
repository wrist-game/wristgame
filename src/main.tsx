import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import '@fontsource-variable/cinzel/wght.css';
import '@fontsource-variable/jost/wght.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/hero.css';
import './styles/pages.css';

import App from './App';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { categories, products } from './data/products';
import { validateCatalog } from './lib/validateCatalog';

// While developing, mistakes in src/data/products.ts are listed in the browser console.
if (import.meta.env.DEV) {
  const problems = validateCatalog(products, categories);
  if (problems.length > 0) console.warn(`[WristGame] ${problems.length} problem(s) in src/data/products.ts:\n• ${problems.join('\n• ')}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CartProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
);
