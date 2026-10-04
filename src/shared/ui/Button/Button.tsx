import { Slot } from '@radix-ui/react-slot';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import './Button.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  /**
   * Pending submit (doc 6): keeps the width, shows a spinner in place of the
   * label, and sets disabled and aria-busy. The label stays for screen readers.
   */
  loading?: boolean;
  /** Render the button styles on the single child instead, e.g. a Link. */
  asChild?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = cn('btn', `btn-${variant}`, `btn-${size}`, loading && 'btn--loading', className);

  if (asChild) {
    return (
      <Slot className={classes} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className="btn__label">{children}</span>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
    </button>
  );
}

