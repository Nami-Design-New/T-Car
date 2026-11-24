import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { FiPlus } from "react-icons/fi";
import { ICONS } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
import { canAffordReward, type RewardCatalogItem } from "../model";

interface Props {
  item: RewardCatalogItem;
  balance: number;
}

export default function CatalogCard({ item, balance }: Props) {
  const t = useTranslations("rewards.catalog");
  const format = useFormatter();
  const affordable = canAffordReward(balance, item);

  return (
    <article className="bg-surface-elevated flex min-w-0 flex-col gap-2 rounded-2xl p-2 shadow-[0_7px_14px_rgba(31,77,153,0.08)]">
      <div
        className={cn(
          "relative h-25 overflow-hidden rounded-xl bg-[linear-gradient(150deg,#2d91ff,#1354c7)] text-white",
          !affordable && "opacity-50",
        )}
      >
        <span
          className="absolute -end-9 -top-12 size-32 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <span
          className="absolute -start-8 -bottom-21 size-32 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <Image
          src="/images/rewards/decor-lane.svg"
          width={420}
          height={3}
          alt=""
          aria-hidden="true"
          className="absolute -start-8 top-19 max-w-none -rotate-12 rtl:rotate-12"
        />
        <span
          className="absolute end-2 top-2 grid size-7 place-items-center rounded-lg bg-white/15"
          aria-hidden="true"
        >
          <Image
            src={ICONS.car.src}
            width={ICONS.car.width}
            height={ICONS.car.height}
            alt=""
          />
        </span>
        <span className="absolute start-3 bottom-3 flex flex-col items-start">
          <strong className="text-[30px] leading-none">
            {format.number(item.discountAmount)}
          </strong>
          <span className="flex items-center gap-0.5 text-[10px]">
            <Image
              src={ICONS.riyal.src}
              width={11}
              height={12}
              alt=""
              aria-hidden="true"
              className="brightness-0 invert"
            />
            {t("discountUnit")}
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-1 pb-1">
        <h2
          className="m-0 flex items-center gap-1 text-[13px] font-bold"
          aria-label={t("discountTitleAccessible", {
            amount: format.number(item.discountAmount),
          })}
        >
          <span>{t("discountTitle")}</span>
          <span>{format.number(item.discountAmount)}</span>
          <Image
            src={ICONS.riyal.src}
            width={11}
            height={12}
            alt=""
            aria-hidden="true"
          />
        </h2>
        <p className="text-text-subtle m-0 text-[11px]">
          {affordable ? t("availableNow") : t("insufficientPoints")}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="flex items-baseline gap-1 text-[11px]">
            <strong
              className={cn(
                "text-sm",
                affordable ? "text-action-primary" : "text-text-subtle",
              )}
            >
              {format.number(item.pointsCost)}
            </strong>
            <span className="text-text-subtle">{t("points")}</span>
          </span>
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full text-xl text-white",
              affordable ? "bg-action-primary" : "bg-[#bdd8ff]",
            )}
            aria-hidden="true"
          >
            <FiPlus />
          </span>
        </div>
        <span className="sr-only">
          {affordable ? t("affordable") : t("insufficientPoints")}
        </span>
      </div>
    </article>
  );
}
