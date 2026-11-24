import { useTranslations } from "next-intl";
import { FiShare2 } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import {
  rewardTierView,
  type RewardTierId,
  type RewardsSummary,
} from "../model";
import PerkRow from "./PerkRow";
import PerkIcon from "./PerkIcon";
import TierHero from "./TierHero";

interface Props {
  summary: RewardsSummary;
  tierId: RewardTierId;
}

export default function TierDetailPage({ summary, tierId }: Props) {
  const t = useTranslations("rewards");
  const view = rewardTierView(summary, tierId);
  const earn = [
    {
      id: "earn-trip",
      icon: <PerkIcon icon="car" />,
      title: t("detail.earn.tripTitle"),
      description: t("detail.earn.tripDescription"),
    },
    {
      id: "earn-review",
      icon: <PerkIcon icon="sparkle" />,
      title: t("detail.earn.reviewTitle"),
      description: t("detail.earn.reviewDescription"),
    },
    {
      id: "earn-invite",
      icon: <FiShare2 aria-hidden="true" />,
      title: t("detail.earn.inviteTitle"),
      description: t("detail.earn.inviteDescription"),
      href: "/account/referrals",
    },
  ];
  const perksSection = (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-base font-bold">
        {view.state === "current"
          ? t("detail.currentPerks")
          : t("detail.tierPerks", { tier: tierId })}
      </h2>
      {view.tier.perks.length ? (
        view.tier.perks.map((perk) => (
          <PerkRow
            key={perk.id}
            title={perk.title}
            description={perk.description}
            icon={<PerkIcon icon={perk.icon} />}
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
                      threshold: view.next.threshold,
                      tier: t(`tiers.${view.next.id}`),
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
        className="grid h-11 grid-cols-4 gap-1 rounded-2xl bg-neutral-100 p-1"
      >
        {view.tiers.map(({ tier }) => (
          <Link
            key={tier.id}
            href={`/account/rewards/tiers/${tier.id}`}
            aria-current={tier.id === tierId ? "page" : undefined}
            className={cn(
              "flex h-9 items-center justify-center rounded-xl px-3.5 text-center text-[13px]",
              tier.id === tierId
                ? "bg-surface-elevated text-action-primary font-semibold shadow-[0_2px_3px_rgba(26,51,102,.1)]"
                : "text-text-subtle font-medium",
            )}
          >
            {t(`tiers.${tier.id}`)}
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
      {view.state === "locked" && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[17px] font-bold">{t("detail.earnTitle")}</h2>
          {earn.map((perk) => (
            <PerkRow
              key={perk.id}
              title={perk.title}
              description={perk.description}
              icon={perk.icon}
              unlocked
              href={perk.href}
            />
          ))}
        </section>
      )}
      {perksSection}
      {view.state === "current" && view.next && view.next.perks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[17px] font-bold">
            {t("detail.unlocksAt", { tier: view.next.id })}
          </h2>
          {view.next.perks.map((perk) => (
            <PerkRow
              key={perk.id}
              title={perk.title}
              description={perk.description}
              icon={<PerkIcon icon={perk.icon} />}
              unlocked={false}
            />
          ))}
        </section>
      )}
    </section>
  );
}
