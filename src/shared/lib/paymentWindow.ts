/**
 * Gateway payments (wallet top-up, booking pay, extensions, modification
 * differences) all answer with the same three links. The customer pays at
 * `paymentUrl` in a new tab; the backend's `successUrl` / `failUrl` pages post
 * the outcome to `window.opener` (docs/api/wallet-api.md §3.4).
 */
export interface PaymentLinks {
  paymentUrl: string;
  successUrl: string;
  failUrl: string;
}

export type PaymentOutcome = "success" | "failed";

const PAYMENT_MESSAGES: Record<string, PaymentOutcome> = {
  "payment-success": "success",
  "payment-failed": "failed",
};

/** The outcome a payment page reports, or null for any other message. */
export function paymentOutcome(data: unknown): PaymentOutcome | null {
  return typeof data === "string" && Object.hasOwn(PAYMENT_MESSAGES, data)
    ? PAYMENT_MESSAGES[data]
    : null;
}

/** Gateway links must be absolute `https` URLs; anything else is rejected at the DTO guard. */
export function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
