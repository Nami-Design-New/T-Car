'use client';

import { InputHTMLAttributes, Ref } from 'react';
import { cn } from '@/shared/lib/cn';
import { useFieldA11y } from './useFieldA11y';
import './Form.scss';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Already translated; shown under the input and announced as its description. */
  error?: string;
  required?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function FormInput({
  label,
  error,
  required,
  className,
  id,
  ...props
}: FormInputProps) {
  const field = useFieldA11y({ id, error, required, describedBy: props['aria-describedby'] });

  return (
    <div className="form_group">
      <label htmlFor={field.id} className="form_label">
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>

      <input
        className={cn('form_input', className)}
        {...props}
        {...field.controlProps}
      />

      {error && (
        <small id={field.errorId} className="form_error">
          {error}
        </small>
      )}
    </div>
  );
}