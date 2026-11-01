import { BankCard, type BankCardVariant } from "@/shared/ui/BankCard";
import { Skeleton } from "@/shared/ui/Skeleton";

interface Props {
  /** Match the card it stands in for: `option` in the picker, `listed` in the tab. */
  variant?: BankCardVariant;
}

/**
 * A bank account card's shape while accounts load. Uses the real card frame
 * so its size and spacing follow `BankCard`; hidden from assistive technology
 * (the list announces "Loading…").
 */
export default function BankAccountCardSkeleton({ variant = "listed" }: Props) {
  const option = variant === "option";

  return (
    <div aria-hidden="true">
      <BankCard variant={variant}>
        <BankCard.Details>
          <span className="flex w-full items-center gap-2">
            {option ? (
              <Skeleton shape="circle" size={28} />
            ) : (
              <Skeleton shape="rect" width={45} height={20} />
            )}
            <Skeleton width="45%" />
          </span>
          <Skeleton width="30%" height={option ? 15 : 16} />
        </BankCard.Details>
      </BankCard>
    </div>
  );
}
