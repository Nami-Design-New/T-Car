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
import type { PhoneFieldValue } from "@/shared/lib/phone";
import {
  phoneChangeSchema,
  licenseUploadSchema,
  profileFormSchema,
  verifyPhoneSchema,
  type ProfileFormValues,
} from "./validation";

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
    const result = await accountApi.updateProfile(changes);
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
  phone: PhoneFieldValue,
): Promise<ActionResult<PhoneFieldValue>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const input = parse(phoneChangeSchema, { phone });
    const result = await accountApi.sendPhoneCode(input.phone);
    if (!result.ok) throw result.error;
    return toActionResult(ok(input.phone, result.message));
  } catch (error) {
    reportError(error, { scope: "account.sendPhoneCode" });
    return toActionResult(fail(error));
  }
}

export async function verifyPhoneAction(
  phone: PhoneFieldValue,
  code: string,
): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const input = parse(verifyPhoneSchema, { phone, code });
    const result = await accountApi.verifyPhone(input.phone, input.code);
    if (!result.ok) throw result.error;
    await updateSessionProfile({ phone: result.data });
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "account.verifyPhone" });
    return toActionResult(fail(error));
  }
}

export async function uploadLicenseAction(
  formData: FormData,
): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const value = formData.get("license");
    const { file } = parse(licenseUploadSchema, {
      file:
        value !== null && typeof value !== "string"
          ? value
          : { name: "", size: 0, type: "" },
    });
    if (!(file instanceof File))
      throw new AppError("validation", "account.licenseRequired");
    const result = await accountApi.uploadLicense(file);
    if (!result.ok) throw result.error;
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "account.uploadLicense" });
    return toActionResult(fail(error));
  }
}

/** Deletes the account and ends the session. */
export async function deleteAccountAction(): Promise<ActionResult<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const result = await accountApi.deleteAccount();
    if (!result.ok) throw result.error;
    await signOut({ redirect: false });
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "account.deleteAccount" });
    return toActionResult(fail(error));
  }
}
