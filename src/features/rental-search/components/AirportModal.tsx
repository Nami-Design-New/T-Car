"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import { FormInput } from "@/shared/ui/Form/FormInput";
import { FiSearch } from "react-icons/fi";
import { CgRadioCheck } from "react-icons/cg";
import type { Airport } from "../model";

interface Props {
  open: boolean;
  onClose: () => void;
  airports: Airport[];
  onSelect: (airport: Airport) => void;
}

export default function AirportModal({
  open,
  airports,
  onClose,
  onSelect,
}: Props) {
  const t = useTranslations("rentalSearch.airport");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Airport | null>(null);

  const filtered = airports.filter((item) =>
    `${item.city} ${item.airport}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onClose={onClose} size="lg" className="selection_modal">
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

        <div className="selection_list">
          {filtered.map((airport) => (
            <button
              key={airport.id}
              type="button"
              className={`selection_item ${selected?.id === airport.id ? "active" : ""}`}
              onClick={() => setSelected(airport)}
            >
              <div className="content">
                <h4>{airport.airport}</h4>
                <p>{airport.city}</p>
              </div>

              <div className="icon">
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
