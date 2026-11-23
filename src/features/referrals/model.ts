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
}

export interface ReferralHistory {
  /** Points earned from all invites. */
  totalPoints: number;
  /** Newest first. */
  invites: ReferralInvite[];
}

export type ReferralInviteStatus = "pending" | "rewarded";

export const referralInviteStatus = (
  invite: ReferralInvite,
): ReferralInviteStatus =>
  invite.firstBookingAt && invite.rewardPoints !== null
    ? "rewarded"
    : "pending";

/** "3 invites · 1 completed" counts. */
export function referralCounts(invites: ReferralInvite[]) {
  return {
    invited: invites.length,
    completed: invites.filter(
      (invite) => referralInviteStatus(invite) === "rewarded",
    ).length,
  };
}

/** The text sent to a friend: the invite line followed by the code. */
export const referralShareText = (intro: string, code: string) =>
  `${intro}\n${code}`;

/** wa.me opens WhatsApp (app or web) with the message filled in. */
export const whatsappShareUrl = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
