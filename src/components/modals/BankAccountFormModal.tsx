'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { PiBank } from 'react-icons/pi';
import type { Bank, BankAccount, BankAccountPayload } from '@app-types/car';
import { normalizeIban } from '@services/bankAccounts.service';
import arrowDownIcon from '@assets/icons/arrow-down.svg';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  banks: Bank[];
  /** The account being edited; its values pre-fill the form. */
  account?: BankAccount;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: BankAccountPayload) => void;
}

const COPY = {
  add: { title: 'إضافة حساب بنكي', submit: 'إضافة' },
  edit: { title: 'تعديل حساب بنكي', submit: 'حفظ' },
};

function BankLogo({ bank }: { bank: Bank }) {
  return bank.logo ? (
    <Image src={bank.logo} alt="" width={45} height={20} className="bank_form_logo" />
  ) : (
    <PiBank className="bank_form_logo_fallback" aria-hidden="true" />
  );
}

/** Add / edit bank account sheet: bank picker plus IBAN field. */
export default function BankAccountFormModal({
  open,
  mode,
  banks,
  account,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const [bankId, setBankId] = useState('');
  const [iban, setIban] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    setBankId(account?.bankId ?? '');
    setIban(account?.iban ?? '');
    setPickerOpen(false);
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, account]);

  if (!open || !mounted) return null;

  const copy = COPY[mode];
  const selectedBank = banks.find((bank) => bank.id === bankId);
  const normalizedIban = normalizeIban(iban);
  const unchanged =
    mode === 'edit' && account?.bankId === bankId && account?.iban === normalizedIban;
  const valid = Boolean(selectedBank) && normalizedIban !== '' && !unchanged;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valid && !loading) onConfirm({ bankId, iban: normalizedIban });
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handlePick = (bank: Bank) => {
    setBankId(bank.id);
    setPickerOpen(false);
  };

  return createPortal(
    <div className="modal_overlay" onClick={handleClose}>
      <div className="bank_form_modal bg-white" onClick={(event) => event.stopPropagation()}>
        <span className="wallet_topup_drag_handle" aria-hidden="true" />

        <div className="wallet_topup_header d-flex align-items-center justify-content-between">
          <h3 className="m-0">{copy.title}</h3>
          <button
            type="button"
            className="wallet_topup_close btn btn-light d-grid p-0"
            onClick={handleClose}
            aria-label="إغلاق"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bank_form_field">
            <span className="bank_form_label" id="bank_form_bank_label">
              اسم البنك
            </span>
            <div className="bank_form_picker">
              <button
                type="button"
                className={`bank_form_control ${pickerOpen ? 'open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={pickerOpen}
                aria-labelledby="bank_form_bank_label"
                onClick={() => setPickerOpen((value) => !value)}
              >
                {selectedBank ? (
                  <span className="bank_form_value">
                    <BankLogo bank={selectedBank} />
                    {selectedBank.name}
                  </span>
                ) : (
                  <span className="bank_form_placeholder">اختر البنك</span>
                )}
                <Image src={arrowDownIcon} alt="" width={18} height={18} className="bank_form_arrow" />
              </button>

              {pickerOpen && (
                <ul className="bank_form_options" role="listbox" aria-labelledby="bank_form_bank_label">
                  {banks.map((bank) => (
                    <li key={bank.id} role="option" aria-selected={bank.id === bankId}>
                      <button
                        type="button"
                        className={`bank_form_option ${bank.id === bankId ? 'selected' : ''}`}
                        onClick={() => handlePick(bank)}
                      >
                        <BankLogo bank={bank} />
                        {bank.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bank_form_field">
            <label className="bank_form_label" htmlFor="bank_form_iban">
              رقم الآيبان
            </label>
            <input
              id="bank_form_iban"
              className="bank_form_control bank_form_input"
              type="text"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              value={iban}
              onChange={(event) => setIban(event.target.value.toUpperCase())}
              placeholder="SA0000000000000000000000"
              required
            />
          </div>

          <button type="submit" className="wallet_topup_submit btn w-100" disabled={!valid || loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-label="جاري التنفيذ" />
            ) : (
              copy.submit
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
