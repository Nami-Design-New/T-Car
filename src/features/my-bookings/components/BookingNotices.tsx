import Image from "next/image";
import { useTranslations } from "next-intl";
import { ICONS } from "@/shared/config/assets";

/**
 * Notices for an upcoming or running booking: a payment-safety warning
 * (extend only through the app) and T-Car's liability for extensions agreed
 * directly with the rental company.
 */
export default function BookingNotices() {
  const t = useTranslations("myBookings.notices");

  return (
    <div className="flex flex-col gap-3">
      <p
        role="note"
        className="border-warning-500 bg-warning-50 text-warning-700 m-0 flex items-start gap-3 rounded-md border-e-2 p-4 text-sm leading-relaxed"
      >
        <Image
          src={ICONS.info.src}
          alt=""
          width={ICONS.info.width}
          height={ICONS.info.height}
          className="mt-0.5 shrink-0"
        />
        <span>{t("paymentSafety")}</span>
      </p>

      <p
        role="note"
        className="border-primary-500 bg-primary-50 text-text-primary m-0 flex items-start gap-3 rounded-md border-s-2 p-4 text-sm leading-relaxed"
      >
        <Image
          src={ICONS.filledShiled.src}
          alt=""
          width={ICONS.filledShiled.width}
          height={ICONS.filledShiled.height}
          className="mt-0.5 shrink-0"
        />
        <span>{t("directExtension")}</span>
      </p>
    </div>
  );
}
