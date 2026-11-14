import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';
import './Button.css';

export type ButtonVariant = 'outline' | 'ghost';

type CommonProps = {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  /** Hide the text label below 600px; it stays available to screen readers. */
  collapseLabel?: boolean;
  children?: ReactNode;
};

export function buttonClassName({
  variant = 'outline',
  hasIcon,
  iconOnly,
  collapseLabel,
  className,
}: {
  variant?: ButtonVariant;
  hasIcon: boolean;
  iconOnly: boolean;
  collapseLabel?: boolean;
  className?: string;
}) {
  return [
    'btn',
    `btn--${variant}`,
    hasIcon && 'btn--has-icon',
    iconOnly && 'btn--icon-only',
    collapseLabel && 'btn--collapse-label',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

function Content({ icon, children }: Pick<CommonProps, 'icon' | 'children'>) {
  return (
    <>
      {icon && <Icon icon={icon} />}
      {children != null && <span className="btn__label">{children}</span>}
    </>
  );
}

export type ButtonProps = CommonProps & ComponentPropsWithRef<'button'>;

/** Pill button. Icon-only buttons must pass aria-label. */
export function Button({
  variant,
  icon,
  collapseLabel,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({
        variant,
        hasIcon: !!icon,
        iconOnly: children == null,
        collapseLabel,
        className,
      })}
      {...rest}
    >
      <Content icon={icon}>{children}</Content>
    </button>
  );
}

export type LinkButtonProps = CommonProps & ComponentPropsWithRef<'a'>;

/** A link styled as a pill button. External links open in a new tab safely. */
export function LinkButton({
  variant,
  icon,
  collapseLabel,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  const external = typeof rest.href === 'string' && /^https?:/.test(rest.href);
  return (
    <a
      className={buttonClassName({
        variant,
        hasIcon: !!icon,
        iconOnly: children == null,
        collapseLabel,
        className,
      })}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      <Content icon={icon}>{children}</Content>
    </a>
  );
}
