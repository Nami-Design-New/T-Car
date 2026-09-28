import { CarBookingCard } from '@/features/booking';
import type { CarDetails } from '../model';
import CarGallery from './CarGallery';
import CarQuickInfo from './CarQuickInfo';
import WarrantiesList from './WarrantiesList';
import AddonsGrid from './AddonsGrid';
import InsuranceOptions from './InsuranceOptions';
import ReviewsSummaryCard from './ReviewsSummaryCard';
import StationAndAirportInfo from './StationAndAirportInfo';

interface Props {
  car: CarDetails;
}

export default function CarDetailsView({ car }: Props) {
  return (
    <>
      <section className="section car-details-page">
        <div className="container-tcar">
          <div className="car-details-grid">
            <div className="car-details-main">
              <CarGallery image={car.images[0]} alt={`${car.brand} ${car.name}`} />
              <CarQuickInfo car={car} />
              {car.pickupPoint && (
                <StationAndAirportInfo showroom={car.showroom} type={car.pickupPoint} />
              )}
              <WarrantiesList warranties={car.warranties} />
              <AddonsGrid addons={car.addons} />
              <InsuranceOptions option={car.insuranceOptions[0]} />
            </div>

            <div className="car-details-side">
              <CarBookingCard
                carId={car.id}
                carName={car.name}
                carBrand={car.brand}
                carImage={car.image}
                showroom={car.showroom}
                rating={car.rating}
                pricePerDay={car.pricePerDay}
                originalPrice={car.originalPrice}
              />

              <ReviewsSummaryCard
                rating={car.rating}
                reviewsCount={car.reviewsCount}
                reviews={car.reviews}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
