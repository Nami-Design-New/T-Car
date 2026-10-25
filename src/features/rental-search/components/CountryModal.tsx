"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FiSearch } from "react-icons/fi";
import { Dialog } from "@/shared/ui/Dialog";
import type { Country } from "../model";
import { FormInput } from "@/shared/ui/Form/FormInput";
import { Button } from "@/shared/ui/Button/Button";
import { CgRadioCheck } from "react-icons/cg";

interface Props {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  onSelect: (country: Country) => void;
}

export default function CountryModal({
  open,
  countries,
  onClose,
  onSelect,
}: Props) {
  const t = useTranslations("rentalSearch.country");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase()),
  );

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
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="mt-4 flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
          {filtered.map((country) => (
            <button
              key={country.id}
              type="button"
              className={`flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-start transition hover:border-action-primary ${selected?.id === country.id ? "border-action-primary bg-surface-card-primary" : "border-stroke-light bg-surface-elevated"}`}
              data-selected={selected?.id === country.id || undefined}
              aria-pressed={selected?.id === country.id}
              onClick={() => setSelected(country)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="shrink-0 overflow-hidden rounded">
                  <Image src={country.flag} alt="" width={30} height={20} />
                </div>
                <h4 className="m-0">{country.name}</h4>
              </div>

              <div
                className={`flex size-6 shrink-0 items-center justify-center text-xl ${selected?.id === country.id ? "text-action-primary" : "text-neutral-400"}`}
              >
                <CgRadioCheck />
              </div>
            </button>
          ))}
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
