'use client';

import { useTranslations } from 'next-intl';;
import {
  FiFacebook,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTwitter,
} from 'react-icons/fi';

export default function ContactInfo() {
  const t = useTranslations();


  return (
    <div className="contact_info">
      <h3>{t('contact.getInTouch')}</h3>

      <p>{t('contact.description')}</p>

      <div className="info_list">
        <div className="info_item">
          <FiPhone />

          <div>
            <span>{t('contact.phone')}</span>
            <strong>+966 500000000</strong>
          </div>
        </div>

        <div className="info_item">
          <FiMail />

          <div>
            <span>{t('contact.email')}</span>
            <strong>info@tcar.com</strong>
          </div>
        </div>

        <div className="info_item">
          <FiMapPin />

          <div>
            <span>{t('contact.address')}</span>
            <strong>Riyadh, Saudi Arabia</strong>
          </div>
        </div>
      </div>

      <div className="socials">
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
  );
}