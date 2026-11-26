import "server-only";

import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import type { Page } from "@/shared/lib/pagination";
import { apiCount, apiData, apiList, apiObject, apiPage, apiText } from "@/shared/lib/api-values";
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
  features: { key: string; title: string }[];
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

const DEFAULT_COLOR = "#9ca3af";
const DEFAULT_ICON = "/images/rewards/badge-bronze.webp";

function apiIcon(value: unknown): string {
  const url = apiText(value);
  return (url.startsWith("/") && !url.startsWith("//")) || /^https:\/\//i.test(url)
    ? url
    : DEFAULT_ICON;
}

function toPackageDto(value: unknown): PackageDto {
  const dto = apiObject(value);
  const start = apiCount(dto.start_points);
  return {
    id: apiCount(dto.id),
    name: apiText(dto.name),
    icon_url: apiIcon(dto.icon_url),
    start_points: start,
    end_points: Math.max(start, apiCount(dto.end_points)),
    high_color: apiText(dto.high_color) || DEFAULT_COLOR,
    medium_color: apiText(dto.medium_color) || DEFAULT_COLOR,
    low_color: apiText(dto.low_color) || DEFAULT_COLOR,
    current_package: dto.current_package === true,
    features: apiList(dto.features).map((value) => {
      const feature = apiObject(value);
      return { key: apiText(feature.key), title: apiText(feature.title) };
    }),
  };
}

function toCurrentPackageDto(value: unknown): CurrentPackageDto {
  const dto = apiObject(value);
  return {
    level_points: apiCount(dto.level_points),
    can_replaced_points: apiCount(dto.can_replaced_points),
    current_package: dto.current_package ? toPackageDto(dto.current_package) : null,
    other_packages: apiList(dto.other_packages).map((value) => {
      const other = apiObject(value);
      return {
        id: apiCount(other.id),
        name: apiText(other.name),
        icon_url: apiIcon(other.icon_url),
        start_points: apiCount(other.start_points),
        high_color: apiText(other.high_color) || undefined,
        medium_color: apiText(other.medium_color) || undefined,
        low_color: apiText(other.low_color) || undefined,
      };
    }),
  };
}

function toDiscountCardsDto(value: unknown): DiscountCardsDto {
  const dto = apiObject(value);
  return {
    can_replaced_points: apiCount(dto.can_replaced_points),
    discount_cards: apiList(dto.discount_cards).map((value) => {
      const card = apiObject(value);
      return {
        id: apiCount(card.id),
        discount_value: apiCount(card.discount_value),
        points_count: apiCount(card.points_count),
        can_replace:
          card.can_replace === true &&
          apiCount(card.id) > 0 &&
          apiCount(card.points_count) > 0,
      };
    }),
  };
}

function toMyDiscountCardDto(value: unknown): MyDiscountCardDto {
  const dto = apiObject(value);
  return {
    id: apiCount(dto.id),
    discount_card_id: apiCount(dto.discount_card_id),
    code: apiText(dto.code),
    discount_value: apiCount(dto.discount_value),
    points_count: apiCount(dto.points_count),
    status: dto.status === "used" || dto.status === "expired" ? dto.status : "active",
    expire_at: apiText(dto.expire_at),
    used_at: apiText(dto.used_at) || null,
    order_id: dto.order_id == null ? null : apiCount(dto.order_id),
  };
}

function toBackendDate(value: string): string {
  const date = value.includes(" ") ? value.replace(" ", "T") + "+03:00" : value;
  return Number.isFinite(Date.parse(date)) ? date : "";
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
  return apiPage(
    apiList(apiObject(response).data).map((card) =>
      toRewardCard(toMyDiscountCardDto(card)),
    ),
    response,
  );
}

/** E11 previews the redemption without spending anything. */
export function mapRedemptionQuoteResponse(response: unknown): {
  balanceBefore: number;
  pointsCost: number;
  balanceAfter: number;
} {
  const data = apiData(response);
  // A missing cost cannot be displayed as a safe confirmation of a purchase.
  if (apiCount(data.replace_points) === 0) throw new AppError("server");
  return {
    balanceBefore: apiCount(data.points_count_before),
    pointsCost: apiCount(data.replace_points),
    balanceAfter: apiCount(data.points_count_after),
  };
}

/** E12 spends the points and returns the new card and both balances. */
export function mapRedeemResponse(response: unknown): RewardRedemptionData {
  const data = apiData(response);
  // Never report a successful redemption without an issued card.
  if (apiCount(apiObject(data.discount_card).id) === 0)
    throw new AppError("server");
  return {
    card: toRewardCard(toMyDiscountCardDto(data.discount_card)),
    pointsCost: apiCount(data.last_replaced_points),
    balanceBefore: apiCount(data.can_replaced_points) + apiCount(data.last_replaced_points),
    balanceAfter: apiCount(data.can_replaced_points),
    tierPoints: apiCount(data.level_points),
  };
}

/** E9 owns both the catalog and the customer's redeemable balance. */
export function mapRewardCatalogResponse(response: unknown): RewardCatalogData {
  const data = toDiscountCardsDto(apiData(response));
  return {
    balance: data.can_replaced_points,
    items: data.discount_cards.map((card): RewardCatalogItem => ({
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
    perks: dto.features.map(({ key, title }) => ({ key, title })),
  };
}

const NEUTRAL_ROAD_COLORS = {
  high: "#e5e7eb",
  medium: "#d1d5db",
  low: "#9ca3af",
};

const EMPTY_TIER: RewardTier = {
  id: "0",
  name: "—",
  iconUrl: DEFAULT_ICON,
  colors: NEUTRAL_ROAD_COLORS,
  startPoints: 0,
  endPoints: 0,
  perks: [],
};

function toRoadTier(
  dto: CurrentPackageDto["other_packages"][number],
): RewardRoadTier {
  return {
    id: String(dto.id),
    name: dto.name,
    iconUrl: dto.icon_url,
    startPoints: dto.start_points,
    colors: dto.high_color && dto.medium_color && dto.low_color
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
  const data = toCurrentPackageDto(apiData(response));
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
  if (road.size === 0) road.set("0", EMPTY_TIER);
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
  const current = toCurrentPackageDto(apiData(currentResponse));
  const tiers = apiList(apiObject(packagesResponse).data).map(toPackageDto).map(toRewardTier);
  return {
    tierPoints: current.level_points,
    balance: current.can_replaced_points,
    tiers: tiers.length ? tiers : [EMPTY_TIER],
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
  return toRewardTier(toPackageDto(apiData(response)));
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
