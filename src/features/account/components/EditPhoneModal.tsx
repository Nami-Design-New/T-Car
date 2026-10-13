'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { PhoneField } from '@/shared/ui/PhoneField';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  currentPhone?: string;
  onSendCode?: (fullNumber: string) => void | Promise<void>;
  loading?: boolean;
  /** Already translated; the dialog stays open with the number. */
  error?: string;
}

export default function EditPhoneModal({
  open,
  onClose,
  currentPhone = '',
  onSendCode,
  loading = false,
  error,
}: Props) {
  const t = useTranslations('account.editPhone');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!open) return;

    setPhone(currentPhone || '');
  }, [open, currentPhone]);

  const handleSend = async () => {
    const fullNumber = phone.trim();
    if (!fullNumber || loading) return;

    await onSendCode?.(fullNumber);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="auth_modal"
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <Dialog.Header className="">
        <Dialog.Title>{t('title')}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body className="">
        <label className="field_label">{t('phone')}</label>

        <div className="phone_wrapper">
          <PhoneField value={phone} onChange={setPhone} />
        </div>

        {error && (
          <p className="text-danger small mt-2 mb-0" role="alert">
            {error}
          </p>
        )}

        <Button
          type="button"
          className="mt-2 w-100"
          size="lg"

          onClick={handleSend}
          disabled={loading}
          aria-busy={loading}
        >
          {t('sendCode')}
        </Button>
      </Dialog.Body>
    </Dialog>
  );
}
