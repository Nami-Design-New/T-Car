import Image from "next/image";
import { useTranslations } from "next-intl";
import { IMAGES } from "@/shared/config/assets";
import type { CarOffer } from "../model";

interface Props {
  offer: CarOffer;
  variant?: "card" | "ribbon";
}

/** Free-days offer overlay returned with a car listing. */
export default function CarOfferBadge({ offer, variant = "card" }: Props) {
  const t = useTranslations("carCard");
  const giftImage = IMAGES.gift;

  if (variant === "ribbon") {
    return (
      <span className="bg-ds-green absolute top-4.5 -left-9 z-3 flex h-10 w-36 -rotate-45 items-center justify-center text-sm font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.18)]">
        {t("specialOffer")}
      </span>
    );
  }

  return (
    <div className="border-status-success bg-surface-background/94 absolute inset-s-1.25 inset-e-1.25 bottom-1 z-2 flex min-h-12 items-stretch justify-between overflow-hidden rounded-md border border-dashed shadow-[0_8px_22px_rgba(30,30,30,0.14)] backdrop-blur-[10px]">
      <span className="flex min-w-0 items-center gap-3">
        <Image
          src={giftImage.src}
          alt={t("gift")}
          width={giftImage.width}
          height={giftImage.height}
          className="shrink-0"
        />
        <span className="px-ds-1 py-ds-2 min-w-0 grow">
          <small className="text-text-primary mb-px block text-xs leading-[1.3]">
            {t("offerBook", { days: offer.requiredDays })}
          </small>
          <strong className="text-ds-green block overflow-hidden text-base leading-[1.35] font-bold text-ellipsis whitespace-nowrap">
            {t("offerFree", { free: offer.freeDays })}
          </strong>
        </span>
      </span>
      <span className="bg-ds-green after:bg-surface-background/94 relative grid min-w-17 place-content-center px-4 py-2 text-center text-white after:absolute after:inset-e-0 after:top-1/2 after:size-4 after:-translate-y-1/2 after:rounded-full after:content-[''] ltr:after:translate-x-1/2 rtl:after:-translate-x-1/2">
        <strong className="block text-xl">{offer.freeDays}</strong>
        <small className="block text-[10px] leading-none">
          {t("extraDays", { count: offer.freeDays })}
        </small>
      </span>
    </div>
  );
}
