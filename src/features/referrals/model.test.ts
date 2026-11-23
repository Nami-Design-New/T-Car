import { describe, expect, it } from "vitest";
import { referralShareText, whatsappShareUrl } from "./model";

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
