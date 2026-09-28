import type { StaticImageData } from 'next/image';
import type { CarListing } from '@app-types/car';

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

export interface PickupBranch {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
}

/** Where the customer collects the car and the other branches nearby. */
export interface CarPickupInfo {
  address: string;
  distanceKm: number;
  branches: PickupBranch[];
}

export interface CarDetails extends CarListing {
  images: (string | StaticImageData)[];
  showroom: string;
  quickFacts: { icon: 'shield' | 'delivery' | 'distance'; label: string }[];
  warranties: CarWarranty[];
  addons: AddonService[];
  insuranceOptions: InsuranceOption[];
  reviews: Review[];
  pickupInfo: CarPickupInfo;
}
