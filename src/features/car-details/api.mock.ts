import type { CarDetails, CarPolicies, CompanyRatings } from "./model";
import { AppError } from "@/shared/lib/errors";
import type { CarDetailsApi } from "./api";
import { getCarListingById } from "@/services/mocks/cars";
import { MOCK_OFFICES } from "@/services/mocks/offices";
const car1 = "/mock/cars/creta.jpg";

/** Everything the details page shows beyond the listing; the same for every mock car. */
type DetailExtras = Pick<
  CarDetails,
  | "images"
  | "quickFacts"
  | "warranties"
  | "addons"
  | "insuranceOptions"
  | "reviews"
  | "pickupInfo"
>;

const MOCK_DETAILS_EXTRAS: DetailExtras = {
  images: [car1],
  quickFacts: [
    { kind: "power", value: "160 HP" },
    { kind: "doors", value: "4" },
    { kind: "bluetooth" },
  ],
  warranties: [
    {
      id: "1",
      title: "ضمان الوصول في الوقت المحدد",
      description:
        "خصم %20 في اليوم الأول إذا وصلت السيارة متأخرة، تطبق الشروط والأحكام.",
    },
    {
      id: "2",
      title: "ضمان نظافة السيارة",
      description:
        "خصم %20 في اليوم الأول إذا وصلت السيارة غير نظيفة، تطبق الشروط والأحكام.",
    },
  ],
  addons: [
    { id: "1", title: "تفويض خارجي", price: 500, icon: "default" },
    { id: "2", title: "إضافة سائق", price: 500, icon: "driver" },
  ],
  insuranceOptions: [
    {
      id: "1",
      title: "تأمين مع خصم",
      description: "في حالة وقوع حادث، سيتم تطبيق رسوم خصم",
      percentage: 20,
    },
    {
      id: "2",
      title: "تأمين شامل",
      description: "تغطية كاملة بدون رسوم إضافية عند وقوع حادث",
    },
  ],
  reviews: [
    {
      id: "1",
      name: "سعد النجار",
      rating: 5,
      date: "25 ديسمبر 2025",
      comment:
        "السائق كان محترفًا ودودًا، وقاد السيارة بأمان وراحة. شكرًا جزيلًا!",
    },
    {
      id: "2",
      name: "منى العلي",
      rating: 5,
      date: "26 ديسمبر 2025",
      comment:
        "تجربة رائعة! كانت السيارة نظيفة جدًا والسائق كان علي موعده بالضبط.",
    },
    {
      id: "3",
      name: "فهد القحطاني",
      rating: 5,
      date: "27 ديسمبر 2025",
      comment:
        "السائق كان مرنًا والسائق ساعدني في حمل الأمتعة. سأستخدم الخدمة مرة أخرى.",
    },
    {
      id: "11",
      name: "فهد القحطاني",
      rating: 5,
      date: "27 ديسمبر 2025",
      comment:
        "السائق كان مرنًا والسائق ساعدني في حمل الأمتعة. سأستخدم الخدمة مرة أخرى.",
    },
    {
      id: "4",
      name: "فهد القحطاني",
      rating: 5,
      date: "27 ديسمبر 2025",
      comment:
        "السائق كان مرنًا والسائق ساعدني في حمل الأمتعة. سأستخدم الخدمة مرة أخرى.",
    },
    {
      id: "5",
      name: "فهد القحطاني",
      rating: 5,
      date: "27 ديسمبر 2025",
      comment:
        "السائق كان مرنًا والسائق ساعدني في حمل الأمتعة. سأستخدم الخدمة مرة أخرى.",
    },
    {
      id: "6",
      name: "فهد القحطاني",
      rating: 5,
      date: "27 ديسمبر 2025",
      comment:
        "السائق كان مرنًا والسائق ساعدني في حمل الأمتعة. سأستخدم الخدمة مرة أخرى.",
    },
  ],
  pickupInfo: {
    address: "جدة، شارع الملك عبدالله بن عبدالعزيز",
    distanceKm: 2.9,
    branches: [
      {
        id: "1",
        name: "فرع جدة",
        address: "جدة، شارع الملك عبدالله بن عبدالعزيز",
        distanceKm: 2.9,
      },
      {
        id: "2",
        name: "فرع جدة",
        address: "جدة، شارع الملك عبدالله بن عبدالعزيز",
        distanceKm: 2.9,
      },
      {
        id: "3",
        name: "فرع جدة",
        address: "جدة، شارع الملك عبدالله بن عبدالعزيز",
        distanceKm: 2.9,
      },
    ],
  },
};

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Read-only, so it is safe to run on the server.
export const carDetailsMock: CarDetailsApi = {
  async getCarDetails(id) {
    await delay();
    const listing = getCarListingById(id);
    if (!listing) throw new AppError("not_found", "cars.notFound");

    return {
      ...listing,
      ...MOCK_DETAILS_EXTRAS,
      reviewsCount: listing.reviewsCount ?? 0,
      showroomLogo: MOCK_OFFICES.find(
        (office) => office.showroom === listing.showroom,
      )?.logo,
    };
  },
  async getCompanyRatings(): Promise<CompanyRatings> {
    await delay();
    return {
      average: 4.8,
      count: MOCK_DETAILS_EXTRAS.reviews.length,
      reviews: MOCK_DETAILS_EXTRAS.reviews.map(
        ({ id, name, rating, date }) => ({
          id,
          name,
          rating,
          date,
        }),
      ),
    };
  },
  async getPolicies(): Promise<CarPolicies> {
    await delay();
    return {
      clientInstructions: [
        "Report any accident immediately to the company and the relevant security authorities.",
        "Return the car at the agreed time to avoid additional charges.",
      ],
      cancellationPolicies: [
        "Cancellation fees may apply according to the booking terms.",
      ],
    };
  },
};
