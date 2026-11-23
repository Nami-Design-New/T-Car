import type {
  ReferralHistory,
  ReferralProgram,
} from "@/features/referrals/model";
import { referralsMock } from "./mocks/referrals";

export interface ReferralsApi {
  getProgram(userId: string): Promise<ReferralProgram>;
  getHistory(userId: string): Promise<ReferralHistory>;
}

// No referrals endpoint exists yet, so keep the mock behind this interface
// until the backend contract is agreed.
export const referralsApi: ReferralsApi = referralsMock;
