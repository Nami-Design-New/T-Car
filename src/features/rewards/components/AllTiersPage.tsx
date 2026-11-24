import { useTranslations } from "next-intl";
import { FiInfo } from "react-icons/fi";
import { rewardsOverview, type RewardsSummary } from "../model";
import TierCard from "./TierCard";

interface Props {
  summary: RewardsSummary;
}

export default function AllTiersPage({ summary }: Props) {
  const t = useTranslations("rewards");
  const overview = rewardsOverview(summary);
  return (
    <section className="bg-surface-card-primary flex flex-col gap-5 rounded-xl">
      <div>
        <h2 className="m-0 text-[17px] font-bold">
          {t("allTiers.introTitle")}
        </h2>
        <p className="text-text-subtle mt-1 text-[11px]">
          {t("allTiers.introDescription")}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {overview.tiers.map(({ tier, state }) => (
          <TierCard
            key={tier.id}
            tier={tier}
            state={state}
            tierPoints={summary.tierPoints}
            next={state === "current" ? overview.next : null}
            progress={overview.progress}
          />
        ))}
      </div>
      <div className="border-stroke-light bg-surface-elevated flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-[11px] leading-relaxed">
        <FiInfo
          className="text-action-primary mt-0.5 shrink-0 text-lg"
          aria-hidden="true"
        />
        <p className="m-0">{t("allTiers.info")}</p>
      </div>
    </section>
  );
}
