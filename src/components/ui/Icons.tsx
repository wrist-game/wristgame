import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Stroke({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

function Solid({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Stroke>
);

export const BagIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Stroke>
);

export const MenuIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.5 7.5h17M3.5 12h17M3.5 16.5h11" />
  </Stroke>
);

export const CloseIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Stroke>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </Stroke>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Stroke>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Stroke>
);

export const PlusIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);

export const MinusIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 12h14" />
  </Stroke>
);

export const TrashIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7M10 11v5M14 11v5" />
  </Stroke>
);

export const CheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Stroke>
);

export const MailIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </Stroke>
);

export const PhoneIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
  </Stroke>
);

export const ClockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Stroke>
);

export const PinIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Stroke>
);

export const InfoIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.6v.100" />
  </Stroke>
);

export const ZoomIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5M11 8.5v5M8.5 11h5" />
  </Stroke>
);

export const WhatsAppIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12.04 2.5a9.44 9.44 0 0 0-8.13 14.25L2.5 21.5l4.9-1.37a9.44 9.44 0 1 0 4.64-17.63Zm0 1.7a7.74 7.74 0 1 1-4.1 14.31l-.300-.180-2.72.760.77-2.64-.200-.320A7.74 7.74 0 0 1 12.04 4.2Zm-3.3 3.77c-.170 0-.440.06-.670.31-.230.25-.880.86-.880 2.1 0 1.23.900 2.43 1.03 2.6.130.17 1.76 2.79 4.34 3.81 2.14.840 2.58.680 3.04.630.47-.040 1.5-.610 1.72-1.2.210-.600.21-1.1.150-1.21-.060-.100-.230-.170-.490-.300-.250-.120-1.5-.740-1.73-.820-.230-.090-.400-.130-.570.12-.170.26-.650.83-.800 1-.150.16-.300.19-.550.06-.250-.130-1.07-.400-2.04-1.26-.750-.670-1.26-1.5-1.41-1.75-.150-.260-.020-.400.11-.520.12-.110.26-.300.38-.440.13-.150.17-.260.26-.430.08-.170.04-.320-.020-.440-.070-.130-.560-1.39-.790-1.9-.200-.450-.410-.460-.600-.470l-.480-.010Z" />
  </Solid>
);

export const InstagramIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M17.2 6.8v.100" />
  </Stroke>
);

export const FacebookIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M14.5 8.5V7a1.5 1.5 0 0 1 1.5-1.5h1.5v-3H15A4 4 0 0 0 11 6.5v2H8.5v3H11v10h3.5v-10h2.5l.500-3h-3Z" />
  </Stroke>
);

export const TikTokIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.300 2.7 2 4.5 4.5 4.8" />
  </Stroke>
);

export const YouTubeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
    <path d="m10.2 9.3 4.6 2.7-4.6 2.7V9.3Z" />
  </Stroke>
);
