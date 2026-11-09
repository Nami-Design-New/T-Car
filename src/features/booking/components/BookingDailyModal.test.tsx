import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingDetails } from "@/features/orders";
import { renderWithIntl } from "@/shared/test/render";
import BookingDailyModal from "./BookingDailyModal";

const { checkAvailabilityAction, notify, notifyError } = vi.hoisted(() => {
  const notifyError = vi.fn();
  return {
    checkAvailabilityAction: vi.fn(),
    notify: { success: vi.fn(), error: notifyError },
    notifyError,
  };
});

vi.mock("@/features/orders", () => ({ checkAvailabilityAction }));
vi.mock("@/shared/hooks/useNotify", () => ({
  useNotify: () => notify,
}));

const availability = {
  carId: "1",
  branchId: "3",
  deliveryType: "from_branch" as const,
};

function futureDateButtons() {
  return screen
    .getAllByRole("button")
    .filter(
      (button) =>
        /^\d+$/.test(button.textContent?.trim() ?? "") &&
        !button.hasAttribute("disabled"),
    );
}

describe("BookingDailyModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits normalized daily booking details with the keyboard", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    checkAvailabilityAction.mockResolvedValue({
      ok: true,
      data: { slots: ["10", "14"], message: "Fetched successfully." },
    });
    renderWithIntl(
      <BookingDailyModal
        open
        onClose={vi.fn()}
        pricePerDay={500}
        onConfirm={onConfirm}
        availability={availability}
      />,
    );

    const dates = futureDateButtons();
    await user.click(dates[0]);
    await user.click(dates[1]);
    await user.click(await screen.findByRole("button", { name: "10 AM" }));
    expect(checkAvailabilityAction).toHaveBeenCalledWith({
      ...availability,
      type: "daily",
      fromDay: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      toDay: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    await user.type(
      screen.getByPlaceholderText("Write any notes or special requests..."),
      " Need help ",
    );
    await user.tab();
    await user.keyboard("{Enter}");

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      time: "10",
      notes: "Need help",
      days: 1,
      pricePerDay: 500,
      total: 575,
    });
  }, 15000);

  it("keeps live order amounts and hides a speculative total in edit mode", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const initialDetails: BookingDetails = {
      startDate: new Date("2099-01-10T09:00:00"),
      endDate: new Date("2099-01-12T09:00:00"),
      time: "09",
      days: 2,
      pricePerDay: 45,
      subtotal: 90,
      vat: 11.2,
      total: 123.2,
      notes: "",
      pickupAddress: "Branch",
      dropoffAddress: "Branch",
      pickupLocation: null,
      dropoffLocation: null,
    };

    renderWithIntl(
      <BookingDailyModal
        open
        mode="edit"
        onClose={vi.fn()}
        pricePerDay={45}
        initialDetails={initialDetails}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.queryByText("Total")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Send change request" }),
    );

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 90, vat: 11.2, total: 123.2 }),
    );
  });

  it("shows a backend 422 message and keeps the selected range open", async () => {
    const user = userEvent.setup();
    checkAvailabilityAction.mockResolvedValue({
      ok: false,
      error: {
        kind: "validation",
        status: 422,
        serverMessage: "The car is not available for the selected days.",
      },
    });

    renderWithIntl(
      <BookingDailyModal
        open
        onClose={vi.fn()}
        pricePerDay={500}
        onConfirm={vi.fn()}
        availability={{ ...availability, deliveryType: "to_location" }}
      />,
    );

    const dates = futureDateButtons();
    await user.click(dates[0]);
    await user.click(dates[1]);

    expect(
      await screen.findByText(
        "The car is not available for the selected days.",
        {},
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    expect(notifyError).toHaveBeenCalledWith(
      "The car is not available for the selected days.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { pressed: true }),
      ).toHaveLength(2),
    );
  }, 15000);

  it("shows a toast when draft creation fails and keeps the modal open", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        kind: "validation",
        status: 422,
        serverMessage: "The selected service is not available.",
      },
    });
    checkAvailabilityAction.mockResolvedValue({
      ok: true,
      data: { slots: ["10"], message: "Fetched successfully." },
    });

    renderWithIntl(
      <BookingDailyModal
        open
        onClose={vi.fn()}
        pricePerDay={500}
        onConfirm={onConfirm}
        availability={availability}
      />,
    );

    const dates = futureDateButtons();
    await user.click(dates[0]);
    await user.click(dates[1]);
    await user.click(await screen.findByRole("button", { name: "10 AM" }));
    await user.click(screen.getByRole("button", { name: "Confirm booking" }));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        "The selected service is not available.",
      ),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  }, 15000);

  it("shows the empty availability state when E1 returns no slots", async () => {
    const user = userEvent.setup();
    checkAvailabilityAction.mockResolvedValue({
      ok: true,
      data: { slots: [], message: "No pickup times are available." },
    });

    renderWithIntl(
      <BookingDailyModal
        open
        onClose={vi.fn()}
        pricePerDay={500}
        onConfirm={vi.fn()}
        availability={availability}
      />,
    );

    const dates = futureDateButtons();
    await user.click(dates[0]);
    await user.click(dates[1]);

    expect(
      await screen.findByText("No pickup times are available."),
    ).toBeInTheDocument();
    expect(notifyError).toHaveBeenCalledWith(
      "No pickup times are available.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  }, 15000);
});
