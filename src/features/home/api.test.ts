import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { post, authPost } = vi.hoisted(() => ({
  post: vi.fn(),
  authPost: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  publicServerHttp: { post },
  serverHttp: { post: authPost },
}));

import { contactApi } from "./api";

// Observed POST /contact-us success (docs/api/contact-join-us-api.md §3.1).
const created = {
  data: null,
  message: "Contact request created successfully.",
  code: 200,
};

const message = {
  name: "Ahmed",
  email: "ahmed@example.com",
  contactReason: "Order Issue",
  bookingNumber: "BK-123",
  message: "Need help",
};

beforeEach(() => vi.clearAllMocks());

describe("contactApi.sendMessage", () => {
  it("posts the API's field names to the public endpoint (no token)", async () => {
    post.mockResolvedValue(created);

    await contactApi.sendMessage(message);
    expect(post).toHaveBeenCalledWith("/contact-us", {
      name: "Ahmed",
      email: "ahmed@example.com",
      message: "Need help",
      reason: "Order Issue",
      order_number: "BK-123",
    });
    expect(authPost).not.toHaveBeenCalled();
  });

  it("leaves out an absent reason and booking number", async () => {
    post.mockResolvedValue(created);

    await contactApi.sendMessage({
      ...message,
      contactReason: undefined,
      bookingNumber: undefined,
    });
    expect(post).toHaveBeenCalledWith("/contact-us", {
      name: "Ahmed",
      email: "ahmed@example.com",
      message: "Need help",
    });
  });

  it("returns the backend message on success", async () => {
    post.mockResolvedValue(created);
    await expect(contactApi.sendMessage(message)).resolves.toEqual({
      ok: true,
      data: null,
      message: "Contact request created successfully.",
    });
  });

  it("returns a server error for an answer that is not an envelope", async () => {
    post.mockResolvedValue("ok");
    await expect(contactApi.sendMessage(message)).resolves.toMatchObject({
      ok: false,
      error: { kind: "server" },
    });
  });

  it("returns the client's errors, keeping a backend 422 message", async () => {
    const invalid = new AppError("validation", undefined, 422, undefined, {
      serverMessage: "The message field is required.",
    });
    post.mockRejectedValue(invalid);
    await expect(contactApi.sendMessage(message)).resolves.toEqual({
      ok: false,
      error: invalid,
    });
  });
});
