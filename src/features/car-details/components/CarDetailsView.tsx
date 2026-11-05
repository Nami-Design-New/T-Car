import { CarBookingCard } from "@/features/booking";
import type { CarDetails } from "../model";
import CarGallery from "./CarGallery";
import CarQuickInfo from "./CarQuickInfo";
import WarrantiesList from "./WarrantiesList";
import AddonsGrid from "./AddonsGrid";
import InsuranceOptions from "./InsuranceOptions";
import ReviewsSummaryCard from "./ReviewsSummaryCard";
import StationAndAirportInfo from "./StationAndAirportInfo";

interface Props {
  car: CarDetails;
}

export default function CarDetailsView({ car }: Props) {
  return (
    <>
      <section className="py-20 max-md:py-12">
        <div className="mx-auto w-full max-w-7xl px-2">
          <div className="car-details-grid grid grid-cols-[minmax(0,1fr)_360px] items-start gap-8 max-lg:grid-cols-1">
            <div className="car-details-main min-w-0">
              <CarGallery
                image={car.images[0]}
                alt={`${car.brand} ${car.name}`}
                offer={car.offer}
              />
              <CarQuickInfo car={car} />
              {car.pickupPoint && (
                <StationAndAirportInfo
                  showroom={car.showroom}
                  pickup={car.pickupInfo}
                  type={car.pickupPoint}
                />
              )}
              {car.warranties.length > 0 && (
                <WarrantiesList warranties={car.warranties} />
              )}
              {car.addons.length > 0 && <AddonsGrid addons={car.addons} />}
              {car.insuranceOptions[0] && (
                <InsuranceOptions option={car.insuranceOptions[0]} />
              )}
            </div>

            <div className="sticky top-25 max-lg:static max-lg:top-auto">
              <CarBookingCard
                carId={car.id}
                carName={car.name}
                carBrand={car.brand}
                carYear={car.year}
                showroomLogo={car.showroomLogo}
                carImage={car.image}
                showroom={car.showroom}
                rating={car.rating}
                pricePerDay={car.pricePerDay}
                originalPrice={car.originalPrice}
              />

              {car.rating && (
                <ReviewsSummaryCard
                  rating={car.rating}
                  reviewsCount={car.reviewsCount}
                  reviews={car.reviews}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
