"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CgRadioCheck } from "react-icons/cg";
import { FiSearch } from "react-icons/fi";
import { getAirportPage } from "../client/lookup.client";
import type { Airport } from "../model";
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
  airports: Page<Airport>;
  onSelect: (airport: Airport) => void;
}

export default function AirportModal({
  open,
  airports,
  onClose,
  onSelect,
}: Props) {
  const t = useTranslations("rentalSearch.airport");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Airport | null>(null);
  const fetchPage = useCallback(
    (page: number) => getAirportPage(page, term, locale),
    [locale, term],
  );
  const airportsList = usePaginatedList(fetchPage, {
    enabled: open,
    initialPage: airports,
    scope: "rentalSearch.airports",
  });
  const { refresh } = airportsList;
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
    <Dialog open={open} onClose={onClose} size="lg">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <FormInput
          icon={<FiSearch />}
          type="search"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="mt-4 max-h-[55vh] scrollbar-none! overflow-y-auto">
          <InfiniteList
            loading={airportsList.loading}
            hasMore={airportsList.hasMore}
            isEmpty={airportsList.items.length === 0}
            error={airportsList.error ?? undefined}
            onLoadMore={airportsList.loadMore}
            onRetry={airportsList.retry}
            className="flex flex-col gap-2"
          >
            <InfiniteList.Items className="flex flex-col gap-2">
              {airportsList.items.map((airport) => (
                <InfiniteList.Item key={airport.id}>
                  <button
                    type="button"
                    className={`hover:border-action-primary flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-start transition ${selected?.id === airport.id ? "border-action-primary bg-surface-card-primary" : "border-stroke-light bg-surface-elevated"}`}
                    onClick={() => setSelected(airport)}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-text-primary m-0 font-semibold">
                        {airport.airport}
                      </h4>
                      <p className="text-text-subtle m-0 mt-1 text-sm">
                        {airport.city}
                      </p>
                    </div>
                    <div
                      className={`flex size-6 shrink-0 items-center justify-center text-xl ${selected?.id === airport.id ? "text-action-primary" : "text-neutral-400"}`}
                    >
                      <CgRadioCheck />
                    </div>
                  </button>
                </InfiniteList.Item>
              ))}
            </InfiniteList.Items>
            <InfiniteList.Loading className="flex flex-col gap-2">
              <Skeleton shape="rect" height={64} className="mb-2 rounded-lg" />
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
          variant="primary"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          {t("confirm")}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
