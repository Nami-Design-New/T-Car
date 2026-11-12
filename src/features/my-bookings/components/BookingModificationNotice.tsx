import Image from "next/image";
import { useTranslations } from "next-intl";
import { ICONS } from "@/shared/config/assets";

export default function BookingModificationNotice() {
  const t = useTranslations("myBookings.notices");

  return (
    <p
      role="note"
      className="border-warning-500 bg-warning-50 text-warning-700 m-0 flex items-center gap-3 rounded-md border-s-2 p-4 text-sm leading-relaxed"
    >
      <Image
        src={ICONS.info.src}
        alt=""
        width={ICONS.info.width}
        height={ICONS.info.height}
        className="mt-0.5 shrink-0"
      />
      <span>{t("modificationPending")}</span>
    </p>
  );
}
