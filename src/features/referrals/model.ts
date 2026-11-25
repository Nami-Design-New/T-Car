import type { Page } from "@/shared/lib/pagination";

/** The signed-in customer's invite code and what one completed invite earns. */
export interface ReferralProgram {
  code: string;
  /** Points added when an invited friend completes their first eligible booking. */
  rewardPoints: number;
}

/** A friend who signed up with the customer's code. */
export interface ReferralInvite {
  id: string;
  /** Shortened by the backend for privacy, e.g. "Ahmed M.". */
  friendName: string;
  joinedAt: string;
  /** Null until the friend completes their first eligible booking. */
  firstBookingAt: string | null;
  /** Points this invite earned; null while it waits for the first booking. */
  rewardPoints: number | null;
  status: ReferralInviteStatus;
}

export interface ReferralHistory {
  /** Points earned from all invites. */
  totalPoints: number;
  invitedCount: number;
  completedCount: number;
  /** Newest first. */
  page: Page<ReferralInvite>;
}

export type ReferralInviteStatus = "pending" | "rewarded";

export const referralInviteStatus = (
  invite: ReferralInvite,
): ReferralInviteStatus => invite.status;

/** The text sent to a friend: the invite line, the code, then the invite link. */
export const referralShareText = (
  intro: string,
  code: string,
  link?: string | null,
) => [intro, code, link].filter(Boolean).join("\n");

/** The query parameter that carries an invite code, e.g. `/ar?ref=TCAR-A7K9`. */
export const REFERRAL_CODE_PARAM = "ref";

/**
 * Opens the site with the sign-in dialog and the code filled in for sign-up.
 * `origin` is the site's, e.g. "https://t-car.sa".
 */
export const referralInviteUrl = (
  origin: string,
  locale: string,
  code: string,
) =>
  `${origin}/${locale}?auth=login&${REFERRAL_CODE_PARAM}=${encodeURIComponent(code)}`;

/** Codes are compared upper-case and without spaces around them. */
export const normalizeReferralCode = (value: string) =>
  value.trim().toUpperCase();

/** A code's shape (letters, digits, dashes), checked before asking the backend. */
export const isReferralCodeFormat = (code: string) =>
  /^[A-Z0-9-]{4,20}$/.test(code);

/** What checking a sign-up invite code returns. */
export type ReferralCodeCheck =
  { valid: true; inviterName: string } | { valid: false };

/** wa.me opens WhatsApp (app or web) with the message filled in. */
export const whatsappShareUrl = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
