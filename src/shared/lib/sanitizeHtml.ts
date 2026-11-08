import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Backend-authored HTML is rendered as is, so it is sanitized on the server:
 * scripts, styles, event handlers and unsafe URLs are dropped, and links get
 * rel="noopener noreferrer". Keeps the backend's supported rich text.
 */
export function sanitizeBackendHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "h1",
      "h2",
      "span",
      "u",
    ],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  }).trim();
}
