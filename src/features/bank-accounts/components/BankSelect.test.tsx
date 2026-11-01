import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { Bank } from "../model";
import BankSelect from "./BankSelect";

const { getBanksAction } = vi.hoisted(() => ({ getBanksAction: vi.fn() }));
vi.mock("../actions", () => ({ getBanksAction }));

const albilad: Bank = { id: "2", name: "Bank Albilad" };
const riyad: Bank = { id: "3", name: "Riyad Bank" };

const page = (items: Bank[], number = 1, lastPage = 1) => ({
  ok: true,
  data: { items, page: number, lastPage, total: items.length },
});

beforeEach(() => {
  vi.clearAllMocks();
  getBanksAction.mockResolvedValue(page([albilad, riyad]));
});

afterEach(() => vi.unstubAllGlobals());

function renderSelect(
  overrides: Partial<React.ComponentProps<typeof BankSelect>> = {},
) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  renderWithIntl(
    <>
      <span id="bank-label">Bank name</span>
      <BankSelect
        value=""
        onChange={onChange}
        labelId="bank-label"
        {...overrides}
      />
    </>,
  );
  return {
    user,
    onChange,
    open: () => user.click(screen.getByRole("combobox", { name: "Bank name" })),
  };
}

describe("BankSelect", () => {
  it("reads page 1 of the banks only when the panel opens", async () => {
    const { open } = renderSelect();
    expect(getBanksAction).not.toHaveBeenCalled();

    await open();
    expect(
      await screen.findByRole("option", { name: "Bank Albilad" }),
    ).toBeInTheDocument();
    expect(getBanksAction).toHaveBeenCalledWith(1, undefined);
    expect(
      screen.getByRole("searchbox", { name: "Search for a bank" }),
    ).toHaveFocus();
  });

  it("shows skeletons with a loading status while the first page loads", async () => {
    getBanksAction.mockReturnValue(new Promise(() => {}));
    const { open } = renderSelect();
    await open();

    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("selects a bank, marks it, and closes the panel", async () => {
    const { user, onChange, open } = renderSelect();
    await open();
    await user.click(await screen.findByRole("button", { name: "Riyad Bank" }));

    expect(onChange).toHaveBeenCalledWith("3");
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("shows the selected bank in the field and marks its option", async () => {
    const { open } = renderSelect({ value: "3" });
    await open();

    expect(
      await screen.findByRole("option", { name: "Riyad Bank" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("combobox")).toHaveTextContent("Riyad Bank");
  });

  it("shows the initial bank before the list has loaded", () => {
    renderSelect({ value: "7", initialBank: { id: "7", name: "Rajhi Bank" } });
    expect(screen.getByRole("combobox")).toHaveTextContent("Rajhi Bank");
  });

  it("searches the API once typing pauses and starts again from page 1", async () => {
    const { user, open } = renderSelect();
    await open();
    await screen.findByRole("option", { name: "Bank Albilad" });

    getBanksAction.mockResolvedValue(page([albilad]));
    await user.type(screen.getByRole("searchbox"), " bilad ");

    await waitFor(() =>
      expect(getBanksAction).toHaveBeenLastCalledWith(1, "bilad"),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("option", { name: "Riyad Bank" }),
      ).not.toBeInTheDocument(),
    );
    // One read on open and one for the finished term, not one per keystroke.
    expect(getBanksAction).toHaveBeenCalledTimes(2);
  });

  it("says when a search has no results, and when there are no banks", async () => {
    const { user, open } = renderSelect();
    getBanksAction.mockResolvedValue(page([]));
    await open();
    expect(await screen.findByText("No banks available.")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(
      await screen.findByText("No banks match your search."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows a failed page with a retry that reads it again", async () => {
    getBanksAction.mockResolvedValueOnce({
      ok: false,
      error: { kind: "network" },
    });
    const { user, open } = renderSelect();
    await open();

    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("option", { name: "Bank Albilad" }),
    ).toBeInTheDocument();
    expect(getBanksAction).toHaveBeenCalledTimes(2);
  });

  it("loads the next page when the end of the list scrolls into view", async () => {
    // jsdom has no IntersectionObserver: report the end marker as visible.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe() {
          this.callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        disconnect() {}
      },
    );
    getBanksAction
      .mockResolvedValueOnce(page([albilad], 1, 2))
      .mockResolvedValueOnce(page([riyad], 2, 2));
    const { open } = renderSelect();
    await open();

    expect(
      await screen.findByRole("option", { name: "Riyad Bank" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Bank Albilad" }),
    ).toBeInTheDocument();
    expect(getBanksAction).toHaveBeenNthCalledWith(2, 2, undefined);
  });

  it("closes when the user clicks outside", async () => {
    const { user, open } = renderSelect();
    await open();
    await user.click(screen.getByText("Bank name"));

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
