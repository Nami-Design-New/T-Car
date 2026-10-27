import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/shared/lib/result";

const actions = vi.hoisted(() => ({
  requestOtpAction: vi.fn(),
  verifyOtpAction: vi.fn(),
  registerAction: vi.fn(),
}));
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../actions", () => actions);
vi.mock("@/i18n/navigation", () => ({ useRouter: () => router }));
vi.mock("@/shared/hooks/useNotify", () => ({ useNotify: () => notify }));

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

function renderFlow(next?: string) {
  const onDone = vi.fn();
  const view = renderHook(() => useAuthFlow({ next, onDone }));
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

  it("treats `location` as signed in until the product decides (Q2)", async () => {
    const { result, onDone } = renderFlow();
    await toOtpStep(result);
    actions.verifyOtpAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "location" },
    });

    await act(() => result.current.verify("1234"));
    expect(onDone).toHaveBeenCalled();
  });

  it("opens registration for a new account, then submits it with the phone and code", async () => {
    const { result } = renderFlow();
    await toOtpStep(result);
    actions.verifyOtpAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "register" },
    });
    await act(() => result.current.verify("1234"));
    expect(result.current.state).toEqual({
      step: "register",
      phone,
      code: "1234",
    });

    actions.registerAction.mockResolvedValue({ ok: true, data: undefined });
    await act(() => result.current.register(profile));

    expect(actions.registerAction).toHaveBeenCalledWith({
      phone,
      code: "1234",
      ...profile,
    });
    expect(result.current.state).toEqual({ step: "success" });
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

  it("keeps the number when going back from registration to the phone", async () => {
    const { result } = renderFlow();
    await toOtpStep(result);
    actions.verifyOtpAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "register" },
    });
    await act(() => result.current.verify("1234"));

    act(() => result.current.back());
    expect(result.current.state).toEqual({ step: "otp", phone });
    act(() => result.current.back());
    expect(result.current.state).toEqual({ step: "login", phone });
  });

  it("forgets the number when the dialog is reset", async () => {
    const { result } = renderFlow();
    await toOtpStep(result);
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ step: "login" });
  });
});
