import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { Result } from "@/shared/lib/result";
import { AppError } from "@/shared/lib/errors";

const { send, state } = vi.hoisted(() => ({
  send: vi.fn<(input: unknown) => Promise<Result<void>>>(),
  state: { submitting: false },
}));

vi.mock("../hooks/useSendContactMessage", () => ({
  useSendContactMessage: () => ({ submitting: state.submitting, send }),
}));

import ContactForm from "./ContactForm";

function renderForm() {
  const user = userEvent.setup();
  renderWithIntl(<ContactForm />);
  return {
    user,
    name: screen.getByRole("textbox", { name: "Full Name" }),
    email: screen.getByRole("textbox", { name: "Email Address" }),
    reason: screen.getByRole("combobox", { name: "Contact reason" }),
    bookingNumber: screen.getByRole("textbox", { name: /Booking number/ }),
    message: screen.getByRole("textbox", { name: "Your Message" }),
    submit: screen.getByRole("button", { name: "Send Message" }),
  };
}

beforeEach(() => {
  state.submitting = false;
  send.mockReset();
  send.mockResolvedValue({ ok: true, data: undefined });
});

describe("ContactForm", () => {
  it("shows a translated required error on blur and associates it with the field", async () => {
    const { user, name } = renderForm();
    await user.click(name);
    await user.tab();

    expect(
      await screen.findByText("Enter your full name."),
    ).toBeInTheDocument();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Enter your full name.");
  });

  it("does not call the action with invalid email", async () => {
    const { user, email, submit } = renderForm();
    await user.type(email, "invalid");
    await user.click(submit);

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it("submits normalized values with the keyboard and shows success", async () => {
    const { user, name, email, reason, bookingNumber, message } = renderForm();
    await user.type(name, " Ahmed ");
    await user.type(email, " ahmed@example.com ");
    await user.selectOptions(reason, "booking");
    await user.type(bookingNumber, " BK-123 ");
    await user.type(message, " Need help ");
    await user.tab();
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith({
        name: "Ahmed",
        email: "ahmed@example.com",
        contactReason: "booking",
        bookingNumber: "BK-123",
        message: "Need help",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your message was sent. We will get back to you soon.",
    );
  });

  it("shows the pending state on the submit button", () => {
    state.submitting = true;
    const { submit } = renderForm();

    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-busy", "true");
  });

  it("keeps values and maps a server field error", async () => {
    send.mockResolvedValue({
      ok: false,
      error: new AppError("validation", "contact.invalidEmail", undefined, {
        email: "contact.invalidEmail",
      }),
    });
    const { user, name, email, reason, message } = renderForm();
    await user.type(name, "Ahmed");
    await user.type(email, "ahmed@example.com");
    await user.selectOptions(reason, "booking");
    await user.type(message, "Need help");
    await user.tab();
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(email).toHaveAccessibleDescription("Enter a valid email address."),
    );
    expect(email).toHaveValue("ahmed@example.com");
  });
});
