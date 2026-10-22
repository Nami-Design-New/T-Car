import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { sendMessage } = vi.hoisted(() => ({ sendMessage: vi.fn() }));

vi.mock("@/services/contact.api", () => ({
  contactApi: { sendMessage },
}));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import { sendContactMessageAction } from "./actions";

const validMessage = {
  name: " Ahmed ",
  email: " ahmed@example.com ",
  contactReason: "booking",
  bookingNumber: "  BK-123  ",
  message: " Need help ",
};

beforeEach(() => {
  vi.clearAllMocks();
  sendMessage.mockResolvedValue(undefined);
});

describe("sendContactMessageAction", () => {
  it("rejects malformed input before calling the service", async () => {
    await expect(
      sendContactMessageAction({
        ...validMessage,
        email: "invalid",
        contactReason: "",
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "contact.invalidEmail",
        fieldErrors: {
          email: "contact.invalidEmail",
          contactReason: "contact.reasonRequired",
        },
      },
    });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("passes normalized values to the service", async () => {
    await expect(sendContactMessageAction(validMessage)).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(sendMessage).toHaveBeenCalledWith({
      name: "Ahmed",
      email: "ahmed@example.com",
      contactReason: "booking",
      bookingNumber: "BK-123",
      message: "Need help",
    });
  });

  it("preserves a service failure as an ActionResult", async () => {
    sendMessage.mockRejectedValue(new AppError("server"));
    await expect(sendContactMessageAction(validMessage)).resolves.toEqual({
      ok: false,
      error: { kind: "server" },
    });
  });
});
