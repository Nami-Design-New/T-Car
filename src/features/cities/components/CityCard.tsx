import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FiArrowRight, FiMapPin } from "react-icons/fi";
import type { City } from "../model";

interface Props {
  city: City;
}

export default function CityCard({ city }: Props) {
  const t = useTranslations();

  return (
    <Link
      href={`/cities/${city.id}`}
      className="group relative block h-65 w-[320px] shrink-0 snap-start overflow-hidden rounded-md no-underline max-md:h-55 max-md:w-[78vw]"
    >
      <Image
        src={city.image}
        alt={city.name}
        fill
        sizes="(max-width:768px) 80vw,320px"
        className="object-cover transition-transform duration-600 group-hover:scale-[1.08]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(30,30,30,0.75)_0%,rgba(30,30,30,0.25)_55%,rgba(30,30,30,0)_100%)]" />
      <span className="bg-text-on-brand/15 text-text-on-brand absolute inset-s-4 top-4 z-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold backdrop-blur-[10px]">
        <FiMapPin aria-hidden="true" />
        {city.carsAvailable} {t("popularCities.carsAvailable")}
      </span>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-5.5">
        <h3 className="text-text-on-brand m-0 text-[1.35rem] font-bold">
          {city.name}
        </h3>
        <span className="text-text-on-brand inline-flex items-center gap-1.5 text-[0.95rem] font-semibold">
          {t("popularCities.explore")}
          <FiArrowRight className="transition-[margin-inline-end] duration-300 group-hover:me-1.25 rtl:scale-x-[-1]" />
        </span>
      </div>
    </Link>
  );
}
