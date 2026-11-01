import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BankCard } from ".";

describe("BankCard", () => {
  it("is one button when selectable", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <BankCard variant="option" onSelect={onSelect}>
        <BankCard.Details>
          <BankCard.Bank name="Al Rajhi" />
          <BankCard.Number>12 34 56</BankCard.Number>
        </BankCard.Details>
      </BankCard>,
    );

    const card = screen.getByRole("button", { name: /Al Rajhi/ });
    expect(card).toHaveTextContent("12 34 56");
    await user.click(card);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("lists a card with named actions", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <BankCard>
        <BankCard.Details>
          <BankCard.Bank name="Riyad Bank" logo="https://t-car.app/riyad.png" />
          <BankCard.Number>98 76 54</BankCard.Number>
        </BankCard.Details>
        <BankCard.Actions>
          <BankCard.Action label="Edit Riyad Bank" onClick={onEdit}>
            <span />
          </BankCard.Action>
        </BankCard.Actions>
      </BankCard>,
    );

    expect(screen.getAllByRole("button")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Edit Riyad Bank" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("keeps the number left-to-right and shows an icon without a logo", () => {
    const { container } = render(
      <BankCard>
        <BankCard.Details>
          <BankCard.Bank name="Riyad Bank" />
          <BankCard.Number>98 76 54</BankCard.Number>
        </BankCard.Details>
      </BankCard>,
    );

    expect(screen.getByText("98 76 54")).toHaveAttribute("dir", "ltr");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
