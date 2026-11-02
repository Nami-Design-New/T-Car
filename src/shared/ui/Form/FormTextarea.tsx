"use client";

import { Ref, TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { useFieldA11y } from "./useFieldA11y";

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  /** Already translated; shown under the textarea and announced as its description. */
  error?: string;
  required?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function FormTextarea({
  label,
  error,
  required,
  className,
  id,
  ...props
}: FormTextareaProps) {
  const field = useFieldA11y({
    id,
    error,
    required,
    describedBy: props["aria-describedby"],
  });

  return (
    <div className="form_group flex flex-col gap-2">
      <label
        htmlFor={field.id}
        className="form_label text-text-primary text-sm font-semibold"
      >
        {label}
        {required && (
          <span className="text-status-error ms-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <textarea
        className={cn(
          "focus:ring-action-primary/15 w-full rounded-md border px-4 py-3.5 text-sm transition duration-200 focus:ring-4 focus:outline-none",
          error
            ? "border-status-error bg-status-error-background focus:border-status-error"
            : "border-stroke-light focus:border-action-primary bg-white",
          className,
        )}
        {...props}
        {...field.controlProps}
      />

      {error && (
        <small id={field.errorId} className="text-status-error text-[13px]">
          {error}
        </small>
      )}
    </div>
  );
}
