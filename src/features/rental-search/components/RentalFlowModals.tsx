"use client";

import dynamic from "next/dynamic";
import type { RentalFlow } from "../hooks/useRentalFlow";
import type { RentalSearchOptions } from "../model";

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

interface Props {
  flow: RentalFlow;
  options: RentalSearchOptions;
}

/** The modals of the rental-type flow; `flow.step` says which one is open. */
export default function RentalFlowModals({ flow, options }: Props) {
  return (
    <>
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
