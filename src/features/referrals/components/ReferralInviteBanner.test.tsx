import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import { resetReferralCode, useReferralCodeStore } from "../referralCodeStore";
import ReferralInviteBanner from "./ReferralInviteBanner";
import ReferralInviteCapture from "./ReferralInviteCapture";

let search = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
}));

afterEach(() => {
  search = "";
  resetReferralCode();
});

describe("invite link", () => {
  it("checks the code from ?ref= and shows the invite", async () => {
    search = "auth=login&ref=tcar-a7k9";
    renderWithIntl(
      <>
        <ReferralInviteCapture />
        <ReferralInviteBanner />
      </>,
    );

    expect(
      await screen.findByText(/Invite from أحمد · Your code is ready:/),
    ).toHaveTextContent("TCAR-A7K9");
  });

  it("keeps an unknown code for the profile step without a banner", async () => {
    search = "ref=TCAR-A7K0";
    renderWithIntl(
      <>
        <ReferralInviteCapture />
        <ReferralInviteBanner />
      </>,
    );

    await vi.waitFor(() =>
      expect(useReferralCodeStore.getState().status).toBe("invalid"),
    );
    expect(useReferralCodeStore.getState().code).toBe("TCAR-A7K0");
    expect(screen.queryByText(/Invite from/)).not.toBeInTheDocument();
  });
});
