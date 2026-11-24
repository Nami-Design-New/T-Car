import { useFormatter, useTranslations } from "next-intl";
import { FiStar } from "react-icons/fi";
import { FiRotateCcw } from "react-icons/fi";
import { Link } from "@/i18n/navigation";

interface Props {
  balance: number;
  showHistory?: boolean;
}

export default function RedeemableBalanceCard({
  balance,
  showHistory = false,
}: Props) {
  const t = useTranslations("rewards.balance");
  const actionsT = useTranslations("rewards.actions");
  const format = useFormatter();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-[linear-gradient(90deg,#0b2a66,#0f4fb8_60%,#1f7ffa)] px-4 py-3.5 text-white shadow-[0_6px_9px_rgba(31,77,153,0.15)]">
      <div className="flex items-center gap-3">
        {" "}
        <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-white/60 bg-[linear-gradient(135deg,#fbe39a,#d9a21b)] text-xl text-[#8b6500] shadow-sm">
          <FiStar aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] text-white/75">{t("label")}</p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <strong className="text-2xl">{format.number(balance)}</strong>
            <span className="text-xs">{t("unit")}</span>
          </p>
        </div>
      </div>
      {showHistory && (
        <Link
          href="/account/points"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-2 text-[11px] font-semibold text-white hover:bg-white/25"
        >
          <FiRotateCcw aria-hidden="true" />
          {actionsT("history")}
        </Link>
      )}
    </div>
  );
}
