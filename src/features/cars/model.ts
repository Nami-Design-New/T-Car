export interface Car {
  id: string;
  name: string;
  brand: string;
  image: string;
  pricePerDay: number;
  seats: number;
  transmission: 'Automatic' | 'Manual';
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  rating: number;
}

export interface SearchCarsParams {
  location?: string;
  pickupDate?: string;
  returnDate?: string;
}

export type PickupPoint = 'airport' | 'station';

/** Per-car booking and delivery choices returned by `/city-cars`. */
export interface CarAvailability {
  bookingTypes: {
    daily: boolean;
    monthly: boolean;
    airport: boolean;
    station: boolean;
    international: boolean;
  };
  deliveryTypes: {
    toLocation: boolean;
    fromBranch: boolean;
  };
}

/** A free-days offer: book `requiredDays` and `freeDays` of them are free. */
export interface CarOffer {
  requiredDays: number;
  freeDays: number;
}

/**
 * A car in a list. The API listings (GET /city-cars) carry no specification
 * fields or review count, so those are optional here.
 */
export interface CarListing
  extends Omit<Car, 'seats' | 'transmission' | 'fuelType'> {
  seats?: number;
  transmission?: Car['transmission'];
  fuelType?: Car['fuelType'];
  originalPrice?: number;
  reviewsCount?: number;
  year: number;
  showroom: string;
  showroomLogo?: string;
  pickupPoint?: PickupPoint;
  offer?: CarOffer;
  availability?: CarAvailability;
}

/** Car rental office (showroom) used to group cars on the cars page. */
export interface Office {
  id: string;
  slug: string;
  /** Short name shown in the row title: "مكتب {name}" */
  name: string;
  /** Value matched against `CarListing.showroom` to bucket cars into this office. */
  showroom: string;
  logo: string;
}

/** A car brand offered as a filter option; `slug` picks the label from `cars.brands.*`. */
export interface CarBrand {
  id: string;
  slug: string;
  logo: string;
}

export interface OfficeCarGroup {
  office: Office;
  cars: CarListing[];
}

/** Whole-percent saving against the original price, at least 1; null when there is no offer. */
export function discountPercent({
  pricePerDay,
  originalPrice,
}: Pick<CarListing, 'pricePerDay' | 'originalPrice'>): number | null {
  if (!originalPrice) return null;
  return Math.max(1, Math.round((1 - pricePerDay / originalPrice) * 100));
}

/**
 * Buckets cars into office rows using `Office.showroom` as the join key, so the
 * offices list stays the single source of truth for both the row title and the
 * cars shown under it. Offices with no cars are dropped.
 */
export function groupCarsByOffice(offices: Office[], cars: CarListing[]): OfficeCarGroup[] {
  return offices
    .map((office) => ({
      office,
      cars: cars.filter((car) => car.showroom === office.showroom),
    }))
    .filter((group) => group.cars.length > 0);
}

/** Cars with a discount, for the home page offers rail. */
export function selectOfferCars(cars: CarListing[]): CarListing[] {
  return cars.filter((car) => discountPercent(car) !== null);
}

/** Full-price cars, best rated first, for the "selected for you" rail. */
export function selectHandpickedCars(cars: CarListing[]): CarListing[] {
  return cars
    .filter((car) => discountPercent(car) === null)
    .sort((a, b) => b.rating - a.rating);
}
