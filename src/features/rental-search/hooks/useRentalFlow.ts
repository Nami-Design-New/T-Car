"use client";

import { useCallback, useState } from "react";
import { readGuestLocation } from "@/shared/lib/guest-location";
import type { LocationData } from "@/shared/lib/location";
import type { Airport, Country, RentalType, Station } from "../model";

type DeliveryType = "to_location" | "from_branch";

/** The one modal of the flow that is open, or null between steps. */
export type RentalFlowStep =
  "booking" | "country" | "pickup" | "airport" | "station" | "map" | null;

const firstStep: Record<RentalType, Exclude<RentalFlowStep, null>> = {
  daily: "pickup",
  monthly: "pickup",
  international: "country",
  airport: "airport",
  station: "station",
};

interface Options {
  /** Called once a location is confirmed, with the `/cars` search params. */
  onComplete: (params: URLSearchParams) => void;
}

/**
 * Rental-type flow: tab → (country → pickup | pickup) → map → `/cars`.
 * Airport and station reuse the saved guest location when it is available.
 * Each choice is carried into the final search params.
 */
export function useRentalFlow({ onComplete }: Options) {
  const [rentalType, setRentalType] = useState<RentalType | null>(null);
  const [step, setStep] = useState<RentalFlowStep>(null);
  const [airport, setAirport] = useState<Airport | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(null);

  const start = (type: RentalType) => {
    setRentalType(type);
    setAirport(null);
    setStation(null);
    setCountry(null);
    setDeliveryType(null);
    setStep(firstStep[type]);
  };

  /** Opens the booking-type choice before the regular home-page flow. */
  const openBooking = useCallback(() => {
    setRentalType(null);
    setAirport(null);
    setStation(null);
    setCountry(null);
    setDeliveryType(null);
    setStep("booking");
  }, []);

  const close = () => setStep(null);

  const confirmPickup = (selected?: DeliveryType) => {
    if (selected) setDeliveryType(selected);
    setStep("map");
  };

  const confirmAirport = (selected: Airport) => {
    setAirport(selected);
    const location = readGuestLocation();
    const region = location?.region?.trim();
    const params = new URLSearchParams({
      type: "airport",
      airportId: String(selected.id),
    });
    if (location && region) {
      params.set("lat", String(location.lat));
      params.set("lng", String(location.lng));
      params.set("region", region);
    }
    setStep(null);
    onComplete(params);
  };

  const confirmStation = (selected: Station) => {
    setStation(selected);
    const location = readGuestLocation();
    const region = location?.region?.trim();
    const params = new URLSearchParams({
      type: "station",
      stationId: String(selected.id),
    });
    if (location && region) {
      params.set("lat", String(location.lat));
      params.set("lng", String(location.lng));
      params.set("region", region);
    }
    setStep(null);
    onComplete(params);
  };

  const confirmCountry = (selected: Country) => {
    setCountry(selected);
    setStep("pickup");
  };

  const confirmLocation = (location: LocationData) => {
    const region = location.region?.trim();
    if (!rentalType || !region) return;

    setStep(null);
    const params = new URLSearchParams({ type: rentalType });
    if (airport) params.set("airportId", String(airport.id));
    if (station) params.set("stationId", String(station.id));
    if (country) params.set("countryId", String(country.id));
    if (deliveryType) params.set("deliveryType", deliveryType);
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
    params.set("region", region);
    onComplete(params);
  };

  return {
    rentalType,
    step,
    start,
    openBooking,
    close,
    confirmPickup,
    confirmAirport,
    confirmStation,
    confirmCountry,
    confirmLocation,
  };
}

export type RentalFlow = ReturnType<typeof useRentalFlow>;
