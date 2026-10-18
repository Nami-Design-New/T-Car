import { useId } from 'react';
import { cn } from '@/shared/lib/cn';

interface Options {
  id?: string;
  error?: string;
  required?: boolean;
  /** A description the caller already links to the control. */
  describedBy?: string;
}

/**
 * The id and ARIA attributes that tie a form control to its error (doc 9 §9.2).
 * `required` is announced with `aria-required` rather than the native
 * attribute, so the browser does not block a submit before the form's own
 * validation runs.
 */
export function useFieldA11y({ id, error, required, describedBy }: Options) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const errorId = `${controlId}-error`;

  return {
    id: controlId,
    errorId,
    controlProps: {
      id: controlId,
      'aria-required': required || undefined,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': cn(describedBy, error && errorId) || undefined,
    },
  };
}
