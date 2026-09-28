import { AppError } from '@/shared/lib/errors';
import type { ContactApi } from '../contact.api';

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

// Stateless, so it is safe to run anywhere.
export const contactMock: ContactApi = {
  async sendMessage({ phone }) {
    await delay();
    // The phone field is marked required, but nothing in the browser enforces it.
    if (phone.replace(/\D/g, '').length < 6) {
      throw new AppError('validation', 'contact.phoneRequired', undefined, {
        phone: 'contact.phoneRequired',
      });
    }
  },
};
