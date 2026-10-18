'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AppError, errorMessageKeys, toAppError } from '@/shared/lib/errors';

/** Turns any error into user-facing text from the `errors` messages: code, then kind, then unknown. */
export function useErrorMessage() {
  const t = useTranslations('errors');

  return useCallback(
    (error: unknown) => {
      const key = errorMessageKeys(toAppError(error)).find((candidate) => t.has(candidate));
      return t(key ?? 'unknown');
    },
    [t]
  );
}

/** Turns a form field's error key (an `errors.*` key from a schema or the server) into text. */
export function useFieldErrorMessage() {
  const errorMessage = useErrorMessage();

  return useCallback(
    (key: string | undefined) =>
      key === undefined ? undefined : errorMessage(new AppError('validation', key)),
    [errorMessage]
  );
}
