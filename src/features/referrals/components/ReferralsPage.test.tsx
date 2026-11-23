import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import ReferralsPage from "./ReferralsPage";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

const program = { code: "TCAR-A7K9", rewardPoints: 500 };

function renderPage() {
  const user = userEvent.setup();
  renderWithIntl(<ReferralsPage program={program} />);
  return { user };
}

describe("ReferralsPage", () => {
  it("shows the invite code, the reward, and the three steps", () => {
    renderPage();
    expect(screen.getByText("TCAR-A7K9")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Earn 500 points" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByText("500 points after their first eligible booking."),
    ).toBeInTheDocument();
  });

  it("links to the invite history", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "My invites" })).toHaveAttribute(
      "href",
      "/account/referrals/history",
    );
  });

  it("copies the code and confirms on the button", async () => {
    const { user } = renderPage();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith("TCAR-A7K9");
    expect(
      await screen.findByRole("button", { name: "Copied" }),
    ).toBeInTheDocument();
  });

  it("keeps the copy label when the clipboard is not available", async () => {
    const { user } = renderPage();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("opens the share dialog with a WhatsApp link that carries the code", async () => {
    const { user } = renderPage();
    await user.click(screen.getByRole("button", { name: "Share invite" }));

    const dialog = screen.getByRole("dialog", { name: "Share the invite" });
    const whatsapp = within(dialog).getByRole("link", { name: "WhatsApp" });
    expect(whatsapp.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(whatsapp.getAttribute("href")!)).toContain(
      "TCAR-A7K9",
    );
    expect(whatsapp).toHaveAttribute("target", "_blank");
  });

  it("opens the terms dialog and closes it", async () => {
    const { user } = renderPage();
    await user.click(
      screen.getByRole("button", { name: "Invite reward terms" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Invite reward terms" });
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(4);

    await user.click(within(dialog).getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
