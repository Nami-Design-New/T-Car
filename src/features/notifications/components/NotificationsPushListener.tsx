"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useNotificationRouter } from "../hooks/useNotificationRouter";
import { useNotificationStore } from "../notificationStore";
import { storeFirebaseTokenAction } from "../actions";
import {
  getFirebaseMessagingToken,
  listenForFirebaseMessages,
} from "../firebase";

interface Props {
  locale: string;
}

/** Keeps the authenticated browser registered for FCM and refreshes live UI. */
export default function NotificationsPushListener({ locale }: Props) {
  const t = useTranslations("account.notifications");
  const handleNotificationTap = useNotificationRouter(true);
  const incrementUnreadCount = useNotificationStore(
    (state) => state.incrementUnreadCount,
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;
    const serviceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type !== "notification-tap") return;
      handleNotificationTap({
        action: event.data.action ?? null,
        orderId:
          event.data.order_id == null ? null : String(event.data.order_id),
      });
    };

    const params = new URLSearchParams(window.location.search);
    const action = params.get("notification_action");
    if (action !== null) {
      handleNotificationTap({
        action,
        orderId: params.get("notification_order_id"),
      });
    }
    navigator.serviceWorker.addEventListener("message", serviceWorkerMessage);

    void (async () => {
      try {
        const token = await getFirebaseMessagingToken();
        if (!active || !token) return;
        await storeFirebaseTokenAction(token, locale === "ar" ? "ar" : "en");
        unsubscribe = await listenForFirebaseMessages((payload) => {
          const title = payload.notification?.title ?? payload.data?.title;
          toast.success(title, {
            action: {
              label: t("open"),
              onClick: () =>
                handleNotificationTap({
                  action: payload.data?.action ?? null,
                  orderId:
                    payload.data?.order_id == null
                      ? null
                      : String(payload.data.order_id),
                }),
            },
          });
          incrementUnreadCount();
        });
      } catch {
        // Push delivery is optional; the server notification centre stays usable.
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
      navigator.serviceWorker.removeEventListener(
        "message",
        serviceWorkerMessage,
      );
    };
  }, [handleNotificationTap, incrementUnreadCount, locale, t]);

  return null;
}
