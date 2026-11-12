import Image from "next/image";
import { ICONS } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
import { formatAmount } from "@/shared/lib/format";

export interface PriceRowProps {
  label: string;
  amount: number;
  hint?: string;
  labelClassName?: string;
  hintClassName?: string;
  total?: boolean;
}

/** A labelled SAR amount for booking and order price breakdowns. */
export function PriceRow({
  label,
  amount,
  hint,
  labelClassName,
  hintClassName,
  total = false,
}: PriceRowProps) {
  return (
    <div
      className={cn(
        "border-stroke-light flex items-center justify-between gap-3 border-x-0 border-t-0 border-dashed py-2 last:border-0",
        total ? "border-b-0" : "border-b",
      )}
    >
      <span className={cn("text-text-subtle text-sm", labelClassName)}>
        {label}
      </span>
      {hint ? (
        <span className={cn("text-text-subtle mx-auto", hintClassName)}>
          {hint}
        </span>
      ) : null}
      <span
        className={cn(
          "flex items-center justify-between tabular-nums",
          total
            ? "text-action-primary text-2xl font-bold"
            : "text-text-primary text-lg font-semibold",
        )}
      >
        <span className="ms-1 flex items-center gap-1">
          {formatAmount(amount)}
          <Image
            src={ICONS.riyal.src}
            width={ICONS.riyal.width}
            height={ICONS.riyal.height}
            alt=""
            aria-hidden="true"
          />
        </span>
      </span>
    </div>
  );
}
