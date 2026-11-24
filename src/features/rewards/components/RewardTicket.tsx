import { useFormatter, useTranslations } from "next-intl";
import { FiClock, FiCopy } from "react-icons/fi";
import { useNotify } from "@/shared/hooks/useNotify";
import { useCopyText } from "@/shared/hooks/useCopyText";
import { cn } from "@/shared/lib/cn";
import type { RewardCard } from "../model";

interface Props {
  card: RewardCard;
}

export default function RewardTicket({ card }: Props) {
  const t = useTranslations("rewards.cards");
  const format = useFormatter();
  const notify = useNotify();
  const { copied, copy } = useCopyText();
  const active = card.status === "active";
  const date = card.status === "used" ? card.usedAt : card.expiresAt;
  const formattedDate = date
    ? format.dateTime(new Date(date), {
        day: "numeric",
        month: "long",
        year: "numeric",
        numberingSystem: "latn",
        timeZone: "UTC",
      })
    : "";

  const copyCode = async () => {
    if (await copy(card.code)) notify.success(t("copied"));
    else notify.error(t("copyFailed"));
  };

  return (
    <li className="bg-surface-elevated before:bg-surface-card-primary after:bg-surface-card-primary relative flex min-h-30 overflow-visible rounded-2xl shadow-[0_6px_12px_rgba(31,77,153,0.06)] before:absolute before:end-[90px] before:-top-2.5 before:z-10 before:size-5 before:rounded-full before:content-[''] after:absolute after:end-[90px] after:-bottom-2.5 after:z-10 after:size-5 after:rounded-full after:content-['']">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <strong className="truncate text-[13px] font-bold">
            {t("discountTitle", { amount: format.number(card.discountAmount) })}
          </strong>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              active
                ? "bg-success-50 text-status-success"
                : card.status === "used"
                  ? "text-text-subtle bg-neutral-100"
                  : "bg-red-50 text-red-600",
            )}
          >
            {t(`status.${card.status}`)}
          </span>
        </div>
        <div
          className={cn(
            "flex min-w-0 items-center justify-between gap-2 rounded-lg border border-dashed px-2.5 py-1.5",
            active
              ? "border-action-primary bg-primary-50 text-action-primary"
              : "border-stroke-light text-text-subtle bg-neutral-50",
          )}
        >
          <bdi
            dir="ltr"
            className="truncate text-[12px] font-bold tracking-wide"
          >
            {card.code}
          </bdi>
          <button
            type="button"
            disabled={!active}
            onClick={copyCode}
            aria-label={
              copied ? t("copied") : t("copyCode", { code: card.code })
            }
            className="enabled:hover:bg-action-primary/10 grid size-5 shrink-0 place-items-center rounded text-[14px] enabled:cursor-pointer disabled:opacity-60"
          >
            <FiCopy aria-hidden="true" />
          </button>
        </div>
        {date && (
          <p className="text-text-subtle m-0 flex items-center gap-1 text-[11px]">
            <FiClock className="shrink-0" aria-hidden="true" />
            <span>
              {card.status === "active"
                ? t("validUntil", { date: formattedDate })
                : card.status === "used"
                  ? t("usedOn", {
                      date: formattedDate,
                      booking: card.bookingId ?? "",
                    })
                  : t("expiredOn", { date: formattedDate })}
            </span>
          </p>
        )}
      </div>
      <div
        className={cn(
          "flex w-25 shrink-0 flex-col items-center justify-center border-s-2 border-dashed border-white/60 text-white",
          active
            ? "bg-[linear-gradient(160deg,#2786ff,#0d57c5)]"
            : "bg-[#d0d0d0]",
          "rounded-e-2xl",
        )}
      >
        <strong className="text-[30px] leading-none">
          {format.number(card.discountAmount)}
        </strong>
        <span className="mt-1 text-[11px]">{t("discountUnit")}</span>
      </div>
    </li>
  );
}
