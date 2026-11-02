import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { post, authPost, siteGet } = vi.hoisted(() => ({
  post: vi.fn(),
  authPost: vi.fn(),
  siteGet: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  publicServerHttp: { post },
  publicSiteServerHttp: { get: siteGet },
  serverHttp: { post: authPost },
}));

import { contactApi, joinUsApi, partnersApi, whyUsApi } from "./api";

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

describe("partnersApi.listPartners", () => {
  it("reads the public site endpoint in the locale and maps the fields", async () => {
    // Observed GET /partners record (docs/api/home-api.md).
    siteGet.mockResolvedValue({
      data: [
        {
          id: 3,
          name: "test 0",
          image_url: "https://t-car.app/storage/partners/logo.webp",
        },
      ],
      message: "",
      code: 200,
    });

    await expect(partnersApi.listPartners("ar")).resolves.toEqual([
      {
        id: "3",
        name: "test 0",
        imageUrl: "https://t-car.app/storage/partners/logo.webp",
      },
    ]);
    expect(siteGet).toHaveBeenCalledWith("/partners", {
      headers: { "Accept-Language": "ar" },
    });
  });

  it("throws a server error for a record without an image URL", async () => {
    siteGet.mockResolvedValue({
      data: [{ id: 1, name: "test" }],
      message: "",
      code: 200,
    });
    await expect(partnersApi.listPartners("en")).rejects.toMatchObject({
      kind: "server",
    });
  });
});

describe("whyUsApi.listCards", () => {
  it("reads the public site endpoint in the locale and maps the fields", async () => {
    // Observed GET /why-us record (docs/api/home-api.md).
    siteGet.mockResolvedValue({
      data: [
        {
          id: 1,
          image_url: "https://t-car.app/storage/why-us/card.jpg",
          title: "Top rental companies",
          description: "We work with the best car rental companies.",
        },
      ],
      message: "",
      code: 200,
    });

    await expect(whyUsApi.listCards("en")).resolves.toEqual([
      {
        id: "1",
        title: "Top rental companies",
        description: "We work with the best car rental companies.",
        imageUrl: "https://t-car.app/storage/why-us/card.jpg",
      },
    ]);
    expect(siteGet).toHaveBeenCalledWith("/why-us", {
      headers: { "Accept-Language": "en" },
    });
  });

  it("throws a server error for a record without a title", async () => {
    siteGet.mockResolvedValue({
      data: [{ id: 1, image_url: "https://t-car.app/x.jpg", description: "" }],
      message: "",
      code: 200,
    });
    await expect(whyUsApi.listCards("ar")).rejects.toMatchObject({
      kind: "server",
    });
  });
});
