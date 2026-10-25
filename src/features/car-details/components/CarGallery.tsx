import Image from 'next/image';

interface Props {
  image: string;
  alt: string;
}

export default function CarGallery({ image, alt }: Props) {
  return (
    <div className="car-gallery">
      <div className="car-gallery-main relative h-[380px] overflow-hidden rounded-md bg-surface-on-background max-md:h-[260px]">
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="(max-width: 992px) 100vw, 640px"
          className="car-gallery-image object-cover"
        />
      </div>
    </div>
  );
}
