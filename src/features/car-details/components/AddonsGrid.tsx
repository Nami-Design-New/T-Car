"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { formatCurrency } from "@/shared/lib/format";
import type { AddonService } from "../model";
import { cn } from "@/shared/lib/cn";

const ICONS = {
  driver: "/icons/driver.svg",
  travel: "/icons/travel-abroad.svg",
  shield: "/icons/shield-checked.svg",
  default: "/icons/shield-checked.svg",
} as const;

interface Props {
  addons: AddonService[];
  onChange?: (selectedIds: string[]) => void;
}

export default function AddonsGrid({ addons, onChange }: Props) {
  const t = useTranslations("carDetails");
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    setSelected(next);
    onChange?.(next);
  };

  return (
    <section className="details-section border-stroke-light mt-8 border-t pt-6">
      <h3 className="text-text-primary mb-4.5 text-[1.15rem] font-bold">
        {t("addons")}
      </h3>

      <div className="addons-grid grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3.5">
        {addons.map((addon) => {
          const icon = ICONS[addon.icon];
          const isSelected = selected.includes(addon.id);

          return (
            <button
              key={addon.id}
              type="button"
              className={cn(
                "addon-card border-stroke-light bg-surface-elevated hover:border-action-primary flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-3 py-5 transition duration-200",
                isSelected &&
                  "selected border-action-primary bg-surface-card-primary",
              )}
              onClick={() => toggle(addon.id)}
            >
              <Image
                src={icon}
                alt=""
                width={28}
                height={28}
                className="addon-card-icon size-7"
              />
              <span className="addon-card-title text-text-primary text-[0.85rem] font-semibold">
                {addon.title}
              </span>
              <span className="addon-card-price text-action-primary text-[0.8rem] font-bold">
                {formatCurrency(addon.price)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
