import "server-only";
import type { ContactMessage } from "./model";
import { contactMock } from "./api.mock";

export interface ContactApi {
  sendMessage(message: ContactMessage): Promise<void>;
}

// The contact form still runs on the mock until C2 sends it to
// POST /contact-us (docs/api/contact-join-us-api.md §7).
export const contactApi: ContactApi = contactMock;
