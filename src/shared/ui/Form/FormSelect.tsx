"use client";
import type { Ref } from "react";
import { useTranslations } from "next-intl";
import { useFieldA11y } from "./useFieldA11y";
import { cn } from "@/shared/lib/cn";
interface Option {
  value: string;
  label: string;
}
export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: Option[];
  required?: boolean;
  /** Already translated; shown under the select and announced as its description. */
  error?: string;
  ref?: Ref<HTMLSelectElement>;
}
export function FormSelect({
  id,
  label,
  options,
  required,
  error,
  ...props
}: FormSelectProps) {
  const t = useTranslations("common");
  const field = useFieldA11y({
    id,
    error,
    required,
    describedBy: props["aria-describedby"],
  });
  return (
    <div className="form_group flex flex-col gap-2">
      <label
        htmlFor={id}
        className="form_label text-text-primary text-sm font-semibold"
      >
        {label}
        {required && (
          <span className="text-status-error ms-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        className={cn(
          "focus:ring-action-primary/15 w-full cursor-pointer appearance-none rounded-md border px-4 py-3.5 text-sm transition duration-200 focus:ring-4 focus:outline-none",
          error
            ? "border-status-error bg-status-error-background focus:border-status-error"
            : "border-stroke-light focus:border-action-primary bg-white",
        )}
        {...props}
        {...field.controlProps}
      >
        <option value="">{t("selectPlaceholder")}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span
          id={field.errorId}
          className="form_error text-status-error text-[13px]"
        >
          {error}
        </span>
      )}
    </div>
  );
}
