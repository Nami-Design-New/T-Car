import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CarDetailsView,
  parseCarDetailsQuery,
  serializeCarDetailsQuery,
} from "@/features/car-details";
import {
  getCarDetails,
  getCompanyRatings,
  getCarPolicies,
} from "@/features/car-details/queries";

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
    serializeCarDetailsQuery(parseCarDetailsQuery(rawSearchParams)),
  );
  if (!car) notFound();

  return { title: `${car.brand} ${car.name}` };
}

export default async function CarDetailsPage({ params, searchParams }: Props) {
  const [{ carId }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const queryKey = serializeCarDetailsQuery(
    parseCarDetailsQuery(rawSearchParams),
  );
  const car = await getCarDetails(carId, queryKey);
  if (!car) notFound();

  // Resolve the car first so an unknown ID remains a proper not-found route.
  const [ratings, policies] = await Promise.all([
    getCompanyRatings(carId, queryKey),
    getCarPolicies(),
  ]);

  return <CarDetailsView car={car} ratings={ratings} policies={policies} />;
}
