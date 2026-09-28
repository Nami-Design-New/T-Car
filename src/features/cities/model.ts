import type { StaticImageData } from 'next/image';

export interface City {
  id: string;
  name: string;
  slug: string;
  image: string | StaticImageData;
  carsAvailable: number;
}

export interface CityDetails {
  id: string;
  name: string;
  slug: string;
  heroImage: string | StaticImageData;
  carsCount: number;
}
