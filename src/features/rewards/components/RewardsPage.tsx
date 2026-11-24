import { useTranslations } from "next-intl";
import { FiClock, FiInfo } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { rewardsOverview, type RewardsSummary } from "../model";
import ConvertPointsBanner from "./ConvertPointsBanner";
import CurrentTierPerks from "./CurrentTierPerks";
import QuickActions from "./QuickActions";
import RedeemableBalanceCard from "./RedeemableBalanceCard";
import TierHero from "./TierHero";
import TierRoad from "./TierRoad";

interface Props {
  summary: RewardsSummary;
}

export default function RewardsPage({ summary }: Props) {
  const t = useTranslations("rewards");
  const overview = rewardsOverview(summary);

  return (
    <section className="bg-surface-card-primary relative flex flex-col gap-5 overflow-hidden rounded-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,#d9eaff,transparent_68%)]" />
      <div className="relative z-1 flex justify-end">
        <Link
          href="/account/points"
          className="bg-surface-elevated text-text-primary hover:text-action-primary grid size-11 place-items-center rounded-md text-xl shadow-sm transition"
          aria-label={t("actions.history")}
        >
          <FiClock aria-hidden="true" />
        </Link>
      </div>

      <div className="relative z-1 flex flex-col gap-5">
        <TierHero
          tierPoints={summary.tierPoints}
          currentTier={overview.current}
          nextTier={overview.next}
          progress={overview.progress}
          pointsLeft={overview.pointsToNext}
        />
        <RedeemableBalanceCard balance={summary.balance} />
        <QuickActions />
        <TierRoad tiers={overview.tiers} roadPosition={overview.roadPosition} />
        <ConvertPointsBanner />
        <CurrentTierPerks
          currentTier={overview.current}
          nextTier={overview.next}
        />
        <div className="border-stroke-light bg-surface-elevated flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-[11px] leading-relaxed">
          <FiInfo
            className="text-action-primary mt-0.5 shrink-0 text-lg"
            aria-hidden="true"
          />
          <p>{t("info")}</p>
        </div>
      </div>
    </section>
  );
}
