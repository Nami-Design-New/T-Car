import type {
  ReferralCodeCheck,
  ReferralHistory,
  ReferralProgram,
} from "./model";
import { referralsMock } from "./api.mock";

export interface ReferralsApi {
  getProgram(userId: string): Promise<ReferralProgram>;
  getHistory(userId: string): Promise<ReferralHistory>;
  /** Checks a friend's code during sign-up (no session). Expects it normalized. */
  checkCode(code: string): Promise<ReferralCodeCheck>;
}

// No referrals endpoint exists yet, so keep the mock behind this interface
// until the backend contract is agreed.
export const referralsApi: ReferralsApi = referralsMock;
