import { CarDetailsView, type CarDetails } from '@/features/car-details';
import { MOCK_CARS, getCarListingById } from '@/services/mocks/cars';

import car1 from '@assets/images/car1.jpg';

interface Props {
  params: Promise<{ carId: string }>;
}

async function getCarDetails(carId: string): Promise<CarDetails> {
  const listing = getCarListingById(carId) ?? MOCK_CARS[0];

  return {
    ...listing,
    images: [car1],
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
      {
        id: '3',
        name: 'فهد القحطاني',
        rating: 5,
        date: '27 ديسمبر 2025',
        comment: 'السائق كان مرنًا والسائق ساعدني في حمل الأمتعة. سأستخدم الخدمة مرة أخرى.',
      },
      {
        id: '4',
        name: 'فهد القحطاني',
        rating: 5,
        date: '27 ديسمبر 2025',
        comment: 'السائق كان مرنًا والسائق ساعدني في حمل الأمتعة. سأستخدم الخدمة مرة أخرى.',
      },
      {
        id: '5',
        name: 'فهد القحطاني',
        rating: 5,
        date: '27 ديسمبر 2025',
        comment: 'السائق كان مرنًا والسائق ساعدني في حمل الأمتعة. سأستخدم الخدمة مرة أخرى.',
      },
      {
        id: '6',
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

  return <CarDetailsView car={car} />;
}
