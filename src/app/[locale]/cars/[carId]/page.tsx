import { notFound } from 'next/navigation';
import { CarDetailsView, getCarDetails } from '@/features/car-details';

interface Props {
  params: Promise<{ carId: string }>;
}

export default async function CarDetailsPage({ params }: Props) {
  const { carId } = await params;
  const car = await getCarDetails(carId);
  if (!car) notFound();

  return <CarDetailsView car={car} />;
}
