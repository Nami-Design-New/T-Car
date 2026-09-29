import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CarDetailsView } from '@/features/car-details';
import { getCarDetails } from '@/features/car-details/queries';

interface Props {
  params: Promise<{ carId: string }>;
}

/** The car's own title; the query is cached, so the page reuses this read. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { carId } = await params;
  const car = await getCarDetails(carId);
  if (!car) notFound();

  return { title: `${car.brand} ${car.name}` };
}

export default async function CarDetailsPage({ params }: Props) {
  const { carId } = await params;
  const car = await getCarDetails(carId);
  if (!car) notFound();

  return <CarDetailsView car={car} />;
}
