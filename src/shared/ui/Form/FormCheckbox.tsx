'use client';

import { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/shared/lib/cn';
import { useFieldA11y } from './useFieldA11y';
import './Form.scss';

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
    <div className={cn('form_group', className)}>
      <label htmlFor={field.id} className="form_check">
        <input type="checkbox" {...props} {...field.controlProps} />
        <span>{label}</span>
      </label>

      {error && (
        <small id={field.errorId} className="form_error">
          {error}
        </small>
      )}
    </div>
  );
}
