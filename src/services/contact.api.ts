import type { ContactMessage } from '@/features/home/model';
import { contactMock } from './mocks/contact';

export interface ContactApi {
  sendMessage(message: ContactMessage): Promise<void>;
}

// No contact endpoint yet, so the mock is the only implementation. Add the
// http one here (see cars.api.ts) and pick between the two with an env flag
// once it exists; callers stay unchanged.
export const contactApi: ContactApi = contactMock;
