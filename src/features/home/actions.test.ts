import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { sendMessage } = vi.hoisted(() => ({ sendMessage: vi.fn() }));

vi.mock("./api", () => ({
  contactApi: { sendMessage },
}));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import { sendContactMessageAction } from "./actions";

const validMessage = {
  name: " Ahmed ",
  email: " ahmed@example.com ",
  contactReason: " Order Issue ",
  bookingNumber: "  BK-123  ",
  message: " Need help ",
};

beforeEach(() => {
  vi.clearAllMocks();
  sendMessage.mockResolvedValue({
    ok: true,
    data: null,
    message: "Contact request created successfully.",
  });
});

describe("sendContactMessageAction", () => {
  it("rejects malformed input before calling the service", async () => {
    await expect(
      sendContactMessageAction({
        ...validMessage,
        email: "invalid",
        contactReason: "x".repeat(256),
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "contact.invalidEmail",
        fieldErrors: {
          email: "contact.invalidEmail",
          contactReason: "contact.reasonTooLong",
        },
      },
    });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("passes normalized values and returns the backend message", async () => {
    await expect(sendContactMessageAction(validMessage)).resolves.toEqual({
      ok: true,
      data: null,
      message: "Contact request created successfully.",
    });
    expect(sendMessage).toHaveBeenCalledWith({
      name: "Ahmed",
      email: "ahmed@example.com",
      contactReason: "Order Issue",
      bookingNumber: "BK-123",
      message: "Need help",
    });
  });

  it("keeps a backend 422 message for the toast", async () => {
    sendMessage.mockResolvedValue({
      ok: false,
      error: new AppError("validation", undefined, 422, undefined, {
        serverMessage: "The message field is required.",
      }),
    });
    await expect(sendContactMessageAction(validMessage)).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        status: 422,
        serverMessage: "The message field is required.",
      },
    });
  });

  it("preserves a service failure as an ActionResult", async () => {
    sendMessage.mockResolvedValue({ ok: false, error: new AppError("server") });
    await expect(sendContactMessageAction(validMessage)).resolves.toEqual({
      ok: false,
      error: { kind: "server" },
    });
  });
});
