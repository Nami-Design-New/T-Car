"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FiLock } from "react-icons/fi";
import { formatTransactionDate } from "@/shared/lib/format";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Price } from "@/shared/ui/Price";
import type { WalletSummary, WalletTransaction } from "../model";
import { Loader } from "@/shared/ui/Loader";

import { ICONS } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
const walletIcon = ICONS.money;
const coinIcon = ICONS.coin;
const balanceIcon = ICONS.balance;

interface Props {
  summary: WalletSummary;
  transactions: WalletTransaction[];
  loading?: boolean;
  /** Set when the wallet failed to load; ErrorState picks the message. */
  error?: unknown;
  onRetry?: () => void;
  onTopUp: () => void;
  onWithdraw: () => void;
}

export default function WalletTab({
  summary,
  transactions,
  loading = false,
  error,
  onRetry,
  onTopUp,
  onWithdraw,
}: Props) {
  const t = useTranslations("wallet");
  if (loading) {
    return (
      <div className="border-stroke-light bg-surface-elevated rounded-xl border p-6">
        <Loader fullScreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-stroke-light bg-surface-elevated rounded-xl border p-6">
        <ErrorState error={error} onRetry={onRetry} size="section" />
      </div>
    );
  }

  return (
    <div className="border-stroke-light bg-surface-elevated rounded-xl border p-6">
      <div className="border-stroke-light bg-surface-elevated mb-7 rounded-lg border px-5 py-6 text-center shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="text-text-subtle mb-3 flex items-center justify-center gap-2 text-sm font-semibold">
          <Image src={walletIcon} alt="" width={22} height={22} />
          <span>{t("totalBalance")}</span>
        </div>

        <div className="text-text-primary mb-5.5 flex justify-center text-[2.2rem] leading-none font-extrabold">
          <Price
            amount={summary.total}
            size="xl"
            className="inline-flex items-center gap-1.5"
          />
        </div>

        <div className="mx-auto mb-5.5 grid max-w-105 grid-cols-2 gap-3">
          <button
            type="button"
            className="primary border-action-primary bg-action-primary text-text-on-action hover:bg-primary-400 h-11.5 cursor-pointer rounded-md border text-[0.9rem] font-bold transition"
            onClick={onTopUp}
          >
            {t("addBalance")}
          </button>
          <button
            type="button"
            className="border-action-primary text-action-primary hover:enabled:bg-primary-50 disabled:border-stroke-heavy disabled:text-text-placeholder h-11.5 cursor-pointer rounded-md border bg-transparent text-[0.9rem] font-bold outline transition disabled:cursor-not-allowed"
            onClick={onWithdraw}
            disabled={summary.withdrawable <= 0}
          >
            {t("withdrawBalance")}
          </button>
        </div>

        <div className="border-stroke-light grid grid-cols-2 border-t pt-4.5">
          <div className="flex flex-col items-center gap-2">
            <span className="text-text-subtle inline-flex items-center gap-1.5 text-[0.78rem] font-semibold">
              <Image src={coinIcon} alt="" width={18} height={18} />
              {t("withdrawableBalance")}
            </span>
            <Price
              amount={summary.withdrawable}
              size="md"
              className="text-text-primary inline-flex items-center gap-1.5 text-[1.15rem] font-extrabold"
            />
          </div>

          <div className="border-stroke-light flex flex-col items-center gap-2 border-s">
            <span className="wallet_breakdown_label text-text-subtle inline-flex items-center gap-1.5 text-[0.78rem] font-semibold">
              <Image src={balanceIcon} alt="" width={18} height={18} />
              {t("nonWithdrawableBalance")}
            </span>
            <Price
              amount={summary.nonWithdrawable}
              size="md"
              className="text-text-primary inline-flex items-center gap-1.5 text-[1.15rem] font-extrabold"
            />
          </div>
        </div>
      </div>

      <div className="">
        <h3 className="text-text-primary mb-3.5 text-base font-bold">
          {t("history")}
        </h3>

        {transactions.length === 0 ? (
          <EmptyState title={t("empty.history")} size="section" />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className={` ${tx.type} flex items-center justify-between gap-3 rounded-md p-3.5 ${tx.type === "topup" ? "bg-primary-50" : tx.type === "payment" ? "bg-error-50" : "bg-success-50"}`}
              >
                <div className="flex flex-col gap-1">
                  <span
                    className={cn(
                      "text-text-primary text-base font-normal",
                      tx.type === "topup"
                        ? "text-action-primary"
                        : tx.type === "payment" && "text-status-error",
                    )}
                  >
                    <Price
                      amount={tx.amount}
                      size="sm"
                      className="inline-flex items-center gap-1.5"
                    />
                  </span>{" "}
                  <span className="text-text-subtle text-xs">
                    {formatTransactionDate(tx.createdAt)}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-text-primary text-[0.88rem] font-bold ${tx.type === "topup" ? "text-action-primary" : tx.type === "payment" ? "text-status-error" : "text-status-success"}`}
                  >
                    {t(`transaction.${tx.type}`)}
                  </span>
                  <span className="text-text-subtle text-xs">#{tx.id}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
