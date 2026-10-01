import Image from 'next/image';

interface Props {
  image: string;
  alt: string;
}

export default function CarGallery({ image, alt }: Props) {
  return (
    <div className="car-gallery">
      <div className="car-gallery-main">
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="(max-width: 992px) 100vw, 640px"
          className="car-gallery-image"
        />
      </div>
    </div>
  );
}
