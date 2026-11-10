import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaymentMethodModal from "./PaymentMethodModal";
import { renderWithIntl } from "@/shared/test/render";

const { getPaymentOptionsAction } = vi.hoisted(() => ({
  getPaymentOptionsAction: vi.fn(),
}));

vi.mock("@/features/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/orders")>()),
  getPaymentOptionsAction,
}));

function options(walletBalance: number) {
  return {
    ok: true,
    data: {
      methods: [
        { id: "6", title: "Online Payment", type: "online" },
        { id: "7", title: "Tabby", type: "tabby" },
      ],
      walletBalance,
    },
  };
}

const onTopUp = vi.fn();

function renderModal(
  props: Partial<React.ComponentProps<typeof PaymentMethodModal>> = {},
) {
  const onConfirm = vi.fn();
  renderWithIntl(
    <PaymentMethodModal
      open
      onClose={() => {}}
      orderId="226"
      amount={123.2}
      onConfirm={onConfirm}
      onTopUp={onTopUp}
      {...props}
    />,
  );
  return onConfirm;
}

describe("PaymentMethodModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the E3 methods and pays with one method alone", async () => {
    getPaymentOptionsAction.mockResolvedValue(options(0));
    const onConfirm = renderModal();

    const tabby = await screen.findByRole("radio", { name: /Tabby/ });
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(getPaymentOptionsAction).toHaveBeenCalledWith("226");
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    await userEvent.click(tabby);
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({
      useWallet: false,
      paymentMethodId: "7",
    });
  });

  it("pays with the wallet alone when the balance covers the amount", async () => {
    getPaymentOptionsAction.mockResolvedValue(options(500));
    const onConfirm = renderModal();

    const wallet = await screen.findByRole("checkbox", {
      name: "Use wallet balance",
    });
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    await userEvent.click(wallet);
    expect(wallet).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText("Your wallet balance covers the full amount."),
    ).toBeInTheDocument();
    // The methods stay available next to the wallet.
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledWith({
      useWallet: true,
      paymentMethodId: null,
    });
  });

  it("combines the wallet with a method, and the method can be cleared", async () => {
    getPaymentOptionsAction.mockResolvedValue(options(500));
    const onConfirm = renderModal();

    await userEvent.click(
      await screen.findByRole("checkbox", { name: "Use wallet balance" }),
    );
    const online = screen.getByRole("radio", { name: /Online Payment/ });
    await userEvent.click(online);
    expect(online).toBeChecked();
    await userEvent.click(online);
    expect(online).not.toBeChecked();
    await userEvent.click(online);
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    // The balance covers the total, so no gateway method is sent.
    expect(onConfirm).toHaveBeenCalledWith({
      useWallet: true,
      paymentMethodId: null,
    });
  });

  it("asks for a top-up when the empty wallet is chosen and leaves it off", async () => {
    getPaymentOptionsAction.mockResolvedValue(options(0));
    renderModal();

    const wallet = await screen.findByRole("checkbox", {
      name: "Use wallet balance",
    });
    await userEvent.click(wallet);
    expect(
      screen.getByRole("dialog", { name: "Insufficient balance" }),
    ).toBeInTheDocument();
    expect(wallet).toHaveAttribute("aria-checked", "false");

    await userEvent.click(screen.getByRole("button", { name: "Top up now" }));
    expect(onTopUp).toHaveBeenCalledOnce();
  });

  it("with a short balance, pays the rest with a method or asks for a top-up", async () => {
    getPaymentOptionsAction.mockResolvedValue(options(50));
    const onConfirm = renderModal();

    await userEvent.click(
      await screen.findByRole("checkbox", { name: "Use wallet balance" }),
    );
    expect(
      screen.getByText(
        "Your wallet pays first. Choose a payment method for the rest.",
      ),
    ).toBeInTheDocument();

    // Wallet alone does not cover the total: the top-up dialog, no payment.
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(
      screen.getByRole("dialog", { name: "Insufficient balance" }),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");

    await userEvent.click(
      screen.getByRole("radio", { name: /Online Payment/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledWith({
      useWallet: true,
      paymentMethodId: "6",
    });
  });

  it("offers no points", async () => {
    getPaymentOptionsAction.mockResolvedValue(options(500));
    renderModal();
    await screen.findByRole("radiogroup", { name: "Payment methods" });
    expect(screen.queryByText(/points/i)).not.toBeInTheDocument();
  });

  it("shows a retry when E3 fails", async () => {
    getPaymentOptionsAction.mockResolvedValueOnce({
      ok: false,
      error: { kind: "server" },
    });
    getPaymentOptionsAction.mockResolvedValueOnce(options(0));
    renderModal();

    await userEvent.click(
      await screen.findByRole("button", { name: /try again/i }),
    );
    expect(
      await screen.findByRole("radio", { name: /Tabby/ }),
    ).toBeInTheDocument();
  });

  it("shows the waiting label while the gateway tab is open", async () => {
    getPaymentOptionsAction.mockResolvedValue(options(0));
    renderModal({ loading: true, loadingLabel: "Waiting for payment..." });

    const button = await screen.findByRole("button", {
      name: "Waiting for payment...",
    });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
