import type { ReferralProgram } from "@/features/referrals/model";
import { referralsMock } from "./mocks/referrals";

export interface ReferralsApi {
  getProgram(userId: string): Promise<ReferralProgram>;
}

// No referrals endpoint exists yet, so keep the mock behind this interface
// until the backend contract is agreed.
export const referralsApi: ReferralsApi = referralsMock;
