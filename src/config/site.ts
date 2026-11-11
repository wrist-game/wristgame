/**
 * WRISTGAME — SITE SETTINGS
 * ---------------------------------------------------------------------------
 * Everything business-specific lives here. Fields left as '' are shown on the
 * site as clearly marked placeholders until you fill them in — nothing is
 * invented on your behalf.
 *
 * TO SWITCH ON WHATSAPP ORDERS: replace the placeholder in `contact.whatsapp`
 * below with your business WhatsApp number. That is the only required step.
 * Then run `npm run check` to confirm the number is accepted.
 */

/**
 * The stand-in for your WhatsApp number. While `contact.whatsapp` is still this
 * placeholder, the site knows no number is set: order messages open in WhatsApp
 * without a recipient and a "number not set" notice is shown at checkout.
 */
export const WHATSAPP_NUMBER_PLACEHOLDER = '8801XXXXXXXXX';

export const site = {
  name: 'WristGame',
  tagline: 'WEAR THE GAME',
  descriptor: ['Watches', 'Style', 'Lifestyle'],
  description:
    'WristGame — Wear the Game. Discover watches that define your style, in black, gold and steel, for modern men and women.',

  /** Your live domain, e.g. 'https://www.wristgame.com'. Used for canonical + social-share URLs. */
  url: '',

  /**
   * Currency used once you add prices in src/data/products.ts.
   * `code` is an ISO 4217 code (BDT, USD, EUR…), `locale` controls number formatting.
   */
  currency: { code: 'BDT', locale: 'en-BD' },

  contact: {
    /**
     * ▶ YOUR BUSINESS WHATSAPP NUMBER. Every order and enquiry is sent to it.
     * Replace the placeholder with the real number, country code first:
     * 880 followed by your mobile number without its leading 0.
     * Spaces, dashes and a leading + are fine; they are removed automatically.
     */
    whatsapp: WHATSAPP_NUMBER_PLACEHOLDER as string,
    /**
     * Only used if the number above is typed in local format (starting with 0):
     * the leading 0 is replaced by this country code. 880 = Bangladesh.
     */
    countryCode: '880',
    /** Phone number as you want it displayed, e.g. '+880 1XXX-XXXXXX'. */
    phone: '',
    email: '',
    address: '',
    /** Support hours, e.g. 'Sat – Thu, 10am – 8pm'. */
    hours: '',
  },

  /** Full profile URLs, e.g. 'https://instagram.com/yourhandle'. */
  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  },

  /**
   * Optional: a form endpoint (Formspree, Getform, your own API…) that accepts a JSON POST.
   * When empty, the contact form hands the message to WhatsApp instead.
   */
  contactFormEndpoint: '',

  /** Small "setup" hints shown where information is still missing. Set to false before launch. */
  showSetupNotes: true,
} as const;

export type SocialKey = keyof typeof site.social;
