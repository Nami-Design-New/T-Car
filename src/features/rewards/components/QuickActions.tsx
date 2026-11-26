import { useTranslations } from "next-intl";
import { FiCreditCard, FiGift, FiRotateCcw } from "react-icons/fi";
import { Link } from "@/i18n/navigation";

const actions = [
  { id: "redeem", href: "/account/rewards/catalog", icon: FiGift },
  { id: "cards", href: "/account/rewards/cards", icon: FiCreditCard },
  { id: "history", href: "/account/points", icon: FiRotateCcw },
] as const;

export default function QuickActions() {
  const t = useTranslations("rewards.actions");

  return (
    <nav className="grid grid-cols-3 gap-3" aria-label={t("label")}>
      {actions.map(({ id, href, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          className="bg-surface-elevated hover:text-action-primary flex min-w-0 flex-col items-center gap-2 rounded-lg px-2 py-3.5 text-center text-xs font-semibold shadow-[0_6px_8px_rgba(31,77,153,0.08)] transition hover:-translate-y-0.5"
        >
          <span className="bg-primary-100 text-action-primary grid size-11 place-items-center rounded-lg text-[22px]">
            <Icon aria-hidden="true" />
          </span>
          <span>{t(id)}</span>
        </Link>
      ))}
    </nav>
  );
}
