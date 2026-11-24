import { Link } from "@/i18n/navigation";
import { ICONS } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import { FiChevronRight } from "react-icons/fi";
import type { RewardsOverview } from "../model";
import TierBadge from "./TierBadge";

interface Props {
  tiers: RewardsOverview["tiers"];
  roadPosition: number;
}

export default function TierRoad({ tiers, roadPosition }: Props) {
  const t = useTranslations("rewards");
  const format = useFormatter();
  // The road runs between the first and last badge centres: half a column in
  // from each side of the equal-width stops.
  const inset = 50 / tiers.length;
  const markerStart = inset + (roadPosition * (100 - 2 * inset)) / 100;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold">{t("road.title")}</h2>
        <Link
          href="/account/rewards/tiers"
          className="text-action-primary inline-flex items-center gap-1 text-xs font-medium"
        >
          {t("road.viewTiers")}
          <FiChevronRight className="rtl:scale-x-[-1]" aria-hidden="true" />
        </Link>
      </div>

      <div className="border-stroke-light bg-surface-elevated rounded-lg border px-4 pt-4 pb-3">
        <div className="relative">
          {/* Badge centre is 28px down (56px badge); the 6px road centres on it. */}
          <div
            className="border-stroke-light absolute top-6.25 h-1.5 overflow-hidden rounded-full border bg-neutral-100"
            style={{
              insetInlineStart: `${inset}%`,
              insetInlineEnd: `${inset}%`,
            }}
          >
            <span
              className="from-primary-400 to-action-primary absolute inset-y-0 start-0 bg-gradient-to-r rtl:bg-gradient-to-l"
              style={{ width: `${roadPosition}%` }}
            />
          </div>
          {/* Under the badges: at a threshold the current badge covers it. */}
          <span
            className="bg-action-primary absolute top-7 z-1 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[11px] text-white shadow rtl:translate-x-0"
            style={{ insetInlineStart: `${markerStart}%` }}
            aria-hidden="true"
          >
            <Image
              src={ICONS.car.src}
              width={ICONS.car.width}
              height={ICONS.car.height}
              alt="car"
            />
          </span>

          <ol
            className="relative z-2 m-0 grid list-none p-0"
            style={{
              gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))`,
            }}
          >
            {tiers.map(({ tier, state }) => (
              <li
                key={tier.id}
                className="flex min-w-0 flex-col items-center text-center"
              >
                <TierBadge tier={tier.id} size={56} state={state} />
                <strong
                  className={cn(
                    "mt-1.5 text-xs",
                    state === "current" && "text-action-primary",
                    state === "locked" && "text-text-subtle",
                  )}
                >
                  {t(`tiers.${tier.id}`)}
                  <span className="sr-only"> ({t(`road.state.${state}`)})</span>
                </strong>
                <span className="text-text-subtle mt-0.5 text-[10px]">
                  {format.number(tier.threshold)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
