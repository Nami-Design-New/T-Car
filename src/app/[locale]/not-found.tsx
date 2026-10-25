"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FiHome, FiSearch } from "react-icons/fi";

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[calc(100vh-100px)] items-center justify-center py-20 text-center max-md:py-[60px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center px-4">
        <div className="mb-6 w-[min(400px,90%)] max-md:w-[min(320px,90%)]">
          <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 180 Q 200 140 400 180"
              stroke="var(--color-stroke-heavy)"
              strokeWidth="34"
              fill="none"
              strokeLinecap="round"
            />

            <path
              d="M0 180 Q 200 140 400 180"
              stroke="var(--color-text-on-brand)"
              strokeWidth="3"
              strokeDasharray="14 12"
              fill="none"
              strokeLinecap="round"
            />

            <line
              x1="120"
              y1="60"
              x2="120"
              y2="150"
              stroke="var(--color-text-subtle)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <g className="origin-[120px_60px] animate-[nfSwing_3s_ease-in-out_infinite] motion-reduce:animate-none">
              <rect
                x="70"
                y="55"
                width="100"
                height="28"
                rx="6"
                fill="var(--color-action-primary)"
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

            <g className="origin-[120px_60px] animate-[nfSwing_3s_ease-in-out_infinite_0.15s] motion-reduce:animate-none">
              <rect
                x="80"
                y="88"
                width="120"
                height="24"
                rx="6"
                fill="var(--color-brand)"
              />

              <text
                x="140"
                y="104"
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#fff"
              >
                {t("notFound.lost")}
              </text>
            </g>

            <g className="animate-[nfDrift_3.5s_ease-in-out_infinite] motion-reduce:animate-none">
              <path
                d="M260 155 h70 a10 10 0 0 1 10 8 l4 14 h6 a6 6 0 0 1 6 6 v10 a4 4 0 0 1 -4 4 h-8 a14 14 0 0 1 -28 0 h-40 a14 14 0 0 1 -28 0 h-6 a4 4 0 0 1 -4 -4 v-16 a10 10 0 0 1 10 -10 z"
                fill="var(--color-action-primary)"
              />

              <path
                d="M275 155 l6 -18 h34 l10 18 z"
                fill="var(--color-action-primary)"
                opacity="0.85"
              />

              <path d="M280 154 l5 -13 h26 l7 13 z" fill="#eaf3ff" />

              <circle
                cx="260"
                cy="197"
                r="10"
                fill="var(--color-text-primary)"
              />

              <circle cx="260" cy="197" r="4" fill="#ccc" />

              <circle
                cx="330"
                cy="197"
                r="10"
                fill="var(--color-text-primary)"
              />

              <circle cx="330" cy="197" r="4" fill="#ccc" />
            </g>

            <text
              x="300"
              y="130"
              className="animate-[nfFloat_2.2s_ease-in-out_infinite_0.3s] motion-reduce:animate-none"
              fontSize="20"
              fontWeight="800"
              fill="var(--color-brand)"
            >
              ?
            </text>
          </svg>
        </div>

        <span className="mb-4 inline-flex items-center justify-center rounded-full bg-surface-card-primary px-[0.9rem] py-[0.35rem] text-[0.8rem] font-bold text-action-primary">
          {t("notFound.error")}
        </span>

        <h1 className="mt-0 mb-3 text-[clamp(1.7rem,3vw,2.2rem)] font-extrabold text-text-primary">
          {t("notFound.title")}
        </h1>

        <p className="mx-auto mt-0 mb-8 max-w-[430px] text-base leading-[1.8] text-text-subtle max-md:text-[0.95rem]">
          {t("notFound.description")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 max-md:w-full max-md:flex-col">
          <Link
            href="/"
            className="inline-flex h-[38px] items-center justify-center rounded-md border border-action-primary bg-action-primary px-5 font-semibold text-text-on-action hover:opacity-90 max-md:w-full"
          >
            <span>
              <FiHome className="me-2" />
              {t("notFound.home")}
            </span>
          </Link>

          <Link
            href="/cities"
            className="inline-flex h-[38px] items-center justify-center rounded-md border border-stroke-light bg-transparent px-5 font-semibold text-text-primary hover:bg-neutral-100 max-md:w-full"
          >
            <span>
              <FiSearch className="me-2" />
              {t("notFound.browseCities")}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
