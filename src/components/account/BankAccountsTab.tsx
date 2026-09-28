'use client';

import Image from 'next/image';
import Lottie from 'lottie-react';
import { PiBank } from 'react-icons/pi';
import type { BankAccount } from '@app-types/car';
import Loader from '@/shared/ui/Loader';

import deleteIcon from '@assets/icons/bank-delete.svg';
import editIcon from '@assets/icons/bank-edit.svg';
import emptyAnimation from '@assets/images/non_data.json';

interface Props {
  accounts: BankAccount[];
  loading?: boolean;
  onAdd: () => void;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
}

export default function BankAccountsTab({
  accounts,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="account-panel">
        <Loader fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="account-panel bank_accounts_panel">
      <h3 className="bank_accounts_title">الحسابات البنكية</h3>

      {accounts.length === 0 ? (
        <div className="bank_accounts_empty">
          <Lottie animationData={emptyAnimation} loop className="bank_accounts_empty_animation" />
          <p>لا توجد حسابات بنكية مضافة</p>
        </div>
      ) : (
        <ul className="bank_accounts_list">
          {accounts.map((account) => (
            <li key={account.id} className="bank_account_card">
              <div className="bank_account_info">
                <div className="bank_account_bank">
                  {account.logo ? (
                    <Image src={account.logo} alt="" width={45} height={20} className="bank_account_logo" />
                  ) : (
                    <PiBank className="bank_account_logo_fallback" aria-hidden="true" />
                  )}
                  <span>{account.bankName}</span>
                </div>
                <span className="bank_account_number" dir="ltr">
                  {account.maskedNumber}
                </span>
              </div>

              <div className="bank_account_actions">
                <button
                  type="button"
                  className="bank_account_action"
                  onClick={() => onEdit(account)}
                  aria-label={`تعديل ${account.bankName}`}
                >
                  <Image src={editIcon} alt="" width={20} height={20} />
                </button>
                <button
                  type="button"
                  className="bank_account_action"
                  onClick={() => onDelete(account)}
                  aria-label={`حذف ${account.bankName}`}
                >
                  <Image src={deleteIcon} alt="" width={20} height={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="bank_accounts_add wallet_topup_submit btn w-100" onClick={onAdd}>
        إضافة حساب بنكي
      </button>
    </div>
  );
}
