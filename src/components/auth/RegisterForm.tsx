'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';

type Props = {
  onBack: () => void;
  onSuccess: () => void;
};

export default function RegisterForm({ onBack, onSuccess }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    birthDate: '',
    agree: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSuccess();
  };

  return (
    <form className="register_form auth_register_form" onSubmit={handleSubmit}>
      <button
        type="button"
        className="back_btn register_back_btn"
        onClick={onBack}
        aria-label={t('auth.register.backLabel')}
      >
        <FiArrowLeft aria-hidden="true" />
      </button>

      <h2>{t('auth.register.title')}</h2>

      <p className="register_description">{t('auth.register.description')}</p>

      <div className="inputs">
        <label className="form_field" htmlFor="register-name">
          <span>{t('auth.register.fullNameLabel')}</span>
          <input
            id="register-name"
            name="name"
            type="text"
            placeholder={t('auth.register.fullNamePlaceholder')}
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form_field" htmlFor="register-email">
          <span>{t('auth.register.emailLabel')}</span>
          <input
            id="register-email"
            className="email_input"
            name="email"
            type="email"
            dir="ltr"
            placeholder={t('auth.register.emailPlaceholder')}
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form_field" htmlFor="register-birth-date">
          <span>{t('auth.register.birthDateLabel')}</span>
          <input
            id="register-birth-date"
            className="date_input"
            name="birthDate"
            type="date"
            dir="ltr"
            autoComplete="bday"
            value={form.birthDate}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      <label className="agree">
        <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} required />

        <span>{t('auth.register.agreeToTerms')}</span>
      </label>

      <button type="submit" className="auth_btn">
        {t('auth.register.submit')}
      </button>
    </form>
  );
}
