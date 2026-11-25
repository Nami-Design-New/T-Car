import { getLocale } from "next-intl/server";
import type {
  RewardCardsData,
  RewardCatalogData,
  RewardCatalogItem,
  RewardPerk,
  RewardRedemption,
  RewardTier,
  RewardsSummary,
} from "./model";
import { rewardsOverview } from "./model";
import { AppError } from "@/shared/lib/errors";
import { fail, ok } from "@/shared/lib/result";
import type { RewardsApi } from "./api";

/**
 * The same customer as the points mock (`features/points/api.mock.ts`), so both
 * pages show the same balances. A feature may not import another feature's
 * mock, so the two numbers are repeated here.
 */
const MOCK_POINTS_SUMMARY = { tierPoints: 12000, balance: 4000 };

type PerkCopy = [
  title: string,
  description: string | undefined,
  icon: RewardPerk["icon"],
];
const PERKS: Record<"ar" | "en", Record<RewardTier["id"], PerkCopy[]>> = {
  ar: {
    bronze: [["توك بديت يا وحش", undefined, "sparkle"]],
    silver: [
      ["إضافة 100 نقطة كل شهر", "تُضاف تلقائيًا إلى رصيدك", "calendar"],
      [
        "خصم على العقود الشهرية (طويلة المدى)",
        "على الحجوزات الشهرية طويلة المدى",
        "percent",
      ],
      [
        "استرداد 50 ريال في المحفظة كل خامس حجز",
        "كل أربع حجوزات، يُضاف 50 ريال لمحفظتك في الحجز الخامس",
        "card",
      ],
    ],
    gold: [
      ["كود خصم مرة واحدة كل شهر", "كود يُستخدم مرة واحدة في الشهر", "tag"],
      ["إضافة 100 نقطة كل 15 يوم", "تُضاف تلقائيًا إلى رصيدك", "calendar"],
      [
        "توصيل مجاني كل خامس حجز",
        "كل أربع حجوزات، يكون توصيل الحجز الخامس مجانًا",
        "car",
      ],
    ],
    diamond: [
      [
        "دعم فني خاص VIP على مدار 24 ساعة",
        "فريق مخصص يرد عليك في أي وقت",
        "support",
      ],
      [
        "توصيل واستلام مجاني على جميع الحجوزات",
        "بدون رسوم توصيل أو استلام",
        "car",
      ],
      [
        "عروض خاصة ومميزة لعملاء الماسية",
        "عروض لا تتوفر لغير عملاء الماسية",
        "gift",
      ],
    ],
  },
  en: {
    bronze: [["You've just started, champ!", undefined, "sparkle"]],
    silver: [
      [
        "100 bonus points every month",
        "Added automatically to your balance",
        "calendar",
      ],
      [
        "A discount on monthly (long-term) contracts",
        "Applies to longer monthly bookings",
        "percent",
      ],
      [
        "SAR 50 wallet cashback on every fifth booking",
        "After every four bookings, SAR 50 is added to your wallet on the fifth",
        "card",
      ],
    ],
    gold: [
      [
        "One discount code every month",
        "A code you can use once each month",
        "tag",
      ],
      [
        "100 bonus points every 15 days",
        "Added automatically to your balance",
        "calendar",
      ],
      [
        "Free delivery on every fifth booking",
        "After every four bookings, the fifth is delivered free",
        "car",
      ],
    ],
    diamond: [
      [
        "Dedicated VIP support, 24/7",
        "A dedicated team is here whenever you need help",
        "support",
      ],
      [
        "Free delivery and collection on all bookings",
        "No delivery or collection fees",
        "car",
      ],
      [
        "Exclusive offers for Diamond members",
        "Offers reserved for Diamond members",
        "gift",
      ],
    ],
  },
};

const tiersFor = (locale: string): RewardTier[] => {
  const copy = locale === "ar" ? PERKS.ar : PERKS.en;
  return (["bronze", "silver", "gold", "diamond"] as const).map(
    (id, index) => ({
      id,
      threshold: [1000, 5000, 10000, 20000][index],
      perks: copy[id].map(([title, description, icon], perkIndex) => ({
        id: `${id}-${perkIndex + 1}`,
        title,
        ...(description ? { description } : {}),
        icon,
      })),
    }),
  );
};

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mock only: this test id reproduces an unavailable rewards service response. */
const MOCK_FAILURE_USER_ID = "rewards-failure";
/**
 * Mock only: redeeming this id always fails with a network error. It is not in
 * the catalog (tests send it straight to `redeem`).
 */
const MOCK_FAILURE_ITEM_ID = "discount-failure";
type MockCatalogItem = RewardCatalogItem & { code: string };
// The 300 SAR card costs more than the mock balance (4,000), so the catalog
// always shows one unaffordable card and `redeem` answers it with
// `rewards.insufficientPoints`.
const CATALOG_ITEMS: MockCatalogItem[] = [
  {
    id: "discount-50",
    discountAmount: 50,
    pointsCost: 1000,
    validityDays: 90,
    code: "TCAR-305-Q9LD",
  },
  {
    id: "discount-100",
    discountAmount: 100,
    pointsCost: 1900,
    validityDays: 90,
    code: "TCAR-100-N7KL",
  },
  {
    id: "discount-200",
    discountAmount: 200,
    pointsCost: 3800,
    validityDays: 90,
    code: "TCAR-200-P4RM",
  },
  {
    id: "discount-300",
    discountAmount: 300,
    pointsCost: 6000,
    validityDays: 90,
    code: "TCAR-300-H6TW",
  },
];

// Read-only and stateless: it runs on the server, so it keeps no per-user state.
// The real API localizes perks from Accept-Language (sent by services/http);
// the mock reads the request locale itself so the interface stays the same.
export const rewardsMock: RewardsApi = {
  async getSummary(userId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError("network", "rewards.unavailable");
    }
    const { tierPoints, balance } = MOCK_POINTS_SUMMARY;
    return {
      tierPoints,
      balance,
      tiers: tiersFor(await getLocale()),
    } satisfies RewardsSummary;
  },
  async getCards(userId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError("network", "rewards.unavailable");
    }
    return {
      balance: MOCK_POINTS_SUMMARY.balance,
      cards: [
        {
          id: "card-active",
          code: "TCAR-30S-Q9LD",
          discountAmount: 50,
          status: "active",
          expiresAt: "2027-01-18T00:00:00.000Z",
        },
        {
          id: "card-used",
          code: "TCAR-962-M2PA",
          discountAmount: 50,
          status: "used",
          usedAt: "2026-10-20T00:00:00.000Z",
          bookingId: "2363",
        },
        {
          id: "card-expired",
          code: "TCAR-418-X5RB",
          discountAmount: 50,
          status: "expired",
          expiresAt: "2026-09-30T00:00:00.000Z",
        },
      ],
    } satisfies RewardCardsData;
  },
  async getCatalog(userId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError("network", "rewards.unavailable");
    }
    return {
      balance: MOCK_POINTS_SUMMARY.balance,
      items: CATALOG_ITEMS.map(
        ({ id, discountAmount, pointsCost, validityDays }) => ({
          id,
          discountAmount,
          pointsCost,
          validityDays,
        }),
      ),
    } satisfies RewardCatalogData;
  },
  async redeem(userId, itemId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID || itemId === MOCK_FAILURE_ITEM_ID) {
      return fail(new AppError("network", "rewards.unavailable"));
    }
    const item = CATALOG_ITEMS.find(({ id }) => id === itemId);
    if (!item)
      return fail(new AppError("not_found", "rewards.cardUnavailable"));
    const { balance, tierPoints } = MOCK_POINTS_SUMMARY;
    if (balance < item.pointsCost) {
      return fail(new AppError("conflict", "rewards.insufficientPoints"));
    }
    // Mock only: nothing is stored, so a reload shows the old balance and My
    // cards does not list the new card. A real API will persist the new card
    // and the balance together.
    const expiresAt = new Date(
      Date.now() + item.validityDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const tierId = rewardsOverview({
      tierPoints,
      balance,
      tiers: tiersFor("en"),
    }).current.id;
    return ok({
      card: {
        id: `redeemed-${item.id}`,
        code: item.code,
        discountAmount: item.discountAmount,
        status: "active",
        expiresAt,
      },
      pointsCost: item.pointsCost,
      balanceBefore: balance,
      balanceAfter: balance - item.pointsCost,
      tierPoints,
      tierId,
    } satisfies RewardRedemption);
  },
};
