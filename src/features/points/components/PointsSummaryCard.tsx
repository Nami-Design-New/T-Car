// import Image from 'next/image';
// import { useTranslations } from 'next-intl';
// import { Link } from '@/i18n/navigation';
// import { POINTS_ICONS } from '@/shared/config/assets';
// import type { PointsSummary } from '../model';
// import { FaChevronCircleDown, FaChevronCircleLeft, FaChevronLeft } from 'react-icons/fa';

// interface Props {
//   summary: PointsSummary;
// }

// export default function PointsSummaryCard({ summary }: Props) {
//   const t = useTranslations('account.points');

//   return (
//     <Link href="/account/points" className="points-summary-card">
//       <Image
//         src={POINTS_ICONS.coins.src}
//         width={POINTS_ICONS.coins.width}
//         height={POINTS_ICONS.coins.height}
//         alt="coins image"
//       />

//       <div className="points-summary-card__body">
//         <div className="points-summary-card__topline">
//           <span className="points-summary-card__title">{t('title')}</span>
//           <span className="points-summary-card__balance">
//             {summary.balance} {t('unit')}
//             <FaChevronLeft />
//           </span>
//         </div>
//         <div className="points-summary-card__description">{t('cardDescription')}</div>
//       </div>
//     </Link>
//   );
// }
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { POINTS_ICONS } from '@/shared/config/assets';
import type { PointsSummary } from '../model';
import { FaChevronLeft } from 'react-icons/fa';

interface Props {
  summary: PointsSummary;
}

export default function PointsSummaryCard({ summary }: Props) {
  const t = useTranslations('account.points');

  return (
    <Link href="/account/points" className="points-summary-card">
      <div className="points-summary-card__topline">
        <span className="points-summary-card__title">{t('title')}</span>
        <span className="points-summary-card__balance">
          {summary.balance} {t('unit')}
          <FaChevronLeft className="points-summary-card__chevron" />
        </span>
      </div>

      <div className="points-summary-card__bottom">
        <div className="points-summary-card__description">{t('cardDescription')}</div>
      </div>
      <div className="points-summary-card__icon-wrapper">
        <Image
          src={POINTS_ICONS.coins.src}
          // width={POINTS_ICONS.coins.width}
          // height={POINTS_ICONS.coins.height}
          alt="coins image"
          fill={true}
        />
      </div>
    </Link>
  );
}
