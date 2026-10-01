'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import phone from '@/assets/images/app-phone.png';
import appStore from '@/assets/images/Apple Store.webp';
import playStore from '@/assets/images/Play Sotre.webp';

export default function DownloadApp() {
  const t = useTranslations('downloadApp');

  return (
    <section className="download_app section">
      <div className="container-tcar">
        <div className="download_app_card">

          <div className="download_app_image">
            <Image
              src={phone}
              alt={t('imageAlt')}
              width={470}
              height={760}
              priority
            />
          </div>

          <div className="download_app_content">

            <span className="tag">
              {t('tag')}
            </span>

            <h2>
              {t('title')}
            </h2>

            <p>
              {t('description')}
            </p>

            <div className="download_buttons">

              <a href="#">
                <Image
                  src={appStore}
                  alt={t('appStoreAlt')}
                  width={180}
                  height={54}
                />
              </a>

              <a href="#">
                <Image
                  src={playStore}
                  alt={t('playStoreAlt')}
                  width={180}
                  height={54}
                />
              </a>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
