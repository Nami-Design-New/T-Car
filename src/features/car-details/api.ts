import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp } from "@/services/http/server";
import { IMAGES } from "@/shared/config/assets";
import { AppError } from "@/shared/lib/errors";
import { sanitizeBackendHtml } from "@/shared/lib/sanitizeHtml";
import type { CarOffer } from "@/features/cars";
import {
  type CarPolicies,
  type CarDetails,
  type CarDetailsQuery,
  type CarQuickFact,
  type CompanyRatings,
  type PickupBranch,
} from "./model";

export interface CarDetailsApi {
  /** Throws an AppError for an unknown id, malformed payload, or backend error. */
  getCarDetails(id: string, query: CarDetailsQuery): Promise<CarDetails>;
  getCompanyRatings(
    id: string,
    query: CarDetailsQuery,
  ): Promise<CompanyRatings>;
  getCarBranches(id: string, query: CarDetailsQuery): Promise<PickupBranch[]>;
  getPolicies(): Promise<CarPolicies>;
}

interface LookupDto {
  id: number;
  title: string;
  logo: string | null;
}

interface OfferDto {
  type: string;
  require_booking_days: number;
  free_days: number;
}

interface CarDto {
  id: number;
  image_url: string | null;
  year: number;
  company_name: string;
  company_logo: string | null;
  lower_price: number;
  max_price: number;
  rate: number;
  brand: LookupDto;
  car_model: LookupDto;
  details: CarTechnicalDetailsDto;
  has_offer: boolean;
  offer: OfferDto | null;
}

interface CarTechnicalDetailsDto {
  power: string;
  door_count: number;
  has_navigation: boolean;
  has_bluetooth: boolean;
  has_panorama: boolean;
  has_usp: boolean;
  has_background_camera: boolean;
  has_sensors: boolean;
  has_apple_play: boolean;
}

interface ServiceDto {
  id: number;
  price: number;
  title: string;
  key: string | null;
}

interface InsuranceDto {
  id: number;
  title: string;
  description: string;
  requires_percentage: boolean;
  percentage: number | null;
}

interface WarrantyDto {
  title: string;
  content: string;
}

interface DetailsDto {
  car: CarDto;
  branch_data: BranchAvailabilityDto;
  serevices: ServiceDto[];
  insurance: InsuranceDto | null;
  warranties: WarrantyDto[];
  /** Delivery range in km around the branch for to_location (observed 60). */
  allowed_distance?: number | null;
}

interface DetailBranchDto {
  id: number;
  title: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  place_id: string;
  region: string;
  logo: string | null;
  distance_km: number;
}

interface BranchAvailabilityDto {
  branch: DetailBranchDto | null;
  has_airport: boolean;
  has_station: boolean;
}

interface CarBranchDto {
  branch_id: number;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  region: string;
  logo: string | null;
  distance_km: number;
}

interface CompanyRateDto {
  id: number;
  value: number;
  user_name: string;
  created_at: string;
}

interface CompanyRatingsDto {
  summary: {
    average: number;
    count: number;
  };
  rates: CompanyRateDto[];
}

interface PolicyContentDto {
  content: string;
}

interface PoliciesDto {
  client_instructions: PolicyContentDto[];
  cancellation_policies: PolicyContentDto[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isCoordinate = (value: unknown): value is string | number =>
  (typeof value === "string" && Number.isFinite(Number(value))) ||
  isNumber(value);

/** Debug output for local API integration work; never emitted by production builds. */
function logDetailData(label: string, value: unknown): void {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console -- intentional local API integration inspection.
    console.info(`[car-details] ${label}`, value);
  }
}

function isLookup(value: unknown): value is LookupDto {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    (value.logo === null || typeof value.logo === "string")
  );
}

function isOffer(value: unknown): value is OfferDto {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    isNumber(value.require_booking_days) &&
    isNumber(value.free_days)
  );
}

function isCarTechnicalDetails(
  value: unknown,
): value is CarTechnicalDetailsDto {
  return (
    isRecord(value) &&
    typeof value.power === "string" &&
    isNumber(value.door_count) &&
    typeof value.has_navigation === "boolean" &&
    typeof value.has_bluetooth === "boolean" &&
    typeof value.has_panorama === "boolean" &&
    typeof value.has_usp === "boolean" &&
    typeof value.has_background_camera === "boolean" &&
    typeof value.has_sensors === "boolean" &&
    typeof value.has_apple_play === "boolean"
  );
}

function isService(value: unknown): value is ServiceDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    isNumber(value.price) &&
    typeof value.title === "string" &&
    (value.key === null || typeof value.key === "string")
  );
}

function isInsurance(value: unknown): value is InsuranceDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.requires_percentage === "boolean" &&
    (value.percentage === null || isNumber(value.percentage))
  );
}

function isWarranty(value: unknown): value is WarrantyDto {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.content === "string"
  );
}

function isDetailBranch(value: unknown): value is DetailBranchDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.title === "string" &&
    typeof value.address === "string" &&
    isCoordinate(value.latitude) &&
    isCoordinate(value.longitude) &&
    typeof value.place_id === "string" &&
    typeof value.region === "string" &&
    (value.logo === null || typeof value.logo === "string") &&
    isNumber(value.distance_km)
  );
}

function isBranchAvailability(value: unknown): value is BranchAvailabilityDto {
  return (
    isRecord(value) &&
    (value.branch === null || isDetailBranch(value.branch)) &&
    typeof value.has_airport === "boolean" &&
    typeof value.has_station === "boolean"
  );
}

function isCarBranch(value: unknown): value is CarBranchDto {
  return (
    isRecord(value) &&
    isNumber(value.branch_id) &&
    typeof value.title === "string" &&
    typeof value.address === "string" &&
    isNumber(value.latitude) &&
    isNumber(value.longitude) &&
    typeof value.place_id === "string" &&
    typeof value.region === "string" &&
    (value.logo === null || typeof value.logo === "string") &&
    isNumber(value.distance_km)
  );
}

function isCompanyRate(value: unknown): value is CompanyRateDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    isNumber(value.value) &&
    typeof value.user_name === "string" &&
    typeof value.created_at === "string"
  );
}

function isCompanyRatings(value: unknown): value is CompanyRatingsDto {
  return (
    isRecord(value) &&
    isRecord(value.summary) &&
    isNumber(value.summary.average) &&
    isNumber(value.summary.count) &&
    Array.isArray(value.rates) &&
    value.rates.every(isCompanyRate)
  );
}

function isPolicyContent(value: unknown): value is PolicyContentDto {
  return isRecord(value) && typeof value.content === "string";
}

function isPolicies(value: unknown): value is PoliciesDto {
  return (
    isRecord(value) &&
    Array.isArray(value.client_instructions) &&
    value.client_instructions.every(isPolicyContent) &&
    Array.isArray(value.cancellation_policies) &&
    value.cancellation_policies.every(isPolicyContent)
  );
}

export function isCarDetailsDto(value: unknown): value is CarDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    (value.image_url === null || typeof value.image_url === "string") &&
    isNumber(value.year) &&
    typeof value.company_name === "string" &&
    (value.company_logo === null || typeof value.company_logo === "string") &&
    isNumber(value.lower_price) &&
    isNumber(value.max_price) &&
    isNumber(value.rate) &&
    typeof value.has_offer === "boolean" &&
    isLookup(value.brand) &&
    isLookup(value.car_model) &&
    isCarTechnicalDetails(value.details) &&
    (value.offer === null || isOffer(value.offer))
  );
}

function isDetailsDto(value: unknown): value is DetailsDto {
  return (
    isRecord(value) &&
    isCarDetailsDto(value.car) &&
    isBranchAvailability(value.branch_data) &&
    Array.isArray(value.serevices) &&
    value.serevices.every(isService) &&
    Array.isArray(value.warranties) &&
    value.warranties.every(isWarranty) &&
    (value.insurance === null || isInsurance(value.insurance)) &&
    (value.allowed_distance === undefined ||
      value.allowed_distance === null ||
      (typeof value.allowed_distance === "number" &&
        Number.isFinite(value.allowed_distance)))
  );
}

function toOffer(car: CarDto): CarOffer | undefined {
  const { offer } = car;
  if (!car.has_offer || offer?.type !== "free_days" || offer.free_days < 1) {
    return undefined;
  }
  return {
    requiredDays: offer.require_booking_days,
    freeDays: offer.free_days,
  };
}

function serviceIcon(key: string | null): CarDetails["addons"][number]["icon"] {
  if (key === "adding_driver") return "driver";
  if (key === "travel_abroad") return "travel";
  if (key === null) return "shield";
  return "default";
}

function serviceType(key: string | null): CarDetails["addons"][number]["type"] {
  if (key === "adding_driver") return "driver_service";
  if (key === "travel_abroad") return "company_service";
  return "car_service";
}

function toQuickFacts(details: CarTechnicalDetailsDto): CarQuickFact[] {
  const facts: CarQuickFact[] = [];
  const power = details.power.trim();
  if (power) facts.push({ kind: "power", value: power });
  if (details.door_count >= 0) {
    facts.push({ kind: "doors", value: String(details.door_count) });
  }

  const availableFeatures: [
    keyof CarTechnicalDetailsDto,
    CarQuickFact["kind"],
  ][] = [
    ["has_navigation", "navigation"],
    ["has_bluetooth", "bluetooth"],
    ["has_panorama", "panorama"],
    ["has_usp", "usb"],
    ["has_background_camera", "camera"],
    ["has_sensors", "sensors"],
    ["has_apple_play", "applePlay"],
  ];
  for (const [field, kind] of availableFeatures) {
    if (details[field]) facts.push({ kind });
  }
  return facts;
}

function toPickupBranch(branch: DetailBranchDto | CarBranchDto): PickupBranch {
  return {
    id: String("branch_id" in branch ? branch.branch_id : branch.id),
    name: branch.title,
    address: branch.address,
    distanceKm: branch.distance_km,
    latitude: Number(branch.latitude),
    longitude: Number(branch.longitude),
    region: branch.region,
    placeId: branch.place_id,
    ...(branch.logo ? { logo: branch.logo } : {}),
  };
}

/** Maps the confirmed core response; later fractions add its detail sections. */
export function mapCarDetails(details: DetailsDto): CarDetails {
  const { car, branch_data: branchData } = details;
  return {
    id: String(car.id),
    name: car.car_model.title,
    brand: car.brand.title,
    image: car.image_url || IMAGES.imageFallback.src,
    images: [car.image_url || IMAGES.imageFallback.src],
    lowerPrice: car.lower_price,
    maxPrice: car.max_price,
    rating: car.rate,
    year: car.year,
    showroom: car.company_name,
    showroomLogo: car.company_logo || undefined,
    pickupPoint: branchData.has_airport
      ? "airport"
      : branchData.has_station
        ? "station"
        : undefined,
    ...(typeof details.allowed_distance === "number" &&
    details.allowed_distance > 0
      ? { allowedDistanceKm: details.allowed_distance }
      : {}),
    hasAirportBranch: branchData.has_airport,
    hasStationBranch: branchData.has_station,
    offer: toOffer(car),
    reviewsCount: 0,
    quickFacts: toQuickFacts(car.details),
    warranties: details.warranties.map((warranty, index) => ({
      id: `warranty-${index}`,
      title: warranty.title,
      content: sanitizeBackendHtml(warranty.content),
    })),
    addons: details.serevices.map((service) => ({
      id: String(service.id),
      title: service.title,
      price: service.price,
      type: serviceType(service.key),
      icon: serviceIcon(service.key),
    })),
    insuranceOptions: details.insurance
      ? [
          {
            id: String(details.insurance.id),
            title: details.insurance.title,
            description: details.insurance.description,
            ...(details.insurance.requires_percentage &&
            details.insurance.percentage !== null
              ? { percentage: details.insurance.percentage }
              : {}),
          },
        ]
      : [],
    reviews: [],
    pickupInfo: branchData.branch
      ? { nearestBranch: toPickupBranch(branchData.branch) }
      : {},
  };
}

function toSearch(query: CarDetailsQuery): URLSearchParams {
  const search = new URLSearchParams();
  const isPickupPointBooking =
    query.bookingType === "airport" || query.bookingType === "station";
  if (query.location && !isPickupPointBooking) {
    search.set("region", query.location.region);
    search.set("latitude", String(query.location.latitude));
    search.set("longitude", String(query.location.longitude));
  }
  if (query.deliveryType && !isPickupPointBooking)
    search.set("delivery_type", query.deliveryType);
  if (query.bookingType) search.set("booking_type", query.bookingType);
  if (query.airportId) search.set("airport_id", query.airportId);
  if (query.stationId) search.set("train_station_id", query.stationId);
  if (query.countryId) search.set("country_id", query.countryId);
  return search;
}

function toCompanyRatesSearch(query: CarDetailsQuery): URLSearchParams {
  const search = new URLSearchParams();
  if (query.location) {
    search.set("latitude", String(query.location.latitude));
    search.set("longitude", String(query.location.longitude));
  }
  if (query.deliveryType) search.set("delivery_type", query.deliveryType);
  return search;
}

/** The branch dialog endpoint rejects a partial delivery context. */
function toBranchesSearch(query: CarDetailsQuery): URLSearchParams | null {
  if (!query.location || !query.deliveryType) return null;

  const search = new URLSearchParams();
  search.set("region", query.location.region);
  search.set("latitude", String(query.location.latitude));
  search.set("longitude", String(query.location.longitude));
  search.set("delivery_type", query.deliveryType);
  return search;
}

async function getCarDetails(
  id: string,
  query: CarDetailsQuery,
): Promise<CarDetails> {
  const search = toSearch(query);
  logDetailData("request params", Object.fromEntries(search));
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `/cars/${id}${search.size ? `?${search}` : ""}`,
  );
  logDetailData("retrieved API data", response);
  const data = isApiEnvelope(response) ? response.data : undefined;
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isDetailsDto(data)
  ) {
    throw new AppError("server");
  }
  const mappedCar = mapCarDetails(data);
  logDetailData("mapped detail model", mappedCar);
  return mappedCar;
}

async function getCompanyRatings(
  id: string,
  query: CarDetailsQuery,
): Promise<CompanyRatings> {
  const search = toCompanyRatesSearch(query);
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `/cars/${id}/company-rates${search.size ? `?${search}` : ""}`,
  );
  const data = isApiEnvelope(response) ? response.data : undefined;
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isCompanyRatings(data)
  ) {
    throw new AppError("server");
  }

  return {
    average: data.summary.average,
    count: data.summary.count,
    reviews: data.rates.map((rate) => ({
      id: String(rate.id),
      name: rate.user_name,
      rating: rate.value,
      date: rate.created_at,
    })),
  };
}

async function getCarBranches(
  id: string,
  query: CarDetailsQuery,
): Promise<PickupBranch[]> {
  const search = toBranchesSearch(query);
  if (!search) return [];

  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `/cars/${id}/branches?${search}`,
  );
  const data = isApiEnvelope(response) ? response.data : undefined;
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !Array.isArray(data) ||
    !data.every(isCarBranch)
  ) {
    throw new AppError("server");
  }

  return data.map(toPickupBranch);
}

async function getPolicies(): Promise<CarPolicies> {
  const response =
    await publicServerHttp.get<ApiEnvelope<unknown>>("/policies");
  const data = isApiEnvelope(response) ? response.data : undefined;
  if (!isApiEnvelope(response) || response.code !== 200 || !isPolicies(data)) {
    throw new AppError("server");
  }

  return {
    clientInstructions: data.client_instructions
      .map((policy) => sanitizeBackendHtml(policy.content))
      .filter(Boolean),
    cancellationPolicies: data.cancellation_policies
      .map((policy) => sanitizeBackendHtml(policy.content))
      .filter(Boolean),
  };
}

export const carDetailsApi: CarDetailsApi = {
  getCarDetails,
  getCompanyRatings,
  getCarBranches,
  getPolicies,
};
