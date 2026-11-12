"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { RadioCards } from "@/shared/ui/RadioCards";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Price } from "@/shared/ui/Price";
import { Skeleton } from "@/shared/ui/Skeleton";
import { cn } from "@/shared/lib/cn";
import type { AppError } from "@/shared/lib/errors";
import { fromActionResult } from "@/shared/lib/result";
import {
  getPaymentOptionsAction,
  walletCoversAlone,
  type PaymentChoice,
  type PaymentOptions,
} from "@/features/orders";
import { PAYMENT_ICONS } from "@/shared/config/assets";
import InsufficientBalanceModal from "./InsufficientBalanceModal";

interface Props {
  open: boolean;
  onClose: () => void;
  /** The draft (E2) being paid. */
  orderId: string;
  /** The draft's `final_price`: decides whether the wallet can pay alone. */
  amount: number;
  onConfirm: (choice: PaymentChoice) => void;
  /** "Top up now" in the insufficient-balance dialog. */
  onTopUp: () => void;
  /** A pay request is running, or a gateway tab is open. */
  loading?: boolean;
  /** Overrides the confirm label while `loading` (e.g. waiting for the gateway tab). */
  loadingLabel?: string;
  /** Already translated; the dialog stays open and shows it after a failed submit. */
  error?: string;
}

type OptionsState =
  | { status: "loading" }
  | { status: "error"; error: AppError }
  | { status: "ready"; options: PaymentOptions };

/** Local icons for the E3 `type` (Q8); an unknown type gets the card icon. */
const METHOD_ICONS: Record<string, { src: string; width: number }> = {
  tabby: { src: PAYMENT_ICONS.tabby.src, width: 58 },
  tamara: { src: PAYMENT_ICONS.tamara.src, width: 66 },
};
const DEFAULT_METHOD_ICON = { src: PAYMENT_ICONS.card.src, width: 24 };
/** Types with a translated description under `booking.payment.options`. */
const DESCRIBED_TYPES = new Set(["tabby", "tamara"]);

const cardClass =
  "flex min-h-14.5 items-center justify-between gap-4 rounded-sm border border-stroke-light bg-surface-elevated px-3 py-2 text-start transition-[border-color,background-color] hover:border-action-primary/50";
const selectedClass = "!border-action-primary/50 !bg-surface-card-primary";

/**
 * Checkout step 3 (O6). Methods and the wallet balance come from E3. R14: the
 * wallet is a card that can always be chosen together with one method (the
 * wallet pays first); the wallet alone needs a balance that covers the total,
 * otherwise the insufficient-balance dialog opens. No points (R13).
 */
export default function PaymentMethodModal({
  open,
  onClose,
  orderId,
  amount,
  onConfirm,
  onTopUp,
  loading = false,
  loadingLabel,
  error,
}: Props) {
  const t = useTranslations("booking.payment");
  const [state, setState] = useState<OptionsState>({ status: "loading" });
  const [useWallet, setUseWallet] = useState(false);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [lowBalanceOpen, setLowBalanceOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = fromActionResult(await getPaymentOptionsAction(orderId));
    setState(
      result.ok
        ? { status: "ready", options: result.data }
        : { status: "error", error: result.error },
    );
  }, [orderId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const options = state.status === "ready" ? state.options : null;
  const balance = options?.walletBalance ?? 0;
  const walletCovers = walletCoversAlone(balance, amount);
  // When the wallet covers everything, the backend pays from it at once, so
  // the method is not sent (no gateway tab opens for nothing).
  const choice: PaymentChoice = {
    useWallet,
    paymentMethodId: useWallet && walletCovers ? null : methodId,
  };
  const canConfirm = options !== null && (useWallet || methodId !== null);

  // The wallet is a card that combines with any method (R14). An empty
  // wallet cannot be chosen: it asks for a top-up instead.
  const toggleWallet = () => {
    if (!useWallet && balance <= 0) {
      setLowBalanceOpen(true);
      return;
    }
    setUseWallet(!useWallet);
  };

  // The wallet alone must cover the total; otherwise ask for a top-up (or a method).
  const confirm = () => {
    if (useWallet && methodId === null && !walletCovers) {
      setLowBalanceOpen(true);
      return;
    }
    onConfirm(choice);
  };

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

      {state.status === "loading" && (
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton shape="rect" height={58} />
          <Skeleton shape="rect" height={58} />
          <Skeleton shape="rect" height={58} />
        </div>
      )}

      {state.status === "error" && (
        <ErrorState error={state.error} onRetry={load} size="inline" />
      )}

      {options && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            role="checkbox"
            aria-checked={useWallet}
            aria-label={t("useWallet")}
            disabled={loading}
            onClick={toggleWallet}
            className={cn(
              cardClass,
              "w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
              useWallet && selectedClass,
            )}
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-text-primary text-lg font-bold">
                {t("wallet")}
              </span>
              <span className="text-text-disabled text-base">
                {t("walletDescription")}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2" dir="ltr">
              <Image
                src={PAYMENT_ICONS.wallet.src}
                alt=""
                width={24}
                height={24}
              />
              <Price amount={balance} size="sm" />
            </span>
          </button>

          {useWallet && (
            <p className="text-text-subtle m-0 text-sm" role="status">
              {walletCovers ? t("walletCovers") : t("walletPartial")}
            </p>
          )}

          {options.methods.length === 0 ? (
            <p className="text-text-subtle m-0 text-sm">{t("noMethods")}</p>
          ) : (
            <RadioCards.Root
              value={methodId ?? ""}
              onValueChange={setMethodId}
              aria-label={t("methodsTitle")}
              className="flex flex-col gap-4"
              disabled={loading}
            >
              {options.methods.map((method) => {
                const icon = METHOD_ICONS[method.type] ?? DEFAULT_METHOD_ICON;
                return (
                  <RadioCards.Item
                    key={method.id}
                    value={method.id}
                    // Clicking the chosen method again clears it, so the
                    // wallet can still pay alone.
                    onClick={() => {
                      if (methodId === method.id) setMethodId(null);
                    }}
                    className={cn(
                      cardClass,
                      methodId === method.id && selectedClass,
                    )}
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="text-text-primary text-lg font-bold">
                        {method.title}
                      </span>
                      {DESCRIBED_TYPES.has(method.type) && (
                        <span className="text-text-disabled text-base">
                          {t(`options.${method.type}.description`)}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center" dir="ltr">
                      <Image
                        src={icon.src}
                        alt=""
                        width={icon.width}
                        height={24}
                      />
                    </span>
                  </RadioCards.Item>
                );
              })}
            </RadioCards.Root>
          )}
        </div>
      )}

      {error && (
        <p className="text-status-error mt-4 mb-0 text-sm" role="alert">
          {error}
        </p>
      )}

      <Button
        type="button"
        size="lg"
        onClick={confirm}
        disabled={!canConfirm}
        loading={loading}
      >
        {loading ? (loadingLabel ?? t("confirming")) : t("confirm")}
      </Button>

      <InsufficientBalanceModal
        open={lowBalanceOpen}
        onClose={() => setLowBalanceOpen(false)}
        onConfirm={() => {
          setLowBalanceOpen(false);
          onTopUp();
        }}
      />
    </Dialog>
  );
}
