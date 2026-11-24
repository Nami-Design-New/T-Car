import { useTranslations } from "next-intl";
import { FiChevronRight } from "react-icons/fi";
import { Link } from "@/i18n/navigation";

export default function ConvertPointsBanner() {
  const t = useTranslations("rewards.convert");

  return (
    <Link
      href="/account/rewards/catalog"
      className="relative flex min-h-24 items-center gap-6 overflow-hidden rounded-lg bg-[linear-gradient(120deg,#1f7ffa,#0f4fb8)] py-4 ps-5 pe-6 text-white shadow-[0_7px_14px_rgba(31,77,153,0.2)]"
    >
      <span className="flex min-w-0 flex-1 flex-col items-start">
        <strong className="text-base">{t("title")}</strong>
        <span className="mt-0.5 text-[11px] text-white/80">
          {t("subtitle")}
        </span>
        <span className="text-action-primary mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold">
          {t("action")}
          <FiChevronRight className="rtl:scale-x-[-1]" aria-hidden="true" />
        </span>
      </span>
      {/* Ticket perforation: notches top and bottom, in line with the divider. */}
      <span className="relative -my-4 w-0 self-stretch" aria-hidden="true">
        <span className="bg-surface-card-primary absolute -start-2 -top-2 size-4 rounded-full" />
        <span className="absolute inset-y-4 start-0 border-s border-dashed border-white/55" />
        <span className="bg-surface-card-primary absolute -start-2 -bottom-2 size-4 rounded-full" />
      </span>
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/15 text-[28px] font-bold">
        %
      </span>
    </Link>
  );
}
