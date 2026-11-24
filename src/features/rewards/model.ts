export type RewardTierId = "bronze" | "silver" | "gold" | "diamond";

export type RewardPerkIcon =
  | "calendar"
  | "percent"
  | "card"
  | "tag"
  | "car"
  | "support"
  | "gift"
  | "sparkle";
export interface RewardPerk {
  id: string;
  title: string;
  description?: string;
  icon: RewardPerkIcon;
}

export interface RewardTier {
  id: RewardTierId;
  /** Lifetime tier points required to reach this tier. */
  threshold: number;
  /** Backend-owned, already-localized perk copy. */
  perks: RewardPerk[];
}

export interface RewardsSummary {
  /** Lifetime points used only to determine the customer's tier. */
  tierPoints: number;
  /** Spendable points; redemption never changes `tierPoints`. */
  balance: number;
  tiers: RewardTier[];
}

export type RewardCardStatus = "active" | "used" | "expired";
export type RewardCardFilter = "all" | RewardCardStatus;
export const REWARD_CARD_FILTERS: RewardCardFilter[] = [
  "all",
  "active",
  "used",
  "expired",
];

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
  cards: RewardCard[];
}

export interface RewardCatalogItem {
  id: string;
  discountAmount: number;
  pointsCost: number;
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
  tierId: RewardTierId;
}

export function canAffordReward(
  balance: number,
  item: RewardCatalogItem,
): boolean {
  return balance >= item.pointsCost;
}

export function matchesRewardCardFilter(
  card: RewardCard,
  filter: RewardCardFilter,
): boolean {
  return filter === "all" || card.status === filter;
}

export type RewardTierState = "reached" | "current" | "locked";

export interface RewardsOverview {
  /** Every tier, lowest threshold first. */
  tiers: { tier: RewardTier; state: RewardTierState }[];
  current: RewardTier;
  /** Null at the top tier. */
  next: RewardTier | null;
  /** 0–100: tier points against the next tier's threshold, as Figma shows it. */
  progress: number;
  pointsToNext: number;
  /** 0–100 along the tier road, at the car between the current and next tier. */
  roadPosition: number;
}

export interface RewardTierView {
  tier: RewardTier;
  state: RewardTierState;
  next: RewardTier | null;
  progress: number;
  pointsLeft: number;
  tiers: RewardsOverview["tiers"];
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function isRewardTierId(value: string): value is RewardTierId {
  return (
    value === "bronze" ||
    value === "silver" ||
    value === "gold" ||
    value === "diamond"
  );
}

export function rewardTierView(
  summary: RewardsSummary,
  tierId: RewardTierId,
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
          : clampPercent((summary.tierPoints / tier.threshold) * 100),
    pointsLeft:
      state === "current"
        ? overview.pointsToNext
        : state === "reached"
          ? 0
          : Math.max(0, tier.threshold - summary.tierPoints),
    tiers: overview.tiers,
  };
}

/**
 * Everything the overview shows, from one sorted copy of the tiers. A customer
 * below the first threshold is shown at the first tier (Bronze).
 */
export function rewardsOverview(summary: RewardsSummary): RewardsOverview {
  const sorted = [...summary.tiers].sort((a, b) => a.threshold - b.threshold);
  if (sorted.length === 0) throw new Error("Rewards require at least one tier");

  const { tierPoints } = summary;
  const reached = sorted.filter((tier) => tierPoints >= tier.threshold).length;
  const currentIndex = Math.max(0, reached - 1);
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
    progress: next ? clampPercent((tierPoints / next.threshold) * 100) : 100,
    pointsToNext: next ? Math.max(0, next.threshold - tierPoints) : 0,
    roadPosition:
      sorted.length === 1
        ? 100
        : (Math.min(currentIndex + 0.5, sorted.length - 1) /
            (sorted.length - 1)) *
          100,
  };
}
