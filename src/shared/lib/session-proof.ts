function base64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Proof that the server found this session's backend token dead: an HMAC of
 * the token with AUTH_SECRET. It travels in `?auth=expired&proof=…`, so only
 * the session it was made for can be cleared through that link; a link made by
 * anyone else signs nobody out. The token, not the session cookie, is signed:
 * Auth.js re-issues the cookie with a new value on every request. Web Crypto,
 * so the middleware can check it.
 */
export async function sessionProof(
  accessToken: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`session-expired:${accessToken}`),
  );
  return base64Url(signature);
}

/** Whether `proof` was made for this token; false when signed out or without a secret. */
export async function isSessionProof(
  proof: string | null,
  accessToken: string | undefined,
  secret: string | undefined,
): Promise<boolean> {
  if (!proof || !accessToken || !secret) return false;
  const expected = await sessionProof(accessToken, secret);
  if (expected.length !== proof.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i += 1) {
    difference |= expected.charCodeAt(i) ^ proof.charCodeAt(i);
  }
  return difference === 0;
}
