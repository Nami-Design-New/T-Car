"use client";

import { useEffect } from "react";
import type { RentalSearchOptions, RentalType } from "../model";
import { useRentalFlow } from "../hooks/useRentalFlow";
import RentalFlowModals from "./RentalFlowModals";

interface Props {
  carId: string;
  availability: {
    bookingTypes: Record<RentalType, boolean>;
    deliveryTypes: { toLocation: boolean; fromBranch: boolean };
  };
  options: RentalSearchOptions;
  onComplete: (carId: string, params: URLSearchParams) => void;
}

/** Opens the standard rental search flow for a selected city car. */
export default function CityCarBookingFlow({
  carId,
  availability,
  options,
  onComplete,
}: Props) {
  const flow = useRentalFlow({
    onComplete: (params) => onComplete(carId, params),
  });
  const { openBooking } = flow;

  useEffect(() => {
    openBooking();
  }, [carId, openBooking]); // A newly selected car starts at its methods.

  return (
    <RentalFlowModals
      flow={flow}
      options={options}
      availability={availability}
    />
  );
}
