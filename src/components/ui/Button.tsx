import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'outline' | 'ghost' | 'whatsapp';
type Size = 'md' | 'lg' | 'sm';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  className?: string;
  children: ReactNode;
}

type ButtonProps = BaseProps &
  (
    | ({ to: string; href?: never } & { onClick?: () => void })
    | ({ href: string; to?: never; external?: boolean } & { onClick?: () => void })
    | ({ to?: never; href?: never } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

/** One button, three shapes: router link (`to`), external link (`href`) or a real <button>. */
export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', block, icon, iconPosition = 'end', className = '', children, ...rest } = props;
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, block ? 'btn--block' : '', className].filter(Boolean).join(' ');

  const content = (
    <>
      {icon && iconPosition === 'start' && <span className="btn__icon">{icon}</span>}
      <span className="btn__label">{children}</span>
      {icon && iconPosition === 'end' && <span className="btn__icon">{icon}</span>}
    </>
  );

  if ('to' in rest && rest.to) {
    return (
      <Link className={classes} to={rest.to} onClick={rest.onClick}>
        {content}
      </Link>
    );
  }

  if ('href' in rest && rest.href) {
    const { href, external = true, onClick } = rest as { href: string; external?: boolean; onClick?: () => void };
    return (
      <a className={classes} href={href} onClick={onClick} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {content}
      </a>
    );
  }

  const { type = 'button', ...buttonProps } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} type={type} {...buttonProps}>
      {content}
    </button>
  );
}
