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
          {filtered.map((station) => (
            <button
              key={station.id}
              type="button"
              className={`selection_item ${selected?.id === station.id ? "active" : ""}`}
              onClick={() => setSelected(station)}
            >
              {" "}
              <div className="content">
                <h4>{station.station}</h4>
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
