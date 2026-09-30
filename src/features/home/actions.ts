'use server';

import { contactApi } from '@/services/contact.api';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import type { ContactMessage } from './model';

/** Public contact form write; the service owns validation and API integration. */
export async function sendContactMessageAction(
  message: ContactMessage
): Promise<ActionResult<void>> {
  try {
    await contactApi.sendMessage(message);
    return toActionResult(ok(undefined));
  } catch (error) {
    reportError(error, { scope: 'contact.send' });
    return toActionResult(fail(error));
  }
}
