import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { FiClock, FiCopy } from "react-icons/fi";
import { ICONS } from "@/shared/config/assets";
import { useNotify } from "@/shared/hooks/useNotify";
import { useCopyText } from "@/shared/hooks/useCopyText";
import { cn } from "@/shared/lib/cn";
import type { RewardCard } from "../model";

interface Props {
  card: RewardCard;
  statusLabel?: string;
  /**
   * `preview`: the confirmation shows the card before it exists, so there is
   * no code row and the validity line is the given text. It sits on the white
   * dialog surface (bordered, notches in the elevated surface colour).
   */
  variant?: "default" | "preview";
  validityLabel?: string;
  as?: "li" | "div";
}

export default function RewardTicket({
  card,
  statusLabel,
  variant = "default",
  validityLabel,
  as: Element = "li",
}: Props) {
  const t = useTranslations("rewards.cards");
  const catalogT = useTranslations("rewards.catalog");
  const preview = variant === "preview";
  const format = useFormatter();
  const notify = useNotify();
  const { copied, copy } = useCopyText();
  const amount = format.number(card.discountAmount);
  const active = card.status === "active";
  const date = card.status === "used" ? card.usedAt : card.expiresAt;
  const formattedDate = date
    ? format.dateTime(new Date(date), {
        day: "numeric",
        month: "long",
        year: "numeric",
        numberingSystem: "latn",
        timeZone: "Asia/Riyadh",
      })
    : "";

  const copyCode = async () => {
    if (await copy(card.code)) notify.success(t("copied"));
    else notify.error(t("copyFailed"));
  };

  return (
    <Element
      className={cn(
        "bg-surface-elevated relative flex overflow-visible before:absolute before:end-[90px] before:-top-2.5 before:z-10 before:size-5 before:rounded-full before:content-[''] after:absolute after:end-[90px] after:-bottom-2.5 after:z-10 after:size-5 after:rounded-full after:content-['']",
        preview
          ? "border-stroke-light before:bg-surface-elevated after:bg-surface-elevated min-h-20 rounded-[18px] border shadow-[0_5px_12px_rgba(31,77,153,0.06)]"
          : "before:bg-surface-card-primary after:bg-surface-card-primary min-h-30 rounded-2xl shadow-[0_6px_12px_rgba(31,77,153,0.06)]",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <strong className="min-w-0 text-[13px] font-bold">
            <span className="sr-only">
              {catalogT("discountTitleAccessible", { amount })}
            </span>
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="truncate">{catalogT("discountTitle")}</span>
              <span>{amount}</span>
              <Image
                src={ICONS.riyal.src}
                width={11}
                height={12}
                alt=""
                className="shrink-0"
              />
            </span>
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
            {statusLabel ?? t(`status.${card.status}`)}
          </span>
        </div>
        {!preview && (
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
        )}
        {(validityLabel || date) && (
          <p className="text-text-subtle m-0 flex items-center gap-1 text-[11px]">
            <FiClock className="shrink-0" aria-hidden="true" />
            <span>
              {validityLabel
                ? validityLabel
                : card.status === "active"
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
          "flex w-25 shrink-0 flex-col items-center justify-center border-y-0 border-s-2 border-e-0 border-dashed border-white/60 text-white",
          active
            ? "bg-[linear-gradient(160deg,#2786ff,#0d57c5)]"
            : "bg-[#d0d0d0]",
          preview ? "rounded-e-[18px]" : "rounded-e-2xl",
        )}
        aria-hidden="true"
      >
        <strong className="text-[30px] leading-none">{amount}</strong>
        <span className="mt-1 flex items-center gap-0.5 text-[11px]">
          {catalogT("discountUnit")}
          <Image
            src={ICONS.riyal.src}
            width={11}
            height={12}
            alt=""
            className="brightness-0 invert"
          />
        </span>
      </div>
    </Element>
  );
}
