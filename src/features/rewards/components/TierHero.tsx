import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { FiChevronsRight } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { REWARDS_ASSETS } from "@/shared/config/assets";
import type { RewardRoadTier, RewardTierState } from "../model";
import TierBadge from "./TierBadge";

interface Props {
  tierPoints: number;
  currentTier: RewardRoadTier;
  nextTier: RewardRoadTier | null;
  progress: number;
  pointsLeft: number;
  state?: RewardTierState;
  href?: string | null;
}

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

  const className = "relative grid min-h-49 overflow-hidden rounded-xl p-5 text-white sm:grid-cols-[minmax(180px,1fr)_150px]";
  const style = {
    background: `linear-gradient(150deg, ${currentTier.colors.high} 14%, ${currentTier.colors.medium} 52%, ${currentTier.colors.low} 88%)`,
    boxShadow: `0 5px 13px color-mix(in srgb, ${currentTier.colors.low} 35%, transparent)`,
  };
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
          {currentTier.name}
        </strong>
        {state === "reached" ? (
          <span className="mt-1 text-xs text-white/75">
            {t("allTiers.fromPoints", {
              points: format.number(currentTier.startPoints),
            })}
          </span>
        ) : (
          <span className="mt-1 flex flex-wrap items-baseline gap-1">
            <b className="text-base">{format.number(tierPoints)}</b>
            {state === "locked" ? (
              <span className="text-xs text-white/75">
                {t("hero.ofTierPoints", {
                  threshold: format.number(currentTier.startPoints),
                })}
              </span>
            ) : nextTier ? (
              <span className="text-xs text-white/75">
                {t("hero.ofTierPoints", {
                  threshold: format.number(nextTier.startPoints),
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
              tier: state === "locked" ? currentTier.name : nextTier!.name,
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
        <TierBadge tier={currentTier} size={72} />
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
    <Link href={href} className={className} style={style}>
      {content}
    </Link>
  ) : (
    <div className={className} style={style}>{content}</div>
  );
}
