export type {
  // City
  City,
  CityDetails,

  // Rental flow
  RentalType,
  PickupType,
  RentalTabsProps,
  PickupTypeModalProps,

  // Location / Map
  LocationData,
  MapLocationModalProps,

  // Branch
  Branch,
  BranchModalProps,

  // Airport
  Airport,
  AirportModalProps,

  // Station
  Station,
  StationModalProps,

  // Account
  UserProfile,
  AppNotification,
} from './car';

// Home page (FAQ / Services)
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}