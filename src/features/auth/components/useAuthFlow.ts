"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useNotify } from "@/shared/hooks/useNotify";
import type { AppError } from "@/shared/lib/errors";
import type { PhoneFieldValue } from "@/shared/lib/phone";
import { fromActionResult } from "@/shared/lib/result";
import {
  completeProfileAction,
  requestOtpAction,
  verifyOtpAction,
} from "../actions";
import type { RegisterFormValues } from "../validation";

/**
 * Where the sign-in dialog is. Each step carries what it needs, so the OTP
 * step cannot exist without the phone the code was sent to. `phone` on the
 * login and register steps is only for going back.
 */
export type AuthFlowState =
  | { step: "login"; phone?: PhoneFieldValue }
  | { step: "otp"; phone: PhoneFieldValue }
  // The session (signed in at verification) identifies the customer, so the
  // profile needs no phone or code; a resumed session has no phone at all.
  | { step: "register"; phone?: PhoneFieldValue };

/** Where the dialog opens: `register` for a session whose profile is still missing. */
export type AuthFlowStart = "login" | "register";

interface Options {
  /** Where to go after signing in, e.g. the protected page that sent the user here. */
  next?: string;
  /** Closes the dialog. */
  onDone: () => void;
  onRegistrationSuccess?: (locationNext: boolean) => void;
  onLocationRequired?: () => void;
  initialStep?: AuthFlowStart;
}

/**
 * The sign-in flow behind `AuthModal`: step state, the Server Actions, and
 * the toasts. The forms only validate and render; each handler resolves with
 * the error the form should show (or `undefined`), and the form keeps its input.
 */
export function useAuthFlow({
  next,
  onDone,
  initialStep = "login",
  onRegistrationSuccess,
  onLocationRequired,
}: Options) {
  const router = useRouter();
  const notify = useNotify();
  const [state, setState] = useState<AuthFlowState>({ step: initialStep });
  const [pending, setPending] = useState(false);

  const reset = () => setState({ step: "login" });

  /** The server now has a session: re-render the header and protected pages. */
  const finish = () => {
    reset();
    onDone();
    if (next) router.replace(next);
    router.refresh();
  };

  /**
   * Closes the dialog without finishing. Leaving the profile form keeps the
   * session (it exists since verification), so the header is refreshed to
   * offer completing the profile.
   */
  const dismiss = () => {
    const leftProfile = state.step === "register";
    reset();
    onDone();
    if (leftProfile) router.refresh();
  };

  /** Runs one action at a time; resolves with the error for the form. */
  const run = async (action: () => Promise<AppError | undefined>) => {
    if (pending) return undefined;
    setPending(true);
    try {
      return await action();
    } finally {
      setPending(false);
    }
  };

  /**
   * A backend validation message is toasted as it is (doc 3 §6), and the form
   * keeps its input without a second, inline message. Any other error goes
   * back to the form.
   */
  const formError = (error: AppError) => {
    if (error.kind === "validation" && error.serverMessage) {
      notify.error(error.serverMessage);
      return undefined;
    }
    return error;
  };

  const requestOtp = (value: PhoneFieldValue) =>
    run(async () => {
      const result = fromActionResult(await requestOtpAction(value));
      if (!result.ok) return formError(result.error);
      notify.success(result.message);
      setState({ step: "otp", phone: result.data });
    });

  const resend = () =>
    run(async () => {
      if (state.step !== "otp") return undefined;
      const result = fromActionResult(await requestOtpAction(state.phone));
      if (!result.ok) return formError(result.error);
      notify.success(result.message);
    });

  const verify = (code: string) =>
    run(async () => {
      if (state.step !== "otp") return undefined;
      const result = fromActionResult(await verifyOtpAction(state.phone, code));
      if (!result.ok) return formError(result.error);
      const { onboardingStep } = result.data;
      if (onboardingStep === "register") {
        setState({ step: "register", phone: state.phone });
      } else if (onboardingStep === "location") {
        onLocationRequired?.();
        reset();
        onDone();
        router.refresh();
      } else {
        finish();
      }
    });

  const register = (values: RegisterFormValues) =>
    run(async () => {
      if (state.step !== "register") return undefined;
      const result = fromActionResult(await completeProfileAction(values));
      if (!result.ok) return formError(result.error);
      notify.success(result.message);
      onRegistrationSuccess?.(result.data.onboardingStep === "location");
      reset();
      onDone();
      router.refresh();
    });

  /**
   * One step back: from the code to the phone (kept, with its country, so it
   * can be edited), from the profile to the code. A resumed profile step has
   * no phone, so it goes back to the start.
   */
  const back = () => {
    if (state.step === "otp") setState({ step: "login", phone: state.phone });
    if (state.step === "register") {
      setState(
        state.phone ? { step: "otp", phone: state.phone } : { step: "login" },
      );
    }
  };

  return {
    state,
    pending,
    requestOtp,
    resend,
    verify,
    register,
    back,
    reset,
    dismiss,
    finish,
  };
}
