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
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={field.id}
          className="text-text-primary mb-1 text-sm font-semibold"
        >
          {label}
          {/* {required && (
            <span className="text-status-error ms-1" aria-hidden="true">
              *
            </span>
          )} */}
        </label>
      )}

      {icon ? (
        // Shares the input's direction, so the icon sits on the side its padding is on.
        <div className="relative" dir={props.dir}>
          <input
            className={cn(
              "w-full rounded-md border px-2 py-4 text-sm transition duration-200 focus:outline-none",
              error
                ? "border-status-error bg-status-error-background focus:border-status-error"
                : "border-stroke-light focus:border-action-primary bg-white",
              "pe-12",
              className,
            )}
            {...props}
            {...field.controlProps}
          />
          <span
            className="text-action-primary pointer-events-none absolute inset-e-3.5 top-1/2 inline-flex -translate-y-1/2"
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>
      ) : (
        <input
          className={cn(
            "w-full rounded-md border px-2 py-4 text-sm transition duration-200 focus:outline-none",
            error
              ? "border-status-error bg-status-error-background focus:border-status-error"
              : "border-stroke-light focus:border-action-primary bg-white",
            className,
          )}
          {...props}
          {...field.controlProps}
        />
      )}

      {error && (
        <small id={field.errorId} className="text-status-error text-xs">
          {error}
        </small>
      )}
    </div>
  );
}
