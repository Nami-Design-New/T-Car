import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";

const { signOutAction, refresh, success, error } = vi.hoisted(() => ({
  signOutAction: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  signOutAction,
  AuthOnboardingModals: () => null,
  LazyAuthModal: () => null,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
}));
vi.mock("@/shared/hooks/useNotify", () => ({
  useNotify: () => ({ success, error }),
}));
vi.mock("@/shared/hooks/useErrorMessage", () => ({
  useErrorMessage: () => (appError: { kind: string }) =>
    `translated:${appError.kind}`,
}));
vi.mock("./UserMenu", () => ({ default: () => null }));

import AuthControl from "./AuthControl";

beforeEach(() => vi.clearAllMocks());

describe("AuthControl logout", () => {
  it("shows the backend success message and refreshes the session", async () => {
    signOutAction.mockResolvedValue({
      ok: true,
      data: undefined,
      message: "Logged out successfully.",
    });
    renderWithIntl(<AuthControl signedIn logoutOnly loginLabel="Sign in" />);

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("Logged out successfully."),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("shows an error and refreshes after the backend fails", async () => {
    signOutAction.mockResolvedValue({ ok: false, error: { kind: "network" } });
    renderWithIntl(<AuthControl signedIn logoutOnly loginLabel="Sign in" />);

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("translated:network"),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });
});
