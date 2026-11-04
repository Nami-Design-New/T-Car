"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CgRadioCheck } from "react-icons/cg";
import { FiSearch } from "react-icons/fi";
import { getCountryPage } from "../client/lookup.client";
import type { Country } from "../model";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import type { Page } from "@/shared/lib/pagination";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FormInput } from "@/shared/ui/Form/FormInput";
import { InfiniteList } from "@/shared/ui/InfiniteList";
import { Skeleton } from "@/shared/ui/Skeleton";

const SEARCH_DELAY_MS = 300;

interface Props {
  open: boolean;
  onClose: () => void;
  countries: Page<Country>;
  onSelect: (country: Country) => void;
}

export default function CountryModal({
  open,
  countries,
  onClose,
  onSelect,
}: Props) {
  const t = useTranslations("rentalSearch.country");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fetchPage = useCallback(
    (page: number) => getCountryPage(page, term, locale),
    [locale, term],
  );
  const countriesList = usePaginatedList(fetchPage, {
    enabled: open,
    initialPage: countries,
    scope: "rentalSearch.countries",
  });
  const { refresh } = countriesList;
  const previousTerm = useRef(term);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (previousTerm.current === term) return;
    previousTerm.current = term;
    if (open) refresh();
  }, [open, refresh, term]);
  useEffect(() => {
    if (!open) {
      setSearch("");
      setTerm("");
      setSelected(null);
    }
  }, [open]);
  return (
    <Dialog open={open} onClose={onClose} initialFocusRef={searchRef}>
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <FormInput
          ref={searchRef}
          icon={<FiSearch />}
          id="country-search"
          type="search"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="mt-4 max-h-[55vh] scrollbar-none! overflow-y-auto">
          <InfiniteList
            loading={countriesList.loading}
            hasMore={countriesList.hasMore}
            isEmpty={countriesList.items.length === 0}
            error={countriesList.error ?? undefined}
            onLoadMore={countriesList.loadMore}
            onRetry={countriesList.retry}
            className="flex flex-col gap-2"
          >
            <InfiniteList.Items className="flex scrollbar-none flex-col gap-2">
              {countriesList.items.map((country) => (
                <InfiniteList.Item key={country.id}>
                  <button
                    type="button"
                    className={`hover:border-action-primary flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-start transition ${selected?.id === country.id ? "border-action-primary bg-surface-card-primary" : "border-stroke-light bg-surface-elevated"}`}
                    data-selected={selected?.id === country.id || undefined}
                    aria-pressed={selected?.id === country.id}
                    onClick={() => setSelected(country)}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="shrink-0 overflow-hidden rounded">
                        <Image
                          src={country.flag}
                          alt=""
                          width={30}
                          height={20}
                        />
                      </div>
                      <h4 className="m-0">{country.name}</h4>
                    </div>
                    <div
                      className={`flex size-6 shrink-0 items-center justify-center text-xl ${selected?.id === country.id ? "text-action-primary" : "text-neutral-400"}`}
                    >
                      <CgRadioCheck />
                    </div>
                  </button>
                </InfiniteList.Item>
              ))}
            </InfiniteList.Items>
            <InfiniteList.Loading className="flex flex-col gap-2">
              <Skeleton shape="rect" height={64} className="rounded-lg" />
            </InfiniteList.Loading>
            <InfiniteList.Error />
            <InfiniteList.Empty>
              <p className="text-text-subtle py-6 text-center text-sm">
                {t("empty")}
              </p>
            </InfiniteList.Empty>
          </InfiniteList>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button
          type="button"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          {t("confirm")}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
