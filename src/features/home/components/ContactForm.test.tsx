import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { Result } from "@/shared/lib/result";
import { AppError } from "@/shared/lib/errors";

const { send, state, notify } = vi.hoisted(() => ({
  send: vi.fn<(input: unknown) => Promise<Result<null>>>(),
  state: { submitting: false },
  notify: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../hooks/useSendContactMessage", () => ({
  useSendContactMessage: () => ({ submitting: state.submitting, send }),
}));
vi.mock("@/shared/hooks/useNotify", () => ({ useNotify: () => notify }));

import ContactForm from "./ContactForm";

function renderForm() {
  const user = userEvent.setup();
  renderWithIntl(<ContactForm />);
  return {
    user,
    name: screen.getByRole("textbox", { name: "Full Name" }),
    email: screen.getByRole("textbox", { name: "Email Address" }),
    reason: screen.getByRole("textbox", { name: "Contact reason (optional)" }),
    bookingNumber: screen.getByRole("textbox", { name: /Booking number/ }),
    message: screen.getByRole("textbox", { name: "Your Message" }),
    submit: screen.getByRole("button", { name: "Send Message" }),
  };
}

async function fillRequired(form: ReturnType<typeof renderForm>) {
  await form.user.type(form.name, "Ahmed");
  await form.user.type(form.email, "ahmed@example.com");
  await form.user.type(form.message, "Need help");
}

beforeEach(() => {
  state.submitting = false;
  vi.clearAllMocks();
  send.mockResolvedValue({
    ok: true,
    data: null,
    message: "Contact request created successfully.",
  });
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

  it("sends a free-text reason with normalized values, toasts the backend message, and clears", async () => {
    const form = renderForm();
    const { user, name, email, reason, bookingNumber, message } = form;
    await user.type(name, " Ahmed ");
    await user.type(email, " ahmed@example.com ");
    await user.type(reason, " Order Issue ");
    await user.type(bookingNumber, " BK-123 ");
    await user.type(message, " Need help ");
    await user.tab();
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith({
        name: "Ahmed",
        email: "ahmed@example.com",
        contactReason: "Order Issue",
        bookingNumber: "BK-123",
        message: "Need help",
      }),
    );
    expect(notify.success).toHaveBeenCalledWith(
      "Contact request created successfully.",
    );
    await waitFor(() => expect(name).toHaveValue(""));
  });

  it("sends without the optional reason and booking number", async () => {
    const form = renderForm();
    await fillRequired(form);
    await form.user.click(form.submit);

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith({
        name: "Ahmed",
        email: "ahmed@example.com",
        contactReason: undefined,
        bookingNumber: undefined,
        message: "Need help",
      }),
    );
  });

  it("toasts a backend 422 and keeps the input", async () => {
    send.mockResolvedValue({
      ok: false,
      error: new AppError("validation", undefined, 422, undefined, {
        serverMessage: "The email address must be a valid email address.",
      }),
    });
    const form = renderForm();
    await fillRequired(form);
    await form.user.click(form.submit);

    await waitFor(() =>
      expect(notify.error).toHaveBeenCalledWith(
        "The email address must be a valid email address.",
      ),
    );
    expect(form.email).toHaveValue("ahmed@example.com");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows other failures inline and keeps the input", async () => {
    send.mockResolvedValue({ ok: false, error: new AppError("network") });
    const form = renderForm();
    await fillRequired(form);
    await form.user.click(form.submit);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(notify.error).not.toHaveBeenCalled();
    expect(form.message).toHaveValue("Need help");
  });

  it("shows the pending state on the submit button", () => {
    state.submitting = true;
    const { submit } = renderForm();

    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-busy", "true");
  });
});
