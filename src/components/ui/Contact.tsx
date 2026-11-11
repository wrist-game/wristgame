import type { ReactNode } from 'react';
import { site, type SocialKey } from '../../config/site';
import { generalEnquiryMessage, whatsappLink } from '../../lib/whatsapp';
import { Button } from './Button';
import { FacebookIcon, InfoIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon } from './Icons';

/** Shows a value from site settings, or a clearly marked placeholder when it has not been provided yet. */
export function ConfigValue({ value, placeholder, href }: { value: string; placeholder: string; href?: string }) {
  if (!value) {
    return (
      <span className="placeholder" title="Add this in src/config/site.ts">
        {placeholder}
      </span>
    );
  }
  return href ? (
    <a className="text-link" href={href}>
      {value}
    </a>
  ) : (
    <span>{value}</span>
  );
}

/** A small owner-facing hint. Hidden everywhere once `showSetupNotes` is false in site settings. */
export function SetupNote({ children }: { children: ReactNode }) {
  if (!site.showSetupNotes) return null;
  return (
    <p className="setup-note">
      <InfoIcon />
      <span>{children}</span>
    </p>
  );
}

const SOCIALS: { key: SocialKey; label: string; Icon: typeof InstagramIcon }[] = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
  { key: 'youtube', label: 'YouTube', Icon: YouTubeIcon },
];

export function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <ul className={`social-links ${className}`.trim()}>
      {SOCIALS.map(({ key, label, Icon }) => {
        const url = site.social[key];
        return (
          <li key={key}>
            {url ? (
              <a className="social-links__item" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} on ${label}`}>
                <Icon />
              </a>
            ) : (
              <span
                className="social-links__item social-links__item--unset"
                role="img"
                aria-label={`${label} (link not added yet)`}
                title={`${label} — add your link in src/config/site.ts`}
              >
                <Icon />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

interface WhatsAppButtonProps {
  message?: string;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  variant?: 'whatsapp' | 'outline';
  onClick?: () => void;
}

export function WhatsAppButton({ message = generalEnquiryMessage(), children = 'Chat on WhatsApp', size = 'md', block, variant = 'whatsapp', onClick }: WhatsAppButtonProps) {
  return (
    <Button href={whatsappLink(message)} variant={variant} size={size} block={block} icon={<WhatsAppIcon />} iconPosition="start" onClick={onClick}>
      {children}
    </Button>
  );
}
