import Image from "next/image";
import type { City } from "../model";
import CityHeroContent from "./CityHeroContent";
import CityHeroFilter from "./CityHeroFilter";

interface Props {
  city: City;
}

export default function CityHero({ city }: Props) {
  return (
    <>
      <div className="relative h-112.5 overflow-hidden rounded-b-[32px]">
        <Image
          src={city.image}
          alt={city.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(30,30,30,0.15)_0%,rgba(30,30,30,0.65)_55%,rgba(30,30,30,0.85)_100%)]" />
        <CityHeroContent city={city} />
      </div>
      <CityHeroFilter />
    </>
  );
}
