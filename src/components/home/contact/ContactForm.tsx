'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';;

import Button from '@/components/common/Button';
import FormInput from '@/components/common/FormInput';
import FormTextarea from '@/components/common/FormTextarea';
import PhoneField from '@/components/common/PhoneField';

export default function ContactForm() {
  const t = useTranslations();


  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log(form);
  };

  return (
    <form className="contact_form" onSubmit={handleSubmit}>
      <div className="row">
        <FormInput
          id="name"
          name="name"
          label={t('contact.name')}
          placeholder={t('contact.name')}
          value={form.name}
          onChange={handleChange}
          required
        />

        <FormInput
          id="email"
          name="email"
          type="email"
          label={t('contact.email')}
          placeholder={t('contact.email')}
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="field mt-3">
        <label className="form_label">
          {t('contact.phone')}
          <span>*</span>
        </label>

        <PhoneField
          value={form.phone}
          onChange={(phone) =>
            setForm((prev) => ({
              ...prev,
              phone,
            }))
          }
          defaultCountry="sa"
        />
      </div>

      <FormTextarea
        id="message"
        name="message"
        label={t('contact.message')}
        placeholder={t('contact.message')}
        value={form.message}
        onChange={handleChange}
        rows={6}
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="contact_btn"
      >
        {t('contact.send')}
      </Button>
    </form>
  );
}