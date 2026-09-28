import type { StaticImageData } from 'next/image';

export type RentalType = 'daily' | 'monthly' | 'airport' | 'station' | 'international';

export type PickupType = 'delivery' | 'branch';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

export interface Branch {
  id: number;
  city: string;
  branch: string;
  address: string;
}

export interface Airport {
  id: number;
  city: string;
  airport: string;
  code: string;
}

export interface Station {
  id: number;
  city: string;
  station: string;
}

/** For international rentals. */
export interface Country {
  id: number;
  code?: string;
  name: string;
  flag: string | StaticImageData;
}

/** The choices the search dialogs offer, loaded once for the hero. */
export interface RentalSearchOptions {
  branches: Branch[];
  airports: Airport[];
  stations: Station[];
  countries: Country[];
}
