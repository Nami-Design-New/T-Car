import { useTranslations } from "next-intl";
import type { City } from "../model";

interface Props {
  city: City;
}

/** Localized title and supporting copy over the city hero image. */
export default function CityHeroContent({ city }: Props) {
  const t = useTranslations("cities.hero");

  return (
    <div className="relative z-2 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center px-4 text-start max-lg:text-center">
      <h1 className="text-text-on-brand mb-3 text-5xl font-extrabold max-lg:text-[2rem]">
        {t("title", { city: city.name })}
      </h1>
      <p className="text-text-on-brand/0.85 leading-[1.8]">
        {t("description")}
      </p>
    </div>
  );
}
