'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import PhoneField from '@/shared/ui/PhoneField';
import logo from '@assets/images/fav.svg';
import whatsappIcon from '@assets/icons/whatsapp-icon.svg';

type Props = {
  /** Sends the code to this phone. */
  onNext: (phone: string) => void;
  loading?: boolean;
  /** Already translated. */
  error?: string;
};

export default function LoginForm({ onNext, loading = false, error }: Props) {
  const t = useTranslations();

  const [phone, setPhone] = useState('+966');

  return (
    <div className="login_form">
      <div className="logo">
        <Image src={logo} alt={t('auth.login.logoAlt')} width={70} height={70} />
      </div>

      <h2>{t('auth.login.title')}</h2>
      <p>{t('auth.login.description')}</p>

      <div className="phone_wrapper">
        <PhoneField
          value={phone}
          onChange={setPhone}
          searchPlaceholder={t('auth.login.countrySearchPlaceholder')}
          inputAriaLabel={t('auth.login.phoneLabel')}
        />
      </div>

      {error && (
        <p className="text-danger small mt-2 mb-0" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="auth_btn auth_btn--whatsapp"
        onClick={() => onNext(phone)}
        disabled={loading}
      >
        <span className="auth_btn_label">{t('auth.login.sendViaWhatsApp')}</span>
        <span className="auth_btn_icon" aria-hidden="true">
          <Image src={whatsappIcon} alt="" width={18} height={18} />
        </span>
      </button>

      <div className="bottom_text">
        {t('auth.login.noAccount')}
        <button type="button" onClick={() => onNext(phone)} disabled={loading}>
          {t('auth.login.createAccount')}
        </button>
      </div>
    </div>
  );
}
