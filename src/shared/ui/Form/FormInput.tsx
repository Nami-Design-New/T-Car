"use client";

import { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/shared/lib/cn";
import { useFieldA11y } from "./useFieldA11y";

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Already translated; shown under the input and announced as its description. */
  error?: string;
  required?: boolean;
  /** Decorative icon at the end of the input, e.g. a calendar; hidden from assistive technology. */
  icon?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function FormInput({
  label,
  error,
  required,
  icon,
  className,
  id,
  ...props
}: FormInputProps) {
  const field = useFieldA11y({
    id,
    error,
    required,
    describedBy: props["aria-describedby"],
  });

  return (
    <div className="form_group flex flex-col gap-2">
      {label && (
        <label htmlFor={field.id} className="form_label text-sm font-semibold text-text-primary">
          {label}
          {required && <span className="ms-1 text-status-error" aria-hidden="true">*</span>}
        </label>
      )}

      {icon ? (
        // Shares the input's direction, so the icon sits on the side its padding is on.
        <div className="form_input_wrapper relative" dir={props.dir}>
          <input
            className={cn(
              'form_input form_input--with-icon w-full rounded-md border border-stroke-light bg-surface-elevated px-4 py-3.5 text-[15px] transition duration-200 focus:border-action-primary focus:outline-none focus:ring-4 focus:ring-action-primary/15',
              'pe-12',
              className,
            )}
            {...props}
            {...field.controlProps}
          />
          <span
            className="form_input_icon pointer-events-none absolute end-3.5 top-1/2 inline-flex -translate-y-1/2 text-action-primary"
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>
      ) : (
        <input
          className={cn(
            'form_input w-full rounded-md border border-stroke-light bg-surface-elevated px-4 py-3.5 text-[15px] transition duration-200 focus:border-action-primary focus:outline-none focus:ring-4 focus:ring-action-primary/15',
            className,
          )}
          {...props}
          {...field.controlProps}
        />
      )}

      {error && (
        <small id={field.errorId} className="form_error text-[13px] text-status-error">
          {error}
        </small>
      )}
    </div>
  );
}
