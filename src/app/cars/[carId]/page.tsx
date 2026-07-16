import CarGallery from '@components/car-details/CarGallery';
import CarQuickInfo from '@components/car-details/CarQuickInfo';
import WarrantiesList from '@components/car-details/WarrantiesList';
import AddonsGrid from '@components/car-details/AddonsGrid';
import InsuranceOptions from '@components/car-details/InsuranceOptions';
import CarBookingCard from '@components/car-details/CarBookingCard';
import ReviewsSummaryCard from '@components/car-details/ReviewsSummaryCard';
import type { CarDetails } from '@app-types/car';

import car1 from '@assets/images/car1.jpg';
import car1Side from '@assets/images/car1-side.jpg';
import car1Back from '@assets/images/car1-back.jpg';
import car1Interior from '@assets/images/car1-interior.jpg';

interface Props {
  params: Promise<{ carId: string }>;
}

async function getCarDetails(carId: string): Promise<CarDetails> {
  return {
    id: carId,
    name: 'E-Class',
    brand: 'مرسيدس',
    image: car1,
    images: [car1, car1Side, car1Back, car1Interior],
    pricePerDay: 500,
    seats: 5,
    year: 2220,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    rating: 4.9,
    reviewsCount: 453,
    showroom: 'معرض السلطان',
    quickFacts: [
      { icon: 'shield', label: 'تأمين قابل للخصم' },
      { icon: 'delivery', label: 'التوصيل خلال 15 دقيقة' },
      { icon: 'distance', label: '300 كم مجانًا' },
    ],
    warranties: [
      {
        id: '1',
        title: 'ضمان الوصول في الوقت المحدد',
        description: 'خصم %20 في اليوم الأول إذا وصلت السيارة متأخرة، تطبق الشروط والأحكام.',
      },
      {
        id: '2',
        title: 'ضمان نظافة السيارة',
        description: 'خصم %20 في اليوم الأول إذا وصلت السيارة غير نظيفة، تطبق الشروط والأحكام.',
      },
    ],
    addons: [
      { id: '1', title: 'تفويض خارجي', price: 500, icon: 'external' },
      { id: '2', title: 'إضافة سائق', price: 500, icon: 'driver' },
    ],
    insuranceOptions: [
      {
        id: '1',
        title: 'تأمين مع خصم',
        subtitle: 'في حالة وقوع حادث، سيتم تطبيق رسوم خصم',
        pricePerDay: 500,
        terms: [
          'تقرير الحوادث: يجب إبلاغ الشركة والجهات الأمنية فور وقوع أي حادث للحفاظ على حقوقك في هذا التأمين.',
          'الالتزام بالمواعيد: يرجى الالتزام بموعد الاستلام والتسليم لتجنب رسوم إضافية ناتجة عن التأخير.',
          'نظافة السيارة: يُرجى الحفاظ على نظافة السيارة الداخلية والخارجية لتجنب رسوم التنظيف العميق.',
        ],
        cancellationPolicy: [
          'يمكن إلغاء الحجز مجانًا حتى 24 ساعة قبل موعد الاستلام.',
          'الإلغاء بعد هذه المدة يخضع لرسوم تصل إلى قيمة يوم واحد من الإيجار.',
        ],
      },
      {
        id: '2',
        title: 'تأمين شامل',
        subtitle: 'تغطية كاملة بدون رسوم إضافية عند وقوع حادث',
        pricePerDay: 750,
        terms: [
          'تغطية كاملة للأضرار الناتجة عن الحوادث بدون تحمل أي رسوم إضافية.',
          'يشمل التأمين تغطية السرقة والحوادث الجزئية والكلية.',
        ],
        cancellationPolicy: ['يمكن إلغاء الحجز مجانًا حتى 48 ساعة قبل موعد الاستلام.'],
      },
    ],
    reviews: [
      {
        id: '1',
        name: 'سعد النجار',
        rating: 5,
        date: '25 ديسمبر 2025',
        comment: 'السائق كان محترفًا ودودًا، وقاد السيارة بأمان وراحة. شكرًا جزيلًا!',
      },
      {
        id: '2',
        name: 'منى العلي',
        rating: 5,
        date: '26 ديسمبر 2025',
        comment: 'تجربة رائعة! كانت السيارة نظيفة جدًا والسائق كان علي موعده بالضبط.',
      },
      {
        id: '3',
        name: 'فهد القحطاني',
        rating: 5,
        date: '27 ديسمبر 2025',
        comment: 'السائق كان مرنًا والسائق ساعدني في حمل الأمتعة. سأستخدم الخدمة مرة أخرى.',
      },
    ],
  };
}

export default async function CarDetailsPage({ params }: Props) {
  const { carId } = await params;
  const car = await getCarDetails(carId);

  return (
    <>
      <section className="section car-details-page">
        <div className="container-tcar">
          <div className="car-details-grid">
            <div className="car-details-main">
              <CarGallery images={car.images} alt={`${car.brand} ${car.name}`} />
              <CarQuickInfo car={car} />
              <WarrantiesList warranties={car.warranties} />
              <AddonsGrid addons={car.addons} />
              <InsuranceOptions options={car.insuranceOptions} />
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
