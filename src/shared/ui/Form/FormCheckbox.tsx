'use client';

import { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/shared/lib/cn';
import { useFieldA11y } from './useFieldA11y';

export interface FormCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  /** Already translated; shown under the checkbox and announced as its description. */
  error?: string;
  required?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function FormCheckbox({
  label,
  error,
  required,
  className,
  id,
  ...props
}: FormCheckboxProps) {
  const field = useFieldA11y({ id, error, required, describedBy: props['aria-describedby'] });

  return (
    <div className={cn('form_group flex flex-col gap-2', className)}>
      <label htmlFor={field.id} className="form_check flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          className="size-[18px] accent-action-primary"
          {...props}
          {...field.controlProps}
        />
        <span>{label}</span>
      </label>

      {error && (
        <small id={field.errorId} className="form_error text-[13px] text-status-error">
          {error}
        </small>
      )}
    </div>
  );
}
