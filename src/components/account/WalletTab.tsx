import { formatCurrency } from '@utils/index';
import type { WalletTransaction } from '@app-types/car';
import Image from 'next/image';

import walletIcon from '@assets/icons/Wallet.svg';
import sarIcon from '@assets/icons/sar.svg';
interface Props {
  balance: number;
  transactions: WalletTransaction[];
  onTopUp: () => void;
}

const TYPE_LABELS: Record<WalletTransaction['type'], string> = {
  topup: 'شحن',
  refund: 'استرداد',
  payment: 'دفع',
};

export default function WalletTab({ balance, transactions, onTopUp }: Props) {
  return (
    <div className="account-panel">
    <div className="wallet_balance_card">

  <div className="wallet_balance_label">
    <Image
      src={walletIcon}
      alt="Wallet"
      width={22}
      height={22}
    />

    <span>رصيدك</span>
  </div>

  <div className="wallet_balance_amount">
    <h2>{formatCurrency(balance)}</h2>

    <Image
      src={sarIcon}
      alt="SAR"
      width={34}
      height={34}
      className="currency_icon"
    />
  </div>

  <button
    type="button"
    className="wallet_topup_btn"
    onClick={onTopUp}
  >
    شحن الرصيد
  </button>

</div>
<div className="wallet_history">
  <h3 className="wallet_history_title">
    سجل الرصيد
  </h3>

      <div className="wallet_history_list">
        {transactions.map((tx) => (
          <div key={tx.id} className={`wallet_history_item ${tx.type}`}>
            <div className="wallet_history_item_body">
              <span className="wallet_history_item_title">{TYPE_LABELS[tx.type]}</span>
              <span className="wallet_history_item_meta">#{tx.reference} - {tx.date}</span>
            </div>

            <span className={`wallet_history_item_amount ${tx.type === 'payment' ? 'negative' : ''}`}>
              {tx.type === 'payment' ? '-' : '+'} {formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
        </div>

  );
}