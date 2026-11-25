import { useTranslations } from "next-intl";
import { FiChevronRight, FiStar } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import type { RewardRoadTier, RewardTier } from "../model";
import PerkIcon from "./PerkIcon";

interface Props {
  currentTier: Pick<RewardTier, "id" | "perks">;
  nextTier: RewardRoadTier | null;
}

export default function CurrentTierPerks({ currentTier, nextTier }: Props) {
  const t = useTranslations("rewards");

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold">{t("perks.title")}</h2>
        <Link
          href={`/account/rewards/tiers/${currentTier.id}`}
          className="text-action-primary inline-flex items-center gap-1 text-xs font-medium"
        >
          {t("perks.viewAll")}
          <FiChevronRight className="rtl:scale-x-[-1]" aria-hidden="true" />
        </Link>
      </div>

      {currentTier.perks.length === 0 ? (
        <div className="border-stroke-light bg-surface-elevated flex items-center gap-3 rounded-lg border p-3">
          <span className="bg-surface-card-primary text-action-primary grid size-10 shrink-0 place-items-center rounded-md text-xl">
            <FiStar aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-[13px] font-semibold">
              {t("perks.emptyTitle")}
            </h3>
            <p className="text-text-subtle mt-0.5 text-[10px]">
              {nextTier
                ? t("perks.emptyDescription", {
                    threshold: nextTier.startPoints,
                    tier: nextTier.name,
                  })
                : t("perks.topTierDescription")}
            </p>
          </div>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {currentTier.perks.map((perk) => (
            <li
              key={perk.key}
              className="border-stroke-light bg-surface-elevated flex items-center gap-3 rounded-lg border p-3"
            >
              <span className="bg-surface-card-primary text-action-primary grid size-10 shrink-0 place-items-center rounded-md text-xl">
                <PerkIcon perkKey={perk.key} />
              </span>
              <span>
                <strong className="block text-[13px]">{perk.title}</strong>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
