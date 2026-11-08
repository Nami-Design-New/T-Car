import { CarBookingCard } from "@/features/booking";
import type {
  CarDetails,
  CarPolicies,
  CompanyRatings,
  PickupBranch,
} from "../model";
import CarGallery from "./CarGallery";
import CarQuickInfo from "./CarQuickInfo";
import WarrantiesList from "./WarrantiesList";
import AddonsGrid from "./AddonsGrid";
import InsuranceOptions from "./InsuranceOptions";
import ReviewsSummaryCard from "./ReviewsSummaryCard";
import StationAndAirportInfo from "./StationAndAirportInfo";
import PoliciesList from "./PoliciesList";

interface Props {
  car: CarDetails;
  ratings: CompanyRatings;
  policies: CarPolicies;
  branches: PickupBranch[];
}

export default function CarDetailsView({
  car,
  ratings,
  policies,
  branches,
}: Props) {
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
              <CarQuickInfo car={car} ratings={ratings} />
              {car.pickupInfo.nearestBranch && (
                <StationAndAirportInfo
                  showroom={car.showroom}
                  pickup={car.pickupInfo}
                  branches={branches}
                  type={car.pickupPoint}
                />
              )}
              <WarrantiesList warranties={car.warranties} />
              {car.addons.length > 0 && <AddonsGrid addons={car.addons} />}
              {car.insuranceOptions[0] && (
                <InsuranceOptions option={car.insuranceOptions[0]} />
              )}
              <PoliciesList policies={policies} />
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
                lowerPrice={car.lowerPrice}
                maxPrice={car.maxPrice}
              />

              {ratings.count > 0 && (
                <ReviewsSummaryCard
                  rating={ratings.average}
                  reviewsCount={ratings.count}
                  reviews={ratings.reviews}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
