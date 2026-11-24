import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { FiChevronsRight } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { REWARDS_ASSETS } from "@/shared/config/assets";
import type { RewardTier, RewardTierState } from "../model";
import TierBadge from "./TierBadge";

interface Props {
  tierPoints: number;
  currentTier: RewardTier;
  nextTier: RewardTier | null;
  progress: number;
  pointsLeft: number;
  state?: RewardTierState;
  href?: string | null;
}

/** Figma draws bronze/silver (copper) and gold; diamond's blue is our own pick. */
const TIER_STYLES: Record<RewardTier["id"], string> = {
  bronze:
    "bg-[linear-gradient(150deg,rgb(243,194,155)_14%,rgb(200,121,74)_50%,rgb(122,62,29)_86%)] shadow-[0_5px_13px_rgba(122,62,29,0.35)]",
  silver:
    "bg-[linear-gradient(150deg,rgb(243,194,155)_14%,rgb(200,121,74)_50%,rgb(122,62,29)_86%)] shadow-[0_5px_13px_rgba(122,62,29,0.35)]",
  gold: "bg-[linear-gradient(150deg,#f7db8d_14%,#d9a21b_52%,#8b5a09_88%)] shadow-[0_5px_13px_rgba(139,90,9,0.35)]",
  diamond:
    "bg-[linear-gradient(150deg,#b9ddff_10%,#5596dd_52%,#174a8b_90%)] shadow-[0_5px_13px_rgba(23,74,139,0.35)]",
};

const { ringOne, ringTwo, ringThree, lane } = REWARDS_ASSETS.decor;

export default function TierHero({
  tierPoints,
  currentTier,
  nextTier,
  progress,
  pointsLeft,
  state = "current",
  href = "/account/rewards/tiers",
}: Props) {
  const t = useTranslations("rewards");
  const format = useFormatter();
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);
  const decorClass = "pointer-events-none absolute max-w-none opacity-45";

  const className = cn(
    "relative grid min-h-49 overflow-hidden rounded-xl p-5 text-white sm:grid-cols-[minmax(180px,1fr)_150px]",
    TIER_STYLES[currentTier.id],
  );
  const content = (
    <>
      <Image
        {...ringOne}
        alt=""
        className={cn(decorClass, "-end-22 -top-27")}
        aria-hidden="true"
      />
      <Image
        {...ringTwo}
        alt=""
        className={cn(decorClass, "-end-12 -top-17")}
        aria-hidden="true"
      />
      <Image
        {...ringThree}
        alt=""
        className={cn(decorClass, "-start-27 top-22")}
        aria-hidden="true"
      />
      <Image
        {...lane}
        alt=""
        className="pointer-events-none absolute -inset-x-10 bottom-14 w-[calc(100%+5rem)] max-w-none rotate-[18deg] opacity-40 rtl:-rotate-[18deg]"
        aria-hidden="true"
      />

      <div className="relative z-1 flex min-w-0 flex-col items-start justify-center pe-2">
        <span className="text-xs font-medium text-white/75">
          {t(
            state === "current"
              ? "hero.currentTier"
              : state === "locked"
                ? "hero.higherTier"
                : "allTiers.state.reached",
          )}
        </span>
        <strong className="mt-0.5 text-[28px] leading-tight">
          {t(`tiers.${currentTier.id}`)}
        </strong>
        {state === "reached" ? (
          <span className="mt-1 text-xs text-white/75">
            {t("allTiers.fromPoints", {
              points: format.number(currentTier.threshold),
            })}
          </span>
        ) : (
          <span className="mt-1 flex flex-wrap items-baseline gap-1">
            <b className="text-base">{format.number(tierPoints)}</b>
            {state === "locked" ? (
              <span className="text-xs text-white/75">
                {t("hero.ofTierPoints", {
                  threshold: format.number(currentTier.threshold),
                })}
              </span>
            ) : nextTier ? (
              <span className="text-xs text-white/75">
                {t("hero.ofTierPoints", {
                  threshold: format.number(nextTier.threshold),
                })}
              </span>
            ) : (
              <span className="text-xs text-white/75">{t("hero.topTier")}</span>
            )}
          </span>
        )}
        {state !== "reached" && (state === "locked" || nextTier) && (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur-sm">
            {t("hero.pointsToNext", {
              points: format.number(pointsLeft),
              tier: state === "locked" ? currentTier.id : nextTier!.id,
            })}
            <FiChevronsRight
              className="shrink-0 text-base rtl:scale-x-[-1]"
              aria-hidden="true"
            />
          </span>
        )}
      </div>

      <div className="relative z-1 mx-auto grid size-31 place-items-center max-sm:absolute max-sm:end-3 max-sm:top-1/2 max-sm:-translate-y-1/2">
        <svg
          className="absolute inset-0 -rotate-90 rtl:-scale-y-100"
          viewBox="0 0 124 124"
          aria-hidden="true"
        >
          <circle
            cx="62"
            cy="62"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,.35)"
            strokeWidth="8"
          />
          <circle
            cx="62"
            cy="62"
            r={radius}
            fill="none"
            stroke="#a8d4ff"
            strokeLinecap="round"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <TierBadge tier={currentTier.id} size={72} />
        <span className="text-action-primary absolute -bottom-0.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold shadow-sm">
          {format.number(progress / 100, {
            style: "percent",
            maximumFractionDigits: 0,
          })}
        </span>
      </div>
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
