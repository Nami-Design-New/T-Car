/** The signed-in customer's invite code and what one completed invite earns. */
export interface ReferralProgram {
  code: string;
  /** Points added when an invited friend completes their first eligible booking. */
  rewardPoints: number;
}

/** The text sent to a friend: the invite line followed by the code. */
export const referralShareText = (intro: string, code: string) =>
  `${intro}\n${code}`;

/** wa.me opens WhatsApp (app or web) with the message filled in. */
export const whatsappShareUrl = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
