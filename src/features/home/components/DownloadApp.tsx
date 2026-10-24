'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { IMAGES } from '@/shared/config/assets';
const phone = IMAGES.appPhone;
const appStore = IMAGES.appStore;
const playStore = IMAGES.googlePlay;

export default function DownloadApp() {
  const t = useTranslations('downloadApp');

  return (
    <section className="download_app section overflow-visible">
      <div className="container-tcar">
        <div className="download_app_card relative flex min-h-[420px] items-center justify-end overflow-visible rounded-2xl bg-[linear-gradient(135deg,var(--color-brand),#1a6bd4)] px-[70px] py-[60px] text-text-on-brand before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_90%_20%,rgba(31,127,250,0.18),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_35%)] before:content-[''] max-lg:min-h-0 max-lg:flex-col max-lg:px-[25px] max-lg:py-10 max-lg:text-center">

          <div className="download_app_image absolute -top-25 end-[70px] z-[5] w-[380px] max-lg:relative max-lg:inset-auto max-lg:mx-auto max-lg:mb-[25px] max-lg:-mt-25 max-lg:w-[260px]">
            <Image
              src={phone}
              alt={t('imageAlt')}
              width={470}
              height={760}
              priority
              className="block h-auto w-full"
            />
          </div>

          <div className="download_app_content relative z-10 me-auto w-[48%] text-start max-lg:m-0 max-lg:w-full max-lg:text-center">

            <span className="tag mb-[18px] inline-flex rounded-full bg-text-on-brand/[0.12] px-[18px] py-2 font-bold">
              {t('tag')}
            </span>

            <h2 className="mb-[18px] text-[46px] font-extrabold leading-[1.25] max-lg:text-[34px]">
              {t('title')}
            </h2>

            <p className="mb-[35px] text-[17px] leading-[1.9] text-text-on-brand/[0.85]">
              {t('description')}
            </p>

            <div className="download_buttons flex flex-wrap items-center gap-[18px] max-lg:justify-center">

              <a href="#" className="block transition duration-300 hover:-translate-y-1 hover:scale-[1.03]">
                <Image
                  src={appStore}
                  alt={t('appStoreAlt')}
                  width={180}
                  height={54}
                  className="h-auto w-[180px] rounded-md transition duration-300 hover:shadow-[0_12px_30px_rgba(30,30,30,0.25)]"
                />
              </a>

              <a href="#" className="block transition duration-300 hover:-translate-y-1 hover:scale-[1.03]">
                <Image
                  src={playStore}
                  alt={t('playStoreAlt')}
                  width={180}
                  height={54}
                  className="h-auto w-[180px] rounded-md transition duration-300 hover:shadow-[0_12px_30px_rgba(30,30,30,0.25)]"
                />
              </a>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
