'use client';

import { Ref, TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import { useFieldA11y } from './useFieldA11y';
import './Form.scss';

export interface FormTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  /** Already translated; shown under the textarea and announced as its description. */
  error?: string;
  required?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function FormTextarea({
  label,
  error,
  required,
  className,
  id,
  ...props
}: FormTextareaProps) {
  const field = useFieldA11y({ id, error, required, describedBy: props['aria-describedby'] });

  return (
    <div className="form_group">
      <label htmlFor={field.id} className="form_label">
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>

      <textarea
        className={cn('form_textarea', className)}
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