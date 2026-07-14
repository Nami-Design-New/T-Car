import type { StaticImageData } from 'next/image';

// Core / Car
export interface Car {
  id: string;
  name: string;
  brand: string;
  image: string | StaticImageData;
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

export interface CarFilters {
  priceMin: number;
  priceMax: number;
  ratings: number[];
  carTypes: string[];
}

export interface CarListing extends Car {
  originalPrice?: number;
  reviewsCount: number;
  year: number;
  showroom: string;
}

// Car / Details page
export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
}

export interface CarWarranty {
  id: string;
  title: string;
  description: string;
}

export interface AddonService {
  id: string;
  title: string;
  price: number;
  icon: 'external' | 'driver';
}

export interface InsuranceOption {
  id: string;
  title: string;
  subtitle: string;
  pricePerDay: number;
  terms: string[];
  cancellationPolicy: string[];
}

export interface CarDetails extends CarListing {
  images: (string | StaticImageData)[];
  showroom: string;
  quickFacts: { icon: 'shield' | 'delivery' | 'distance'; label: string }[];
  warranties: CarWarranty[];
  addons: AddonService[];
  insuranceOptions: InsuranceOption[];
  reviews: Review[];
}

// City
export interface City {
  id: string;
  name: string;
  slug: string;
  image: string;
  carsAvailable: number;
}

export interface CityDetails {
  id: string;
  name: string;
  slug: string;
  heroImage: string | StaticImageData;
  carsCount: number;
}

// Rental flow (tabs / pickup type)
export type RentalType =
  | 'daily'
  | 'monthly'
  | 'airport'
  | 'station'
  | 'international';

export type PickupType =
  | 'delivery'
  | 'branch';

export interface RentalTabsProps {
  onSelect: (type: RentalType) => void;
}

export interface PickupTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: PickupType) => void;
}

// Location / Map
export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

export interface MapLocationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (location: LocationData) => void;
}

// Branch
export interface Branch {
  id: number;
  city: string;
  branch: string;
  address: string;
}

export interface BranchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (branch: Branch) => void;
}

// Airport
export interface Airport {
  id: number;
  city: string;
  airport: string;
  code: string;
}

export interface AirportModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (airport: Airport) => void;
}

// Station
export interface Station {
  id: number;
  city: string;
  station: string;
}

export interface StationModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (station: Station) => void;
}
export type PaymentMethod = 'wallet' | 'visa';

export interface BookingDetails {
  startDate: Date;
  endDate: Date;
  time: string;
  days: number;
  pricePerDay: number;
  subtotal: number;
  vat: number;
  total: number;
  notes: string;
}