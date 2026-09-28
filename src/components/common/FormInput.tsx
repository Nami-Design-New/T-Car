'use client';

import { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormInput({
  label,
  error,
  required,
  className,
  id,
  ...props
}: FormInputProps) {
  return (
    <div className="form_group">
      <label htmlFor={id} className="form_label">
        {label}
        {required && <span>*</span>}
      </label>

      <input
        id={id}
        className={cn('form_input', className)}
        {...props}
      />

      {error && <small className="form_error">{error}</small>}
    </div>
  );
}