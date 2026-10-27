import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/shared/lib/result";

const actions = vi.hoisted(() => ({
  requestOtpAction: vi.fn(),
  verifyOtpAction: vi.fn(),
  completeProfileAction: vi.fn(),
  discardRegistrationAction: vi.fn(),
}));
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../actions", () => actions);
vi.mock("@/i18n/navigation", () => ({ useRouter: () => router }));
vi.mock("@/shared/hooks/useNotify", () => ({ useNotify: () => notify }));
// Translated text is not under test here: the error kind stands in for it.
vi.mock("@/shared/hooks/useErrorMessage", () => ({
  useErrorMessage: () => (error: { kind: string }) => `text:${error.kind}`,
}));

import { useAuthFlow } from "./useAuthFlow";

const phone = { countryCode: "+966", phone: "544444442" };
const profile = {
  fullName: "New Customer",
  email: "new@domain.com",
  birthDate: "1990-05-17",
};
const validation422 = (serverMessage: string): ActionResult<never> => ({
  ok: false,
  error: { kind: "validation", status: 422, serverMessage },
});

function renderFlow(
  next?: string,
  callbacks: {
    onRegistrationSuccess?: (locationNext: boolean) => void;
    onLocationRequired?: () => void;
  } = {},
) {
  const onDone = vi.fn();
  const view = renderHook(() =>
    useAuthFlow({ next, onDone, ...callbacks }),
  );
  return { ...view, onDone };
}

/** Requests the code for `phone`, so the flow is on the OTP step. */
async function toOtpStep(flow: ReturnType<typeof renderFlow>["result"]) {
  actions.requestOtpAction.mockResolvedValue({
    ok: true,
    data: phone,
    message: "OTP has been sent successfully.",
  });
  await act(() =>
    flow.current.requestOtp({ countryCode: "+966", phone: "0544444442" }),
  );
}

/** Verifies a new number, so the flow is on the profile step (no session yet). */
async function toRegisterStep(flow: ReturnType<typeof renderFlow>["result"]) {
  await toOtpStep(flow);
  actions.verifyOtpAction.mockResolvedValue({
    ok: true,
    data: { onboardingStep: "register" },
  });
  await act(() => flow.current.verify("1234"));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAuthFlow", () => {
  it("moves to the OTP step with the normalized phone and toasts the backend message", async () => {
    const { result } = renderFlow();
    await toOtpStep(result);

    expect(result.current.state).toEqual({ step: "otp", phone });
    expect(notify.success).toHaveBeenCalledWith(
      "OTP has been sent successfully.",
    );
  });

  it("toasts a backend validation error and stays on the step without a form error", async () => {
    actions.requestOtpAction.mockResolvedValue(
      validation422("The phone number must be 8 to 15 digits only."),
    );
    const { result } = renderFlow();

    let formError: unknown;
    await act(async () => {
      formError = await result.current.requestOtp(phone);
    });

    expect(formError).toBeUndefined();
    expect(notify.error).toHaveBeenCalledWith(
      "The phone number must be 8 to 15 digits only.",
    );
    expect(result.current.state).toEqual({ step: "login" });
  });

  it("returns other errors to the form", async () => {
    actions.requestOtpAction.mockResolvedValue({
      ok: false,
      error: { kind: "rate_limited" },
    });
    const { result } = renderFlow();

    let formError: unknown;
    await act(async () => {
      formError = await result.current.requestOtp(phone);
    });

    expect(formError).toMatchObject({ kind: "rate_limited" });
    expect(notify.error).not.toHaveBeenCalled();
  });

  it("finishes sign-in for a completed account and goes to `next`", async () => {
    const { result, onDone } = renderFlow("/account/profile");
    await toOtpStep(result);
    actions.verifyOtpAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "completed" },
    });

    await act(() => result.current.verify("1234"));

    expect(actions.verifyOtpAction).toHaveBeenCalledWith(phone, "1234");
    expect(onDone).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/account/profile");
    expect(router.refresh).toHaveBeenCalled();
    expect(result.current.state).toEqual({ step: "login" });
  });

  it("closes auth and requests the separate location modal when location is missing", async () => {
    const onLocationRequired = vi.fn();
    const { result, onDone } = renderFlow(undefined, {
      onLocationRequired,
    });
    await toOtpStep(result);
    actions.verifyOtpAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "location" },
    });

    await act(() => result.current.verify("1234"));
    expect(result.current.state).toEqual({ step: "login" });
    expect(onLocationRequired).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("closes auth and requests separate success and location modals after registration", async () => {
    const onRegistrationSuccess = vi.fn();
    const { result, onDone } = renderFlow(undefined, {
      onRegistrationSuccess,
    });
    await toRegisterStep(result);
    actions.completeProfileAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "location" },
      message: "Profile updated successfully.",
    });
    await act(() => result.current.register(profile));
    expect(onRegistrationSuccess).toHaveBeenCalledWith(true);
    expect(result.current.state).toEqual({ step: "login" });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("closes auth and requests the separate success modal when registration is complete", async () => {
    const onRegistrationSuccess = vi.fn();
    const { result, onDone } = renderFlow(undefined, {
      onRegistrationSuccess,
    });
    await toRegisterStep(result);
    actions.completeProfileAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "completed" },
      message: "Profile updated successfully.",
    });
    await act(() => result.current.register(profile));

    expect(onRegistrationSuccess).toHaveBeenCalledWith(false);
    expect(onDone).toHaveBeenCalledOnce();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("opens the profile for a new account, completes it, and toasts the message", async () => {
    const { result } = renderFlow();
    await toOtpStep(result);
    actions.verifyOtpAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "register" },
    });
    await act(() => result.current.verify("1234"));
    expect(result.current.state).toEqual({ step: "register", phone });

    actions.completeProfileAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "location" },
      message: "Profile updated successfully.",
    });
    await act(() => result.current.register(profile));

    expect(actions.completeProfileAction).toHaveBeenCalledWith(profile);
    expect(notify.success).toHaveBeenLastCalledWith(
      "Profile updated successfully.",
    );
    expect(result.current.state).toEqual({ step: "login" });
  });

  it("toasts a profile rejected by the backend and keeps the form", async () => {
    const { result } = renderFlow();
    await toRegisterStep(result);
    actions.completeProfileAction.mockResolvedValue(
      validation422("The email has already been taken."),
    );

    let formError: unknown;
    await act(async () => {
      formError = await result.current.register(profile);
    });

    expect(formError).toBeUndefined();
    expect(notify.error).toHaveBeenCalledWith(
      "The email has already been taken.",
    );
    expect(result.current.state).toEqual({ step: "register", phone });
  });

  it("goes back to the phone with a toast when the registration expired", async () => {
    const { result } = renderFlow();
    await toRegisterStep(result);
    actions.completeProfileAction.mockResolvedValue({
      ok: false,
      error: { kind: "unauthorized" },
    });

    let formError: unknown;
    await act(async () => {
      formError = await result.current.register(profile);
    });

    expect(formError).toBeUndefined();
    expect(notify.error).toHaveBeenCalledWith("text:unauthorized");
    expect(result.current.state).toEqual({ step: "login", phone });
  });

  it("discards the registration when the profile form is closed", async () => {
    const { result, onDone } = renderFlow();
    await toRegisterStep(result);
    act(() => result.current.dismiss());

    expect(actions.discardRegistrationAction).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalled();
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("closes the phone step without discarding or refreshing", () => {
    const { result } = renderFlow();
    act(() => result.current.dismiss());
    expect(actions.discardRegistrationAction).not.toHaveBeenCalled();
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("toasts a wrong code and keeps the OTP step", async () => {
    const { result } = renderFlow();
    await toOtpStep(result);
    actions.verifyOtpAction.mockResolvedValue(
      validation422("The verification code is invalid or expired."),
    );

    await act(() => result.current.verify("0000"));

    expect(notify.error).toHaveBeenCalledWith(
      "The verification code is invalid or expired.",
    );
    expect(result.current.state).toEqual({ step: "otp", phone });
  });

  it("resends to the same phone and steps back", async () => {
    const { result } = renderFlow();
    await toOtpStep(result);

    await act(() => result.current.resend());
    expect(actions.requestOtpAction).toHaveBeenLastCalledWith(phone);

    act(() => result.current.back());
    expect(result.current.state).toEqual({ step: "login", phone });
  });

  it("discards the registration and keeps the number when going back from the profile", async () => {
    const { result } = renderFlow();
    await toRegisterStep(result);

    act(() => result.current.back());
    expect(actions.discardRegistrationAction).toHaveBeenCalledOnce();
    expect(result.current.state).toEqual({ step: "login", phone });
  });

  it("forgets the number when the dialog is reset", async () => {
    const { result } = renderFlow();
    await toOtpStep(result);
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ step: "login" });
  });
});
