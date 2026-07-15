'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDownload,
} from 'react-icons/fi';

import logo from '@assets/images/fav.svg';
import appStore from '../../../assets/images/Apple Store.webp';
import googlePlay from '../../../assets/images/Play Sotre.webp';

import { NAV_LINKS } from '@constants/index';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container-tcar footer_top">
        <div className="footer_brand">
          <Image src={logo} alt="T-Car" width={160} height={48} />

          <p>{t('hero.subtitle')}</p>

          <div className="footer_socials">
            <a href="#">
              <FiFacebook />
            </a>

            <a href="#">
              <FiInstagram />
            </a>

            <a href="#">
              <FiTwitter />
            </a>
          </div>
        </div>

        <div className="footer_links">
          <h4>{t('footer.quickLinks')}</h4>

          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{t(link.label)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer_contact">
          <h4>{t('footer.contactUs')}</h4>

          <div className="contact_item">
            <FiMail />
            <a href="mailto:info@tcar.com">info@tcar.com</a>
          </div>

          <div className="contact_item">
            <FiPhone />
            <a href="tel:+966500000000">+966 500000000</a>
          </div>

          <div className="contact_item">
            <FiMapPin />
            <a
              href="https://maps.google.com/?q=Riyadh,Saudi Arabia"
              target="_blank"
              rel="noopener noreferrer"
            >
              Riyadh, Saudi Arabia
            </a>
          </div>
        </div>

        <div className="footer_apps">
          <h4>
            <FiDownload />
            حمل التطبيق
          </h4>

          <a href="#">
            <Image src={appStore} alt="App Store" width={170} />
          </a>

          <a href="#">
            <Image src={googlePlay} alt="Google Play" width={170} />
          </a>
        </div>
      </div>

      <div className="footer_bottom container">
        <div className="footer_copy">
          © {year} T-Car. {t('footer.rights')}
        </div>
        <div className="footer_bottom_links">
          <Link href="/terms">{t('footer.terms')}</Link>

          <Link href="/privacy">{t('footer.privacy')}</Link>
        </div>
      </div>
    </footer>
  );
}
