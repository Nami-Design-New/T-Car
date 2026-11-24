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
import type { RewardPerkIcon } from "../model";

interface Props {
  icon: RewardPerkIcon;
}

export default function PerkIcon({ icon }: Props) {
  switch (icon) {
    case "calendar":
      return <FiCalendar aria-hidden="true" />;
    case "percent":
      return <FiPercent aria-hidden="true" />;
    case "card":
      return <FiCreditCard aria-hidden="true" />;
    case "tag":
      return <FiTag aria-hidden="true" />;
    case "car":
      return <PiCarProfile aria-hidden="true" />;
    case "support":
      return <FiHeadphones aria-hidden="true" />;
    case "gift":
      return <FiGift aria-hidden="true" />;
    case "sparkle":
      return <FiStar aria-hidden="true" />;
  }
}
