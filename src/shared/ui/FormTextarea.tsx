'use client';

import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface FormTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormTextarea({
  label,
  error,
  required,
  className,
  id,
  ...props
}: FormTextareaProps) {
  return (
    <div className="form_group">
      <label htmlFor={id} className="form_label">
        {label}
        {required && <span>*</span>}
      </label>

      <textarea
        id={id}
        className={cn('form_textarea', className)}
        {...props}
      />

      {error && <small className="form_error">{error}</small>}
    </div>
  );
}