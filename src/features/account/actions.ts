'use server';

import { auth, signOut } from '@/auth';
import { accountApi } from '@/services/account.api';
import { AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import type { LicenseUpload, UserProfile } from './model';

/**
 * Runs a write for the signed-in customer. Server Actions are public POST
 * endpoints, so each one checks the session itself instead of relying on the
 * page's middleware guard.
 */
async function run<T>(
  scope: string,
  write: (accountId: string) => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('unauthorized');
    return toActionResult(ok(await write(session.user.id)));
  } catch (error) {
    reportError(error, { scope });
    return toActionResult(fail(error));
  }
}

export async function saveProfileAction(profile: UserProfile): Promise<ActionResult<UserProfile>> {
  return run('account.saveProfile', (accountId) => accountApi.updateProfile(accountId, profile));
}

/** Sends (or resends) the verification code to a new phone number. */
export async function sendPhoneCodeAction(phone: string): Promise<ActionResult<void>> {
  return run('account.sendPhoneCode', (accountId) => accountApi.sendPhoneCode(accountId, phone));
}

export async function verifyPhoneAction(phone: string, code: string): Promise<ActionResult<void>> {
  return run('account.verifyPhone', (accountId) => accountApi.verifyPhone(accountId, phone, code));
}

export async function uploadLicenseAction(formData: FormData): Promise<ActionResult<void>> {
  const value = formData.get('license');
  const file: LicenseUpload =
    value !== null && typeof value !== 'string'
      ? { name: value.name, size: value.size, type: value.type }
      : { name: '', size: 0, type: '' };

  return run('account.uploadLicense', (accountId) => accountApi.uploadLicense(accountId, file));
}

/** Deletes the account and ends the session. */
export async function deleteAccountAction(): Promise<ActionResult<void>> {
  const result = await run('account.deleteAccount', (accountId) =>
    accountApi.deleteAccount(accountId)
  );
  if (result.ok) await signOut({ redirect: false });
  return result;
}
