import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";
import { phoneCountriesApi } from "./api";

const saudi = {
  id: 1,
  title: "Saudi Arabia",
  phone_code: "+966",
  image: "https://t-car.test/flags/sa.jpg",
};
const jordan = { id: 8, title: "Jordan", phone_code: "+962", image: null };
const egypt = {
  id: 7,
  title: "Egypt",
  phone_code: "+20",
  image: "https://t-car.test/flags/eg.jpg",
};

function page(data: unknown[], current_page = 1, last_page = 1) {
  return {
    data,
    pagination: {
      current_page,
      last_page,
      per_page: 10,
      total: 9,
      from: 1,
      to: data.length,
    },
    message: "Fetched successfully.",
    code: 200,
  };
}

function respond(body: unknown) {
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify(body), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const requestedUrl = (fetchMock: ReturnType<typeof respond>) =>
  new URL(String(fetchMock.mock.calls[0][0]), "https://app.test");

afterEach(() => vi.unstubAllGlobals());

describe("phoneCountriesApi.listCountries", () => {
  it("maps countries and turns pagination into a cursor", async () => {
    const fetchMock = respond(page([saudi, jordan], 1, 3));

    const result = await phoneCountriesApi.listCountries({
      search: " Sau ",
      limit: 2,
    });

    expect(result).toEqual({
      items: [
        {
          id: "1",
          name: "Saudi Arabia",
          countryCode: "+966",
          flagUrl: "https://t-car.test/flags/sa.jpg",
        },
        {
          id: "8",
          name: "Jordan",
          countryCode: "+962",
          flagUrl: "/images/placeholders/flag.svg",
        },
      ],
      nextCursor: "2",
    });
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toMatch(/\/countries$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "1",
      per_page: "2",
      search: "Sau",
    });
  });

  it("requests the cursor's page and ends on the last page", async () => {
    const fetchMock = respond(page([egypt], 3, 3));

    const result = await phoneCountriesApi.listCountries({
      search: "",
      cursor: "3",
      limit: 4,
    });

    expect(result.nextCursor).toBeNull();
    const params = requestedUrl(fetchMock).searchParams;
    expect(params.get("page")).toBe("3");
    expect(params.has("search")).toBe(false);
  });

  it("filters a calling-code search locally, because the backend searches titles only", async () => {
    const fetchMock = respond(page([saudi, jordan, egypt]));

    const result = await phoneCountriesApi.listCountries({
      search: "+96",
      limit: 1,
    });

    expect(result.items.map((country) => country.countryCode)).toEqual([
      "+966",
      "+962",
    ]);
    expect(result.nextCursor).toBeNull();
    const params = requestedUrl(fetchMock).searchParams;
    expect(params.get("per_page")).toBe("100");
    expect(params.has("search")).toBe(false);
  });

  it("rejects an invalid cursor without a request", async () => {
    const fetchMock = respond(page([]));

    await expect(
      phoneCountriesApi.listCountries({ search: "", cursor: "x", limit: 10 }),
    ).rejects.toMatchObject({
      kind: "validation",
      code: "phoneCountries.invalidCursor",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a response with an unexpected shape", async () => {
    respond(page([{ id: "1", title: "Saudi Arabia" }]));

    const error = await phoneCountriesApi
      .listCountries({ search: "", limit: 10 })
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).kind).toBe("server");
  });
});
