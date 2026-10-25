import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { POINTS_ICONS } from "@/shared/config/assets";
import type { PointsSummary } from "../model";
import { FaChevronLeft } from "react-icons/fa";

interface Props {
  summary: PointsSummary;
}

export default function PointsSummaryCard({ summary }: Props) {
  const t = useTranslations("account.points");

  return (
    <Link
      href="/account/points"
      className=" relative mb-5 flex w-full flex-col overflow-hidden rounded-[20px] bg-[#edf2f7] text-end no-underline shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] [direction:rtl]"
    >
      <div className=" flex items-center justify-between rounded-t-[20px] bg-action-primary px-6 py-4.5 text-text-on-action">
        <span className=" ms-32.5 text-lg font-bold text-text-on-action">
          {t("title")}
        </span>
        <span className=" flex items-center gap-2 text-xl font-bold text-text-on-action">
          {summary.balance} {t("unit")}
          <FaChevronLeft className=" text-xs" />
        </span>
      </div>

      <div className=" relative flex min-h-13.75 items-center justify-between bg-primary-100 px-6 py-4">
        <div className=" ms-31.25 max-w-[75%] text-[13px] leading-normal text-text-subtle">
          {t("cardDescription")}
        </div>
      </div>
      <div className=" absolute inset-s-0-0 top-0 flex size-30.5 items-center justify-center">
        <Image src={POINTS_ICONS.coins.src} alt="coins image" fill={true} />
      </div>
    </Link>
  );
}
