import { AppError } from "@/shared/lib/errors";
import { fail, ok } from "@/shared/lib/result";
import type { ContactApi } from "./api";

/*
 * Test double of the live `ContactApi` (no production caller, no mock flag).
 * Stateless, so it is safe on the server.
 *
 * Failure rule, as the API answers it: an email without "@" is a 422 "The
 * email address must be a valid email address.".
 */
export const contactMock: ContactApi = {
  async sendMessage({ email }) {
    if (!email.includes("@")) {
      return fail(
        new AppError("validation", undefined, 422, undefined, {
          serverMessage: "The email address must be a valid email address.",
        }),
      );
    }
    return ok(null, "Contact request created successfully.");
  },
};
