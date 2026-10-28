import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconPosition?: "start" | "end";
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
  variant = "primary",
  size = "md",
  loading = false,
  asChild = false,
  className,
  icon,
  iconPosition = "start",
  disabled,
  ...rest
}: ButtonProps) {
  const baseClasses =
    "group relative cursor-pointer isolate inline-flex min-h-[38px] items-center justify-center overflow-hidden rounded-md border px-3 py-1.5 text-base leading-6 backdrop-blur-[24px] transition duration-[350ms] after:absolute after:inset-0 after:z-[1] after:w-0 after:bg-current after:opacity-[0.18] after:content-[''] after:transition-[width] after:duration-300 after:ease-in-out hover:after:w-full";

  const variantClasses = {
    primary: "border-action-primary bg-action-primary text-text-on-action",
    secondary: "border-brand bg-brand text-text-on-brand",
    outline: "border border-action-primary bg-transparent text-action-primary",
  };

  const sizeClasses = {
    sm: "h-8 px-ds-5 py-ds-3 text-sm ",
    md: "h-11 px-ds-7 py-ds-4 text-sm",
    lg: "h-13 px-ds-7 py-ds-5 text-sm",
  };

  const classes = cn(
    "btn", // semantic class for styling
    `btn-${variant}`,
    `btn-${size}`,
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    Boolean(icon) && "btn--with-icon gap-2",
    loading && "btn--loading gap-2",
    className,
  );

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
      {icon && iconPosition === "start" && (
        <span
          className={cn(
            "btn__icon btn__icon--start relative z-2 inline-flex shrink-0 items-center leading-none [&>svg]:block",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <span
        className={cn(
          "btn__label relative z-2 inline-flex items-center gap-2 transition duration-300 group-hover:animate-[btn-scale_0.3s]",
        )}
      >
        {children}
      </span>
      {icon && iconPosition === "end" && (
        <span
          className={cn(
            "btn__icon btn__icon--end relative z-2 inline-flex shrink-0 items-center leading-none [&>svg]:block",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      {loading && (
        <span
          className="btn__spinner inline-block size-[1.1em] shrink-0 animate-[btn-spin_0.7s_linear_infinite] rounded-full border-2 border-current border-r-transparent motion-reduce:animate-[btn-spin_1.6s_linear_infinite]"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
