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

import { contactApi, joinUsApi } from "./api";

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

describe("joinUsApi.sendJoinRequest", () => {
  const request = {
    name: "Acme Owner",
    phone: { countryCode: "+966", phone: "512345678" },
    companyName: "Acme",
    email: "owner@example.com",
    companySizeId: "1",
  };

  it("posts the national number and company_size_id to the public endpoint", async () => {
    post.mockResolvedValue({
      data: null,
      message: "Join request sent.",
      code: 200,
    });

    await expect(joinUsApi.sendJoinRequest(request)).resolves.toEqual({
      ok: true,
      data: null,
      message: "Join request sent.",
    });
    expect(post).toHaveBeenCalledWith("/join-us", {
      name: "Acme Owner",
      phone: "512345678",
      company_name: "Acme",
      email: "owner@example.com",
      company_size_id: 1,
    });
    expect(authPost).not.toHaveBeenCalled();
  });

  it("refuses a size ID that is not a positive integer without a request", async () => {
    for (const companySizeId of ["", "abc", "0", "1.5"]) {
      await expect(
        joinUsApi.sendJoinRequest({ ...request, companySizeId }),
      ).resolves.toMatchObject({
        ok: false,
        error: { kind: "validation", code: "joinUs.companySizeRequired" },
      });
    }
    expect(post).not.toHaveBeenCalled();
  });

  it("keeps a backend 422 and returns the 500 as a server error", async () => {
    const invalid = new AppError("validation", undefined, 422, undefined, {
      serverMessage: "The phone must be 9 digits and start with 5.",
    });
    post.mockRejectedValueOnce(invalid);
    await expect(joinUsApi.sendJoinRequest(request)).resolves.toEqual({
      ok: false,
      error: invalid,
    });

    const crash = new AppError("server", undefined, 500);
    post.mockRejectedValueOnce(crash);
    await expect(joinUsApi.sendJoinRequest(request)).resolves.toEqual({
      ok: false,
      error: crash,
    });
  });
});
