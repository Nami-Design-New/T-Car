'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';;
import PhoneField from '@/components/common/PhoneField';
import logo from '@assets/images/fav.svg';
import whatsappIcon from '@assets/icons/whatsapp-icon.svg';

type Props = {
  onNext: () => void;
  onRegister: () => void;
};

export default function LoginForm({ onNext, onRegister }: Props) {
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

      <button type="button" className="auth_btn auth_btn--whatsapp" onClick={onNext}>
        <span className="auth_btn_label">{t('auth.login.sendViaWhatsApp')}</span>
        <span className="auth_btn_icon" aria-hidden="true">
          <Image src={whatsappIcon} alt="" width={18} height={18} />
        </span>
      </button>

      <div className="bottom_text">
        {t('auth.login.noAccount')}
        <button type="button" onClick={onRegister}>
          {t('auth.login.createAccount')}
        </button>
      </div>
    </div>
  );
}
