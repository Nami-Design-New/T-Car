import type { RewardsSummary } from "@/features/rewards/model";
import { rewardsMock } from "./mocks/rewards";

export interface RewardsApi {
  getSummary(userId: string): Promise<RewardsSummary>;
}

// No rewards endpoint exists yet, so keep the mock behind this interface
// until the backend contract is agreed.
export const rewardsApi: RewardsApi = rewardsMock;
