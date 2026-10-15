'use client';

import { useCallback, useState } from 'react';
import { fail, fromActionResult, type Result } from '@/shared/lib/result';
import { reportError } from '@/shared/lib/report';
import { sendContactMessageAction } from '../actions';
import type { ContactMessage } from '../model';

/** Sends the contact form through the public Server Action boundary. */
export function useSendContactMessage() {
  const [submitting, setSubmitting] = useState(false);

  const send = useCallback(async (message: ContactMessage): Promise<Result<void>> => {
    setSubmitting(true);
    try {
      return fromActionResult(await sendContactMessageAction(message));
    } catch (error) {
      reportError(error, { scope: 'contact.send' });
      return fail(error);
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, send };
}
