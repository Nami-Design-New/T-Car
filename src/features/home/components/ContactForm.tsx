'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';

import { Button } from '@/shared/ui/Button';
import { FormInput, FormSelect, FormTextarea } from '@/shared/ui/Form';
import type { ContactMessage } from '../model';
import { useSendContactMessage } from '../hooks/useSendContactMessage';

const EMPTY_FORM: ContactMessage = {
  name: '',
  email: '',
  contactReason: '',
  bookingNumber: '',
  message: '',
};

export default function ContactForm() {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const { submitting, send } = useSendContactMessage();

  const [form, setForm] = useState<ContactMessage>(EMPTY_FORM);
  const [status, setStatus] = useState<{ sent: true } | { error: AppError } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setStatus(null);
    const result = await send(form);
    if (result.ok) {
      setForm(EMPTY_FORM);
      setStatus({ sent: true });
    } else {
      setStatus({ error: result.error });
    }
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

      <div className="row">
        <FormSelect
          id="contactReason"
          name="contactReason"
          label={t('contact.reason')}
          options={[
            { value: 'booking', label: t('contact.reasons.booking') },
            { value: 'car-rental', label: t('contact.reasons.carRental') },
            { value: 'payment', label: t('contact.reasons.payment') },
            { value: 'partnership', label: t('contact.reasons.partnership') },
            { value: 'other', label: t('contact.reasons.other') },
          ]}
          value={form.contactReason}
          onChange={handleChange}
          required
        />

        <FormInput
          id="bookingNumber"
          name="bookingNumber"
          label={t('contact.bookingNumber')}
          placeholder={t('contact.bookingNumber')}
          value={form.bookingNumber}
          onChange={handleChange}
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

      {status && 'error' in status && (
        <p className="text-danger small mt-3 mb-0" role="alert">
          {errorMessage(status.error)}
        </p>
      )}
      {status && 'sent' in status && (
        <p className="text-success small mt-3 mb-0" role="status">
          {t('contact.sent')}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="contact_btn"
        disabled={submitting}
      >
        {submitting ? t('contact.sending') : t('contact.send')}
      </Button>
    </form>
  );
}
