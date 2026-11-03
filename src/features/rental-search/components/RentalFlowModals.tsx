"use client";

import dynamic from "next/dynamic";
import type { RentalFlow } from "../hooks/useRentalFlow";
import type { RentalSearchOptions, RentalType } from "../model";

const PickupTypeModal = dynamic(() => import("./PickupTypeModal"), {
  ssr: false,
});
const MapLocationModal = dynamic(
  () =>
    import("@/shared/ui/MapLocationModal").then(
      ({ MapLocationModal }) => MapLocationModal,
    ),
  { ssr: false },
);
const AirportModal = dynamic(() => import("./AirportModal"), { ssr: false });
const StationModal = dynamic(() => import("./StationModal"), { ssr: false });
const CountryModal = dynamic(() => import("./CountryModal"), { ssr: false });
const BookingTypeModal = dynamic(() => import("./BookingTypeModal"), {
  ssr: false,
});

interface Props {
  flow: RentalFlow;
  options: RentalSearchOptions;
  availability?: {
    bookingTypes: Record<RentalType, boolean>;
    deliveryTypes: {
      toLocation: boolean;
      fromBranch: boolean;
    };
  };
}

/** The modals of the rental-type flow; `flow.step` says which one is open. */
export default function RentalFlowModals({
  flow,
  options,
  availability,
}: Props) {
  return (
    <>
      {availability && (
        <BookingTypeModal
          open={flow.step === "booking"}
          availability={availability.bookingTypes}
          onClose={flow.close}
          onSelect={flow.start}
        />
      )}

      <CountryModal
        open={flow.step === "country"}
        countries={options.countries}
        onClose={flow.close}
        onSelect={flow.confirmCountry}
      />

      <PickupTypeModal
        open={flow.step === "pickup"}
        onClose={flow.close}
        onSelect={flow.confirmPickup}
        availability={availability?.deliveryTypes}
      />

      <AirportModal
        open={flow.step === "airport"}
        airports={options.airports}
        onClose={flow.close}
        onSelect={flow.confirmAirport}
      />

      <StationModal
        open={flow.step === "station"}
        stations={options.stations}
        onClose={flow.close}
        onSelect={flow.confirmStation}
      />

      {flow.step === "map" && (
        <MapLocationModal
          open
          onClose={flow.close}
          onConfirm={flow.confirmLocation}
        />
      )}
    </>
  );
}
