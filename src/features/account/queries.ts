import 'server-only';
import { auth } from '@/auth';
import { accountApi } from '@/services/account.api';
import { AppError } from '@/shared/lib/errors';
import type { UserProfile } from './model';

/** The signed-in customer's profile. The middleware guards the page; this is the real check. */
export async function getProfile(): Promise<UserProfile> {
  const session = await auth();
  if (!session?.user?.id) throw new AppError('unauthorized');
  return accountApi.getProfile(session.user.id);
}
