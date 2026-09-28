import { notFound } from 'next/navigation';
import { CarDetailsView } from '@/features/car-details';
import { getCarDetails } from '@/features/car-details/queries';

interface Props {
  params: Promise<{ carId: string }>;
}

export default async function CarDetailsPage({ params }: Props) {
  const { carId } = await params;
  const car = await getCarDetails(carId);
  if (!car) notFound();

  return <CarDetailsView car={car} />;
}
