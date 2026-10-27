import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { toast } from "sonner";
import { useNotify } from "@/shared/hooks/useNotify";
import { renderWithIntl } from "@/shared/test/render";
import { Toaster } from "./Toaster";

afterEach(() => act(() => void toast.dismiss()));

function Notifier({ success, error }: { success?: string; error?: string }) {
  const notify = useNotify();
  return (
    <>
      <button type="button" onClick={() => notify.success(success)}>
        success
      </button>
      <button type="button" onClick={() => notify.error(error)}>
        error
      </button>
    </>
  );
}

describe("Toaster", () => {
  it("labels the notification region", () => {
    renderWithIntl(<Toaster dir="ltr" />);
    expect(
      screen.getByRole("region", { name: /Notifications/ }),
    ).toBeInTheDocument();
  });

  it.each([
    ["ltr", "right"],
    ["rtl", "left"],
  ] as const)(
    "puts %s toasts at the bottom %s (inline end)",
    async (dir, side) => {
      const user = userEvent.setup();
      renderWithIntl(
        <>
          <Toaster dir={dir} />
          <Notifier success="Saved." />
        </>,
      );
      await user.click(screen.getByRole("button", { name: "success" }));

      const toaster = (await screen.findByText("Saved.")).closest(
        "[data-sonner-toaster]",
      );
      expect(toaster).toHaveAttribute("dir", dir);
      expect(toaster).toHaveAttribute("data-x-position", side);
      expect(toaster).toHaveAttribute("data-y-position", "bottom");
    },
  );

  it("shows the backend message as it is", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <Toaster dir="ltr" />
        <Notifier error="The phone number is required." />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "error" }));
    expect(
      await screen.findByText("The phone number is required."),
    ).toBeInTheDocument();
  });

  it("replaces an untranslated key or a missing message with a fallback", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <Toaster dir="ltr" />
        <Notifier error="validation.email_required" />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "error" }));
    expect(
      await screen.findByText("Check the details you entered and try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("validation.email_required"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "success" }));
    expect(await screen.findByText("Done successfully.")).toBeInTheDocument();
  });
});
