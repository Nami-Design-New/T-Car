export type RentalType =
  "daily" | "monthly" | "airport" | "station" | "international";

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
  flag: string;
}

/** The choices the search dialogs offer, loaded once for the hero. */
export interface RentalSearchOptions {
  airports: Airport[];
  stations: Station[];
  countries: Country[];
}
