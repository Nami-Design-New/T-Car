"use server";

import { auth, signOut, updateSessionProfile } from "@/auth";
import { accountApi } from "./api";
import { AppError } from "@/shared/lib/errors";
import { reportError } from "@/shared/lib/report";
import {
  fail,
  ok,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import { toValidationError } from "@/shared/lib/validation";
import type { ZodType } from "zod";
import type { ProfileChanges } from "./model";
import {
  phoneChangeSchema,
  licenseUploadSchema,
  profileFormSchema,
  verifyPhoneSchema,
  type ProfileFormValues,
} from "./validation";

/**
 * Runs a write for the signed-in customer. Server Actions are public POST
 * endpoints, so each one checks the session itself instead of relying on the
 * page's middleware guard.
 */
async function run<T>(
  scope: string,
  write: (accountId: string) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    return toActionResult(ok(await write(session.user.id)));
  } catch (error) {
    reportError(error, { scope });
    return toActionResult(fail(error));
  }
}

/**
 * Parses the input again on the server: the client's validation is not
 * trusted. A failure becomes a `validation` AppError with field errors, which
 * `reportError` does not report.
 */
function parse<T>(schema: ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error);
  return parsed.data;
}

/**
 * Saves the editable fields only. The phone and license status are
 * server-managed and do not travel in the client input.
 */
export async function saveProfileAction(
  input: ProfileFormValues,
): Promise<ActionResult<ProfileChanges>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const changes = parse(profileFormSchema, input);
    const result = await accountApi.updateProfile(session.user.id, changes);
    if (!result.ok) throw result.error;
    await updateSessionProfile({
      name: result.data.fullName,
      email: result.data.email,
    });
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "account.saveProfile" });
    return toActionResult(fail(error));
  }
}

/** Sends (or resends) the verification code to a new phone number. */
export async function sendPhoneCodeAction(
  phone: string,
): Promise<ActionResult<void>> {
  return run("account.sendPhoneCode", (accountId) => {
    const input = parse(phoneChangeSchema, { phone });
    return accountApi.sendPhoneCode(accountId, input.phone);
  });
}

export async function verifyPhoneAction(
  phone: string,
  code: string,
): Promise<ActionResult<void>> {
  return run("account.verifyPhone", (accountId) => {
    const input = parse(verifyPhoneSchema, { phone, code });
    return accountApi.verifyPhone(accountId, input.phone, input.code);
  });
}

export async function uploadLicenseAction(
  formData: FormData,
): Promise<ActionResult<void>> {
  const value = formData.get("license");
  return run("account.uploadLicense", (accountId) => {
    const { file } = parse(licenseUploadSchema, {
      file:
        value !== null && typeof value !== "string"
          ? value
          : { name: "", size: 0, type: "" },
    });
    return accountApi.uploadLicense(accountId, file);
  });
}

/** Deletes the account and ends the session. */
export async function deleteAccountAction(): Promise<ActionResult<void>> {
  const result = await run("account.deleteAccount", (accountId) =>
    accountApi.deleteAccount(accountId),
  );
  if (result.ok) await signOut({ redirect: false });
  return result;
}
