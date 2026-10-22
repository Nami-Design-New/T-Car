"use client";

import { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/shared/lib/cn";
import { useFieldA11y } from "./useFieldA11y";
import "./Form.scss";

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
    <div className="form_group">
      {label && (
        <label htmlFor={field.id} className="form_label">
          {label}
          {required && <span aria-hidden="true">*</span>}
        </label>
      )}

      {icon ? (
        // Shares the input's direction, so the icon sits on the side its padding is on.
        <div className="form_input_wrapper" dir={props.dir}>
          <input
            className={cn("form_input", "form_input--with-icon", className)}
            {...props}
            {...field.controlProps}
          />
          <span className="form_input_icon" aria-hidden="true">
            {icon}
          </span>
        </div>
      ) : (
        <input
          className={cn("form_input", className)}
          {...props}
          {...field.controlProps}
        />
      )}

      {error && (
        <small id={field.errorId} className="form_error">
          {error}
        </small>
      )}
    </div>
  );
}
