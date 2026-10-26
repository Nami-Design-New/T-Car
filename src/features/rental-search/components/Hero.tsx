"use client";

import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  applyCarFilterDraft,
  type CarBrand,
  type CarFilterDraft,
} from "@/features/cars";
import { useRentalFlow } from "../hooks/useRentalFlow";
import type { RentalSearchOptions } from "../model";
import HeroBackground from "./HeroBackground";
import HeroFilterDrawer from "./HeroFilterDrawer";
import HeroHeader from "./HeroHeader";
import HeroSearchBar from "./HeroSearchBar";
import RentalFlowModals from "./RentalFlowModals";
import RentalTabs from "./RentalTabs";

interface Props {
  options: RentalSearchOptions;
  brands: CarBrand[];
}

export default function Hero({ options, brands }: Props) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const flow = useRentalFlow({
    onComplete: (params) => router.push(`/cars?${params.toString()}`),
  });

  const navigateToCars = (params: URLSearchParams) => {
    if (flow.rentalType) params.set("type", flow.rentalType);
    router.push(`/cars?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    navigateToCars(params);
  };

  const handleFiltersApply = (filters: CarFilterDraft) => {
    const params = applyCarFilterDraft(
      new URLSearchParams(currentSearchParams.toString()),
      filters,
    );
    setShowFilters(false);
    navigateToCars(params);
  };

  return (
    <section className="hero_section relative isolate flex h-[clamp(640px,82vh,820px)] min-h-[clamp(640px,82vh,820px)] w-full items-center overflow-visible max-md:h-auto max-md:min-h-0 max-md:flex-col max-md:items-stretch max-md:gap-6 max-md:pb-6 max-md:pt-10">
      <HeroBackground />
      <HeroHeader />
      <div className="hero_filter absolute -bottom-12 left-1/2 z-10 w-[min(1200px,calc(100%-32px))] -translate-x-1/2 animate-[hero-filter-in_0.8s_0.18s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none max-lg:bottom-[-64px] max-md:relative max-md:inset-auto max-md:mx-4 max-md:w-auto max-md:translate-x-0">
        <HeroSearchBar
          onSearch={handleSearch}
          onOpenFilters={() => setShowFilters(true)}
        />
        <RentalTabs onSelect={flow.start} />
      </div>
      <HeroFilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        brands={brands}
        onApply={handleFiltersApply}
      />

      <RentalFlowModals flow={flow} options={options} />
    </section>
  );
}
