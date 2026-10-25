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
      <div className="rounded-xl border border-stroke-light bg-surface-elevated p-6">
        <Loader fullScreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-stroke-light bg-surface-elevated p-6">
        <ErrorState error={error} onRetry={onRetry} size="section" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stroke-light bg-surface-elevated p-6">
      <div className="wallet_balance_card mb-7 rounded-lg border border-stroke-light bg-surface-elevated px-5 py-6 text-center shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="wallet_balance_label mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-text-subtle">
          <Image src={walletIcon} alt="" width={22} height={22} />
          <span>{t("totalBalance")}</span>
        </div>

        <div className="wallet_balance_amount mb-5.5 flex justify-center text-[2.2rem] font-extrabold leading-none text-text-primary">
          <Price
            amount={summary.total}
            size="xl"
            className="wallet_amount inline-flex items-center gap-1.5"
          />
        </div>

        <div className="wallet_balance_actions mx-auto mb-5.5 grid max-w-105 grid-cols-2 gap-3">
          <button
            type="button"
            className="wallet_action_btn primary h-11.5 cursor-pointer rounded-md border border-action-primary bg-action-primary text-[0.9rem] font-bold text-text-on-action transition hover:bg-primary-400"
            onClick={onTopUp}
          >
            {t("addBalance")}
          </button>
          <button
            type="button"
            className="wallet_action_btn outline h-11.5 cursor-pointer rounded-md border border-action-primary bg-transparent text-[0.9rem] font-bold text-action-primary transition hover:enabled:bg-primary-50 disabled:cursor-not-allowed disabled:border-stroke-heavy disabled:text-text-placeholder"
            onClick={onWithdraw}
            disabled={summary.withdrawable <= 0}
          >
            {t("withdrawBalance")}
          </button>
        </div>

        <div className="wallet_balance_breakdown grid grid-cols-2 border-t border-stroke-light pt-4.5">
          <div className="wallet_breakdown_item flex flex-col items-center gap-2">
            <span className="wallet_breakdown_label inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-text-subtle">
              <Image src={coinIcon} alt="" width={18} height={18} />
              {t("withdrawableBalance")}
            </span>
            <Price
              amount={summary.withdrawable}
              size="md"
              className="wallet_amount inline-flex items-center gap-1.5 text-[1.15rem] font-extrabold text-text-primary"
            />
          </div>

          <div className="wallet_breakdown_item flex flex-col items-center gap-2 border-s border-stroke-light">
            <span className="wallet_breakdown_label inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-text-subtle">
              <Image src={balanceIcon} alt="" width={18} height={18} />
              {t("nonWithdrawableBalance")}
            </span>
            <Price
              amount={summary.nonWithdrawable}
              size="md"
              className="wallet_amount inline-flex items-center gap-1.5 text-[1.15rem] font-extrabold text-text-primary"
            />
          </div>
        </div>
      </div>

      <div className="wallet_history">
        <h3 className="wallet_history_title mb-3.5 text-base font-bold text-text-primary">
          {t("history")}
        </h3>

        {transactions.length === 0 ? (
          <EmptyState title={t("empty.history")} size="section" />
        ) : (
          <ul className="wallet_history_list m-0 flex list-none flex-col gap-2.5 p-0">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className={`wallet_history_item ${tx.type} flex items-center justify-between gap-3 rounded-md p-3.5 ${tx.type === "topup" ? "bg-primary-50" : tx.type === "payment" ? "bg-error-50" : "bg-success-50"}`}
              >
                <div className="wallet_history_item_body flex flex-col gap-1">
                  <span
                    className={`wallet_history_item_title text-[0.88rem] font-bold text-text-primary ${tx.type === "topup" ? "text-action-primary" : tx.type === "payment" ? "text-status-error" : "text-status-success"}`}
                  >
                    {t(`transaction.${tx.type}`)}
                  </span>
                  <span className="wallet_history_item_meta text-xs text-text-subtle">
                    {formatTransactionDate(tx.createdAt)}
                  </span>
                </div>

                <div className="wallet_history_item_side flex flex-col items-end gap-1">
                  <span className="wallet_history_item_amount text-[0.95rem] font-extrabold text-text-primary">
                    <Price
                      amount={tx.amount}
                      size="sm"
                      className="wallet_amount inline-flex items-center gap-1.5"
                    />
                  </span>
                  <span className="wallet_history_item_meta text-xs text-text-subtle">
                    #{tx.reference}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
