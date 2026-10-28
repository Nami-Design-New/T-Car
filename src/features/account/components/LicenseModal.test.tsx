import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";
import { renderWithIntl } from "@/shared/test/render";
import { LICENSE_MAX_SIZE_BYTES } from "../model";
import LicenseModal from "./LicenseModal";

function renderModal(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const user = userEvent.setup();
  const onClose = vi.fn();
  renderWithIntl(<LicenseModal open onClose={onClose} onSubmit={onSubmit} />);
  const input = document.querySelector('input[type="file"]');

  if (!(input instanceof HTMLInputElement))
    throw new Error("License input is missing");

  return { user, onSubmit, input };
}

describe("LicenseModal", () => {
  it("shows the 15 MB validation error and does not submit an oversized file", async () => {
    const { user, onSubmit, input } = renderModal();
    const tooLarge = new File(
      [new Uint8Array(LICENSE_MAX_SIZE_BYTES + 1)],
      "license.png",
      { type: "image/png" },
    );

    await user.upload(input, tooLarge);

    expect(
      await screen.findByText(
        "The driving license image must be 15 MB or smaller.",
      ),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Upload" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits an accepted image file", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user, input } = renderModal(onSubmit);
    const file = new File(["license"], "license.jpg", { type: "image/jpeg" });

    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(file));
  });

  it("accepts a .jpeg image", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user, input } = renderModal(onSubmit);
    const file = new File(["license"], "license.jpeg", {
      type: "image/jpeg",
    });

    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(file));
  });

  it("keeps the selected file and shows a returned failure", async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValue(new AppError("validation", "account.licenseRejected"));
    const { user, input } = renderModal(onSubmit);
    const file = new File(["license"], "license.jpg", { type: "image/jpeg" });

    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The driving license could not be uploaded. Try another image.",
    );
    expect(screen.getByText("license.jpg")).toBeVisible();
  });
});
