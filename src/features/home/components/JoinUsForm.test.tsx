import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";

const { getSettingsAction, sendJoinRequestAction, notify } = vi.hoisted(
  () => ({
    getSettingsAction: vi.fn(),
    sendJoinRequestAction: vi.fn(),
    notify: { success: vi.fn(), error: vi.fn() },
  }),
);

vi.mock("../actions", () => ({ sendJoinRequestAction }));
vi.mock("@/features/settings", () => ({ getSettingsAction }));
vi.mock("@/shared/hooks/useNotify", () => ({ useNotify: () => notify }));
// The country list comes from the stateless mock instead of the API.
vi.mock("@/features/phone-countries", async () => {
  const { phoneCountriesMock } =
    await import("@/features/phone-countries/api.mock");
  return { loadPhoneCountries: phoneCountriesMock.listCountries };
});

import JoinUsForm from "./JoinUsForm";

const sizes = [
  { id: "1", size: 10 },
  { id: "2", size: 20 },
];

function renderForm(onClose = vi.fn()) {
  const user = userEvent.setup();
  renderWithIntl(<JoinUsForm open onClose={onClose} />);
  return {
    user,
    onClose,
    name: screen.getByRole("textbox", { name: "First name" }),
    phone: screen.getByRole("textbox", { name: "Phone number" }),
    companyName: screen.getByRole("textbox", { name: "Company name" }),
    size: screen.getByRole("combobox", { name: "Company size" }),
    email: screen.getByRole("textbox", { name: "Email address" }),
    submit: screen.getByRole("button", { name: "Submit request" }),
  };
}

async function fill(form: ReturnType<typeof renderForm>) {
  await form.user.type(form.name, "Acme Owner");
  await form.user.type(form.phone, "0512345678");
  await form.user.type(form.companyName, "Acme");
  await waitFor(() => expect(form.size).toBeEnabled());
  await form.user.selectOptions(form.size, "2");
  await form.user.type(form.email, "owner@example.com");
}

beforeEach(() => {
  vi.clearAllMocks();
  getSettingsAction.mockResolvedValue({
    ok: true,
    data: { companySizes: sizes },
  });
  sendJoinRequestAction.mockResolvedValue({
    ok: true,
    data: null,
    message: "Join request sent.",
  });
});

describe("JoinUsForm", () => {
  it("lists the company sizes from the settings", async () => {
    const { size } = renderForm();

    expect(size).toBeDisabled();
    expect(
      await screen.findByRole("option", { name: "20 employees" }),
    ).toBeInTheDocument();
    expect(size).toBeEnabled();
    expect(getSettingsAction).toHaveBeenCalledTimes(1);
  });

  it("shows a failed size list with a retry that reads it again", async () => {
    getSettingsAction.mockResolvedValueOnce({
      ok: false,
      error: { kind: "network" },
    });
    const { user } = renderForm();

    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("option", { name: "10 employees" }),
    ).toBeInTheDocument();
    expect(getSettingsAction).toHaveBeenCalledTimes(2);
  });

  it("shows translated errors without calling the action", async () => {
    const { user, submit } = renderForm();
    await user.click(submit);

    expect(await screen.findByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Enter the company name.")).toBeInTheDocument();
    expect(screen.getByText("Choose the company size.")).toBeInTheDocument();
    expect(sendJoinRequestAction).not.toHaveBeenCalled();
  });

  it("sends the request, toasts the backend message, and closes", async () => {
    const form = renderForm();
    await fill(form);
    await form.user.click(form.submit);

    await waitFor(() =>
      expect(sendJoinRequestAction).toHaveBeenCalledWith({
        name: "Acme Owner",
        phone: { countryCode: "+966", phone: "512345678" },
        companyName: "Acme",
        email: "owner@example.com",
        companySizeId: "2",
      }),
    );
    expect(notify.success).toHaveBeenCalledWith("Join request sent.");
    expect(form.onClose).toHaveBeenCalled();
  });

  it("toasts a backend 422 and keeps the dialog and the input", async () => {
    sendJoinRequestAction.mockResolvedValue({
      ok: false,
      error: {
        kind: "validation",
        status: 422,
        serverMessage: "The phone must be 9 digits and start with 5.",
      },
    });
    const form = renderForm();
    await fill(form);
    await form.user.click(form.submit);

    await waitFor(() =>
      expect(notify.error).toHaveBeenCalledWith(
        "The phone must be 9 digits and start with 5.",
      ),
    );
    expect(form.onClose).not.toHaveBeenCalled();
    expect(form.companyName).toHaveValue("Acme");
  });

  it("shows a server failure inline (e.g. the backend's 500)", async () => {
    sendJoinRequestAction.mockResolvedValue({
      ok: false,
      error: { kind: "server", status: 500 },
    });
    const form = renderForm();
    await fill(form);
    await form.user.click(form.submit);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(form.onClose).not.toHaveBeenCalled();
  });
});
