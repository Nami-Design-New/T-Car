import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import { Drawer, type DrawerProps } from "./Drawer";

type HarnessProps = Partial<
  Omit<DrawerProps, "open" | "onClose" | "children">
> & {
  onClose?: () => void;
  withTitle?: boolean;
  closeLabel?: string;
};

function Harness({
  onClose,
  withTitle = true,
  closeLabel,
  ...props
}: HarnessProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <Drawer
        {...props}
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
      >
        <Drawer.Header>
          {withTitle && <Drawer.Title>Filters</Drawer.Title>}
          <Drawer.Close label={closeLabel} />
        </Drawer.Header>
        <Drawer.Body>
          <input aria-label="brand" />
          <button type="button">apply</button>
        </Drawer.Body>
      </Drawer>
    </>
  );
}

// Radix sets pointer-events: none on the page behind a modal; clicking the
// backdrop in jsdom needs the check off, as a real pointer would.
const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

async function openDrawer(props: HarnessProps = {}) {
  const user = setup();
  renderWithIntl(<Harness {...props} />);
  await user.click(screen.getByRole("button", { name: "open" }));
  return { user, drawer: screen.getByRole("dialog") };
}

describe("Drawer", () => {
  it("renders nothing while closed", () => {
    renderWithIntl(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a labelled modal in a portal", async () => {
    const { drawer } = await openDrawer();
    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(drawer).toHaveAccessibleName("Filters");
    expect(drawer.parentElement).toBe(document.body);
  });

  it("takes its name from `label` when there is no visible title", async () => {
    const { drawer } = await openDrawer({
      withTitle: false,
      label: "Filter results",
    });
    expect(drawer).toHaveAccessibleName("Filter results");
  });

  it("docks to the end edge by default", async () => {
    const { drawer } = await openDrawer();
    expect(drawer).toHaveClass("drawer--end", "end-0");
  });

  it("docks to the start edge on request", async () => {
    const { drawer } = await openDrawer({ side: "start" });
    expect(drawer).toHaveClass("drawer--start", "start-0");
  });

  it("moves focus inside and keeps Tab within the drawer", async () => {
    const { user, drawer } = await openDrawer();
    expect(drawer).toContainElement(document.activeElement as HTMLElement);
    for (let i = 0; i < 5; i += 1) {
      await user.tab();
      expect(drawer).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("locks page scroll while open", async () => {
    const { user } = await openDrawer();
    expect(document.body).toHaveAttribute("data-scroll-locked");
    await user.keyboard("{Escape}");
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
  });

  it("closes on Escape and returns focus to the opener", async () => {
    const onClose = vi.fn();
    const { user } = await openDrawer({ onClose });
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "open" })).toHaveFocus();
  });

  it("ignores Escape when closeOnEscape is false", async () => {
    const onClose = vi.fn();
    const { user } = await openDrawer({ onClose, closeOnEscape: false });
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on a backdrop click but not on a click inside", async () => {
    const onClose = vi.fn();
    const { user, drawer } = await openDrawer({ onClose });

    await user.click(within(drawer).getByRole("button", { name: "apply" }));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(document.querySelector(".drawer-backdrop") as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores backdrop clicks when closeOnBackdrop is false", async () => {
    const onClose = vi.fn();
    const { user } = await openDrawer({ onClose, closeOnBackdrop: false });
    await user.click(document.querySelector(".drawer-backdrop") as Element);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes from its localized close button", async () => {
    const onClose = vi.fn();
    const { user, drawer } = await openDrawer({ onClose });
    await user.click(within(drawer).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("names the close button from `label` when given", async () => {
    const { drawer } = await openDrawer({ closeLabel: "Close filters" });
    expect(
      within(drawer).getByRole("button", { name: "Close filters" }),
    ).toBeInTheDocument();
  });
});
