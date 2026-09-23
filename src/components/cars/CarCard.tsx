'use client';

import { Link } from '@/i18n/navigation';
import type { CarListing } from '@app-types/car';
import giftImage from '@assets/images/gift.svg';
import RiyalIcon from '@assets/ryal.svg';
import { classNames } from '@utils/index';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FaStar } from 'react-icons/fa6';
import { FiMapPin } from 'react-icons/fi';
import { LuPlane } from 'react-icons/lu';
import { MdTrain } from 'react-icons/md';

const priceFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

export interface CarCardProps {
  car: CarListing;
  className?: string;
  imageSizes?: string;
  priority?: boolean;
}

export default function CarCard({
  car,
  className,
  imageSizes = '(max-width: 767px) 86vw, (max-width: 1199px) 45vw, 350px',
  priority = false,
}: CarCardProps) {
  const t = useTranslations('carCard');
  const detailsHref = `/cars/${car.id}` as const;
  const discountPercent = car.originalPrice
    ? Math.max(1, Math.round((1 - car.pricePerDay / car.originalPrice) * 100))
    : null;

  return (
    <article className={classNames('car-card', className)}>
      <Link
        href={detailsHref}
        className="car-card__link"
        aria-label={t('viewCar', { brand: car.brand, name: car.name })}
      >
        <div className="car-card__media">
          <Image
            src={car.image}
            alt={`${car.brand} ${car.name}`}
            fill
            sizes={imageSizes}
            priority={priority}
          />

          {car.pickupPoint ? (
            <span className="car-card__pickup">
              {car.pickupPoint === 'airport' ? (
                <LuPlane aria-hidden="true" />
              ) : (
                <MdTrain aria-hidden="true" />
              )}
              {car.pickupPoint === 'airport' ? t('airportPickup') : t('stationPickup')}
            </span>
          ) : null}

          {discountPercent ? (
            <div className="car-card__offer">
              <span className="car-card__offer-copy">
                <Image src={giftImage} alt={t('gift')} />
                <span>
                  <small>{t('limitedOffer')}</small>
                  <strong>{t('saveNow')}</strong>
                </span>
              </span>
              <span className="car-card__offer-value">
                <strong>{discountPercent}%</strong>
                <small>{t('discount')}</small>
              </span>
            </div>
          ) : null}
        </div>

        <div className="car-card__content">
          <h3 className="car-card__title">
            {car.brand} {car.name}
          </h3>

          <div className="car-card__meta">
            <span className="car-card__showroom">
              <FiMapPin aria-hidden="true" />
              <span>{car.showroom}</span>
            </span>
            <span className="car-card__year">{car.year}</span>
          </div>

          <div className="car-card__footer">
            <span className="car-card__price">
              <span className="car-card__current-price">
                <strong>{priceFormatter.format(car.pricePerDay)}</strong>
                <Image src={RiyalIcon} alt="ريال" className="car-card__riyal-icon" />
                <small>{t('perDay')}</small>
              </span>
              {car.originalPrice ? (
                <del className="car-card__old-price">
                  <span>{priceFormatter.format(car.originalPrice)}</span>
                  <Image src={RiyalIcon} alt="ريال" className="car-card__riyal-icon" />
                </del>
              ) : null}
            </span>
            <span className="car-card__rating" aria-label={t('rating', { rating: car.rating })}>
              <span>{car.rating}</span>
              <FaStar aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
