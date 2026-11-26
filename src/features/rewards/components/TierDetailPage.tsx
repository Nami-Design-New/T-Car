import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import {
  rewardTierView,
  type RewardsSummary,
} from "../model";
import PerkRow from "./PerkRow";
import PerkIcon from "./PerkIcon";
import TierHero from "./TierHero";
import EarnPointsDialog from "./EarnPointsDialog";

interface Props {
  summary: RewardsSummary;
  tierId: string;
}

export default function TierDetailPage({ summary, tierId }: Props) {
  const t = useTranslations("rewards");
  const view = rewardTierView(summary, tierId);
  const perksSection = (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-base font-bold">
        {view.state === "current"
          ? t("detail.currentPerks")
          : t("detail.tierPerks", { tier: view.tier.name })}
      </h2>
      {view.tier.perks.length ? (
        view.tier.perks.map((perk) => (
          <PerkRow
            key={perk.key}
            title={perk.title}
            icon={<PerkIcon perkKey={perk.key} />}
            unlocked={view.state !== "locked"}
          />
        ))
      ) : (
        <div className="border-stroke-light bg-surface-elevated rounded-lg border p-4">
          {view.state === "reached" ? (
            <p className="text-text-subtle m-0 text-xs">
              {t("tierPage.noPerks")}
            </p>
          ) : (
            <>
              <strong>{t("perks.emptyTitle")}</strong>
              <p className="text-text-subtle text-xs">
                {view.next
                  ? t("perks.emptyDescription", {
                      threshold: view.next.startPoints,
                      tier: view.next.name,
                    })
                  : t("perks.topTierDescription")}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
  return (
    <section className="bg-surface-card-primary flex flex-col gap-5 rounded-xl">
      <nav
        aria-label={t("detail.tierNavigation")}
        className="flex min-h-11 gap-1 overflow-x-auto rounded-2xl bg-neutral-100 p-1"
      >
        {view.tiers.map(({ tier }) => (
          <Link
            key={tier.id}
            href={`/account/rewards/tiers/${tier.id}`}
            aria-current={tier.id === tierId ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-max flex-1 items-center justify-center rounded-xl px-3.5 text-center text-[13px]",
              tier.id === tierId
                ? "bg-surface-elevated text-action-primary font-semibold shadow-[0_2px_3px_rgba(26,51,102,.1)]"
                : "text-text-subtle font-medium",
            )}
          >
            {tier.name}
          </Link>
        ))}
      </nav>
      <TierHero
        tierPoints={summary.tierPoints}
        currentTier={view.tier}
        nextTier={view.state === "locked" ? null : view.next}
        progress={view.progress}
        pointsLeft={view.pointsLeft}
        state={view.state}
        href={null}
      />
      {perksSection}
      {view.state === "current" && view.next && view.next.perks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[17px] font-bold">
            {t("detail.unlocksAt", { tier: view.next.name })}
          </h2>
          {view.next.perks.map((perk) => (
            <PerkRow
              key={perk.key}
              title={perk.title}
              icon={<PerkIcon perkKey={perk.key} />}
              unlocked={false}
            />
          ))}
        </section>
      )}
      <EarnPointsDialog />
    </section>
  );
}
