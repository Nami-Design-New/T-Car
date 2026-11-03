import 'server-only';
import { IMAGES } from '@/shared/config/assets';
import type { CarListing, CarOffer, OfficeCarGroup } from './model';

interface LookupDto {
  id: number;
  title: string;
  logo: string | null;
}

interface OfferDto {
  id: number;
  description: string;
  type: string;
  require_booking_days: number;
  free_days: number;
  max_distance: number;
}

interface CarListingDto {
  id: number;
  image_url: string | null;
  year: number;
  company_name: string;
  company_logo: string | null;
  any_car_branches_support_airport: boolean;
  lower_price: number;
  max_price: number;
  rate: number;
  has_offer: boolean;
  brand: LookupDto;
  type: LookupDto;
  car_model: LookupDto;
  offer: OfferDto | null;
}

interface CompanyCarsGroupDto {
  company_id: number;
  company_name: string;
  company_logo: string | null;
  cars: CarListingDto[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

function isLookup(value: unknown): value is LookupDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.title === 'string' &&
    isNullableString(value.logo)
  );
}

function isOffer(value: unknown): value is OfferDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.type === 'string' &&
    isNumber(value.require_booking_days) &&
    isNumber(value.free_days)
  );
}

function isCarListing(value: unknown): value is CarListingDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    isNullableString(value.image_url) &&
    isNumber(value.year) &&
    typeof value.company_name === 'string' &&
    isNullableString(value.company_logo) &&
    typeof value.any_car_branches_support_airport === 'boolean' &&
    isNumber(value.lower_price) &&
    isNumber(value.rate) &&
    isLookup(value.brand) &&
    isLookup(value.car_model) &&
    (value.offer === null || isOffer(value.offer))
  );
}

/** A company and its cars, as `/city-cars` returns them (docs/api/cities-api.md §3.2). */
export function isCompanyCarsGroup(value: unknown): value is CompanyCarsGroupDto {
  return (
    isRecord(value) &&
    isNumber(value.company_id) &&
    typeof value.company_name === 'string' &&
    isNullableString(value.company_logo) &&
    Array.isArray(value.cars) &&
    value.cars.every(isCarListing)
  );
}

/** Only `free_days` is known (Q8); any other type maps to no offer. */
function toCarOffer(offer: OfferDto | null): CarOffer | undefined {
  if (offer?.type !== 'free_days' || offer.free_days < 1) return undefined;
  return { requiredDays: offer.require_booking_days, freeDays: offer.free_days };
}

export function mapCarListing(car: CarListingDto): CarListing {
  return {
    id: String(car.id),
    name: car.car_model.title,
    brand: car.brand.title,
    image: car.image_url || IMAGES.imageFallback.src,
    pricePerDay: car.lower_price,
    rating: car.rate,
    year: car.year,
    showroom: car.company_name,
    showroomLogo: car.company_logo || undefined,
    pickupPoint: car.any_car_branches_support_airport ? 'airport' : undefined,
    offer: toCarOffer(car.offer),
  };
}

export function mapCompanyCarsGroup(group: CompanyCarsGroupDto): OfficeCarGroup {
  return {
    office: {
      id: String(group.company_id),
      slug: String(group.company_id),
      name: group.company_name,
      showroom: group.company_name,
      logo: group.company_logo || IMAGES.imageFallback.src,
    },
    cars: group.cars.map(mapCarListing),
  };
}
