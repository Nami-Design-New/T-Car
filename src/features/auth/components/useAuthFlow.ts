"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import type { AppError } from "@/shared/lib/errors";
import type { PhoneFieldValue } from "@/shared/lib/phone";
import { fromActionResult } from "@/shared/lib/result";
import {
  completeProfileAction,
  discardRegistrationAction,
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
  // The verified phone's token waits on the server (pending registration),
  // so the profile needs no phone or code; there is no session yet.
  | { step: "register"; phone: PhoneFieldValue };

interface Options {
  /** Where to go after signing in, e.g. the protected page that sent the user here. */
  next?: string;
  /** Closes the dialog. */
  onDone: () => void;
  onRegistrationSuccess?: (locationNext: boolean) => void;
  onLocationRequired?: () => void;
}

/**
 * The sign-in flow behind `AuthModal`: step state, the Server Actions, and
 * the toasts. The forms only validate and render; each handler resolves with
 * the error the form should show (or `undefined`), and the form keeps its input.
 */
export function useAuthFlow({
  next,
  onDone,
  onRegistrationSuccess,
  onLocationRequired,
}: Options) {
  const router = useRouter();
  const notify = useNotify();
  const errorMessage = useErrorMessage();
  const [state, setState] = useState<AuthFlowState>({ step: "login" });
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
   * Closes the dialog without finishing. Leaving the profile form discards the
   * registration (product decision): the next sign-in verifies a new code.
   */
  const dismiss = () => {
    if (state.step === "register") void discardRegistrationAction();
    reset();
    onDone();
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
      if (!result.ok && result.error.kind === "unauthorized") {
        // The registration expired: back to the phone for a new code.
        notify.error(errorMessage(result.error));
        setState({ step: "login", phone: state.phone });
        return undefined;
      }
      if (!result.ok) return formError(result.error);
      notify.success(result.message);
      onRegistrationSuccess?.(result.data.onboardingStep === "location");
      reset();
      onDone();
      router.refresh();
    });

  /**
   * One step back to the phone (kept, with its country, so it can be edited).
   * From the profile that discards the registration: the code is spent, so a
   * new one is needed.
   */
  const back = () => {
    if (state.step === "register") void discardRegistrationAction();
    if (state.step !== "login") setState({ step: "login", phone: state.phone });
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
