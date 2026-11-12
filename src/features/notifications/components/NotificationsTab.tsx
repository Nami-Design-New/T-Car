"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { FiTrash2 } from "react-icons/fi";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { IMAGES } from "@/shared/config/assets";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { useNotificationRouter } from "../hooks/useNotificationRouter";
import type { Page } from "@/shared/lib/pagination";
import { fromActionResult, type ActionResult } from "@/shared/lib/result";
import { Button } from "@/shared/ui/Button";
import { BackButton } from "@/shared/ui/BackButton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InfiniteList } from "@/shared/ui/InfiniteList";
import {
  deleteNotificationAction,
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../actions";
import type { AppNotification } from "../model";

interface Props {
  initialPage: Page<AppNotification>;
}

export default function NotificationsTab({ initialPage }: Props) {
  const t = useTranslations("account.notifications");
  const accountT = useTranslations("account");
  const locale = useLocale();
  const router = useRouter();
  const notify = useNotify();
  const errorMessage = useErrorMessage();
  const [pending, setPending] = useState<string | null>(null);
  const [optimisticallyDeleted, setOptimisticallyDeleted] = useState<
    Set<string>
  >(() => new Set());
  const fetchPage = useCallback(
    async (page: number) =>
      fromActionResult(await getNotificationsAction(page)),
    [],
  );
  const notifications = usePaginatedList(fetchPage, {
    initialPage,
    scope: "notifications.list",
  });
  const handleNotificationTap = useNotificationRouter(true);

  const run = async (
    key: string,
    action: () => Promise<ActionResult<void>>,
  ) => {
    setPending(key);
    try {
      const result = fromActionResult(await action());
      if (result.ok) {
        notify.success(result.message);
        notifications.refresh();
        router.refresh();
      } else {
        notify.error(
          result.error.kind === "validation" && result.error.serverMessage
            ? result.error.serverMessage
            : errorMessage(result.error),
        );
      }
    } finally {
      setPending(null);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value.replace(" ", "T"));
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date);
  };

  const unread = notifications.items.some((notification) => !notification.read);

  const markReadOnClick = (notification: AppNotification) => {
    if (!notification.read && pending === null) {
      void run(`read-${notification.id}`, () =>
        markNotificationReadAction(notification.id),
      );
    }
    handleNotificationTap(notification);
  };

  const deleteOptimistically = async (notification: AppNotification) => {
    if (pending !== null) return;
    setOptimisticallyDeleted((current) =>
      new Set(current).add(notification.id),
    );
    setPending(`delete-${notification.id}`);
    try {
      const result = fromActionResult(
        await deleteNotificationAction(notification.id),
      );
      if (result.ok) {
        notify.success(result.message);
        return;
      }
      setOptimisticallyDeleted((current) => {
        const next = new Set(current);
        next.delete(notification.id);
        return next;
      });
      notify.error(
        result.error.kind === "validation" && result.error.serverMessage
          ? result.error.serverMessage
          : errorMessage(result.error),
      );
    } catch (error) {
      setOptimisticallyDeleted((current) => {
        const next = new Set(current);
        next.delete(notification.id);
        return next;
      });
      notify.error(errorMessage(error));
    } finally {
      setPending(null);
    }
  };

  const visibleNotifications = notifications.items.filter(
    (notification) => !optimisticallyDeleted.has(notification.id),
  );

  return (
    <div className="border-stroke-light bg-surface-elevated rounded-xl border p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <BackButton aria-label={accountT("back")} />
          <h3 className="text-text-primary m-0 text-base font-bold">
            {t("title")}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={pending === "read-all"}
            disabled={!unread || pending !== null}
            className="border-0 bg-transparent px-0 font-semibold underline underline-offset-4"
            onClick={() => run("read-all", markAllNotificationsReadAction)}
          >
            {t("markAllRead")}
          </Button>
          {/* Delete all is intentionally hidden until product enables it. */}
          {/* <Button
            type="button"
            variant="destructive"
            size="sm"
            loading={pending === "delete-all"}
            disabled={notifications.items.length === 0 || pending !== null}
            aria-label={t("deleteAll")}
            title={t("deleteAll")}
            onClick={() => run("delete-all", deleteAllNotificationsAction)}
          >
            <FiTrash2 aria-hidden="true" />
          </Button> */}
        </div>
      </div>

      <InfiniteList
        loading={notifications.loading}
        hasMore={notifications.hasMore}
        isEmpty={visibleNotifications.length === 0}
        error={notifications.error ?? undefined}
        onLoadMore={notifications.loadMore}
        onRetry={notifications.retry}
      >
        <InfiniteList.Items className="flex flex-col">
          {visibleNotifications.map((n) => (
            <InfiniteList.Item
              key={n.id}
              className="border-stroke-light border-b last:border-0"
            >
              <div className="flex items-start gap-3 px-1 py-3.5">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 border-0 bg-transparent p-0 text-start"
                  disabled={pending !== null}
                  onClick={() => markReadOnClick(n)}
                >
                  <span className="bg-surface-card-primary grid size-10 shrink-0 place-items-center rounded-lg">
                    <Image
                      src={IMAGES.companyLogoFallback.src}
                      width={IMAGES.companyLogoFallback.width}
                      height={IMAGES.companyLogoFallback.height}
                      className="size-7 object-contain"
                      alt=""
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="text-text-primary m-0 mb-1 text-base leading-[1.6] font-semibold">
                      {n.title}
                    </p>
                    <p className="text-text-subtle m-0 mb-1 text-sm leading-6">
                      {n.message}
                    </p>
                    <span className="text-text-subtle text-[0.75rem]">
                      {formatDate(n.createdAt)}
                    </span>
                  </span>
                </button>
                <div className="flex min-h-full shrink-0 flex-col items-center justify-between gap-1">
                  {n.read ? null : (
                    <span
                      className={cn(
                        "bg-action-primary mt-3 size-2 grow rounded-full",
                        n.read && "bg-stroke-heavy",
                      )}
                      aria-label={n.read ? undefined : t("unread")}
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-status-error shrink-0 border-0 bg-transparent p-0 px-2 hover:bg-transparent!"
                    loading={pending === `delete-${n.id}`}
                    disabled={pending !== null}
                    aria-label={t("delete")}
                    onClick={() => {
                      void deleteOptimistically(n);
                    }}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </InfiniteList.Item>
          ))}
        </InfiniteList.Items>
        <InfiniteList.Loading className="mt-3">
          <NotificationSkeleton />
        </InfiniteList.Loading>
        <InfiniteList.Error />
        <InfiniteList.Empty>
          <EmptyState title={t("empty")} size="inline" />
        </InfiniteList.Empty>
      </InfiniteList>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="border-stroke-light flex animate-pulse items-start gap-3 border-b px-1 py-3.5">
      <span className="bg-stroke-light mt-1.5 size-2 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <span className="bg-stroke-light h-4 w-1/3 rounded" />
        <span className="bg-stroke-light h-3 w-3/4 rounded" />
        <span className="bg-stroke-light h-3 w-1/4 rounded" />
      </div>
    </div>
  );
}
