/**
 * WRISTGAME — EDITABLE SITE COPY
 * ---------------------------------------------------------------------------
 * Placeholder brand copy. It deliberately avoids facts (dates, places, numbers,
 * guarantees) so nothing here needs to be "true" yet — rewrite it in your own
 * words whenever you are ready.
 */
import { toImage } from '../lib/catalog';

/** Photos named "…-lg.webp" get their phone-sized copies picked automatically (see `npm run images`). */
export const lifestyleImages = {
  suit: toImage('/images/products/classic-gold-watch-2-lg.webp', 'Gold-tone watch worn with a black tailored suit'),
  drive: toImage('/images/products/royal-black-edition-2-lg.webp', 'Black watch worn on the wrist at the wheel of a car at night'),
};

export const home = {
  hero: {
    eyebrow: 'Watches · Style · Lifestyle',
    headline: ['Time to', 'Elevate.'],
    subtitle: 'Discover watches that define your style.',
    primaryCta: 'Shop Now',
    secondaryCta: 'Explore WristGame',
  },
  featured: {
    eyebrow: 'Featured Collection',
    title: 'The pieces everyone asks about',
    intro: 'Pieces from the WristGame line-up — chosen for presence, finished in black and gold.',
  },
  pillars: [
    {
      title: 'Watches',
      text: 'A focused edit of designs — from bold bracelet pieces to slim everyday classics.',
    },
    {
      title: 'Style',
      text: 'Black, gold and clean lines. Every piece is picked to work with what you already wear.',
    },
    {
      title: 'Lifestyle',
      text: 'More than telling time: it is how you show up. That is what Wear the Game means.',
    },
  ],
  story: {
    eyebrow: 'The WristGame Way',
    title: 'Your wrist speaks before you do',
    text: 'A watch is the one thing you wear every single day. WristGame exists to make that choice easy: considered designs, a clear point of view, and a look that feels premium from the first glance.',
    cta: 'Our Story',
  },
  cta: {
    title: 'Wear the Game',
    text: 'Find the watch that matches your pace.',
    button: 'Shop All Watches',
  },
};

export const about = {
  eyebrow: 'About WristGame',
  title: 'Built for people who notice the details',
  lead: 'WristGame is a watch and lifestyle brand for modern men and women who treat style as part of the game — and their watch as the first move.',
  story: [
    {
      heading: 'Where it started',
      text: 'WristGame began with a simple belief: a great watch changes how you carry yourself. Not because of what it costs, but because of how it makes you feel when you put it on. We set out to build a place where finding that watch feels as good as wearing it.',
    },
    {
      heading: 'What we look for',
      text: 'Presence, proportion and finish. Every piece in the line-up is chosen with the same questions in mind — does it look right from across the room, does it sit well on the wrist, and will you still reach for it a year from now?',
    },
    {
      heading: 'Wear the Game',
      text: 'It is more than a tagline. It is the idea that confidence is something you put on in the morning. Boardroom, weekend or night out — your wrist game goes with you.',
    },
  ],
  values: [
    { title: 'Considered design', text: 'A tight, curated range instead of endless choice.' },
    { title: 'Black & gold DNA', text: 'A signature look that runs through everything we do.' },
    { title: 'For him and for her', text: 'A range picked to suit different wrists and different styles.' },
    { title: 'Personal service', text: 'Real conversations — order and ask questions directly on WhatsApp.' },
  ],
  quote: 'Time is the one luxury everyone wears.',
};

export const policies = {
  /** Shown on product pages. Replace with your real delivery / returns / warranty terms. */
  delivery: 'Delivery options, timelines and charges will be confirmed when you place your order.',
  returns: 'Return and exchange terms will be shared with your order confirmation.',
  payment: 'No payment is taken on this website. WristGame arranges payment with you directly after replying to your order.',
};
