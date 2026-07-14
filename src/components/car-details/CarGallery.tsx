'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import type { StaticImageData } from 'next/image';

interface Props {
  images: (string | StaticImageData)[];
  alt: string;
}

export default function CarGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);

  const goNext = () => setActive((prev) => (prev + 1) % images.length);
  const goPrev = () => setActive((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="car-gallery">
      <div className="car-gallery-main">
        <Image
          src={images[active]}
          alt={`${alt} - صورة ${active + 1}`}
          fill
          priority
          sizes="(max-width: 992px) 100vw, 640px"
          className="car-gallery-image"
        />

        {images.length > 1 && (
          <>
            <button type="button" className="car-gallery-nav prev" onClick={goPrev} aria-label="الصورة السابقة">
              <FiChevronRight />
            </button>
            <button type="button" className="car-gallery-nav next" onClick={goNext} aria-label="الصورة التالية">
              <FiChevronLeft />
            </button>

            <span className="car-gallery-counter">{active + 1} / {images.length}</span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="car-gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              className={`car-gallery-thumb ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`عرض صورة ${i + 1}`}
            >
              <Image src={img} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}