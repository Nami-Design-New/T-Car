'use client';

import { useId } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './PhoneField.scss';

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
  defaultCountry = 'sa',
  disabled = false,
  searchPlaceholder = 'Search countries...',
  inputAriaLabel = 'Phone number',
  label,
  required = false,
  error,
}: PhoneFieldProps) {
  const errorId = `${useId()}-error`;

  return (
    <div className="phone_field_wrapper">
      {label && <label className="phone_field_label">{label}</label>}
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
          name: 'phone',
          autoComplete: 'tel',
          'aria-label': inputAriaLabel,
          'aria-required': required || undefined,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? errorId : undefined,
        }}
        containerClass="phone_field"
        inputClass="phone_input"
        buttonClass="country_selector_btn"
        dropdownClass="country_dropdown"
        searchClass="country_search"
      />
      {error && (
        <p id={errorId} className="phone_field_error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
