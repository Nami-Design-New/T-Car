"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { PiBank } from "react-icons/pi";
import type { BankAccount } from "../model";
import { Loader } from "@/shared/ui/Loader";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";

import { ICONS } from "@/shared/config/assets";
import { Button } from "@/shared/ui/Button";
const deleteIcon = ICONS.bankDelete;
const editIcon = ICONS.bankEdit;

interface Props {
  accounts: BankAccount[];
  loading?: boolean;
  /** Set when the accounts failed to load; ErrorState picks the message. */
  error?: unknown;
  onRetry?: () => void;
  onAdd: () => void;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
}

export default function BankAccountsTab({
  accounts,
  loading = false,
  error,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations("bankAccounts");
  if (loading) {
    return (
      <div className="rounded-xl border border-stroke-light bg-surface-elevated p-6">
        <Loader fullScreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className=" flex flex-col gap-5 rounded-xl border border-stroke-light bg-surface-elevated p-6">
        <h3 className=" m-0 text-base font-semibold leading-5.75 text-text-primary">
          {t("title")}
        </h3>
        <ErrorState error={error} onRetry={onRetry} size="section" />
      </div>
    );
  }

  return (
    <div className=" flex flex-col gap-5 rounded-xl border border-stroke-light bg-surface-elevated p-6">
      <h3 className=" m-0 text-base font-semibold leading-5.75 text-text-primary">
        {t("title")}
      </h3>

      {accounts.length === 0 ? (
        <EmptyState title={t("title")} size="section" />
      ) : (
        <ul className=" m-0 flex list-none flex-col gap-3 p-0">
          {accounts.map((account) => (
            <li
              key={account.id}
              className=" flex  items-center gap-3 rounded-md border border-dashed border-stroke-light bg-surface-on-background p-4"
            >
              <div className=" flex min-w-0 flex-1 flex-col items-start gap-3">
                <div className=" flex items-center gap-2 text-xs font-semibold leading-4.25 text-text-primary">
                  {account.logo ? (
                    <Image
                      src={account.logo}
                      alt=""
                      width={45}
                      height={20}
                      className="bank_account_logo object-cover"
                    />
                  ) : (
                    <PiBank
                      className=" text-xl text-status-success"
                      aria-hidden="true"
                    />
                  )}
                  <span>{account.bankName}</span>
                </div>
                <span
                  className=" text-base leading-5.75 text-text-primary"
                  dir="ltr"
                >
                  {account.maskedNumber}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="grid size-7 shrink-0 place-items-center rounded-md border-0 bg-surface-background p-0 transition-shadow hover:shadow-[0_0_0_1px_var(--color-stroke-light)] focus-visible:shadow-[0_0_0_1px_var(--color-stroke-light)] focus-visible:outline-none"
                  onClick={() => onEdit(account)}
                  aria-label={t("edit", { bank: account.bankName })}
                >
                  <Image
                    src={editIcon}
                    className="size-5 max-w-none shrink-0"
                    alt=""
                    width={20}
                    height={20}
                  />
                </button>
                <button
                  type="button"
                  className="grid size-7 shrink-0 place-items-center rounded-md border-0 bg-surface-background p-0 transition-shadow hover:shadow-[0_0_0_1px_var(--color-stroke-light)] focus-visible:shadow-[0_0_0_1px_var(--color-stroke-light)] focus-visible:outline-none"
                  onClick={() => onDelete(account)}
                  aria-label={t("delete", { bank: account.bankName })}
                >
                  <Image
                    src={deleteIcon}
                    alt=""
                    className="size-5 max-w-none shrink-0"
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" className=" w-full" size="lg" onClick={onAdd}>
        {t("add")}
      </Button>
    </div>
  );
}
