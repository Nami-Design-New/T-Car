'use client';

import { useTranslations } from 'next-intl';
import {
  FiFacebook,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTwitter,
} from 'react-icons/fi';

export default function ContactInfo() {
  const t = useTranslations('contact');

  return (
    <div className="contact_info flex flex-col rounded-xl bg-brand p-10 text-text-on-brand max-md:p-[30px]">
      <h3 className="mb-4 text-2xl font-semibold">{t('getInTouch')}</h3>

      <p className="mb-[35px] text-text-on-brand/75 leading-[1.8]">{t('description')}</p>

      <div className="info_list flex flex-col gap-[18px]">
        <div className="info_item flex items-center gap-4">
          <FiPhone className="size-[46px] shrink-0 rounded-full bg-text-on-brand/[0.08] p-3 text-action-primary" />

          <div>
            <span className="block text-[0.8rem] text-text-on-brand/[0.65]">{t('phone')}</span>
            <strong className="text-[0.95rem]">{t('phoneValue')}</strong>
          </div>
        </div>

        <div className="info_item flex items-center gap-4">
          <FiMail className="size-[46px] shrink-0 rounded-full bg-text-on-brand/[0.08] p-3 text-action-primary" />

          <div>
            <span className="block text-[0.8rem] text-text-on-brand/[0.65]">{t('email')}</span>
            <strong className="text-[0.95rem]">{t('emailValue')}</strong>
          </div>
        </div>

        <div className="info_item flex items-center gap-4">
          <FiMapPin className="size-[46px] shrink-0 rounded-full bg-text-on-brand/[0.08] p-3 text-action-primary" />

          <div>
            <span className="block text-[0.8rem] text-text-on-brand/[0.65]">{t('address')}</span>
            <strong className="text-[0.95rem]">{t('addressValue')}</strong>
          </div>
        </div>
      </div>

      <div className="socials mt-auto flex gap-3 pt-[35px] max-md:justify-center">
        <a href="#" className="flex size-11 items-center justify-center rounded-full bg-text-on-brand/[0.08] transition duration-300 hover:-translate-y-1 hover:bg-action-primary">
          <FiFacebook />
        </a>

        <a href="#" className="flex size-11 items-center justify-center rounded-full bg-text-on-brand/[0.08] transition duration-300 hover:-translate-y-1 hover:bg-action-primary">
          <FiInstagram />
        </a>

        <a href="#" className="flex size-11 items-center justify-center rounded-full bg-text-on-brand/[0.08] transition duration-300 hover:-translate-y-1 hover:bg-action-primary">
          <FiTwitter />
        </a>
      </div>
    </div>
  );
}
