import "server-only";

import type { ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { apiCount, apiData, apiId, apiList, apiNumber, apiObject, apiPage, apiText } from "@/shared/lib/api-values";
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

function toSource(dto: Record<string, unknown>): PointsSource {
  switch (dto.point_type) {
    case "booking_reward":
      return {
        kind: "booking",
        bookingId: dto.order_id == null ? null : apiId(dto.order_id, ""),
      };
    case "rate_reward":
      return {
        kind: "rating",
        bookingId: dto.order_id == null ? null : apiId(dto.order_id, ""),
      };
    case "referral_reward":
      return { kind: "referral" };
    case "replace":
      return { kind: "redemption", discountAmount: dto.discount_value == null ? null : apiNumber(dto.discount_value) };
    default:
      return { kind: "referral" };
  }
}

function toTransaction(value: unknown, index: number): PointsTransaction {
  const dto = apiObject(value);
  const date = apiText(dto.date);
  const createdAt = date.includes(" ") ? date.replace(" ", "T") + "+03:00" : date;
  return {
    id: apiId(dto.id, `transaction-${index}`),
    type: dto.type === "used" ? "used" : "earned",
    title: apiText(dto.title),
    amount: apiNumber(dto.points),
    createdAt: Number.isFinite(Date.parse(createdAt)) ? createdAt : new Date(0).toISOString(),
    source: toSource(dto),
  };
}

/** Maps the fields the points screen uses, tolerating changed response fields. */
export function mapPointsResponse(value: unknown): PointsData {
  const data = apiData(value);
  return {
    summary: {
      tierPoints: apiCount(data.level_points),
      balance: apiCount(data.can_replaced_points),
      lastRedemption: apiCount(data.last_replaced_points) || null,
    },
    page: apiPage(apiList(data.transactions).map(toTransaction), value),
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
