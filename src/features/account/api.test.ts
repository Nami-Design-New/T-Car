import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  serverHttp: { get },
}));

import { accountApi } from "./api";

const envelope = (data: unknown) => ({
  data,
  message: "Profile retrieved successfully.",
  code: 200,
});

describe("accountApi.getProfile", () => {
  it("maps the live profile response into the account model", async () => {
    get.mockResolvedValue(
      envelope({
        user: {
          name: "Ahmed Abdullah",
          email: "ahmed@domain.com",
          phone: "500000000",
          phone_code: "+966",
          birth_date: "1993-03-15",
          license: { id: 1 },
        },
      }),
    );

    await expect(accountApi.getProfile()).resolves.toEqual({
      fullName: "Ahmed Abdullah",
      email: "ahmed@domain.com",
      birthDate: "1993-03-15",
      phone: "+966500000000",
      licenseUploaded: true,
    });
    expect(get).toHaveBeenCalledWith("/profile");
  });

  it("maps a missing license to false", async () => {
    get.mockResolvedValue(
      envelope({
        user: {
          name: "Ahmed Abdullah",
          email: "ahmed@domain.com",
          phone: "500000000",
          phone_code: "+966",
          birth_date: "1993-03-15",
          license: null,
        },
      }),
    );

    await expect(accountApi.getProfile()).resolves.toMatchObject({
      licenseUploaded: false,
    });
  });

  it("rejects an unexpected response shape", async () => {
    get.mockResolvedValue(envelope({ user: { name: "Ahmed" } }));

    await expect(accountApi.getProfile()).rejects.toEqual(
      new AppError("server"),
    );
  });
});
