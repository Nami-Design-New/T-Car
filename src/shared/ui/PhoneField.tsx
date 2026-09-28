'use client';

import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface PhoneFieldProps {
  value: string;
  onChange: (phone: string) => void;
  defaultCountry?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  inputAriaLabel?: string;
}

export default function PhoneField({
  value,
  onChange,
  defaultCountry = 'sa',
  disabled = false,
  searchPlaceholder = 'Search countries...',
  inputAriaLabel = 'Phone number',
}: PhoneFieldProps) {
  return (
    <PhoneInput
      country={defaultCountry}
      value={value}
      onChange={onChange}
      disabled={disabled}
      enableSearch
      searchPlaceholder={searchPlaceholder}
      disableSearchIcon
      countryCodeEditable={false}
      inputProps={{
        name: 'phone',
        autoComplete: 'tel',
        'aria-label': inputAriaLabel,
      }}
      containerClass="phone_field"
      inputClass="phone_input"
      buttonClass="country_selector_btn"
      dropdownClass="country_dropdown"
      searchClass="country_search"
    />
  );
}
