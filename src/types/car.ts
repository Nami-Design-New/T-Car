import type { StaticImageData } from 'next/image';

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

export interface AppNotification {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

