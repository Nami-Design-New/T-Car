import Image from "next/image";
import { CarOfferBadge, type CarOffer } from "@/features/cars";

interface Props {
  image: string;
  alt: string;
  offer?: CarOffer;
}

export default function CarGallery({ image, alt, offer }: Props) {
  return (
    <div className="car-gallery">
      <div className="car-gallery-main bg-surface-on-background relative h-[380px] overflow-hidden rounded-md max-md:h-[260px]">
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="(max-width: 992px) 100vw, 640px"
          className="car-gallery-image object-cover"
        />
        {offer && (
          <>
            <CarOfferBadge offer={offer} />
            <CarOfferBadge offer={offer} variant="ribbon" />
          </>
        )}
      </div>
    </div>
  );
}
