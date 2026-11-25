import { describe, expect, it } from "vitest";
import {
  isReferralCodeFormat,
  normalizeReferralCode,
  referralInviteStatus,
  referralInviteUrl,
  referralShareText,
  whatsappShareUrl,
} from "./model";

describe("referral share text", () => {
  it("adds the invite link on the last line when there is one", () => {
    expect(
      referralShareText(
        "Join me:",
        "TCAR-A7K9",
        referralInviteUrl("https://t-car.sa", "ar", "TCAR-A7K9"),
      ),
    ).toBe("Join me:\nTCAR-A7K9\nhttps://t-car.sa/ar?auth=login&ref=TCAR-A7K9");
  });

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
    status: "pending" as const,
  };

  it("waits until the friend's first booking earns the reward", () => {
    expect(referralInviteStatus(invite)).toBe("pending");
    expect(
      referralInviteStatus({
        ...invite,
        firstBookingAt: "2026-10-30T00:00:00.000Z",
        rewardPoints: 500,
        status: "rewarded",
      }),
    ).toBe("rewarded");
  });
});

describe("sign-up invite codes", () => {
  it("compares codes upper-case and trimmed", () => {
    expect(normalizeReferralCode("  tcar-a7k9 ")).toBe("TCAR-A7K9");
  });

  it.each([
    ["TCAR-A7K9", true],
    ["ABC", false],
    ["TCAR A7K9", false],
    ["TCAR-A7K9-TOO-LONG-CODE", false],
  ])("checks the shape of %s", (code, valid) => {
    expect(isReferralCodeFormat(code)).toBe(valid);
  });
});
