'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { PiBank } from 'react-icons/pi';
import type { BankAccount } from '@app-types/car';

interface Props {
  open: boolean;
  accounts: BankAccount[];
  onClose: () => void;
  onSelect: (account: BankAccount) => void;
}

export default function BankSelectModal({ open, accounts, onClose, onSelect }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="modal_overlay" onClick={onClose}>
      <div className="bank_select_modal bg-white" onClick={(event) => event.stopPropagation()}>
        <span className="wallet_topup_drag_handle" aria-hidden="true" />

        <div className="wallet_topup_header d-flex align-items-center justify-content-between">
          <h3 className="m-0">اختر البنك</h3>
          <button
            type="button"
            className="wallet_topup_close btn btn-light d-grid p-0"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <FiX />
          </button>
        </div>

        {accounts.length === 0 ? (
          <p className="bank_select_empty">لا توجد حسابات بنكية مضافة</p>
        ) : (
          <ul className="bank_select_list">
            {accounts.map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  className="bank_select_option"
                  onClick={() => onSelect(account)}
                >
                  <span className="bank_select_name">
                    {account.logo ? (
                      <Image src={account.logo} alt="" width={28} height={28} />
                    ) : (
                      <PiBank aria-hidden="true" />
                    )}
                    {account.bankName}
                  </span>
                  <span className="bank_select_number" dir="ltr">
                    {account.maskedNumber}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}
