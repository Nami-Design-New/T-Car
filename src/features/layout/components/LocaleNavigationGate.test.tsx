import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLocaleNavigationStore } from "../localeNavigationStore";
import LocaleNavigationGate from "./LocaleNavigationGate";

afterEach(() => {
  useLocaleNavigationStore.setState({ pendingLocation: null });
  vi.restoreAllMocks();
});

describe("LocaleNavigationGate", () => {
  it("replaces the application with the loader during a locale reload", () => {
    useLocaleNavigationStore.setState({ pendingLocation: "/ar" });
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);

    render(
      <LocaleNavigationGate>
        <p>Application content</p>
      </LocaleNavigationGate>,
    );

    expect(screen.queryByText("Application content")).not.toBeInTheDocument();
    expect(screen.getByAltText("Car")).toBeInTheDocument();
  });
});
