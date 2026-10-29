import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";
import { createHttpClient } from "./client";

function respond(status: number, body?: unknown, raw?: string) {
  // A new Response per call: a body can be read only once.
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(raw ?? (body === undefined ? null : JSON.stringify(body)), {
        status,
        headers: { "Content-Type": raw ? "text/html" : "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function failure(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

const envelope = (code: number, message: string, data: unknown = null) => ({
  data,
  message,
  code,
});

afterEach(() => vi.unstubAllGlobals());

describe("createHttpClient", () => {
  it("returns the whole envelope on success", async () => {
    respond(200, envelope(200, "OTP has been sent successfully."));
    const client = createHttpClient({ baseUrl: "https://api.test/user" });

    await expect(client.post("/auth/request-otp", {})).resolves.toEqual(
      envelope(200, "OTP has been sent successfully."),
    );
  });

  it("treats HTTP 200 with body code 422 as a validation error with the backend message", async () => {
    respond(200, envelope(422, "The phone number is required."));
    const client = createHttpClient({ baseUrl: "https://api.test/user" });

    const error = await failure(client.post("/auth/request-otp", {}));
    expect(error.kind).toBe("validation");
    expect(error.status).toBe(422);
    expect(error.serverMessage).toBe("The phone number is required.");
  });

  it("uses other body codes as they are", async () => {
    respond(200, envelope(429, "Too many attempts."));
    const client = createHttpClient({ baseUrl: "https://api.test/user" });

    const error = await failure(client.post("/auth/request-otp", {}));
    expect(error.kind).toBe("rate_limited");
    expect(error.serverMessage).toBe("Too many attempts.");
  });

  it("decides HTTP 401 by its status and calls onUnauthorized", async () => {
    respond(401, envelope(401, "Unauthorized. Please log in."));
    const onUnauthorized = vi.fn();
    const client = createHttpClient({
      baseUrl: "https://api.test/user",
      onUnauthorized,
    });

    const error = await failure(client.post("/logout"));
    expect(error.kind).toBe("unauthorized");
    expect(error.serverMessage).toBeUndefined();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("calls onUnauthorized for a body code 401 too", async () => {
    respond(200, envelope(401, "Unauthorized. Please log in."));
    const onUnauthorized = vi.fn();
    const client = createHttpClient({
      baseUrl: "https://api.test/user",
      onUnauthorized,
    });

    expect((await failure(client.post("/logout"))).kind).toBe("unauthorized");
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("waits for an async onUnauthorized before rejecting", async () => {
    respond(401);
    const steps: string[] = [];
    const client = createHttpClient({
      baseUrl: "https://api.test/user",
      onUnauthorized: async () => {
        await Promise.resolve();
        steps.push("cleared");
      },
    });

    await client.post("/logout").catch(() => steps.push("rejected"));
    expect(steps).toEqual(["cleared", "rejected"]);
  });

  it("decides HTTP 5xx by its status, even with an HTML body", async () => {
    respond(500, undefined, "<html>Server Error</html>");
    const client = createHttpClient({ baseUrl: "https://api.test/user" });

    const error = await failure(client.get("/countries"));
    expect(error.kind).toBe("server");
    expect(error.status).toBe(500);
  });

  it("keeps the HTTP status for a non-2xx response without an envelope", async () => {
    respond(404, { error: "Not Found" });
    const client = createHttpClient({ baseUrl: "https://api.test/user" });

    expect((await failure(client.get("/missing"))).kind).toBe("not_found");
  });

  it("rejects a successful response that is not JSON", async () => {
    respond(200, undefined, "<html>maintenance</html>");
    const client = createHttpClient({ baseUrl: "https://api.test/user" });

    expect((await failure(client.get("/countries"))).kind).toBe("server");
  });

  it("sends the locale as Accept-Language unless the caller sets it", async () => {
    const fetchMock = respond(200, envelope(200, "ok"));
    const client = createHttpClient({
      baseUrl: "https://api.test/user",
      getLocale: () => "ar",
    });

    await client.get("/countries");
    await client.get("/countries", { headers: { "Accept-Language": "en" } });

    const sent = fetchMock.mock.calls.map(([, init]) =>
      new Headers(init?.headers).get("Accept-Language"),
    );
    expect(sent).toEqual(["ar", "en"]);
  });

  it("sends FormData unchanged without forcing a JSON content type", async () => {
    const fetchMock = respond(200, envelope(200, "License saved successfully.", {}));
    const client = createHttpClient({ baseUrl: "https://api.test/user" });
    const formData = new FormData();
    formData.set("license", new Blob(["license"], { type: "image/png" }), "license.png");

    await client.post("/license", formData);

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBe(formData);
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });
});
