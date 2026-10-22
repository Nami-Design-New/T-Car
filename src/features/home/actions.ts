"use server";

import { contactApi } from "@/services/contact.api";
import { reportError } from "@/shared/lib/report";
import {
  fail,
  ok,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import { toValidationError } from "@/shared/lib/validation";
import type { ZodType } from "zod";
import type { ContactMessage } from "./model";
import { contactMessageSchema } from "./validation";

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

/** Public contact form write; the action validates before the service boundary. */
export async function sendContactMessageAction(
  message: ContactMessage,
): Promise<ActionResult<void>> {
  try {
    await contactApi.sendMessage(parse(contactMessageSchema, message));
    return toActionResult(ok(undefined));
  } catch (error) {
    reportError(error, { scope: "contact.send" });
    return toActionResult(fail(error));
  }
}
