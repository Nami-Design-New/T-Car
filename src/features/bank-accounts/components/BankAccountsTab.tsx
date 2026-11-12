"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { BankAccount } from "../model";
import { BankCard } from "@/shared/ui/BankCard";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InfiniteList } from "@/shared/ui/InfiniteList";

import { ICONS } from "@/shared/config/assets";
import { Button } from "@/shared/ui/Button";
import BankAccountCardSkeleton from "./loading/BankAccountCardSkeleton";
const deleteIcon = ICONS.bankDelete;
const editIcon = ICONS.bankEdit;

interface Props {
  /** The loaded pages of accounts. */
  accounts: BankAccount[];
  loading: boolean;
  hasMore: boolean;
  /** Set when a page failed to load; the list shows it with a retry. */
  error?: unknown;
  onLoadMore: () => void;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
}

export default function BankAccountsTab({
  accounts,
  loading,
  hasMore,
  error,
  onLoadMore,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations("bankAccounts");

  return (
    <div className="border-stroke-light bg-surface-elevated flex flex-col gap-5 rounded-xl border p-6">
      <div className="flex items-center justify-end gap-3.5 max-md:gap-2.5">
        <Button type="button" className="" size="lg" onClick={onAdd}>
          {t("add")}
        </Button>
      </div>
      <InfiniteList
        loading={loading}
        hasMore={hasMore}
        isEmpty={accounts.length === 0}
        error={error}
        onLoadMore={onLoadMore}
        onRetry={onRetry}
      >
        <InfiniteList.Items className="flex flex-col gap-3">
          {accounts.map((account) => (
            <InfiniteList.Item key={account.id}>
              <BankCard variant="listed">
                <BankCard.Details>
                  <BankCard.Bank name={account.bankName} logo={account.logo} />
                  <BankCard.Number>{account.maskedNumber}</BankCard.Number>
                </BankCard.Details>
                <BankCard.Actions>
                  <BankCard.Action
                    label={t("edit", { bank: account.bankName })}
                    onClick={() => onEdit(account)}
                  >
                    <Image
                      src={editIcon}
                      className="size-5 max-w-none shrink-0"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </BankCard.Action>
                  <BankCard.Action
                    label={t("delete", { bank: account.bankName })}
                    onClick={() => onDelete(account)}
                  >
                    <Image
                      src={deleteIcon}
                      alt=""
                      className="size-5 max-w-none shrink-0"
                      width={20}
                      height={20}
                    />
                  </BankCard.Action>
                </BankCard.Actions>
              </BankCard>
            </InfiniteList.Item>
          ))}
        </InfiniteList.Items>
        <InfiniteList.Loading className="mt-3 flex flex-col gap-3 first:mt-0">
          <BankAccountCardSkeleton variant="listed" />
        </InfiniteList.Loading>
        <InfiniteList.Error />
        <InfiniteList.Empty>
          <EmptyState title={t("empty.title")} size="section" />
        </InfiniteList.Empty>
      </InfiniteList>
    </div>
  );
}
