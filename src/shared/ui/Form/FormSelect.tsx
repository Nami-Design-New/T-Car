'use client';
import type { Ref } from 'react';
import { useTranslations } from 'next-intl';
import { useFieldA11y } from './useFieldA11y';
import './Form.scss';
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
export function FormSelect({ id, label, options, required, error, ...props }: FormSelectProps) {
  const t = useTranslations('common');
  const field = useFieldA11y({ id, error, required, describedBy: props['aria-describedby'] });
  return (
    <div className="form_group">
      <label htmlFor={id} className="form_label">
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>
      <select className="form_select" {...props} {...field.controlProps}>
        <option value="">{t('selectPlaceholder')}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={field.errorId} className="form_error">
          {error}
        </span>
      )}
    </div>
  );
}
