"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ICONS } from "@/shared/config/assets";
import { useNotificationStore } from "../notificationStore";

const notificationIcon = ICONS.notification;

interface Props {
  initialUnreadCount: number;
}

/** The server supplies the first count; foreground FCM updates it immediately. */
export default function NotificationBell({ initialUnreadCount }: Props) {
  const t = useTranslations("account.notifications");
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount, setUnreadCount]);

  return (
    <Link
      href="/account/notifications"
      className="bg-surface-on-background text-text-primary hover:bg-surface-card-primary hover:text-action-primary focus-visible:outline-action-primary/20 relative ms-3 grid h-11 w-11 shrink-0 place-items-center rounded-lg shadow-[inset_0px_8px_12px_0px_#FCFEFA,inset_0px_-4px_4px_0px_#0C0C0C26] transition duration-300 focus-visible:outline-3 focus-visible:outline-offset-2"
      aria-label={`${t("title")}: ${t("unreadCount", { count: unreadCount })}`}
    >
      <span className="relative inline-flex shrink-0">
        <Image
          src={notificationIcon.src}
          width={notificationIcon.width}
          height={notificationIcon.height}
          aria-hidden="true"
          alt={t("title")}
        />
        {unreadCount > 0 && (
          <span className="border-surface-background bg-status-error text-text-on-action absolute -inset-e-2 -top-2 grid h-6 w-max min-w-6 shrink-0 place-items-center rounded-full border-2 px-1.5 text-xs leading-none font-extrabold whitespace-nowrap">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </span>
    </Link>
  );
}
