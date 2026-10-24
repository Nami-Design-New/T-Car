"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiSearch, FiSliders, FiX } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-fade";

import { IMAGES } from "@/shared/config/assets";
const hero1 = IMAGES.heroOne;
const hero2 = IMAGES.heroTwo;
const hero3 = IMAGES.heroThree;

import {
  applyCarFilterDraft,
  CarFilters,
  type CarBrand,
  type CarFilterDraft,
} from "@/features/cars";
import type { LocationData } from "@/shared/lib/location";
import RentalTabs from "./RentalTabs";

const PickupTypeModal = dynamic(() => import("./PickupTypeModal"), {
  ssr: false,
});
const MapLocationModal = dynamic(
  () =>
    import("@/shared/ui/MapLocationModal").then(
      ({ MapLocationModal }) => MapLocationModal,
    ),
  { ssr: false },
);
const AirportModal = dynamic(() => import("./AirportModal"), { ssr: false });
const StationModal = dynamic(() => import("./StationModal"), { ssr: false });
const CountryModal = dynamic(() => import("./CountryModal"), { ssr: false });

import type {
  Airport,
  Country,
  RentalSearchOptions,
  RentalType,
  Station,
} from "../model";

interface Props {
  options: RentalSearchOptions;
  brands: CarBrand[];
}

const slides = [hero1, hero2, hero3];

export default function Hero({ options, brands }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [rentalType, setRentalType] = useState<RentalType | null>(null);
  // Pickup
  const [showPickupModal, setShowPickupModal] = useState(false);
  // Map
  const [showMapModal, setShowMapModal] = useState(false);

  // Airport
  const [showAirportModal, setShowAirportModal] = useState(false);
  // Station
  const [showStationModal, setShowStationModal] = useState(false);
  // Country (international)
  const [showCountryModal, setShowCountryModal] = useState(false);
  // Selected Data
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null,
  );
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const navigateToCars = (params: URLSearchParams) => {
    if (rentalType) params.set("type", rentalType);
    router.push(`/cars?${params.toString()}`);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const query = search.trim();
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

  useEffect(() => {
    if (!showFilters) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowFilters(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showFilters]);

  const goToCars = (params: Record<string, string | number>) => {
    if (!rentalType) return;
    const searchParams = new URLSearchParams({ type: rentalType });
    // Earlier steps of the flow: before, these were logged and then dropped.
    if (selectedAirport)
      searchParams.set("airportId", String(selectedAirport.id));
    if (selectedStation)
      searchParams.set("stationId", String(selectedStation.id));
    if (selectedCountry)
      searchParams.set("countryId", String(selectedCountry.id));

    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, String(value));
    });

    router.push(`/cars?${searchParams.toString()}`);
  };

  // ===========================
  // Rental Type
  // ===========================

  const handleRentalSelect = (type: RentalType) => {
    setRentalType(type);
    setSelectedLocation(null);
    setSelectedAirport(null);
    setSelectedStation(null);
    setSelectedCountry(null);

    switch (type) {
      case "daily":
      case "monthly":
        setShowPickupModal(true);
        break;

      case "international":
        setShowCountryModal(true);
        break;

      case "airport":
        setShowAirportModal(true);
        break;

      case "station":
        setShowStationModal(true);
        break;
    }
  };

  // ===========================
  // Pickup
  // ===========================

  const handlePickupSelect = () => {
    setShowPickupModal(false);
    setShowMapModal(true);
  };

  // ===========================
  // Airport
  // ===========================

  const handleAirportConfirm = (airport: Airport) => {
    setSelectedAirport(airport);
    setShowAirportModal(false);
    setShowMapModal(true);
  };

  // ===========================
  // Station
  // ===========================

  const handleStationConfirm = (station: Station) => {
    setSelectedStation(station);
    setShowStationModal(false);
    setShowMapModal(true);
  };

  // ===========================
  // Country (international)
  // ===========================

  const handleCountryConfirm = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
    // after choosing country, show pickup type modal
    setShowPickupModal(true);
  };

  // ===========================
  // Location
  // ===========================

  const handleLocationConfirm = (location: LocationData) => {
    setSelectedLocation(location);
    setShowMapModal(false);
    goToCars({
      lat: location.lat,
      lng: location.lng,
      address: location.address,
    });
  };

  return (
    <section
      className={cn(
        "hero_section relative isolate flex h-[clamp(640px,82vh,820px)] min-h-[clamp(640px,82vh,820px)] w-full items-center overflow-visible",
        showFilters && "has-filter-drawer z-1100",
      )}
    >
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        speed={1500}
        loop
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        className="hero_swiper absolute inset-0 z-0 h-full w-full [&_.swiper-slide]:h-full [&_.swiper-slide]:w-full [&_.swiper-wrapper]:h-full [&_.swiper-wrapper]:w-full"
      >
        {slides.map((image, index) => (
          <SwiperSlide key={image.src}>
            <div className="hero_slide relative h-full w-full bg-cover bg-center bg-no-repeat before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(30,30,30,0.62)_0%,rgba(30,30,30,0.16)_42%,rgba(30,30,30,0.58)_100%),linear-gradient(90deg,rgba(10,37,64,0.28),transparent_58%)] before:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%)] after:mix-blend-screen after:content-['']">
              <Image
                src={image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                style={{ objectFit: "cover", objectPosition: "center" }}
                className="animate-[hero-image-drift_14s_ease-in-out_infinite_alternate] motion-reduce:animate-none"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div
        className="hero_overlay pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(10,37,64,0.64)_0%,rgba(10,37,64,0.12)_38%,rgba(30,30,30,0.58)_100%),linear-gradient(90deg,rgba(10,37,64,0.38),transparent_58%)]"
        aria-hidden="true"
      />

      <div className="hero_content before:absolute before:start-0 before:top-1/2 before:h-px before:w-[clamp(28px,9vw,112px)] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7))] before:content-[''] after:absolute after:end-0 after:top-1/2 after:h-px after:w-[clamp(28px,9vw,112px)] after:rotate-180 after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7))] after:content-[''] absolute start-6 end-6 top-[clamp(108px,15vh,160px)] z-[2] mx-auto w-[calc(100%-48px)] max-w-[820px] text-center text-text-on-brand animate-[hero-content-in_0.85s_cubic-bezier(0.22,1,0.36,1)_both] [text-shadow:0_10px_30px_rgba(30,30,30,0.28)] motion-reduce:animate-none max-md:start-4 max-md:end-4 max-md:top-[82px] max-md:before:hidden max-md:after:hidden">
        <span className="hero_eyebrow inline-flex items-center gap-2.5 rounded-full border border-white/35 bg-white/10 px-[13px] py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/[0.92] backdrop-blur-[8px] max-md:text-[9px] max-md:tracking-[0.12em]">
          {t("rentalSearch.hero.eyebrow")}
        </span>
        <h1 className="mx-auto mb-3 mt-[18px] max-w-[760px] text-[clamp(2.2rem,5vw,4.8rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-shadow-[0_10px_30px_rgba(30,30,30,0.28)] max-md:mt-3.5 max-md:text-[clamp(2rem,10vw,3rem)]">
          {t("rentalSearch.hero.title")}
        </h1>
        <p className="mx-auto max-w-[560px] text-[clamp(1rem,1.7vw,1.3rem)] font-medium leading-[1.7] text-white/90 max-md:max-w-[300px] max-md:text-[0.95rem]">
          {t("rentalSearch.hero.subtitle")}
        </p>
      </div>

      <div className="hero_filter absolute bottom-[-76px] left-1/2 z-10 w-[min(1200px,calc(100%-32px))] -translate-x-1/2 animate-[hero-filter-in_0.8s_0.18s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none max-lg:bottom-[-64px] max-md:bottom-[-160px]">
        <form
          className="hero_search mx-auto mb-3.5 flex w-[min(760px,calc(100%-32px))] items-center gap-2.5 rounded-2xl border border-white/[0.74] bg-surface-elevated/[0.94] p-2 shadow-[0_24px_55px_rgba(30,30,30,0.24)] backdrop-blur-[14px] max-sm:w-[calc(100%-16px)]"
          onSubmit={handleSearch}
        >
          <div className="hero_search_field relative flex-1">
            <FiSearch
              className="pointer-events-none absolute start-[17px] top-1/2 -translate-y-1/2 text-action-primary"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("cars.filters.searchPlaceholder")}
              aria-label={t("cars.filters.searchPlaceholder")}
              className="h-[52px] w-full rounded-xl border border-stroke-light bg-surface-on-background px-12 text-text-primary outline-none focus:border-action-primary focus:ring-4 focus:ring-action-primary/15"
            />
          </div>
          <button
            type="submit"
            className="hero_search_submit inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border-0 bg-action-primary px-[22px] font-bold text-text-on-action transition duration-200 hover:-translate-y-0.5 max-sm:w-[52px] max-sm:px-0"
          >
            <FiSearch aria-hidden="true" />
            <span className="max-sm:hidden">{t("search.submit")}</span>
          </button>
          <button
            type="button"
            className="hero_filter_toggle inline-flex size-[52px] items-center justify-center rounded-xl border-0 bg-surface-card-primary text-[21px] text-action-primary transition duration-200 hover:-translate-y-0.5"
            onClick={() => setShowFilters(true)}
            aria-label={t("cars.filters.open")}
            title={t("cars.filters.open")}
          >
            <FiSliders aria-hidden="true" />
          </button>
        </form>
        <RentalTabs onSelect={handleRentalSelect} />
      </div>
      {showFilters && (
        <>
          <button
            type="button"
            className="hero_filter_drawer_backdrop fixed inset-0 z-[1099] cursor-default border-0 bg-black/[0.42] backdrop-blur-[4px] animate-[hero-drawer-fade-in_0.24s_ease-out] motion-reduce:animate-none"
            onClick={() => setShowFilters(false)}
            aria-label={t("cars.filters.close")}
          />
          <aside
            className="hero_filter_drawer fixed bottom-0 end-0 top-0 z-[1100] flex w-[min(440px,100vw)] flex-col bg-surface-elevated shadow-[-18px_0_48px_rgba(30,30,30,0.2)] animate-[hero-drawer-slide-in_0.28s_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none rtl:shadow-[18px_0_48px_rgba(30,30,30,0.2)] rtl:animate-[hero-drawer-slide-in-rtl_0.28s_cubic-bezier(0.22,1,0.36,1)]"
            aria-label={t("cars.filters.title")}
            aria-modal="true"
            role="dialog"
          >
            <header className="hero_filter_drawer_header flex items-end justify-between gap-4 border-b border-stroke-light px-6 pb-5 pt-8">
              <button
                type="button"
                className="hero_filter_drawer_close grid size-[38px] place-items-center rounded-full border border-stroke-light bg-surface-on-background text-[19px] text-text-primary transition hover:border-action-primary hover:text-action-primary"
                onClick={() => setShowFilters(false)}
                aria-label={t("cars.filters.close")}
              >
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className="hero_filter_drawer_body min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <CarFilters brands={brands} onApply={handleFiltersApply} />
            </div>
          </aside>
        </>
      )}

      {/* Pickup */}

      <CountryModal
        open={showCountryModal}
        countries={options.countries}
        onClose={() => setShowCountryModal(false)}
        onSelect={handleCountryConfirm}
      />

      <PickupTypeModal
        open={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        onSelect={handlePickupSelect}
      />

      {/* Airport */}

      <AirportModal
        open={showAirportModal}
        airports={options.airports}
        onClose={() => setShowAirportModal(false)}
        onSelect={handleAirportConfirm}
      />

      {/* Station */}

      <StationModal
        open={showStationModal}
        stations={options.stations}
        onClose={() => setShowStationModal(false)}
        onSelect={handleStationConfirm}
      />

      {/* Map */}

      {showMapModal && (
        <MapLocationModal
          open
          onClose={() => setShowMapModal(false)}
          onConfirm={handleLocationConfirm}
        />
      )}
    </section>
  );
}
