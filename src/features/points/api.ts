import "server-only";

import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { isPaginationDto, toPage } from "@/shared/lib/pagination";
import type {
  PointsData,
  PointsFilter,
  PointsSource,
  PointsSummary,
  PointsTransaction,
} from "./model";

export interface PointsApi {
  getPoints(
    userId: string,
    page: number,
    filter: PointsFilter,
  ): Promise<PointsData>;
  getSummary(userId: string): Promise<PointsSummary>;
}

interface TransactionDto {
  id: number;
  type: "earned" | "used";
  point_type: "booking_reward" | "referral_reward" | "rate_reward" | "replace";
  title: string;
  points: number;
  order_id: number | null;
  discount_card_id: number | null;
  discount_value: number | null;
  date: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;
const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function isRiyadhDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
  )
    return false;
  const [year, month, day, hour, minute, second] = value
    .split(/[- :]/)
    .map(Number);
  const check = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() + 1 === month &&
    check.getUTCDate() === day &&
    check.getUTCHours() === hour &&
    check.getUTCMinutes() === minute &&
    check.getUTCSeconds() === second
  );
}

function isTransactionDto(value: unknown): value is TransactionDto {
  return (
    isRecord(value) &&
    isCount(value.id) &&
    (value.type === "earned" || value.type === "used") &&
    (value.point_type === "booking_reward" ||
      value.point_type === "referral_reward" ||
      value.point_type === "rate_reward" ||
      value.point_type === "replace") &&
    typeof value.title === "string" &&
    isAmount(value.points) &&
    (value.order_id === null || isCount(value.order_id)) &&
    (value.discount_card_id === null || isCount(value.discount_card_id)) &&
    (value.discount_value === null || isAmount(value.discount_value)) &&
    isRiyadhDate(value.date)
  );
}

function toSource(dto: TransactionDto): PointsSource {
  switch (dto.point_type) {
    case "booking_reward":
      return {
        kind: "booking",
        bookingId: dto.order_id === null ? null : String(dto.order_id),
      };
    case "rate_reward":
      return {
        kind: "rating",
        bookingId: dto.order_id === null ? null : String(dto.order_id),
      };
    case "referral_reward":
      return { kind: "referral" };
    case "replace":
      return { kind: "redemption", discountAmount: dto.discount_value };
  }
}

function toTransaction(dto: TransactionDto): PointsTransaction {
  return {
    id: String(dto.id),
    type: dto.type,
    title: dto.title,
    amount: dto.points,
    createdAt: dto.date.replace(" ", "T") + "+03:00",
    source: toSource(dto),
  };
}

/** Validates the live balances, transactions, and pagination nested in data. */
export function mapPointsResponse(value: unknown): PointsData {
  if (!isApiEnvelope(value) || value.code !== 200 || !isRecord(value.data))
    throw new AppError("server");
  const data = value.data;
  if (
    !isCount(data.level_points) ||
    !isCount(data.can_replaced_points) ||
    !isCount(data.last_replaced_points) ||
    !Array.isArray(data.transactions) ||
    !data.transactions.every(isTransactionDto) ||
    !isPaginationDto(data.pagination)
  ) {
    throw new AppError("server");
  }
  return {
    summary: {
      tierPoints: data.level_points,
      balance: data.can_replaced_points,
      lastRedemption: data.last_replaced_points || null,
    },
    page: toPage(data.transactions.map(toTransaction), data.pagination),
  };
}

async function readPoints(
  page: number,
  perPage: number,
  filter: PointsFilter,
): Promise<PointsData> {
  const response = await serverHttp.get<ApiEnvelope<unknown>>("/points", {
    query: {
      page,
      per_page: perPage,
      ...(filter === "all"
        ? {}
        : { filter: filter === "spent" ? "used" : "earned" }),
    },
  });
  return mapPointsResponse(response);
}

export const pointsApi: PointsApi = {
  getPoints(_userId, page, filter) {
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !["all", "earned", "spent"].includes(filter)
    ) {
      throw new AppError("validation");
    }
    return readPoints(page, 10, filter);
  },
  async getSummary(_userId) {
    return (await readPoints(1, 1, "all")).summary;
  },
};
