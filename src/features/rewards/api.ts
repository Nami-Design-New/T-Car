import type {
  RewardCardsData,
  RewardCatalogData,
  RewardRedemption,
  RewardsSummary,
} from "./model";
import type { Result } from "@/shared/lib/result";
import { rewardsMock } from "./api.mock";

export interface RewardsApi {
  getSummary(userId: string): Promise<RewardsSummary>;
  getCards(userId: string): Promise<RewardCardsData>;
  getCatalog(userId: string): Promise<RewardCatalogData>;
  redeem(userId: string, itemId: string): Promise<Result<RewardRedemption>>;
}

// R6 keeps the API-shaped mock; R7 connects package reads to the live API.
export const rewardsApi: RewardsApi = rewardsMock;
