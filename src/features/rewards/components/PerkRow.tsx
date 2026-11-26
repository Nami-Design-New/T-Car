import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FiCheck, FiLock } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";

interface Props {
  title: string;
  description?: string;
  icon: ReactNode;
  unlocked: boolean;
  href?: string;
}

export default function PerkRow({
  title,
  description,
  icon,
  unlocked,
  href,
}: Props) {
  const t = useTranslations("rewards");
  const content = (
    <>
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-[14px] text-[22px]",
          !unlocked
            ? "text-text-subtle bg-neutral-100"
            : "bg-surface-card-primary text-action-primary",
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <strong
          className={cn(
            "block text-sm font-semibold",
            !unlocked && "text-text-subtle",
          )}
        >
          {title}
        </strong>
        {description && (
          <span className="text-text-subtle block text-[11px]">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-xl text-sm",
          !unlocked
            ? "bg-neutral-100 text-neutral-400"
            : "bg-success-50 text-status-success",
        )}
      >
        {unlocked ? (
          <FiCheck aria-hidden="true" />
        ) : (
          <FiLock aria-hidden="true" />
        )}
        <span className="sr-only">
          {t(unlocked ? "perkState.unlocked" : "perkState.locked")}
        </span>
      </span>
    </>
  );
  const className =
    "border-stroke-light bg-surface-elevated flex items-center gap-3 rounded-[18px] border p-3.5";
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
