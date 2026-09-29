'use client';

import Image from 'next/image';
import { PiBank } from 'react-icons/pi';
import { Dialog } from '@/shared/ui/Dialog';
import type { BankAccount } from '@/features/bank-accounts';

interface Props {
  open: boolean;
  accounts: BankAccount[];
  onClose: () => void;
  onSelect: (account: BankAccount) => void;
}

export default function BankSelectModal({ open, accounts, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onClose={onClose} className="bank_select_modal" placement="bottom-sheet">
      <span className="wallet_topup_drag_handle" aria-hidden="true" />
      <Dialog.Header className="wallet_topup_header d-flex align-items-center justify-content-between">
        <Dialog.Title>اختر البنك</Dialog.Title>
        <Dialog.Close className="wallet_topup_close btn btn-light d-grid p-0" />
      </Dialog.Header>

      <Dialog.Body>
        {accounts.length === 0 ? (
          <p className="bank_select_empty">لا توجد حسابات بنكية مضافة</p>
        ) : (
          <ul className="bank_select_list">
            {accounts.map((account) => (
              <li key={account.id}>
                <button type="button" className="bank_select_option" onClick={() => onSelect(account)}>
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
      </Dialog.Body>
    </Dialog>
  );
}
