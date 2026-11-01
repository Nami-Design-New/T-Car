"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { fromActionResult } from "@/shared/lib/result";
import { BankCard } from "@/shared/ui/BankCard";
import { Dialog } from "@/shared/ui/Dialog";
import { InfiniteList } from "@/shared/ui/InfiniteList";
import { getBankAccountsAction } from "../actions";
import type { BankAccount } from "../model";
import BankAccountCardSkeleton from "./loading/BankAccountCardSkeleton";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (account: BankAccount) => void;
}

/**
 * Picks one of the customer's bank accounts (e.g. for a withdrawal). The
 * accounts are read page by page from the API each time the picker opens.
 */
export default function BankAccountPicker({ open, onClose, onSelect }: Props) {
  const t = useTranslations("wallet.bankSelect");
  const fetchPage = useCallback(
    async (page: number) => fromActionResult(await getBankAccountsAction(page)),
    [],
  );
  const accounts = usePaginatedList(fetchPage, {
    enabled: open,
    scope: "bankAccounts.picker",
  });

  return (
    <Dialog open={open} onClose={onClose} placement="center" size="md">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body>
        <InfiniteList
          loading={accounts.loading}
          hasMore={accounts.hasMore}
          isEmpty={accounts.items.length === 0}
          error={accounts.error ?? undefined}
          onLoadMore={accounts.loadMore}
          onRetry={accounts.retry}
        >
          <InfiniteList.Items className="flex flex-col gap-2.5">
            {accounts.items.map((account) => (
              <InfiniteList.Item key={account.id}>
                <BankCard variant="option" onSelect={() => onSelect(account)}>
                  <BankCard.Details>
                    <BankCard.Bank
                      name={account.bankName}
                      logo={account.logo}
                    />
                    <BankCard.Number>{account.maskedNumber}</BankCard.Number>
                  </BankCard.Details>
                </BankCard>
              </InfiniteList.Item>
            ))}
          </InfiniteList.Items>
          <InfiniteList.Loading className="mt-2.5 flex flex-col gap-2.5 first:mt-0">
            <BankAccountCardSkeleton variant="option" />
          </InfiniteList.Loading>
          <InfiniteList.Error />
          <InfiniteList.Empty>
            <p className="text-text-subtle my-3 text-center text-[13px]">
              {t("empty")}
            </p>
          </InfiniteList.Empty>
        </InfiniteList>
      </Dialog.Body>
    </Dialog>
  );
}
