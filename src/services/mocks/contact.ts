import { AppError } from '@/shared/lib/errors';
import type { ContactApi } from '../contact.api';

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

// Stateless, so it is safe to run anywhere.
export const contactMock: ContactApi = {
  async sendMessage({ name, email, contactReason, message }) {
    await delay();
    // Required fields are validated here because the browser can submit without them.
    if (!name.trim() || !email.trim() || !contactReason || !message.trim()) {
      throw new AppError('validation', 'contact.required', undefined, {
        form: 'contact.required',
      });
    }
  },
};
