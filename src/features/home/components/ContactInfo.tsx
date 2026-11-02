'use client';

import type { IconType } from 'react-icons';
import { useTranslations } from 'next-intl';
import {
  FiFacebook,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTwitter,
} from 'react-icons/fi';
import type { ContactSettings } from '@/features/settings';

interface Props {
  /** From GET /settings; a missing detail is hidden. */
  contact: ContactSettings;
}

const iconClass =
  'size-[46px] shrink-0 rounded-full bg-text-on-brand/[0.08] p-3 text-action-primary';
const socialClass =
  'flex size-11 items-center justify-center rounded-full bg-text-on-brand/[0.08] transition duration-300 hover:-translate-y-1 hover:bg-action-primary';

/** Brand names, not translated. */
const SOCIALS: { key: 'facebook' | 'instagram' | 'twitter'; label: string; icon: IconType }[] = [
  { key: 'facebook', label: 'Facebook', icon: FiFacebook },
  { key: 'instagram', label: 'Instagram', icon: FiInstagram },
  { key: 'twitter', label: 'X (Twitter)', icon: FiTwitter },
];

export default function ContactInfo({ contact }: Props) {
  const t = useTranslations('contact');
  const socials = SOCIALS.filter(({ key }) => contact[key]);

  return (
    <div className="contact_info flex flex-col rounded-xl bg-brand p-10 text-text-on-brand max-md:p-[30px]">
      <h3 className="mb-4 text-2xl font-semibold">{t('getInTouch')}</h3>

      <p className="mb-[35px] text-text-on-brand/75 leading-[1.8]">{t('description')}</p>

      <div className="info_list flex flex-col gap-[18px]">
        {contact.phone && (
          <div className="info_item flex items-center gap-4">
            <FiPhone className={iconClass} aria-hidden="true" />

            <div>
              <span className="block text-[0.8rem] text-text-on-brand/[0.65]">{t('phone')}</span>
              <a
                href={`tel:${contact.phone.replace(/[\s-]/g, '')}`}
                dir="ltr"
                className="text-[0.95rem] font-bold hover:text-action-primary"
              >
                {contact.phone}
              </a>
            </div>
          </div>
        )}

        {contact.email && (
          <div className="info_item flex items-center gap-4">
            <FiMail className={iconClass} aria-hidden="true" />

            <div className="min-w-0">
              <span className="block text-[0.8rem] text-text-on-brand/[0.65]">{t('email')}</span>
              <a
                href={`mailto:${contact.email}`}
                dir="ltr"
                className="block truncate text-[0.95rem] font-bold hover:text-action-primary"
              >
                {contact.email}
              </a>
            </div>
          </div>
        )}

        <div className="info_item flex items-center gap-4">
          <FiMapPin className={iconClass} aria-hidden="true" />

          <div>
            <span className="block text-[0.8rem] text-text-on-brand/[0.65]">{t('address')}</span>
            <strong className="text-[0.95rem]">{t('addressValue')}</strong>
          </div>
        </div>
      </div>

      {socials.length > 0 && (
        <div className="socials mt-auto flex gap-3 pt-[35px] max-md:justify-center">
          {socials.map(({ key, label, icon: Icon }) => (
            <a
              key={key}
              href={contact[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={socialClass}
            >
              <Icon aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
