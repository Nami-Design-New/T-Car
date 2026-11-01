"use client";

import * as Popover from "@radix-ui/react-popover";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { FiCheck, FiSearch } from "react-icons/fi";
import { PiBank } from "react-icons/pi";
import { ICONS } from "@/shared/config/assets";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { cn } from "@/shared/lib/cn";
import { fromActionResult } from "@/shared/lib/result";
import { InfiniteList } from "@/shared/ui/InfiniteList";
import { Skeleton } from "@/shared/ui/Skeleton";
import { getBanksAction } from "../actions";
import type { Bank } from "../model";

/** Wait after the last keystroke before searching the API. */
const SEARCH_DELAY_MS = 300;

interface Props {
  /** The selected bank's ID ("" for none). */
  value: string;
  onChange: (bankId: string) => void;
  /** Shown for `value` until the list has loaded it (e.g. an edited account's bank). */
  initialBank?: Bank;
  /** ID of the element that names the field. */
  labelId: string;
  invalid?: boolean;
  /** ID of the field's error message, when there is one. */
  errorId?: string;
}

function BankLogo({ bank }: { bank: Bank }) {
  return (
    <span className="bg-surface-on-background flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-sm">
      {bank.logo ? (
        <Image
          src={bank.logo}
          alt=""
          width={32}
          height={32}
          className="size-full object-contain"
        />
      ) : (
        <PiBank className="text-status-success text-lg" aria-hidden="true" />
      )}
    </span>
  );
}

/** One option's shape while banks load. */
function BankOptionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5" aria-hidden="true">
      <Skeleton shape="rect" width={32} height={32} />
      <Skeleton width="55%" />
    </div>
  );
}

/**
 * Bank field of the add / edit form: a combobox whose panel searches the banks
 * on the API (GET /banks, by title in the current language) and loads the next
 * page on scroll. The list is read when the panel opens. The panel is a Radix
 * popover in a portal: it floats over the sheet (no scrollbar on the sheet),
 * flips above the field near the bottom of the screen, and an outside click or
 * Escape closes only the panel.
 */
export default function BankSelect({
  value,
  onChange,
  initialBank,
  labelId,
  invalid = false,
  errorId,
}: Props) {
  const t = useTranslations("bankAccounts.form");
  const locale = useLocale();
  const listId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");

  const fetchBanks = useCallback(
    async (page: number) =>
      fromActionResult(await getBanksAction(page, term || undefined)),
    [term],
  );
  const banks = usePaginatedList(fetchBanks, {
    enabled: open,
    scope: "bankAccounts.banks",
  });
  const { refresh } = banks;

  // Search once typing pauses, then read page 1 of the new results.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const searchedTerm = useRef(term);
  useEffect(() => {
    if (searchedTerm.current === term) return;
    searchedTerm.current = term;
    if (open) refresh();
  }, [term, open, refresh]);

  const changeOpen = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch("");
      setTerm("");
    }
  }, []);

  const hasOptions = banks.items.length > 0;
  const selected =
    banks.items.find((bank) => bank.id === value) ??
    (initialBank?.id === value ? initialBank : undefined);

  return (
    <Popover.Root open={open} onOpenChange={changeOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          role="combobox"
          className={cn(
            "border-stroke-light bg-surface-on-background text-text-primary focus-visible:border-action-primary flex h-12.5 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm transition-colors outline-none",
            open && "border-action-primary",
            invalid && "border-status-error",
          )}
          aria-haspopup="listbox"
          aria-controls={open && hasOptions ? listId : undefined}
          aria-expanded={open}
          aria-labelledby={labelId}
          aria-required="true"
          aria-invalid={invalid}
          aria-describedby={errorId}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-3">
              <BankLogo bank={selected} />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-text-placeholder text-xs">
              {t("chooseBank")}
            </span>
          )}
          <Image
            src={ICONS.arrowDown}
            alt=""
            width={18}
            height={18}
            className={cn(
              "shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          aria-labelledby={labelId}
          dir={locale === "ar" ? "rtl" : "ltr"}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
          className="border-stroke-light bg-surface-elevated text-text-primary z-[10002] w-(--radix-popover-trigger-width) overflow-hidden rounded-md border shadow-[0_8px_24px_rgba(0,0,0,0.08)] outline-none"
        >
          <div className="border-stroke-light border-b p-2">
            <div className="relative">
              <FiSearch
                className="text-text-subtle pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-base"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchBank")}
                aria-label={t("searchBank")}
                aria-controls={hasOptions ? listId : undefined}
                autoComplete="off"
                className="border-stroke-light bg-surface-on-background text-text-primary placeholder:text-text-placeholder focus:border-action-primary h-10 w-full rounded-sm border ps-9 pe-3 text-sm transition-colors outline-none"
              />
            </div>
          </div>

          <div
            className="max-h-[min(15rem,calc(var(--radix-popover-content-available-height)-4rem))] touch-pan-y overflow-y-auto overscroll-contain p-1.5"
            // The sheet's scroll lock treats this body-level portal as outside
            // content and cancels its wheel and touch scrolling (as in
            // PhoneField): keep the events from the lock, and apply a wheel
            // movement it canceled anyway to the list itself.
            onWheel={(event) => {
              event.stopPropagation();
              if (event.defaultPrevented) {
                event.currentTarget.scrollTop += event.deltaY;
              }
            }}
            onTouchMove={(event) => event.stopPropagation()}
          >
            <InfiniteList
              loading={banks.loading}
              hasMore={banks.hasMore}
              isEmpty={banks.items.length === 0}
              error={banks.error ?? undefined}
              onLoadMore={banks.loadMore}
              onRetry={banks.retry}
            >
              {hasOptions && (
                <ul
                  id={listId}
                  role="listbox"
                  aria-labelledby={labelId}
                  className="m-0 flex list-none flex-col gap-0.5 p-0"
                >
                  {banks.items.map((bank) => {
                    const isSelected = bank.id === value;
                    return (
                      <li
                        key={bank.id}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <button
                          type="button"
                          className={cn(
                            "text-text-primary hover:bg-surface-on-background focus-visible:bg-surface-on-background flex w-full items-center gap-3 rounded-sm border-0 bg-transparent px-3 py-2.5 text-start text-sm transition-colors focus-visible:outline-none",
                            isSelected &&
                              "bg-surface-card-primary text-action-primary font-semibold",
                          )}
                          onClick={() => {
                            onChange(bank.id);
                            changeOpen(false);
                          }}
                        >
                          <BankLogo bank={bank} />
                          <span className="min-w-0 flex-1 truncate">
                            {bank.name}
                          </span>
                          {isSelected && (
                            <FiCheck
                              className="shrink-0 text-base"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <InfiniteList.Loading count={4}>
                <BankOptionSkeleton />
              </InfiniteList.Loading>
              <InfiniteList.Error />
              <InfiniteList.Empty>
                <p className="text-text-subtle m-0 px-3 py-6 text-center text-sm">
                  {term ? t("noBankResults") : t("noBanks")}
                </p>
              </InfiniteList.Empty>
            </InfiniteList>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
