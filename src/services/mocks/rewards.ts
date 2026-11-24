import { getLocale } from "next-intl/server";
import type { RewardTier, RewardsSummary } from "@/features/rewards/model";
import { AppError } from "@/shared/lib/errors";
import type { RewardsApi } from "../rewards.api";
import { MOCK_POINTS_DATA } from "./points";

const PERKS = {
  ar: {
    silver: [
      "إضافة 100 نقطة كل شهر",
      "خصم على العقود الشهرية",
      "استرداد 50 ﷼ في المحفظة كل خامس حجز",
    ],
    gold: [
      "كود خصم مرة كل شهر",
      "إضافة 100 نقطة كل 15 يوم",
      "توصيل مجاني كل خامس حجز",
    ],
    diamond: [
      "دعم VIP خاص على مدار 24 ساعة",
      "توصيل واستلام مجاني على كل الحجوزات",
      "عروض خاصة ومميزة لعملاء الماسية",
    ],
  },
  en: {
    silver: [
      "100 bonus points every month",
      "A discount on monthly rentals",
      "SAR 50 wallet cashback on every fifth booking",
    ],
    gold: [
      "One discount code every month",
      "100 bonus points every 15 days",
      "Free delivery on every fifth booking",
    ],
    diamond: [
      "Dedicated 24/7 VIP support",
      "Free delivery and collection on every booking",
      "Exclusive offers for Diamond members",
    ],
  },
} as const;

const tiersFor = (locale: string): RewardTier[] => {
  const perks = locale === "ar" ? PERKS.ar : PERKS.en;
  return [
    { id: "bronze", threshold: 1000, perks: [] },
    { id: "silver", threshold: 5000, perks: [...perks.silver] },
    { id: "gold", threshold: 10000, perks: [...perks.gold] },
    { id: "diamond", threshold: 20000, perks: [...perks.diamond] },
  ];
};

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mock only: this test id reproduces an unavailable rewards service response. */
const MOCK_FAILURE_USER_ID = "rewards-failure";

// Read-only and stateless: it runs on the server, so it keeps no per-user state.
// The real API localizes perks from Accept-Language (sent by services/http);
// the mock reads the request locale itself so the interface stays the same.
export const rewardsMock: RewardsApi = {
  async getSummary(userId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError("network", "rewards.unavailable");
    }

    // Same customer as the points mock, so both pages show the same balances.
    const { tierPoints, balance } = MOCK_POINTS_DATA.summary;
    return {
      tierPoints,
      balance,
      tiers: tiersFor(await getLocale()),
    } satisfies RewardsSummary;
  },
};
