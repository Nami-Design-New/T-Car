'use client';

import { useCallback, useState } from 'react';
import { contactApi } from '@/services/contact.api';
import { reportError } from '@/shared/lib/report';
import { fail, ok, type Result } from '@/shared/lib/result';
import type { ContactMessage } from '../model';

/** Sends the contact form. `send` resolves to a Result. */
export function useSendContactMessage() {
  const [submitting, setSubmitting] = useState(false);

  const send = useCallback(async (message: ContactMessage): Promise<Result<void>> => {
    setSubmitting(true);
    try {
      await contactApi.sendMessage(message);
      return ok(undefined);
    } catch (error) {
      reportError(error, { scope: 'contact.send' });
      return fail(error);
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, send };
}
