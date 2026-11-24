import { getLocale } from "next-intl/server";
import type {
  RewardPerk,
  RewardTier,
  RewardsSummary,
} from "@/features/rewards/model";
import { AppError } from "@/shared/lib/errors";
import type { RewardsApi } from "../rewards.api";
import { MOCK_POINTS_DATA } from "./points";

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
