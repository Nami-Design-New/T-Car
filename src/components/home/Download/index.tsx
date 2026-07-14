'use client';

import Image from 'next/image';

import phone from '../../../assets/images/app-phone.png';
import appStore from '../../../assets/images/Apple Store.webp';
import playStore from '../../../assets/images/Play Sotre.webp';

export default function DownloadApp() {
  return (
    <section className="download_app section">
      <div className="container-tcar">
        <div className="download_app_card">

          <div className="download_app_image">
            <Image
              src={phone}
              alt="T-Car App"
              width={470}
              height={760}
              priority
            />
          </div>

          <div className="download_app_content">

            <span className="tag">
              تطبيق T-Car
            </span>

            <h2>
              حمّل التطبيق واحجز سيارتك في دقائق
            </h2>

            <p>
              ابحث عن أفضل السيارات، قارن الأسعار، احجز بسهولة،
              واستلم سيارتك أينما كنت داخل المملكة.
            </p>

            <div className="download_buttons">

              <a href="#">
                <Image
                  src={appStore}
                  alt="Download on the App Store"
                  width={180}
                  height={54}
                />
              </a>

              <a href="#">
                <Image
                  src={playStore}
                  alt="Get it on Google Play"
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