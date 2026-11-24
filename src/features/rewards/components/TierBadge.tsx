import Image from "next/image";
import { FiCheck, FiLock } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";
import { REWARDS_ASSETS } from "@/shared/config/assets";
import type { RewardTierId, RewardTierState } from "../model";

interface Props {
  tier: RewardTierId;
  size: 48 | 56 | 72;
  /** Road states: a glow when current, a check or lock mark otherwise. Omit for a plain badge. */
  state?: RewardTierState;
}

export default function TierBadge({ tier, size, state }: Props) {
  const badge = REWARDS_ASSETS.badges[tier];
  const frame =
    tier === "silver"
      ? size === 72
        ? REWARDS_ASSETS.frames.silverHero
        : REWARDS_ASSETS.frames.silverRoad
      : REWARDS_ASSETS.frames[tier];
  const statusSize = size === 72 ? "size-6" : "size-5";

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      {state === "current" && (
        <Image
          {...REWARDS_ASSETS.glowCurrent}
          alt=""
          className="pointer-events-none absolute max-w-none"
          aria-hidden="true"
        />
      )}
      <Image
        {...frame}
        alt=""
        className={cn(
          "pointer-events-none absolute size-full max-w-none object-contain",
          state === "locked" && "opacity-65 grayscale",
        )}
        aria-hidden="true"
      />
      <Image
        src={badge.src}
        width={Math.round(size * 1.45)}
        height={Math.round(size * 1.45)}
        sizes={`${size}px`}
        alt=""
        className={cn(
          "relative z-1 size-[72%] object-contain",
          state === "locked" && "opacity-65 grayscale",
        )}
        aria-hidden="true"
      />
      {(state === "reached" || state === "locked") && (
        <span
          className={cn(
            "absolute -inset-s-0.5 -bottom-0.5 z-2 grid rounded-full text-white ring-2 ring-white",
            statusSize,
            state === "reached" ? "bg-status-success" : "bg-neutral-400",
          )}
          aria-hidden="true"
        >
          {state === "reached" ? (
            <FiCheck className="m-auto" />
          ) : (
            <FiLock className="m-auto text-[10px]" />
          )}
        </span>
      )}
    </span>
  );
}
