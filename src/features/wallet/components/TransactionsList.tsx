"use client";

import type { WalletTransaction } from "../model";
import { Price } from "@/shared/ui/Price";
import { formatTransactionDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { useTranslations } from "next-intl";

interface Props {
  transactions: WalletTransaction[];
}

export default function TransactionsList({ transactions }: Props) {
  const t = useTranslations("wallet");
  console.log(transactions);
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {transactions.map((tx) => (
        <li
          key={tx.id}
          className={cn(
            "flex items-center justify-between gap-3 rounded-md p-3.5",
            tx.type === "topup" && "bg-primary-100",
            tx.type === "payment" && "bg-error-50",
            tx.type === "withdrawal" && "bg-success-50",
            tx.type === "refund" && "bg-white",
          )}
        >
          <div className="flex flex-col gap-1">
            <span>
              <Price
                amount={tx.amount}
                size="sm"
                className="inline-flex items-center gap-1.5"
                amountClassName={cn(
                  "text-base font-normal",
                  tx.type === "topup"
                    ? "text-action-primary"
                    : tx.type === "payment"
                      ? "text-status-error"
                      : "text-text-primary",
                )}
              />
            </span>
            <span className="text-text-subtle text-xs">
              {formatTransactionDate(tx.createdAt)}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={cn(
                "text-base font-normal",
                tx.type === "topup" && "text-action-primary",
                tx.type === "payment" && "text-status-error",
                tx.type === "withdrawal" && "text-status-success",
                tx.type === "refund" && "text-text-primary",
              )}
            >
              {t(`transaction.${tx.type}`)}
            </span>
            <span className="text-text-subtle text-xs">#{tx.id}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
