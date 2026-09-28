import 'server-only';
import { accountApi } from '@/services/account.api';
import type { UserProfile } from './model';

const CURRENT_ACCOUNT_ID = 'current';

export function getProfile(): Promise<UserProfile> {
  return accountApi.getProfile(CURRENT_ACCOUNT_ID);
}
