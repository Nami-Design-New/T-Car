import type { AppNotification } from "../model";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/cn";

interface Props {
  notifications: AppNotification[];
}

export default function NotificationsTab({ notifications }: Props) {
  const t = useTranslations("account.notifications");

  return (
    <div className="account-panel rounded-xl border border-stroke-light bg-surface-elevated p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="m-0 text-[1.05rem] font-bold text-text-primary">
          {t("title")}
        </h3>
        <button
          type="button"
          className="border-0 bg-transparent text-[0.82rem] font-semibold text-action-primary hover:underline"
        >
          {t("markAllRead")}
        </button>
      </div>

      <div className="flex flex-col">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 border-b border-stroke-light px-1 py-3.5 last:border-0"
          >
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full bg-action-primary",
                n.read && "bg-stroke-heavy",
              )}
            />
            <div>
              <p className="m-0 mb-1 text-[0.88rem] leading-[1.6] text-text-primary">
                {n.title}
              </p>
              <span className="text-[0.75rem] text-text-subtle">{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
