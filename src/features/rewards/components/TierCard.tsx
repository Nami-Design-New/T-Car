import { useFormatter, useTranslations } from "next-intl";
import { FiCheck, FiLock, FiStar } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import type { RewardTier, RewardTierState } from "../model";
import TierBadge from "./TierBadge";

interface Props {
  tier: RewardTier;
  state: RewardTierState;
  tierPoints: number;
  next: RewardTier | null;
  progress: number;
}

export default function TierCard({
  tier,
  state,
  tierPoints,
  next,
  progress,
}: Props) {
  const t = useTranslations("rewards");
  const format = useFormatter();
  const unlocked = state !== "locked";
  return (
    <article
      className={cn(
        "bg-surface-elevated relative flex flex-col gap-3.5 rounded-[20px] border p-4 shadow-[0_6px_9px_rgba(31,77,153,.07)]",
        state === "current"
          ? "border-action-primary border-[1.5px]"
          : "border-stroke-light",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Figma: a locked card shows the plain badge at 45% opacity. */}
        <span className={cn("inline-flex", state === "locked" && "opacity-45")}>
          <TierBadge tier={tier} size={48} />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "m-0 text-[17px] font-bold",
              state === "locked" && "text-text-subtle",
            )}
          >
            <Link
              href={`/account/rewards/tiers/${tier.id}`}
              className="after:absolute after:inset-0"
            >
              {tier.name}
            </Link>
          </h3>
          <p className="text-text-subtle m-0 text-[11px]">
            {t("allTiers.fromPoints", {
              points: format.number(tier.startPoints),
            })}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap [&>svg]:size-3",
            state === "current"
              ? "bg-surface-card-primary text-action-primary"
              : state === "reached"
                ? "bg-success-50 text-status-success"
                : "text-text-subtle bg-neutral-100",
          )}
        >
          {state === "locked"
            ? t("allTiers.requires", { points: format.number(tier.startPoints) })
            : t(`allTiers.state.${state}`)}
          {state === "current" ? (
            <FiStar aria-hidden="true" />
          ) : state === "reached" ? (
            <FiCheck aria-hidden="true" />
          ) : (
            <FiLock aria-hidden="true" />
          )}
        </span>
      </div>
      {state === "current" && next && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-2 text-[11px]">
            <span className="text-text-subtle font-medium">
              {t("allTiers.progress", {
                points: format.number(tierPoints),
                threshold: format.number(next.startPoints),
                tier: next.name,
              })}
            </span>
            <span className="text-action-primary font-semibold">
              {format.number(progress / 100, {
                style: "percent",
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="from-primary-400 to-action-primary h-full rounded-full bg-gradient-to-r rtl:bg-gradient-to-l"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {tier.perks.length > 0 && (
        <ul
          className={cn(
            "m-0 flex list-none flex-col gap-2 rounded-[14px] p-3 text-xs font-medium",
            unlocked
              ? "bg-surface-card-primary text-text-primary"
              : "text-text-subtle bg-neutral-100",
          )}
        >
          {tier.perks.map((perk) => (
            <li key={perk.key} className="flex items-center gap-2">
              {unlocked ? (
                <FiCheck
                  className="text-status-success size-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <FiLock
                  className="size-3.5 shrink-0 text-neutral-400"
                  aria-hidden="true"
                />
              )}
              <span className="sr-only">
                {t(unlocked ? "perkState.unlocked" : "perkState.locked")}
              </span>
              <span className="flex-1">{perk.title}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
