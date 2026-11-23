import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import { resetReferralCode } from "../referralCodeStore";
import ReferralCodeField from "./ReferralCodeField";

afterEach(resetReferralCode);

function renderField() {
  const user = userEvent.setup();
  renderWithIntl(<ReferralCodeField />);
  return {
    user,
    input: screen.getByRole("textbox", { name: "Invite code (optional)" }),
  };
}

describe("ReferralCodeField", () => {
  it("starts empty with the hint and the check disabled", () => {
    const { input } = renderField();
    expect(input).toHaveAccessibleDescription(
      "Got a code from a friend? Add it here or continue without it.",
    );
    expect(screen.getByRole("button", { name: "Check code" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Continue without an invite code" }),
    ).not.toBeInTheDocument();
  });

  it("applies a valid code and names the friend", async () => {
    const { user, input } = renderField();
    await user.type(input, "tcar-a7k9");
    expect(input).toHaveValue("TCAR-A7K9");

    await user.click(screen.getByRole("button", { name: "Check code" }));

    expect(
      await screen.findByRole("button", { name: "Change code" }),
    ).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription(
      "أحمد's invite is applied. Finish creating your account.",
    );
    expect(input).toHaveAttribute("readonly");

    await user.click(screen.getByRole("button", { name: "Change code" }));
    expect(input).not.toHaveAttribute("readonly");
    expect(input).toHaveFocus();
  });

  it("marks an unknown code as invalid; Enter checks it", async () => {
    const { user, input } = renderField();
    await user.type(input, "TCAR-A7K0{Enter}");

    expect(
      await screen.findByRole("button", { name: "Check again" }),
    ).toBeInTheDocument();
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      "This code is not valid. Check it and try again.",
    );
  });

  it("offers a retry when the check cannot reach the service", async () => {
    const { user, input } = renderField();
    await user.type(input, "TCAR-FAIL");
    await user.click(screen.getByRole("button", { name: "Check code" }));

    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription(
      "We couldn't check the code. Check your connection and try again.",
    );
  });

  it("clears the code to continue without one", async () => {
    const { user, input } = renderField();
    await user.type(input, "TCAR-A7K0");
    await user.click(
      screen.getByRole("button", { name: "Continue without an invite code" }),
    );
    expect(input).toHaveValue("");
    expect(screen.getByRole("button", { name: "Check code" })).toBeDisabled();
  });
});
