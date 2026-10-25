"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import { FormInput } from "@/shared/ui/Form/FormInput";
import type { Station } from "../model";

import { FiSearch } from "react-icons/fi";
import { CgRadioCheck } from "react-icons/cg";

interface Props {
  open: boolean;
  onClose: () => void;
  stations: Station[];
  onSelect: (station: Station) => void;
}

export default function StationModal({
  open,
  stations,
  onClose,
  onSelect,
}: Props) {
  const t = useTranslations("rentalSearch.station");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Station | null>(null);
  const filtered = stations.filter((item) =>
    `${item.city} ${item.station}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <FormInput
          icon={<FiSearch />}
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="mt-4 flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
          {filtered.map((station) => (
            <button
              key={station.id}
              type="button"
              className={`flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-start transition hover:border-action-primary ${selected?.id === station.id ? "border-action-primary bg-surface-card-primary" : "border-stroke-light bg-surface-elevated"}`}
              onClick={() => setSelected(station)}
            >
              {" "}
              <div className="min-w-0 flex-1">
                <h4 className="m-0 font-semibold text-text-primary">
                  {station.station}
                </h4>
              </div>
              <div
                className={`flex size-6 shrink-0 items-center justify-center text-xl ${selected?.id === station.id ? "text-action-primary" : "text-neutral-400"}`}
              >
                <CgRadioCheck />
              </div>
            </button>
          ))}
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
