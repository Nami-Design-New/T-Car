"use client";

import { useId } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export interface PhoneFieldProps {
  value: string;
  onChange: (phone: string) => void;
  onBlur?: () => void;
  defaultCountry?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  inputAriaLabel?: string;
  label?: string;
  required?: boolean;
  /** Already translated; shown under the input, announced, and linked as its description. */
  error?: string;
}

export function PhoneField({
  value,
  onChange,
  onBlur,
  defaultCountry = "sa",
  disabled = false,
  searchPlaceholder = "Search countries...",
  inputAriaLabel = "Phone number",
  label,
  required = false,
  error,
}: PhoneFieldProps) {
  const errorId = `${useId()}-error`;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-text-primary font-semibold">{label}</label>
      )}
      <PhoneInput
        country={defaultCountry}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        enableSearch
        searchPlaceholder={searchPlaceholder}
        disableSearchIcon
        countryCodeEditable={false}
        inputProps={{
          name: "phone",
          autoComplete: "tel",
          "aria-label": inputAriaLabel,
          "aria-required": required || undefined,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? errorId : undefined,
        }}
        containerClass="phone_field relative w-full direction-ltr"
        inputClass="phone_input h-12.5! !w-full !rounded-md !border !border-stroke-light !pl-4 !pr-4 !text-left !direction-ltr focus:!border-action-primary focus:!outline-none focus:!ring-4 focus:!ring-action-primary/15"
        buttonClass="!h-12.5 "
        dropdownClass=""
        searchClass=""
      />
      {error && (
        <p
          id={errorId}
          className="phone_field_error text-status-error mt-1 mb-0 text-[13px]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
