import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import { PopularCities } from "@/features/cities";
import { getCities } from "@/features/cities/queries";
export const metadata: Metadata = {};
export default async function CitiesPage() {
  const cities = await getCities();
  const t = await getTranslations("citiesPage");
  return (
    <section className="py-20 max-md:py-12">
      <div className="mx-auto w-full max-w-7xl px-2">
        <SectionTitle title={t("title")} subtitle={t("subtitle")} />
        <PopularCities cities={cities} />
      </div>
    </section>
  );
}
