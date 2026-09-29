'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

import PhoneField from '@/shared/ui/PhoneField';

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
  const [mounted, setMounted] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setPhone(currentPhone || '');
  }, [open, currentPhone]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const handleSend = () => {
    if (!phone.trim() || loading) return;

    onSendCode?.(phone);
  };

  const content = (
    <div className="modal_overlay" onClick={onClose}>
      <div
        className="auth_modal phone_modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="phone_modal_header">
          <h3>تعديل رقم الجوال</h3>

          <button
            type="button"
            className="icon_btn"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="phone_modal_body">
          <label className="field_label">
            رقم الجوال
          </label>

          <div className="phone_wrapper">
            <PhoneField
              value={phone}
              onChange={setPhone}
            />
          </div>

          {error && (
            <p className="text-danger small mt-2 mb-0" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="auth_btn"
            onClick={handleSend}
            disabled={loading}
            aria-busy={loading}
          >
            إرسال كود التحقق
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
