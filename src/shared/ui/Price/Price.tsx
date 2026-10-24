import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/cn";
import { formatAmount } from "@/shared/lib/format";
import { ICONS } from "@/shared/config/assets";
const sarIcon = ICONS.riyal;

const ICON_SIZES = { sm: 14, md: 16, lg: 20, xl: 30 } as const;

export interface Props {
  amount: number;
  size?: keyof typeof ICON_SIZES;
  /** A crossed-out previous price, e.g. before a discount. */
  strike?: boolean;
  className?: string;
  amountClassName?: string;
}

/** An amount in SAR: the number with the riyal sign (the app's only currency). */
export function Price({
  amount,
  size = "md",
  strike = false,
  amountClassName,
  className,
}: Props) {
  const t = useTranslations("states.price");
  const iconSize = ICON_SIZES[size];
  const Wrapper = strike ? "del" : "span";

  return (
    <Wrapper
      className={cn(
        "price inline-flex items-center gap-1.5 whitespace-nowrap",
        `price--${size}`,
        strike && "price--strike text-text-subtle line-through",
        className,
      )}
    >
      <span className={amountClassName}>{formatAmount(amount)}</span>
      <Image
        src={sarIcon}
        alt={t("sar")}
        width={iconSize}
        height={iconSize}
        className="price__currency currency_icon shrink-0 object-contain"
      />
    </Wrapper>
  );
}
