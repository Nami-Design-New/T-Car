"use client";

import { useTranslations } from "next-intl";
import {
  CarFilters,
  type CarFilterDraft,
  type CityCarFilterOptions,
  type PriceRange,
} from "@/features/cars";
import { Drawer } from "@/shared/ui/Drawer";

interface Props {
  open: boolean;
  onClose: () => void;
  filterOptions: CityCarFilterOptions;
  priceRange: PriceRange;
  onApply: (filters: CarFilterDraft) => void;
}

export default function HeroFilterDrawer({
  open,
  onClose,
  filterOptions,
  priceRange,
  onApply,
}: Props) {
  const t = useTranslations("cars.filters");
  return (
    <Drawer
      open={open}
      onClose={onClose}
      label={t("title")}
      className="hero_filter_drawer"
    >
      <Drawer.Header className="items-end">
        <Drawer.Close label={t("close")} />
      </Drawer.Header>
      <Drawer.Body className="pb-0">
        <CarFilters
          brands={[]}
          cityOptions={filterOptions}
          priceRange={priceRange}
          onApply={onApply}
          embedded
        />
      </Drawer.Body>
    </Drawer>
  );
}
