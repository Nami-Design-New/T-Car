import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import MobileNav from "./MobileNav";

let pathname = "/account/rewards/tiers";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname,
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

describe("MobileNav", () => {
  it("uses the Figma icons and links account, bookings, and rewards", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    renderWithIntl(
      <MobileNav signedIn drawerChildren={null}>
        {null}
      </MobileNav>,
    );

    const navigation = await screen.findByRole("navigation", {
      name: "Main navigation",
    });
    const account = screen.getByRole("link", { name: "My account" });
    const bookings = screen.getByRole("link", { name: "My bookings" });
    const rewards = screen.getByRole("link", { name: "Rewards" });

    expect(account).toHaveAttribute("href", "/account/profile");
    expect(bookings).toHaveAttribute("href", "/account/bookings");
    expect(rewards).toHaveAttribute("href", "/account/rewards");
    expect(rewards).toHaveAttribute("aria-current", "page");
    expect(account).not.toHaveAttribute("aria-current", "page");
    expect(navigation.querySelector('img[src="/icons/account.svg"]')).toHaveClass(
      "grayscale",
    );
    expect(navigation.querySelector('img[src="/icons/booking.svg"]')).toHaveClass(
      "grayscale",
    );
    expect(navigation.querySelector('img[src="/icons/gift.svg"]')).not.toHaveClass(
      "grayscale",
    );
  });
});
