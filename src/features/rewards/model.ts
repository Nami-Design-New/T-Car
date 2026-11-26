import type { Page } from "@/shared/lib/pagination";

export interface RewardPerk {
  key: string;
  title: string;
  code: string | null;
}

export interface RewardRoadTier {
  id: string;
  name: string;
  iconUrl: string;
  colors: { high: string; medium: string; low: string };
  startPoints: number;
}

export interface RewardTier extends RewardRoadTier {
  /** Lifetime tier points required to enter and finish this tier. */
  endPoints: number;
  perks: RewardPerk[];
}

export interface RewardsSummary {
  /** Lifetime points used only to determine the customer's tier. */
  tierPoints: number;
  /** Spendable points; redemption never changes `tierPoints`. */
  balance: number;
  tiers: RewardTier[];
}

/** The overview uses E7's current package and road list, without E6. */
export interface RewardsHomeData {
  tierPoints: number;
  balance: number;
  currentTier: RewardTier | null;
  roadTiers: RewardRoadTier[];
}

export type RewardCardStatus = "active" | "used" | "expired";
export type RewardCardFilter = "all" | RewardCardStatus;
export const REWARD_CARD_FILTERS: RewardCardFilter[] = [
  "all",
  "active",
  "used",
  "expired",
];

export function parseRewardCardFilter(value: unknown): RewardCardFilter {
  return typeof value === "string" &&
    REWARD_CARD_FILTERS.includes(value as RewardCardFilter)
    ? (value as RewardCardFilter)
    : "all";
}

export interface RewardCard {
  id: string;
  code: string;
  discountAmount: number;
  status: RewardCardStatus;
  expiresAt?: string;
  usedAt?: string;
  bookingId?: string;
}

export interface RewardCardsData {
  balance: number;
  page: Page<RewardCard>;
}

export interface RewardCatalogItem {
  id: string;
  discountAmount: number;
  pointsCost: number;
  /** The E9 per-card eligibility decision controls the redeem button. */
  canReplace: boolean;
  /** Days the redeemed card stays valid, counted from redemption. */
  validityDays: number;
}

export interface RewardCatalogData {
  balance: number;
  items: RewardCatalogItem[];
}

export interface RewardRedemption {
  card: RewardCard;
  pointsCost: number;
  balanceBefore: number;
  balanceAfter: number;
  tierPoints: number;
  /** Unchanged by redemption; shown on the success screen. */
  tierId: string;
  tierName: string;
}

export type RewardTierState = "reached" | "current" | "locked";

export interface TierOverview<T extends RewardRoadTier> {
  /** Every tier, lowest threshold first. */
  tiers: { tier: T; state: RewardTierState }[];
  current: T;
  /** Null at the top tier. */
  next: T | null;
  /** 0–100: tier points against the next tier's threshold, as Figma shows it. */
  progress: number;
  pointsToNext: number;
  /** 0–100 along the tier road, at the car between the current and next tier. */
  roadPosition: number;
}

export type RewardsOverview = TierOverview<RewardTier>;
export type RewardsHomeOverview = TierOverview<RewardRoadTier>;

export interface RewardTierView {
  tier: RewardTier;
  state: RewardTierState;
  next: RewardTier | null;
  progress: number;
  pointsLeft: number;
  tiers: RewardsOverview["tiers"];
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function rewardTierView(
  summary: RewardsSummary,
  tierId: string,
): RewardTierView {
  const overview = rewardsOverview(summary);
  const index = overview.tiers.findIndex(({ tier }) => tier.id === tierId);
  if (index < 0) throw new Error(`Missing reward tier: ${tierId}`);
  const { tier, state } = overview.tiers[index];
  const next = overview.tiers[index + 1]?.tier ?? null;
  return {
    tier,
    state,
    next,
    progress:
      state === "current"
        ? overview.progress
        : state === "reached"
          ? 100
          : clampPercent((summary.tierPoints / tier.startPoints) * 100),
    pointsLeft:
      state === "current"
        ? overview.pointsToNext
        : state === "reached"
          ? 0
          : Math.max(0, tier.startPoints - summary.tierPoints),
    tiers: overview.tiers,
  };
}

/**
 * Everything the overview shows, from one sorted copy of the tiers. A customer
 * below the first threshold is shown at the first tier.
 */
function tierOverview<T extends RewardRoadTier>(
  tiers: T[],
  tierPoints: number,
  currentId?: string | null,
): TierOverview<T> {
  const sorted = [...tiers].sort((a, b) => a.startPoints - b.startPoints);
  if (sorted.length === 0) throw new Error("Rewards require at least one tier");

  const reached = sorted.filter(
    (tier) => tierPoints >= tier.startPoints,
  ).length;
  const matchedIndex =
    currentId == null ? -1 : sorted.findIndex((tier) => tier.id === currentId);
  const currentIndex =
    matchedIndex >= 0 ? matchedIndex : Math.max(0, reached - 1);
  const current = sorted[currentIndex];
  const next = sorted[currentIndex + 1] ?? null;

  return {
    tiers: sorted.map((tier, index) => ({
      tier,
      state:
        index === currentIndex
          ? "current"
          : index < currentIndex
            ? "reached"
            : "locked",
    })),
    current,
    next,
    progress: next ? clampPercent((tierPoints / next.startPoints) * 100) : 100,
    pointsToNext: next ? Math.max(0, next.startPoints - tierPoints) : 0,
    roadPosition:
      sorted.length === 1
        ? 100
        : (Math.min(currentIndex + 0.5, sorted.length - 1) /
            (sorted.length - 1)) *
          100,
  };
}

export function rewardsOverview(summary: RewardsSummary): RewardsOverview {
  return tierOverview(summary.tiers, summary.tierPoints);
}

export function rewardsHomeOverview(
  data: RewardsHomeData,
): RewardsHomeOverview {
  return tierOverview(data.roadTiers, data.tierPoints, data.currentTier?.id);
}
