import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { formatAmount } from '@/shared/lib/format';
import { ICONS } from '@/shared/config/assets';
const sarIcon = ICONS.riyal;
import './Price.scss';

const ICON_SIZES = { sm: 14, md: 16, lg: 20, xl: 30 } as const;

interface Props {
  amount: number;
  size?: keyof typeof ICON_SIZES;
  /** A crossed-out previous price, e.g. before a discount. */
  strike?: boolean;
  className?: string;
}

/** An amount in SAR: the number with the riyal sign (the app's only currency). */
export function Price({ amount, size = 'md', strike = false, className }: Props) {
  const t = useTranslations('states.price');
  const iconSize = ICON_SIZES[size];
  const Wrapper = strike ? 'del' : 'span';

  return (
    <Wrapper className={cn('price', `price--${size}`, strike && 'price--strike', className)}>
      <span className="price__amount">{formatAmount(amount)}</span>
      <Image
        src={sarIcon}
        alt={t('sar')}
        width={iconSize}
        height={iconSize}
        className="price__currency currency_icon"
      />
    </Wrapper>
  );
}
