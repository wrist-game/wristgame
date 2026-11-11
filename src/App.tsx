import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { lazyPage } from './lib/lazyPage';
import Home from './pages/Home';

// Everything except the home page is split into its own chunk and loaded on demand.
// `lazyPage` retries a failed download once; `PageBoundary` (in Layout) handles the rest.
const Shop = lazyPage(() => import('./pages/Shop'));
const ProductDetail = lazyPage(() => import('./pages/ProductDetail'));
const Collections = lazyPage(() => import('./pages/Collections'));
const About = lazyPage(() => import('./pages/About'));
const Contact = lazyPage(() => import('./pages/Contact'));
const Cart = lazyPage(() => import('./pages/Cart'));
const Checkout = lazyPage(() => import('./pages/Checkout'));
const PaymentReturn = lazyPage(() => import('./pages/PaymentReturn'));
const NotFound = lazyPage(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="collections" element={<Collections />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        {/* Where a payment provider sends the customer back to. Shows only what the backend has verified. */}
        <Route path="payment/return" element={<PaymentReturn />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
