import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { sendMessage, sendJoinRequest } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  sendJoinRequest: vi.fn(),
}));

vi.mock("./api", () => ({
  contactApi: { sendMessage },
  joinUsApi: { sendJoinRequest },
}));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import {
  sendContactMessageAction,
  sendJoinRequestAction,
} from "./actions";

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

describe("Join Us actions", () => {
  const request = {
    name: " Acme Owner ",
    phone: { countryCode: "+966", phone: "0512345678" },
    companyName: " Acme ",
    email: " owner@example.com ",
    companySizeId: "1",
  };

  it("sends the parsed request and returns the backend message", async () => {
    sendJoinRequest.mockResolvedValue({
      ok: true,
      data: null,
      message: "Join request sent.",
    });
    await expect(sendJoinRequestAction(request)).resolves.toEqual({
      ok: true,
      data: null,
      message: "Join request sent.",
    });
    expect(sendJoinRequest).toHaveBeenCalledWith({
      name: "Acme Owner",
      phone: { countryCode: "+966", phone: "512345678" },
      companyName: "Acme",
      email: "owner@example.com",
      companySizeId: "1",
    });
  });

  it("rejects malformed input before calling the API", async () => {
    await expect(
      sendJoinRequestAction({ ...request, name: "A", companySizeId: "" }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        fieldErrors: {
          name: "joinUs.nameTooShort",
          companySizeId: "joinUs.companySizeRequired",
        },
      },
    });
    expect(sendJoinRequest).not.toHaveBeenCalled();
  });

  it("keeps a backend 422 message for the toast", async () => {
    sendJoinRequest.mockResolvedValue({
      ok: false,
      error: new AppError("validation", undefined, 422, undefined, {
        serverMessage: "The phone must be 9 digits and start with 5.",
      }),
    });
    await expect(sendJoinRequestAction(request)).resolves.toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        serverMessage: "The phone must be 9 digits and start with 5.",
      },
    });
  });
});
