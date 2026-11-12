"use client";

import { useCallback } from "react";
import { useTopLoader } from "nextjs-toploader";
import { useRouter } from "@/i18n/navigation";
import { notificationDestination, type NotificationPayload } from "../router";

/** Client router shared by notification rows and Firebase message taps. */
export function useNotificationRouter(signedIn: boolean) {
  const router = useRouter();
  const loader = useTopLoader();
  return useCallback(
    (payload: NotificationPayload) => {
      const destination = notificationDestination(payload);
      // NextTopLoader observes clicks, but `router.push()` needs an explicit start.
      loader.start();
      if (!signedIn && destination.requiresAuth) {
        router.push(
          `/?auth=login&next=${encodeURIComponent(destination.path)}`,
        );
        return;
      }
      router.push(destination.path);
    },
    [loader, router, signedIn],
  );
}
