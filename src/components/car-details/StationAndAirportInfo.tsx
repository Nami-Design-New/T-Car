'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiExternalLink, FiHome, FiX } from 'react-icons/fi';
import { LuPlane } from 'react-icons/lu';
import branchIcon from '@assets/icons/branch-car.svg';

interface Props {
  showroom: string;
  address?: string;
  distanceKm?: number;
}

const branches = [
  { id: 1, name: 'فرع جدة', address: 'جدة، شارع الملك عبدالله بن عبدالعزيز', distanceKm: 2.9 },
  { id: 2, name: 'فرع جدة', address: 'جدة، شارع الملك عبدالله بن عبدالعزيز', distanceKm: 2.9 },
  { id: 3, name: 'فرع جدة', address: 'جدة، شارع الملك عبدالله بن عبدالعزيز', distanceKm: 2.9 },
];

export default function StationAndAirportInfo({
  showroom,
  address = 'جدة، شارع الملك عبدالله بن عبدالعزيز',
  distanceKm = 2.9,
}: Props) {
  const [showBranches, setShowBranches] = useState(false);

  useEffect(() => {
    if (!showBranches) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowBranches(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showBranches]);

  return (
    <>
      <section className="station-airport-info" aria-label="معلومات الاستلام والفرع">
        <div className="station-airport-info-banner">
          <div className="station-airport-info-heading">
            <LuPlane aria-hidden="true" />
            <strong>مواقف تي كار في المطار</strong>
          </div>
          <p>خدمة الاستلام والإرجاع السريعة في مواقف السيارات بالمطار</p>
        </div>

        <div className="station-airport-info-branch">
          <div className="station-airport-info-branch-main">
            <span className="station-airport-info-eyebrow">
              <FiHome aria-hidden="true" />
              أقرب فرع لك
            </span>
            <h3>{showroom}</h3>
            <p>{address}</p>
          </div>

          <div className="station-airport-info-branch-meta">
            <button
              type="button"
              className="station-airport-info-branches-trigger"
              aria-label={`عرض تفاصيل ${showroom}`}
              onClick={() => setShowBranches(true)}
            >
              <FiExternalLink aria-hidden="true" />
              الفروع
            </button>
            <span>{distanceKm.toLocaleString('ar-SA')} كم</span>
          </div>
        </div>
      </section>

      {showBranches && (
        <div
          className="modal_overlay branches-info-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowBranches(false);
          }}
        >
          <div
            className="branches-info-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="branches-info-title"
          >
            <div className="branches-info-handle" aria-hidden="true" />

            <div className="branches-info-header">
              <h2 id="branches-info-title">الفروع</h2>
              <button
                type="button"
                className="branches-info-close"
                aria-label="إغلاق قائمة الفروع"
                onClick={() => setShowBranches(false)}
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <div className="branches-info-list">
              {branches.map((branch) => (
                <article className="branches-info-item" key={branch.id}>
                  <span className="branches-info-icon" aria-hidden="true">
                    <Image src={branchIcon} alt="" width={24} height={24} />
                  </span>

                  <div className="branches-info-content">
                    <h3>{branch.name}</h3>
                    <p>{branch.address}</p>
                  </div>

                  <span className="branches-info-distance">
                    {branch.distanceKm.toLocaleString('ar-SA')} كم
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
