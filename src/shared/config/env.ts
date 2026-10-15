// Every environment variable is read here, once. NEXT_PUBLIC_* values must be
// read with a literal `process.env.NEXT_PUBLIC_…` so Next can inline them.

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

export const env = {
  /** API base URL for requests sent from the browser. */
  publicApiUrl,
  /** API base URL for requests sent from the server. Falls back to the public one. */
  serverApiUrl: process.env.API_URL || publicApiUrl,
};
