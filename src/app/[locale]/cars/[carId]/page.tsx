import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CarDetailsView,
  parseCarDetailsQuery,
  serializeCarDetailsQuery,
  withDefaultRentalContext,
} from "@/features/car-details";
import {
  getCarDetails,
  getCarBranches,
  getCompanyRatings,
  getCarPolicies,
} from "@/features/car-details/queries";
import type { BookingContext } from "@/features/orders";
import { auth } from "@/auth";

interface Props {
  params: Promise<{ carId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The car's own title; the query is cached, so the page reuses this read. */
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ carId }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const car = await getCarDetails(
    carId,
    serializeCarDetailsQuery(
      withDefaultRentalContext(parseCarDetailsQuery(rawSearchParams)),
    ),
  );
  if (!car) notFound();

  return { title: `${car.brand} ${car.name}` };
}

export default async function CarDetailsPage({ params, searchParams }: Props) {
  const [{ carId }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const parsedQuery = parseCarDetailsQuery(rawSearchParams);
  const rentalQuery = withDefaultRentalContext(parsedQuery);
  const queryKey = serializeCarDetailsQuery(rentalQuery);
  const car = await getCarDetails(carId, queryKey);
  if (!car) notFound();

  // Resolve the car first so an unknown ID remains a proper not-found route.
  const [ratings, policies, branches, session] = await Promise.all([
    getCompanyRatings(carId, queryKey),
    getCarPolicies(),
    getCarBranches(carId, queryKey),
    auth(),
  ]);

  const bookingContext: BookingContext = {
    bookingType: rentalQuery.bookingType!,
    deliveryType: rentalQuery.deliveryType!,
    ...(parsedQuery.location ? { location: parsedQuery.location } : {}),
    ...(car.pickupInfo.nearestBranch
      ? { branch: car.pickupInfo.nearestBranch }
      : {}),
    ...(parsedQuery.airportId ? { airportId: parsedQuery.airportId } : {}),
    ...(parsedQuery.stationId ? { stationId: parsedQuery.stationId } : {}),
    ...(parsedQuery.countryId ? { countryId: parsedQuery.countryId } : {}),
  };

  return (
    <CarDetailsView
      car={car}
      ratings={ratings}
      policies={policies}
      branches={branches}
      bookingContext={bookingContext}
      signedIn={Boolean(session?.user)}
    />
  );
}
