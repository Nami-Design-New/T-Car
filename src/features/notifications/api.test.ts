import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";
import { mapNotificationsResponse, mapUnreadCountResponse } from "./api";

vi.mock("@/services/http/server", () => ({
  serverHttp: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const notification = {
  id: 536,
  title: "Booking modified",
  message: "Your modification request was approved and applied.",
  action: "modification_applied",
  order_id: 304,
  is_read: false,
  created_at: "2026-11-12 13:28:50",
};

describe("notification API response mapping", () => {
  it("maps the live paginated notification response", () => {
    expect(
      mapNotificationsResponse({
        code: 200,
        message: "Notifications fetched successfully.",
        data: {
          notifications: [notification],
          unread_count: 36,
          pagination: {
            current_page: 1,
            last_page: 9,
            per_page: 5,
            total: 41,
            from: 1,
            to: 5,
          },
        },
      }),
    ).toEqual({
      unreadCount: 36,
      page: {
        page: 1,
        lastPage: 9,
        total: 41,
        items: [
          {
            id: "536",
            title: notification.title,
            message: notification.message,
            action: notification.action,
            orderId: "304",
            read: false,
            createdAt: notification.created_at,
          },
        ],
      },
    });
  });

  it("rejects malformed notification data rather than rendering it", () => {
    expect(() =>
      mapNotificationsResponse({
        code: 200,
        message: "ok",
        data: { notifications: [{ ...notification, is_read: "no" }] },
      }),
    ).toThrow(AppError);
  });

  it("maps the unread count without loading the full list", () => {
    expect(
      mapUnreadCountResponse({
        code: 200,
        message: "Unread notification count fetched successfully.",
        data: { unread_count: 36 },
      }),
    ).toBe(36);
  });
});
