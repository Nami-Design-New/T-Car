import {
  CarFilters,
  CarOfficeRow,
  SortBar,
  parseCarSearchParams,
} from "@/features/cars";
import { getCarBrands, getOfficeCarGroups } from "@/features/cars/queries";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { FiArrowLeft } from "react-icons/fi";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CarsPage({ searchParams }: Props) {
  const t = await getTranslations();
  const params = parseCarSearchParams(await searchParams);
  const [officeGroups, brands] = await Promise.all([
    getOfficeCarGroups(params),
    getCarBrands(),
  ]);

  return (
    <section className="section city-listings car-page mt-10 pt-0 max-md:mt-6">
      <div className="container-tcar">
        <header className="car-page__heading relative mb-10 flex max-w-[720px] items-center gap-4 max-md:mb-8">
          <Link
            href="/"
            className="car-page__back grid size-11 shrink-0 place-items-center rounded-md border border-stroke-light bg-surface-elevated text-xl text-text-primary shadow-[0_6px_18px_rgba(30,30,30,0.05)] transition hover:-translate-y-px hover:border-action-primary hover:bg-action-primary hover:text-text-on-action hover:shadow-[0_8px_20px_rgba(31,127,250,0.2)] focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-3 max-md:size-10"
            aria-label={t("notFound.home")}
          >
            <FiArrowLeft className="mirror-in-rtl" aria-hidden="true" />
          </Link>
          <h1 className="m-0 text-[clamp(1.5rem,2vw,3rem)] font-extrabold leading-[1.18] tracking-[-0.035em] text-text-primary max-md:text-[clamp(1.85rem,9vw,2.4rem)]">{t("carsPage.title")}</h1>
        </header>

        <div className="city-listings-grid grid grid-cols-[280px_1fr] items-start gap-8 max-lg:grid-cols-1">
          <CarFilters brands={brands} />
          <div className="office-rows flex min-w-0 flex-col gap-3">
            {/* <SortBar
              resultsCount={officeGroups.reduce((count, group) => count + group.cars.length, 0)}
              value={params.sort}
            /> */}
            {officeGroups.map(({ office, cars: officeCars }) => (
              <CarOfficeRow key={office.id} office={office} cars={officeCars} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
