"use client";

import { useState } from "react";
import type { LocationData } from "@/shared/lib/location";
import type { Airport, Country, RentalType, Station } from "../model";

/** The one modal of the flow that is open, or null between steps. */
export type RentalFlowStep =
  "country" | "pickup" | "airport" | "station" | "map" | null;

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
 * Rental-type flow: tab → (country → pickup | airport | station | pickup)
 * → map → `/cars`. Each choice is carried into the final search params.
 */
export function useRentalFlow({ onComplete }: Options) {
  const [rentalType, setRentalType] = useState<RentalType | null>(null);
  const [step, setStep] = useState<RentalFlowStep>(null);
  const [airport, setAirport] = useState<Airport | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [country, setCountry] = useState<Country | null>(null);

  const start = (type: RentalType) => {
    setRentalType(type);
    setAirport(null);
    setStation(null);
    setCountry(null);
    setStep(firstStep[type]);
  };

  const close = () => setStep(null);

  const confirmPickup = () => setStep("map");

  const confirmAirport = (selected: Airport) => {
    setAirport(selected);
    setStep("map");
  };

  const confirmStation = (selected: Station) => {
    setStation(selected);
    setStep("map");
  };

  const confirmCountry = (selected: Country) => {
    setCountry(selected);
    setStep("pickup");
  };

  const confirmLocation = (location: LocationData) => {
    setStep(null);
    if (!rentalType) return;
    const params = new URLSearchParams({ type: rentalType });
    if (airport) params.set("airportId", String(airport.id));
    if (station) params.set("stationId", String(station.id));
    if (country) params.set("countryId", String(country.id));
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
    params.set("address", location.address);
    onComplete(params);
  };

  return {
    rentalType,
    step,
    start,
    close,
    confirmPickup,
    confirmAirport,
    confirmStation,
    confirmCountry,
    confirmLocation,
  };
}

export type RentalFlow = ReturnType<typeof useRentalFlow>;
