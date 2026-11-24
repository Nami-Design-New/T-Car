import { useFormatter, useTranslations } from "next-intl";
import { FiStar } from "react-icons/fi";

interface Props {
  balance: number;
}

export default function RedeemableBalanceCard({ balance }: Props) {
  const t = useTranslations("rewards.balance");
  const format = useFormatter();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-[linear-gradient(90deg,#0b2a66,#0f4fb8_60%,#1f7ffa)] px-4 py-3.5 text-white shadow-[0_6px_9px_rgba(31,77,153,0.15)]">
      <div>
        <p className="text-[11px] text-white/75">{t("label")}</p>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <strong className="text-2xl">{format.number(balance)}</strong>
          <span className="text-xs">{t("unit")}</span>
        </p>
      </div>
      <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-white/60 bg-[linear-gradient(135deg,#fbe39a,#d9a21b)] text-xl text-[#8b6500] shadow-sm">
        <FiStar aria-hidden="true" />
      </span>
    </div>
  );
}
