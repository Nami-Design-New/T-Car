import { PiCarProfile } from "react-icons/pi";
import {
  FiCalendar,
  FiPercent,
  FiCreditCard,
  FiTag,
  FiHeadphones,
  FiGift,
  FiStar,
} from "react-icons/fi";
interface Props {
  perkKey: string;
}

export default function PerkIcon({ perkKey }: Props) {
  switch (perkKey) {
    case "monthly_points":
    case "points_every_days":
      return <FiCalendar aria-hidden="true" />;
    case "monthly_contract_discount":
      return <FiPercent aria-hidden="true" />;
    case "booking_wallet_refund":
      return <FiCreditCard aria-hidden="true" />;
    case "monthly_discount_code":
      return <FiTag aria-hidden="true" />;
    case "free_delivery_every_bookings":
    case "free_delivery_pickup_all":
      return <PiCarProfile aria-hidden="true" />;
    case "vip_support_24h":
      return <FiHeadphones aria-hidden="true" />;
    case "diamond_offers":
      return <FiGift aria-hidden="true" />;
    case "bronze_welcome":
      return <FiStar aria-hidden="true" />;
    default:
      return <FiGift aria-hidden="true" />;
  }
}
