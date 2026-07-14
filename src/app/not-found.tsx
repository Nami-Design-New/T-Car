'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { FiHome, FiSearch } from 'react-icons/fi';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="not-found-page">
      <div className="container-tcar not-found-content">
        <div className="not-found-illustration">
          <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
            {/* الطريق */}
            <path
              d="M0 180 Q 200 140 400 180"
              stroke="var(--nf-road)"
              strokeWidth="34"
              fill="none"
              strokeLinecap="round"
            />

            <path
              d="M0 180 Q 200 140 400 180"
              stroke="var(--nf-road-line)"
              strokeWidth="3"
              strokeDasharray="14 12"
              fill="none"
              strokeLinecap="round"
            />

            {/* لافتة */}
            <line
              x1="120"
              y1="60"
              x2="120"
              y2="150"
              stroke="var(--nf-pole)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <g className="nf-sign nf-sign-1">
              <rect
                x="70"
                y="55"
                width="100"
                height="28"
                rx="6"
                fill="var(--nf-secondary)"
              />

              <text
                x="120"
                y="74"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#fff"
              >
                404
              </text>
            </g>

            <g className="nf-sign nf-sign-2">
              <rect
                x="80"
                y="88"
                width="120"
                height="24"
                rx="6"
                fill="var(--nf-primary)"
              />

              <text
                x="140"
                y="104"
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#fff"
              >
                {t('notFound.lost')}
              </text>
            </g>

            {/* السيارة */}
            <g className="nf-car">
              <path
                d="M260 155 h70 a10 10 0 0 1 10 8 l4 14 h6 a6 6 0 0 1 6 6 v10 a4 4 0 0 1 -4 4 h-8 a14 14 0 0 1 -28 0 h-40 a14 14 0 0 1 -28 0 h-6 a4 4 0 0 1 -4 -4 v-16 a10 10 0 0 1 10 -10 z"
                fill="var(--nf-secondary)"
              />

              <path
                d="M275 155 l6 -18 h34 l10 18 z"
                fill="var(--nf-secondary)"
                opacity="0.85"
              />

              <path
                d="M280 154 l5 -13 h26 l7 13 z"
                fill="#eaf3ff"
              />

              <circle
                cx="288"
                cy="197"
                r="10"
                fill="var(--nf-dark)"
              />

              <circle
                cx="288"
                cy="197"
                r="4"
                fill="#ccc"
              />

              <circle
                cx="336"
                cy="197"
                r="10"
                fill="var(--nf-dark)"
              />

              <circle
                cx="336"
                cy="197"
                r="4"
                fill="#ccc"
              />
            </g>

            {/* علامة الاستفهام */}
            <text
              x="300"
              y="130"
              className="nf-question q1"
              fontSize="20"
              fontWeight="800"
              fill="var(--nf-primary)"
            >
              ?
            </text>
          </svg>
        </div>

        <span className="not-found-eyebrow">
          {t('notFound.error')}
        </span>

        <h1>
          {t('notFound.title')}
        </h1>

        <p>
          {t('notFound.description')}
        </p>

        <div className="not-found-actions">
          <Link
            href="/"
            className="btn btn-primary btn-md"
          >
            <FiHome />
            {t('notFound.home')}
          </Link>

          <Link
            href="/cities"
            className="btn btn-outline btn-md"
          >
            <FiSearch />
            {t('notFound.browseCities')}
          </Link>
        </div>
      </div>
    </div>
  );
}