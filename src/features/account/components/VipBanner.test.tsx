import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import VipBanner from "./VipBanner";

const props = {
  isVip: true,
  vipPackages: "الذهبية",
  whatsappNumber: "+955555555111",
  title: "دعم VIP مميز",
  description: "خاص لعملاء الذهبية · متاح 24 ساعة",
  contactLabel: "تواصل مع دعم VIP عبر واتساب",
};

describe("VipBanner", () => {
  it("shows the package and opens WhatsApp without a prefilled message", () => {
    render(<VipBanner {...props} />);

    expect(screen.getByText(props.title)).toBeInTheDocument();
    expect(screen.getByText(props.description)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: props.contactLabel }),
    ).toHaveAttribute("href", "https://wa.me/955555555111");
  });

  it("does not show the banner when the customer is not VIP", () => {
    render(<VipBanner {...props} isVip={false} />);
    expect(screen.queryByText(props.title)).not.toBeInTheDocument();
  });

  it("shows the information without a broken link when the number is missing", () => {
    render(<VipBanner {...props} whatsappNumber={null} />);
    expect(screen.getByText(props.title)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
