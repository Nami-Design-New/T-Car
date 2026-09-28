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

export type PickupPoint = 'airport' | 'station';

export interface CarListing extends Car {
  originalPrice?: number;
  reviewsCount: number;
  year: number;
  showroom: string;
  pickupPoint?: PickupPoint;
}

// Office (car rental branch / showroom grouping for the cars page)
export interface Office {
  id: string;
  slug: string;
  /** Short name shown in the row title: "مكتب {name}" */
  name: string;
  /** Value matched against `CarListing.showroom` to bucket cars into this office. */
  showroom: string;
  logo: string | StaticImageData;
}

export interface OfficeCarGroup {
  office: Office;
  cars: CarListing[];
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

// Booking flow
export type PaymentMethod = 'wallet' | 'visa' | 'tabby' | 'tamara';

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
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupLocation?: LocationData | null;
  dropoffLocation?: LocationData | null;
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

export type PickupType = 'delivery' | 'branch';

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
  title?: string;
  initialLocation?: LocationData | null;
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

// Country (for international rentals)
export interface Country {
  id: number;
  code?: string;
  name: string;
  flag: string | StaticImageData;
}

export interface CountryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
}

// Account (profile / wallet / notifications)
export interface UserProfile {
  fullName: string;
  email: string;
  birthDate: string;
  phone: string;
}

export type WalletTransactionType = 'topup' | 'refund' | 'payment' | 'withdraw';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  reference: string;
  /** ISO date string */
  createdAt: string;
}

export interface WalletSummary {
  total: number;
  withdrawable: number;
  nonWithdrawable: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  logo?: StaticImageData | string;
  maskedNumber: string;
}

export interface AppNotification {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

export type BookingStatus =
  | 'current'     
  | 'upcoming'    
  | 'late'         
  | 'completed'   
  | 'cancelled'; 

export type BookingTab = 'active' | 'past';

export interface UserBooking {
  id: string;

  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;

  showroom: string;

  year: number;
  rating: number;

  status: BookingStatus;
  statusLabel: string;

  dateLabel: string;
}
export interface BookingDetailsView {
  id: string;

  reference: string;

  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;

  showroom: string;

  status: BookingStatus;
  statusLabel: string;

  pricePerDay: number;
  originalPrice?: number;

  pickupDateTime: string;
  dropoffDateTime: string;
pickupLocation: string;
dropoffLocation: string;
  warrantyNote: string;
pointsUsed: number;
  days: number;

  subtotal: number;

  vatRate: number;
  vat: number;

  total: number;

  bannerTimestamp?: string;
}
