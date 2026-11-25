import type { Page } from "@/shared/lib/pagination";

export type PointsTransactionType = "earned" | "used";

/** What a points movement came from; decides where it links. */
export type PointsSource =
  | { kind: "booking"; bookingId: string | null }
  | { kind: "rating"; bookingId: string | null }
  | { kind: "referral" }
  /** Points exchanged for a discount card worth `discountAmount` SAR. */
  | { kind: "redemption"; discountAmount: number | null };

export interface PointsTransaction {
  id: string;
  type: PointsTransactionType;
  title: string;
  /** Signed: positive when earned, negative when used. */
  amount: number;
  createdAt: string;
  source: PointsSource;
}

export interface PointsSummary {
  /** Points that count towards the customer's tier. */
  tierPoints: number;
  /** Points available to redeem. */
  balance: number;
  /** Points spent on the latest redemption; null before the first one. */
  lastRedemption: number | null;
}

export interface PointsData {
  summary: PointsSummary;
  /** Newest first. */
  page: Page<PointsTransaction>;
}

export type PointsFilter = "all" | "earned" | "spent";

export const POINTS_FILTERS: readonly PointsFilter[] = [
  "all",
  "earned",
  "spent",
];

/**
 * Points times are shown in Saudi time, so the server and the browser render
 * the same text and a movement falls in the same month for every customer.
 */
export const POINTS_TIME_ZONE = "Asia/Riyadh";

const monthKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: POINTS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

/** How many of the newest movements sit under "Latest activity". */
export const LATEST_POINTS_COUNT = 3;

export type PointsGroup =
  | { kind: "latest"; transactions: PointsTransaction[] }
  /** `month` is the first day of the month, e.g. "2026-09-01". */
  | { kind: "month"; month: string; transactions: PointsTransaction[] };

/**
 * The newest movements first, then the rest by calendar month, as the
 * design shows them. Expects the list newest first.
 */
export function groupPointsTransactions(
  transactions: PointsTransaction[],
): PointsGroup[] {
  if (transactions.length === 0) return [];

  const groups: PointsGroup[] = [
    {
      kind: "latest",
      transactions: transactions.slice(0, LATEST_POINTS_COUNT),
    },
  ];
  for (const transaction of transactions.slice(LATEST_POINTS_COUNT)) {
    const month = `${monthKey.format(new Date(transaction.createdAt))}-01`;
    const last = groups[groups.length - 1];
    if (last.kind === "month" && last.month === month) {
      last.transactions.push(transaction);
    } else {
      groups.push({ kind: "month", month, transactions: [transaction] });
    }
  }
  return groups;
}

/** Where a movement leads, if anywhere: its booking or the invite history. */
export function pointsSourceHref(source: PointsSource): string | null {
  switch (source.kind) {
    case "booking":
    case "rating":
      return source.bookingId ? `/account/bookings/${source.bookingId}` : null;
    case "referral":
      return "/account/referrals/history";
    default:
      return null;
  }
}
