import { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@utils/index';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={classNames(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        className
      )}
      {...rest}
    >
      <span>{children}</span>
    </button>
  );
}
