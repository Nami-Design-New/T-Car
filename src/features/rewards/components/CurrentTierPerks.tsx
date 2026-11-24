import { useTranslations } from "next-intl";
import { FiChevronRight, FiStar } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import type { RewardTier } from "../model";
import PerkIcon from "./PerkIcon";

interface Props {
  currentTier: RewardTier;
  nextTier: RewardTier | null;
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
                    threshold: nextTier.threshold,
                    tier: t(`tiers.${nextTier.id}`),
                  })
                : t("perks.topTierDescription")}
            </p>
          </div>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {currentTier.perks.map((perk) => (
            <li
              key={perk.id}
              className="border-stroke-light bg-surface-elevated flex items-center gap-3 rounded-lg border p-3"
            >
              <span className="bg-surface-card-primary text-action-primary grid size-10 shrink-0 place-items-center rounded-md text-xl">
                <PerkIcon icon={perk.icon} />
              </span>
              <span>
                <strong className="block text-[13px]">{perk.title}</strong>
                {perk.description && (
                  <span className="text-text-subtle text-[11px]">
                    {perk.description}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
