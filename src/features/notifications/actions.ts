"use server";

import { auth } from "@/auth";
import { AppError } from "@/shared/lib/errors";
import { reportError } from "@/shared/lib/report";
import {
  fail,
  ok,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import {
  deleteAllNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  storeFirebaseToken,
  getNotifications,
} from "./api";
import type { Page } from "@/shared/lib/pagination";
import type { AppNotification } from "./model";

function requireNotificationId(id: string): string {
  if (!/^\d+$/.test(id)) throw new AppError("validation");
  return id;
}

async function run(
  scope: string,
  write: () => Promise<Awaited<ReturnType<typeof markAllNotificationsRead>>>,
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const result = await write();
    if (!result.ok) throw result.error;
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope });
    return toActionResult(fail(error));
  }
}

/** Loads one notifications page for the shared infinite list. */
export async function getNotificationsAction(
  page: number,
): Promise<ActionResult<Page<AppNotification>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    return toActionResult(ok((await getNotifications(page)).page));
  } catch (error) {
    reportError(error, { scope: "notifications.list" });
    return toActionResult(fail(error));
  }
}

export async function markNotificationReadAction(id: string) {
  return run("notifications.markRead", () =>
    markNotificationRead(requireNotificationId(id)),
  );
}

export async function markAllNotificationsReadAction() {
  return run("notifications.markAllRead", markAllNotificationsRead);
}

export async function deleteNotificationAction(id: string) {
  return run("notifications.delete", () =>
    deleteNotification(requireNotificationId(id)),
  );
}

export async function deleteAllNotificationsAction() {
  return run("notifications.deleteAll", deleteAllNotifications);
}

export async function storeFirebaseTokenAction(
  token: string,
  language: "ar" | "en",
): Promise<ActionResult<void>> {
  return run("notifications.storeFirebaseToken", () => {
    if (token.trim() === "" || token.length > 4096)
      throw new AppError("validation");
    return storeFirebaseToken(token, language);
  });
}
