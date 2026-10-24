"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { RadioCards } from "@/shared/ui/RadioCards";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";
import type { PaymentMethod } from "../model";
import { ICONS, PAYMENT_ICONS } from "@/shared/config/assets";
const walletIcon = PAYMENT_ICONS.wallet;
const cardIcon = PAYMENT_ICONS.card;
const tabyIcon = PAYMENT_ICONS.tabby;
const tamaraIcon = PAYMENT_ICONS.tamara;
const riyalIcon = ICONS.riyal;

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  loading?: boolean;
  /** Already translated; the dialog stays open and shows it after a failed submit. */
  error?: string;
}

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  description: string;
  icon: { src: string; width: number; height: number };
  iconAlt: string;
  iconWidth: number;
  iconHeight: number;
}

const OPTIONS: PaymentOption[] = [
  {
    id: "visa",
    title: "visa.title",
    description: "visa.description",
    icon: cardIcon,
    iconAlt: "",
    iconWidth: 24,
    iconHeight: 24,
  },
  {
    id: "tabby",
    title: "tabby.title",
    description: "tabby.description",
    icon: tabyIcon,
    iconAlt: "",
    iconWidth: 58,
    iconHeight: 24,
  },
  {
    id: "tamara",
    title: "tamara.title",
    description: "tamara.description",
    icon: tamaraIcon,
    iconAlt: "",
    iconWidth: 66,
    iconHeight: 24,
  },
];

export default function PaymentMethodModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  error,
}: Props) {
  const t = useTranslations("booking.payment");
  const [method, setMethod] = useState<PaymentMethod>("wallet");
  const [usePoints, setUsePoints] = useState(false);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement="center"
      label={t("dialogLabel")}
    >
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <div className="flex flex-col gap-4">
        <RadioCards.Root
          value={method}
          onValueChange={(value) => setMethod(value as PaymentMethod)}
          aria-label={t("title")}
          className="flex flex-col gap-4"
        >
          <RadioCards.Item
            value="wallet"
            className={cn(
              "flex min-h-14.5 items-center justify-between gap-4 rounded-sm border  bg-surface-elevated px-3 py-2 text-start transition-[border-color,background-color] hover:  border-action-primary/50",
              method === "wallet" &&
                "border-action-primary/50 bg-surface-card-primary",
            )}
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-lg font-bold text-text-primary">
                {t("wallet")}
              </span>
              <span className="text-base text-text-disabled">
                {t("walletDescription")}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2" dir="ltr">
              <Image src={walletIcon} alt="" width={24} height={24} />
              <strong className="flex items-center gap-1 text-base font-bold text-text-primary">
                500
                <Image
                  src={riyalIcon}
                  alt={t("currency")}
                  width={14}
                  height={14}
                />
              </strong>
            </span>
          </RadioCards.Item>

          {OPTIONS.map((option) => (
            <RadioCards.Item
              key={option.id}
              value={option.id}
              className={cn(
                "flex min-h-14.5 items-center justify-between gap-4 rounded-sm border border-stroke-light bg-surface-elevated px-3 py-2 text-start transition-[border-color,background-color] hover:border-action-primary/50",
                method === option.id &&
                  "border-action-primary/50! bg-surface-card-primary!",
              )}
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-lg font-bold text-text-primary">
                  {t(`options.${option.id}.title`)}
                </span>
                <span className="text-base text-text-disabled">
                  {t(`options.${option.id}.description`)}
                </span>
              </span>
              <span className="flex shrink-0 items-center" dir="ltr">
                <Image
                  src={option.icon}
                  alt={option.iconAlt}
                  width={option.iconWidth}
                  height={option.iconHeight}
                />
              </span>
            </RadioCards.Item>
          ))}
        </RadioCards.Root>

        <label className="flex min-h-14.5 cursor-pointer items-center justify-between gap-4 rounded-sm border border-stroke-light bg-surface-elevated px-3 py-2 text-start">
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-lg font-bold text-text-primary">
              {t("points")}
            </span>
            <span className="text-base text-text-disabled">
              {t("pointsDescription")}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-4" dir="ltr">
            <span className="relative inline-flex shrink-0">
              <input
                className="peer sr-only"
                type="checkbox"
                role="switch"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
              />
              <span className="relative h-6 w-11 rounded-full bg-surface-disabled transition-colors peer-checked:bg-action-primary peer-focus-visible:outline-2 peer-focus-visible:outline-action-primary peer-focus-visible:outline-offset-2 after:absolute after:start-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
            </span>
            <span className="flex flex-col items-start gap-0.5" dir="rtl">
              <small className="text-[10px] text-text-primary">
                {t("upTo")}{" "}
                <strong className="font-semibold text-status-error">
                  100 {t("pointsUnit")}
                </strong>
              </small>
              <span className="flex items-center gap-1 text-base text-text-primary">
                <span>=</span>
                <strong className="text-lg font-bold">500</strong>
                <Image
                  src={riyalIcon}
                  alt={t("currency")}
                  width={12}
                  height={12}
                />
              </span>
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p className="text-status-error text-sm mt-4 mb-0" role="alert">
          {error}
        </p>
      )}

      <Button
        type="button"
        size="lg"
        onClick={() => onConfirm(method)}
        loading={loading}
      >
        {loading ? t("confirming") : t("confirm")}
      </Button>
    </Dialog>
  );
}
