import "server-only";

import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import type { Result } from "@/shared/lib/result";
import { rewardsMock } from "./api.mock";
import type {
  RewardCardsData,
  RewardCatalogData,
  RewardCatalogItem,
  RewardRedemption,
  RewardRoadTier,
  RewardTier,
  RewardsHomeData,
  RewardsSummary,
} from "./model";

export interface RewardsApi {
  getHome(userId: string): Promise<RewardsHomeData>;
  getSummary(userId: string): Promise<RewardsSummary>;
  getTier(userId: string, id: string): Promise<RewardTier | null>;
  getCards(userId: string): Promise<RewardCardsData>;
  getCatalog(userId: string): Promise<RewardCatalogData>;
  redeem(userId: string, itemId: string): Promise<Result<RewardRedemption>>;
}

interface PackageDto {
  id: number;
  name: string;
  icon_url: string;
  start_points: number;
  end_points: number;
  high_color: string;
  medium_color: string;
  low_color: string;
  current_package: boolean;
  features: { key: string; title: string; code: string | null }[];
}

interface CurrentPackageDto {
  level_points: number;
  can_replaced_points: number;
  current_package: PackageDto | null;
  other_packages: {
    id: number;
    name: string;
    icon_url: string;
    start_points: number;
    high_color?: string;
    medium_color?: string;
    low_color?: string;
  }[];
}

interface DiscountCardsDto {
  can_replaced_points: number;
  discount_cards: {
    id: number;
    discount_value: number;
    points_count: number;
  }[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;
const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
const isIconUrl = (value: unknown): value is string =>
  isText(value) &&
  ((value.startsWith("/") && !value.startsWith("//")) ||
    /^https:\/\//i.test(value));

function isFeatureDto(value: unknown): value is PackageDto["features"][number] {
  return (
    isRecord(value) &&
    isText(value.key) &&
    isText(value.title) &&
    (value.code === null || typeof value.code === "string")
  );
}

function isPackageDto(value: unknown): value is PackageDto {
  return (
    isRecord(value) &&
    isCount(value.id) &&
    isText(value.name) &&
    isIconUrl(value.icon_url) &&
    isCount(value.start_points) &&
    isCount(value.end_points) &&
    value.end_points >= value.start_points &&
    isColor(value.high_color) &&
    isColor(value.medium_color) &&
    isColor(value.low_color) &&
    typeof value.current_package === "boolean" &&
    Array.isArray(value.features) &&
    value.features.every(isFeatureDto)
  );
}

function isOtherPackageDto(
  value: unknown,
): value is CurrentPackageDto["other_packages"][number] {
  return (
    isRecord(value) &&
    isCount(value.id) &&
    isText(value.name) &&
    isIconUrl(value.icon_url) &&
    isCount(value.start_points) &&
    ([value.high_color, value.medium_color, value.low_color].every(
      (color) => color === undefined,
    ) ||
      [value.high_color, value.medium_color, value.low_color].every(isColor))
  );
}

function isCurrentPackageDto(value: unknown): value is CurrentPackageDto {
  return (
    isRecord(value) &&
    isCount(value.level_points) &&
    isCount(value.can_replaced_points) &&
    (value.current_package === null || isPackageDto(value.current_package)) &&
    Array.isArray(value.other_packages) &&
    value.other_packages.every(isOtherPackageDto)
  );
}

function isDiscountCardDto(
  value: unknown,
): value is DiscountCardsDto["discount_cards"][number] {
  return (
    isRecord(value) &&
    isCount(value.id) &&
    isCount(value.discount_value) &&
    isCount(value.points_count)
  );
}

function isDiscountCardsDto(value: unknown): value is DiscountCardsDto {
  return (
    isRecord(value) &&
    isCount(value.can_replaced_points) &&
    Array.isArray(value.discount_cards) &&
    value.discount_cards.every(isDiscountCardDto)
  );
}

/** E9 owns both the catalog and the customer's redeemable balance. */
export function mapRewardCatalogResponse(response: unknown): RewardCatalogData {
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isDiscountCardsDto(response.data)
  ) {
    throw new AppError("server");
  }
  return {
    balance: response.data.can_replaced_points,
    items: response.data.discount_cards.map(
      (card): RewardCatalogItem => ({
        id: String(card.id),
        discountAmount: card.discount_value,
        pointsCost: card.points_count,
        validityDays: 90,
      }),
    ),
  };
}

function toRewardTier(dto: PackageDto): RewardTier {
  return {
    id: String(dto.id),
    name: dto.name,
    iconUrl: dto.icon_url,
    colors: {
      high: dto.high_color,
      medium: dto.medium_color,
      low: dto.low_color,
    },
    startPoints: dto.start_points,
    endPoints: dto.end_points,
    perks: dto.features.map(({ key, title, code }) => ({ key, title, code })),
  };
}

const NEUTRAL_ROAD_COLORS = {
  high: "#e5e7eb",
  medium: "#d1d5db",
  low: "#9ca3af",
};

function toRoadTier(
  dto: CurrentPackageDto["other_packages"][number],
): RewardRoadTier {
  return {
    id: String(dto.id),
    name: dto.name,
    iconUrl: dto.icon_url,
    startPoints: dto.start_points,
    colors: dto.high_color
      ? {
          high: dto.high_color,
          medium: dto.medium_color!,
          low: dto.low_color!,
        }
      : NEUTRAL_ROAD_COLORS,
  };
}

/** E7 alone supplies the rewards overview and the entire tier road. */
export function mapRewardsHomeResponse(response: unknown): RewardsHomeData {
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isCurrentPackageDto(response.data)
  ) {
    throw new AppError("server");
  }
  const data = response.data;
  const currentTier = data.current_package
    ? toRewardTier(data.current_package)
    : null;
  const road = new Map(
    data.other_packages.map((dto) => {
      const tier = toRoadTier(dto);
      return [tier.id, tier] as const;
    }),
  );
  if (currentTier) road.set(currentTier.id, currentTier);
  if (road.size === 0) throw new AppError("server");
  return {
    tierPoints: data.level_points,
    balance: data.can_replaced_points,
    currentTier,
    roadTiers: [...road.values()],
  };
}

/** E6 supplies all packages; E7 supplies the customer's two balances. */
export function mapRewardsSummaryResponse(
  packagesResponse: unknown,
  currentResponse: unknown,
): RewardsSummary {
  if (
    !isApiEnvelope(packagesResponse) ||
    packagesResponse.code !== 200 ||
    !Array.isArray(packagesResponse.data) ||
    packagesResponse.data.length === 0 ||
    !packagesResponse.data.every(isPackageDto) ||
    !isApiEnvelope(currentResponse) ||
    currentResponse.code !== 200 ||
    !isCurrentPackageDto(currentResponse.data)
  ) {
    throw new AppError("server");
  }
  return {
    tierPoints: currentResponse.data.level_points,
    balance: currentResponse.data.can_replaced_points,
    tiers: packagesResponse.data.map(toRewardTier),
  };
}

async function getHome(_userId: string): Promise<RewardsHomeData> {
  const current = await serverHttp.get<ApiEnvelope<unknown>>(
    "/packages/current",
  );
  return mapRewardsHomeResponse(current);
}

async function getCatalog(_userId: string): Promise<RewardCatalogData> {
  const response = await serverHttp.get<ApiEnvelope<unknown>>("/discount-cards");
  return mapRewardCatalogResponse(response);
}

/** E8 returns one full package; a body-code 404 is handled by serverHttp. */
export function mapRewardTierResponse(response: unknown): RewardTier {
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isPackageDto(response.data)
  ) {
    throw new AppError("server");
  }
  return toRewardTier(response.data);
}

async function getSummary(_userId: string): Promise<RewardsSummary> {
  const [packages, current] = await Promise.all([
    serverHttp.get<ApiEnvelope<unknown>>("/packages"),
    serverHttp.get<ApiEnvelope<unknown>>("/packages/current"),
  ]);
  return mapRewardsSummaryResponse(packages, current);
}

async function getTier(
  _userId: string,
  id: string,
): Promise<RewardTier | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const response = await serverHttp.get<ApiEnvelope<unknown>>(
      `/packages/${encodeURIComponent(id)}`,
    );
    return mapRewardTierResponse(response);
  } catch (error) {
    if (error instanceof AppError && error.kind === "not_found") return null;
    throw error;
  }
}

export const rewardsApi: RewardsApi = {
  getHome,
  getSummary,
  getTier,
  getCards: rewardsMock.getCards,
  getCatalog,
  redeem: rewardsMock.redeem,
};
