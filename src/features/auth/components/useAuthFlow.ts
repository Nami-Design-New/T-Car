"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useNotify } from "@/shared/hooks/useNotify";
import type { AppError } from "@/shared/lib/errors";
import type { PhoneFieldValue } from "@/shared/lib/phone";
import { fromActionResult } from "@/shared/lib/result";
import { registerAction, requestOtpAction, verifyOtpAction } from "../actions";
import type { RegisterFormValues } from "../validation";

/**
 * Where the sign-in dialog is. Each step carries what it needs, so the OTP
 * step cannot exist without the phone the code was sent to.
 */
export type AuthFlowState =
  /** `phone`: the number to start from after going back or editing it. */
  | { step: "login"; phone?: PhoneFieldValue }
  | { step: "otp"; phone: PhoneFieldValue }
  | { step: "register"; phone: PhoneFieldValue; code: string }
  | { step: "success" };

interface Options {
  /** Where to go after signing in, e.g. the protected page that sent the user here. */
  next?: string;
  /** Closes the dialog. */
  onDone: () => void;
}

/**
 * The sign-in flow behind `AuthModal`: step state, the Server Actions, and
 * the toasts. The forms only validate and render; each handler resolves with
 * the error the form should show (or `undefined`), and the form keeps its input.
 */
export function useAuthFlow({ next, onDone }: Options) {
  const router = useRouter();
  const notify = useNotify();
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

  /** Runs one action; resolves with the error for the form. */
  const run = async (action: () => Promise<AppError | undefined>) => {
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
      // `location` is treated as signed in until the product decides whether
      // the location step is required (Auth-API.md Q2).
      if (result.data.onboardingStep === "register") {
        setState({ step: "register", phone: state.phone, code });
      } else {
        finish();
      }
    });

  const register = (values: RegisterFormValues) =>
    run(async () => {
      if (state.step !== "register") return undefined;
      const result = fromActionResult(
        await registerAction({
          phone: state.phone,
          code: state.code,
          ...values,
        }),
      );
      if (!result.ok) return formError(result.error);
      setState({ step: "success" });
    });

  /**
   * One step back: from the code to the phone (kept, with its country, so it
   * can be edited), from the profile to the code.
   */
  const back = () => {
    if (state.step === "otp") setState({ step: "login", phone: state.phone });
    if (state.step === "register")
      setState({ step: "otp", phone: state.phone });
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
    finish,
  };
}
