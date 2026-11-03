export interface City {
  id: string;
  name: string;
  /** The `/city-cars` key: Arabic in both locales, sent as returned. */
  region: string;
  /** The API image, or the shared fallback. */
  image: string;
  carsAvailable: number;
}
