'use client';
import type { Ref } from 'react';
import { useTranslations } from 'next-intl';
import { useFieldA11y } from './useFieldA11y';
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
    <div className="form_group flex flex-col gap-2">
      <label htmlFor={id} className="form_label text-sm font-semibold text-text-primary">
        {label}
        {required && <span className="ms-1 text-status-error" aria-hidden="true">*</span>}
      </label>
      <select
        className="form_select w-full cursor-pointer appearance-none rounded-md border border-stroke-light bg-surface-elevated px-4 py-3.5 text-[15px] transition duration-200 focus:border-action-primary focus:outline-none focus:ring-4 focus:ring-action-primary/15"
        {...props}
        {...field.controlProps}
      >
        <option value="">{t('selectPlaceholder')}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={field.errorId} className="form_error text-[13px] text-status-error">
          {error}
        </span>
      )}
    </div>
  );
}
