import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";

const { getBankAccountsAction } = vi.hoisted(() => ({
  getBankAccountsAction: vi.fn(),
}));

vi.mock("../actions", () => ({ getBankAccountsAction }));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import BankAccountPicker from "./BankAccountPicker";

const account = {
  id: "5",
  bankId: "2",
  bankName: "Al Rajhi",
  maskedNumber: "12 34 56",
  iban: "SA4420000001234567123456",
};

const page = (items: (typeof account)[]) => ({
  ok: true,
  data: { items, page: 1, lastPage: 1, total: items.length },
});

beforeEach(() => vi.clearAllMocks());

describe("BankAccountPicker", () => {
  it("reads nothing while closed", () => {
    renderWithIntl(
      <BankAccountPicker open={false} onClose={vi.fn()} onSelect={vi.fn()} />,
    );
    expect(getBankAccountsAction).not.toHaveBeenCalled();
  });

  it("shows card skeletons, then the accounts, and selects one", async () => {
    getBankAccountsAction.mockResolvedValue(page([account]));
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <BankAccountPicker open onClose={vi.fn()} onSelect={onSelect} />,
    );

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Choose a bank");
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(getBankAccountsAction).toHaveBeenCalledWith(1);

    await user.click(await screen.findByRole("button", { name: /Al Rajhi/ }));
    expect(onSelect).toHaveBeenCalledWith(account);
  });

  it("shows a failed read with a retry", async () => {
    getBankAccountsAction
      .mockResolvedValueOnce({ ok: false, error: { kind: "network" } })
      .mockResolvedValueOnce(page([account]));
    const user = userEvent.setup();
    renderWithIntl(
      <BankAccountPicker open onClose={vi.fn()} onSelect={vi.fn()} />,
    );

    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("button", { name: /Al Rajhi/ }),
    ).toBeInTheDocument();
    expect(getBankAccountsAction).toHaveBeenLastCalledWith(1);
  });

  it("shows an empty state and closes through Dialog", async () => {
    getBankAccountsAction.mockResolvedValue(page([]));
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <BankAccountPicker open onClose={onClose} onSelect={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("No bank accounts added")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
