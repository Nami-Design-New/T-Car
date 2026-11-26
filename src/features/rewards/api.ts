import "server-only";

import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { isPaginationDto, toPage, type Page } from "@/shared/lib/pagination";
import { fail, ok, type Result } from "@/shared/lib/result";
import {
  REWARD_CARD_FILTERS,
  type RewardCard,
  type RewardCardFilter,
  type RewardCardsData,
  type RewardCatalogData,
  type RewardCatalogItem,
  type RewardRedemptionData,
  type RewardRedemptionQuote,
  type RewardRoadTier,
  type RewardTier,
  type RewardsHomeData,
  type RewardsSummary,
} from "./model";

export interface RewardsApi {
  getHome(userId: string): Promise<RewardsHomeData>;
  getSummary(userId: string): Promise<RewardsSummary>;
  getTier(userId: string, id: string): Promise<RewardTier | null>;
  getCards(userId: string, filter: RewardCardFilter): Promise<RewardCardsData>;
  getCardsPage(
    userId: string,
    page: number,
    filter: RewardCardFilter,
  ): Promise<Page<RewardCard>>;
  getCatalog(userId: string): Promise<RewardCatalogData>;
  getRedemptionQuote(
    userId: string,
    itemId: string,
  ): Promise<RewardRedemptionQuote>;
  redeem(
    userId: string,
    itemId: string,
  ): Promise<Result<RewardRedemptionData>>;
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
    can_replace: boolean;
  }[];
}

interface MyDiscountCardDto {
  id: number;
  discount_card_id: number;
  code: string;
  discount_value: number;
  points_count: number;
  status: "active" | "used" | "expired";
  expire_at: string;
  used_at: string | null;
  order_id: number | null;
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
    isCount(value.points_count) &&
    typeof value.can_replace === "boolean"
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

function isBackendDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = value.includes(" ") ? value.replace(" ", "T") + "+03:00" : value;
  return (
    (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        value,
      )) &&
    Number.isFinite(Date.parse(date))
  );
}

function isMyDiscountCardDto(value: unknown): value is MyDiscountCardDto {
  return (
    isRecord(value) &&
    isCount(value.id) &&
    isCount(value.discount_card_id) &&
    isText(value.code) &&
    isCount(value.discount_value) &&
    isCount(value.points_count) &&
    (value.status === "active" ||
      value.status === "used" ||
      value.status === "expired") &&
    isBackendDate(value.expire_at) &&
    (value.used_at === null || isBackendDate(value.used_at)) &&
    (value.order_id === null || isCount(value.order_id))
  );
}

function toBackendDate(value: string): string {
  return value.includes(" ") ? value.replace(" ", "T") + "+03:00" : value;
}

function toRewardCard(dto: MyDiscountCardDto): RewardCard {
  return {
    id: String(dto.id),
    code: dto.code,
    discountAmount: dto.discount_value,
    status: dto.status,
    expiresAt: toBackendDate(dto.expire_at),
    ...(dto.used_at ? { usedAt: toBackendDate(dto.used_at) } : {}),
    ...(dto.order_id === null ? {} : { bookingId: String(dto.order_id) }),
  };
}

export function mapRewardCardsPageResponse(
  response: unknown,
): Page<RewardCard> {
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !Array.isArray(response.data) ||
    !response.data.every(isMyDiscountCardDto) ||
    !isRecord(response) ||
    !isPaginationDto(response.pagination)
  ) {
    throw new AppError("server");
  }
  return toPage(response.data.map(toRewardCard), response.pagination);
}

interface RedemptionQuoteDto {
  points_count_before: number;
  replace_points: number;
  points_count_after: number;
}

interface RedeemDto {
  level_points: number;
  can_replaced_points: number;
  last_replaced_points: number;
  discount_card: MyDiscountCardDto;
}

function isRedemptionQuoteDto(value: unknown): value is RedemptionQuoteDto {
  return (
    isRecord(value) &&
    isCount(value.points_count_before) &&
    isCount(value.replace_points) &&
    isCount(value.points_count_after)
  );
}

function isRedeemDto(value: unknown): value is RedeemDto {
  return (
    isRecord(value) &&
    isCount(value.level_points) &&
    isCount(value.can_replaced_points) &&
    isCount(value.last_replaced_points) &&
    isMyDiscountCardDto(value.discount_card)
  );
}

/** E11 previews the redemption without spending anything. */
export function mapRedemptionQuoteResponse(response: unknown): {
  balanceBefore: number;
  pointsCost: number;
  balanceAfter: number;
} {
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isRedemptionQuoteDto(response.data)
  ) {
    throw new AppError("server");
  }
  return {
    balanceBefore: response.data.points_count_before,
    pointsCost: response.data.replace_points,
    balanceAfter: response.data.points_count_after,
  };
}

/** E12 spends the points and returns the new card and both balances. */
export function mapRedeemResponse(response: unknown): RewardRedemptionData {
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isRedeemDto(response.data)
  ) {
    throw new AppError("server");
  }
  const data = response.data;
  return {
    card: toRewardCard(data.discount_card),
    pointsCost: data.last_replaced_points,
    balanceBefore: data.can_replaced_points + data.last_replaced_points,
    balanceAfter: data.can_replaced_points,
    tierPoints: data.level_points,
  };
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
    items: response.data.discount_cards.map((card): RewardCatalogItem => ({
      id: String(card.id),
      discountAmount: card.discount_value,
      pointsCost: card.points_count,
      canReplace: card.can_replace,
      validityDays: 90,
    })),
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
  const current =
    await serverHttp.get<ApiEnvelope<unknown>>("/packages/current");
  return mapRewardsHomeResponse(current);
}

async function getCatalog(_userId: string): Promise<RewardCatalogData> {
  const response =
    await serverHttp.get<ApiEnvelope<unknown>>("/discount-cards");
  return mapRewardCatalogResponse(response);
}

async function getCardsPage(
  _userId: string,
  page: number,
  filter: RewardCardFilter,
): Promise<Page<RewardCard>> {
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !REWARD_CARD_FILTERS.includes(filter)
  ) {
    throw new AppError("validation");
  }
  const response = await serverHttp.get<ApiEnvelope<unknown>>(
    "/my-discount-cards",
    {
      query: { page, per_page: 10, ...(filter === "all" ? {} : { filter }) },
    },
  );
  return mapRewardCardsPageResponse(response);
}

async function getCards(
  userId: string,
  filter: RewardCardFilter,
): Promise<RewardCardsData> {
  const [catalog, page] = await Promise.all([
    getCatalog(userId),
    getCardsPage(userId, 1, filter),
  ]);
  return { balance: catalog.balance, page };
}

/** E11 previews the card; E7 supplies the tier name the success screen shows. */
async function getRedemptionQuote(
  userId: string,
  itemId: string,
): Promise<RewardRedemptionQuote> {
  const [quoteResponse, home] = await Promise.all([
    serverHttp.get<ApiEnvelope<unknown>>("/replace-points/quote", {
      query: { discount_card_id: itemId },
    }),
    getHome(userId),
  ]);
  return {
    ...mapRedemptionQuoteResponse(quoteResponse),
    tierName: home.currentTier?.name ?? home.roadTiers[0]?.name ?? "",
  };
}

/** E12 spends the points; 400/422 arrive as a validation AppError. */
async function redeem(
  _userId: string,
  itemId: string,
): Promise<Result<RewardRedemptionData>> {
  if (!/^\d+$/.test(itemId)) {
    return fail(new AppError("validation", "rewards.cardUnavailable"));
  }
  try {
    const response = await serverHttp.post<ApiEnvelope<unknown>>(
      "/replace-points",
      { discount_card_id: Number(itemId) },
    );
    return ok(
      mapRedeemResponse(response),
      isApiEnvelope(response) ? response.message : undefined,
    );
  } catch (error) {
    return fail(error);
  }
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
  getCards,
  getCardsPage,
  getCatalog,
  getRedemptionQuote,
  redeem,
};
