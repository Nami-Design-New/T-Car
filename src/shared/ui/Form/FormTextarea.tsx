'use client';

import { Ref, TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import { useFieldA11y } from './useFieldA11y';

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
    <div className="form_group flex flex-col gap-2">
      <label htmlFor={field.id} className="form_label text-sm font-semibold text-text-primary">
        {label}
        {required && <span className="ms-1 text-status-error" aria-hidden="true">*</span>}
      </label>

      <textarea
        className={cn(
          'form_textarea w-full rounded-md border border-stroke-light bg-surface-elevated px-4 py-3.5 text-[15px] transition duration-200 focus:border-action-primary focus:outline-none focus:ring-4 focus:ring-action-primary/15',
          className,
        )}
        {...props}
        {...field.controlProps}
      />

      {error && (
        <small id={field.errorId} className="form_error text-[13px] text-status-error">
          {error}
        </small>
      )}
    </div>
  );
}
