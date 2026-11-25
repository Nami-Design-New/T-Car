import Image from "next/image";
import { FiCheck, FiLock } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";
import { REWARDS_ASSETS } from "@/shared/config/assets";
import type { RewardTier, RewardTierState } from "../model";

interface Props {
  tier: RewardTier;
  size: 48 | 56 | 72;
  /** Road states: a glow when current, a check or lock mark otherwise. Omit for a plain badge. */
  state?: RewardTierState;
}

export default function TierBadge({ tier, size, state }: Props) {
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
      <span
        className={cn(
          "pointer-events-none absolute size-full",
          state === "locked" && "opacity-65 grayscale",
        )}
        style={{
          background: `linear-gradient(150deg, ${tier.colors.high}, ${tier.colors.medium}, ${tier.colors.low})`,
          clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0 50%)",
        }}
        aria-hidden="true"
      />
      <Image
        src={tier.iconUrl}
        width={Math.round(size * 1.45)}
        height={Math.round(size * 1.45)}
        sizes={`${size}px`}
        unoptimized
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
