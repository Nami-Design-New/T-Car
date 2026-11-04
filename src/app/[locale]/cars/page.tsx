import {
  CarFilters,
  parseCarSearchParams,
  toCarsListingQuery,
  type CarsListingSource,
} from "@/features/cars";
import { getCityCarFilterOptions } from "@/features/cars/queries";
import { getRentalSearchOptions } from "@/features/rental-search/queries";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getSiteSettings } from "@/features/settings/queries";
import { FiArrowLeft } from "react-icons/fi";
import CarsListingSection from "./CarsListingSection";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CarsPage({ searchParams }: Props) {
  const [t, rawParams, site] = await Promise.all([
    getTranslations(),
    searchParams,
    getSiteSettings(),
  ]);
  const priceRange = site.priceFilterRange;
  const params = parseCarSearchParams(rawParams, priceRange);
  const source = Array.isArray(rawParams.source)
    ? rawParams.source[0]
    : rawParams.source;
  const listingSource: CarsListingSource =
    source === "offers"
      ? "offer"
      : source === "careful_chooses"
        ? "careful_chooses"
        : "general";
  const title = t(
    source === "offers" ? "carSections.offers" : "carsPage.title",
  );
  const [filterOptions, options] = await Promise.all([
    getCityCarFilterOptions(),
    getRentalSearchOptions(),
  ]);

  return (
    <section className="mt-10 pt-0 pb-20 max-md:mt-6 max-md:pb-12">
      <div className="mx-auto w-full max-w-7xl px-2">
        <header className="car-page__heading relative mb-10 flex max-w-180 items-center gap-4 max-md:mb-8">
          <Link
            href="/"
            className="car-page__back border-stroke-light bg-surface-elevated text-text-primary hover:border-action-primary hover:bg-action-primary hover:text-text-on-action focus-visible:outline-action-primary/20 grid size-11 shrink-0 place-items-center rounded-md border text-xl shadow-[0_6px_18px_rgba(30,30,30,0.05)] transition hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(31,127,250,0.2)] focus-visible:outline-3 focus-visible:outline-offset-3 max-md:size-10"
            aria-label={t("notFound.home")}
          >
            <FiArrowLeft className="rtl:scale-x-[-1]" aria-hidden="true" />
          </Link>
          <h1 className="text-text-primary m-0 text-[clamp(1.5rem,2vw,3rem)] leading-[1.18] font-extrabold tracking-[-0.035em] max-md:text-[clamp(1.85rem,9vw,2.4rem)]">
            {title}
          </h1>
        </header>

        <div className="city-listings-grid grid grid-cols-[320px_1fr] items-start gap-8 max-lg:grid-cols-1">
          <CarFilters
            brands={[]}
            cityOptions={filterOptions}
            priceRange={priceRange}
          />
          <div className="office-rows flex min-w-0 flex-col gap-3">
            {/* <SortBar
              resultsCount={officeGroups.reduce((count, group) => count + group.cars.length, 0)}
              value={params.sort}
            /> */}
            <CarsListingSection
              query={toCarsListingQuery(params, listingSource)}
              options={options}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
