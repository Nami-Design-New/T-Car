import type {
  RewardCardsData,
  RewardCatalogData,
  RewardRedemption,
  RewardsSummary,
} from "@/features/rewards/model";
import type { Result } from "@/shared/lib/result";
import { rewardsMock } from "./mocks/rewards";

export interface RewardsApi {
  getSummary(userId: string): Promise<RewardsSummary>;
  getCards(userId: string): Promise<RewardCardsData>;
  getCatalog(userId: string): Promise<RewardCatalogData>;
  redeem(userId: string, itemId: string): Promise<Result<RewardRedemption>>;
}

// No rewards endpoint exists yet, so keep the mock behind this interface
// until the backend contract is agreed.
export const rewardsApi: RewardsApi = rewardsMock;
