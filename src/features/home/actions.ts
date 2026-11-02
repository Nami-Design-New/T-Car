"use server";

import { contactApi, joinUsApi } from "./api";
import { reportError } from "@/shared/lib/report";
import {
  fail,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import { toValidationError } from "@/shared/lib/validation";
import type { ZodType } from "zod";
import type { ContactMessage, JoinUsRequest } from "./model";
import { contactMessageSchema, joinUsSchema } from "./validation";

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

/**
 * Public contact form write (POST /contact-us, no session needed). The form is
 * parsed again here; success carries the backend's message for the toast, and
 * a backend 422 keeps its message as `serverMessage`.
 */
export async function sendContactMessageAction(
  message: ContactMessage,
): Promise<ActionResult<null>> {
  try {
    const result = await contactApi.sendMessage(
      parse(contactMessageSchema, message),
    );
    if (!result.ok) throw result.error;
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "contact.send" });
    return toActionResult(fail(error));
  }
}

/**
 * Public Join Us write (POST /join-us, no session needed). Parsed again here;
 * success carries the backend's message for the toast, and a backend 422
 * keeps its message as `serverMessage`.
 */
export async function sendJoinRequestAction(
  request: JoinUsRequest,
): Promise<ActionResult<null>> {
  try {
    const result = await joinUsApi.sendJoinRequest(
      parse(joinUsSchema, request),
    );
    if (!result.ok) throw result.error;
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "joinUs.send" });
    return toActionResult(fail(error));
  }
}
