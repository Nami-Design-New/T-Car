import { describe, expect, it } from "vitest";
import {
  referralCounts,
  referralInviteStatus,
  referralShareText,
  whatsappShareUrl,
} from "./model";

describe("referral share text", () => {
  it("puts the code on its own line after the invite line", () => {
    expect(referralShareText("Join me:", "TCAR-A7K9")).toBe(
      "Join me:\nTCAR-A7K9",
    );
  });

  it("encodes the whole message into the WhatsApp link", () => {
    expect(whatsappShareUrl("جرّب تي كار!\nTCAR-A7K9")).toBe(
      `https://wa.me/?text=${encodeURIComponent("جرّب تي كار!\nTCAR-A7K9")}`,
    );
  });
});

describe("referral invite status", () => {
  const invite = {
    id: "1",
    friendName: "Ahmed M.",
    joinedAt: "2026-10-24T00:00:00.000Z",
    firstBookingAt: null,
    rewardPoints: null,
  };

  it("waits until the friend's first booking earns the reward", () => {
    expect(referralInviteStatus(invite)).toBe("pending");
    expect(
      referralInviteStatus({
        ...invite,
        firstBookingAt: "2026-10-30T00:00:00.000Z",
        rewardPoints: 500,
      }),
    ).toBe("rewarded");
  });

  it("counts invited and completed friends", () => {
    expect(
      referralCounts([
        invite,
        { ...invite, id: "2", firstBookingAt: "2026-10-30", rewardPoints: 500 },
      ]),
    ).toEqual({ invited: 2, completed: 1 });
  });
});
