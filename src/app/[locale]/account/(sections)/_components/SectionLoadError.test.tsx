import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import { SectionLoadError } from "./SectionLoadError";

const refresh = vi.fn();
const reportError = vi.fn();

vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/shared/lib/report", () => ({
  reportError: (...args: unknown[]) => reportError(...args),
}));

describe("SectionLoadError", () => {
  it("shows the design's failed-load card, reports the error, and retries", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "abc" });

    renderWithIntl(
      <SectionLoadError
        error={error}
        reset={reset}
        title="Your invite code could not be loaded"
        scope="account.referrals"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your invite code could not be loaded",
    );
    expect(
      screen.getByText("Check your internet connection and try again."),
    ).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledWith(error, {
      scope: "account.referrals",
      digest: "abc",
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalled();
    expect(reset).toHaveBeenCalled();
  });
});
