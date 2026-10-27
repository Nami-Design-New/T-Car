// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type Auth = { user?: { onboardingStep?: string } } | null;

const { intlMiddleware } = vi.hoisted(() => ({
  intlMiddleware: vi.fn(
    (req: Request) => new Response(null, { headers: req.headers }),
  ),
}));

vi.mock("next-intl/middleware", () => ({ default: () => intlMiddleware }));
// NextAuth's wrapper adds `req.auth`; here the test sets it.
vi.mock("./auth", () => ({
  auth: (handler: (req: NextRequest & { auth: Auth }) => Promise<Response>) =>
    handler,
}));

import middleware from "./middleware";
import { NEXT_PATH_HEADER, SESSION_COOKIE } from "./shared/config/session";
import { sessionProof } from "./shared/lib/session-proof";
import { encode } from "next-auth/jwt";

const run = middleware as unknown as (
  req: NextRequest & { auth: Auth },
) => Promise<Response>;

function request(path: string, auth: Auth = null, headers?: HeadersInit) {
  return Object.assign(
    new NextRequest(`http://localhost${path}`, { headers }),
    { auth },
  );
}

const signedIn: Auth = { user: { onboardingStep: "completed" } };
const SECRET = "test-secret";
let sessionCookies = "";

beforeAll(async () => {
  process.env.AUTH_SECRET = SECRET;
  const session = await encode({
    secret: SECRET,
    salt: SESSION_COOKIE,
    token: { accessToken: "dead" },
  });
  sessionCookies = `${SESSION_COOKIE}=${session}; NEXT_LOCALE=ar`;
});

function expired(proof?: string) {
  const params = new URLSearchParams({ auth: "expired" });
  if (proof) params.set("proof", proof);
  params.set("next", "/account/profile");
  return run(request(`/ar?${params}`, signedIn, { cookie: sessionCookies }));
}

describe("middleware", () => {
  it("clears the session and opens sign-in with this session's proof", async () => {
    const response = await expired(await sessionProof("dead", SECRET));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/ar?auth=login&next=%2Faccount%2Fprofile",
    );
    const cleared = response.headers.getSetCookie();
    expect(cleared).toHaveLength(1);
    expect(cleared[0]).toMatch(new RegExp(`^${SESSION_COOKIE}=;.*Max-Age=0`));
    expect(cleared[0]).toMatch(/HttpOnly/);
  });

  it("signs nobody out from a link without a proof", async () => {
    const response = await expired();

    expect(response.headers.get("location")).toBe("http://localhost/ar");
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("signs nobody out with a proof made for another session", async () => {
    const response = await expired(await sessionProof("other", SECRET));

    expect(response.headers.get("location")).toBe("http://localhost/ar");
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("opens sign-in for a visitor who is already signed out", async () => {
    const response = await run(request("/ar?auth=expired&next=%2Faccount"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/ar?auth=login&next=%2Faccount",
    );
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("passes the locale-less path and query on as the next path", async () => {
    const response = await run(
      request("/en/account/bookings?status=active", signedIn, {
        [NEXT_PATH_HEADER]: "//evil.example",
      }),
    );

    expect(response.headers.get(NEXT_PATH_HEADER)).toBe(
      "/account/bookings?status=active",
    );
  });

  it("uses / for the locale root", async () => {
    expect((await run(request("/ar"))).headers.get(NEXT_PATH_HEADER)).toBe("/");
  });

  it("still sends a signed-out visitor of /account to sign in", async () => {
    const response = await run(request("/ar/account/profile"));
    expect(response.headers.get("location")).toBe(
      "http://localhost/ar?auth=login&next=%2Faccount%2Fprofile",
    );
  });
});
