"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { useNotify } from "@/shared/hooks/useNotify";
import type { AppError } from "@/shared/lib/errors";
import { formatPhoneFieldValue, type PhoneFieldValue } from "@/shared/lib/phone";
import { fromActionResult } from "@/shared/lib/result";
import { Dialog } from "@/shared/ui/Dialog";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { registerAction, requestOtpAction, verifyOtpAction } from "../actions";
import type { RegisterFormValues } from "../validation";
import LoginForm from "./LoginForm";
import OtpForm from "./OtpForm";
import RegisterForm from "./RegisterForm";

type Props = {
  show: boolean;
  onHide: () => void;
  /** Where to go after signing in, e.g. the protected page that sent the user here. */
  next?: string;
};

type Step = "login" | "otp" | "register" | "success";

export default function AuthModal({ show, onHide, next }: Props) {
  const t = useTranslations("authSuccess");
  const router = useRouter();
  const notify = useNotify();

  const [step, setStep] = useState<Step>("login");
  /** The normalized phone the code was sent to. */
  const [otpPhone, setOtpPhone] = useState<PhoneFieldValue>({
    countryCode: "",
    phone: "",
  });
  // Verification and registration still run on the mock, which takes the
  // whole number (until A5 / A6).
  const phone = formatPhoneFieldValue(otpPhone);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  const reset = () => {
    setStep("login");
    setCode("");
  };

  const close = () => {
    if (pending) return;
    reset();
    onHide();
  };

  /** The server now has a session: re-render the header and protected pages. */
  const finish = () => {
    reset();
    onHide();
    if (next) router.replace(next);
    router.refresh();
  };

  /** Runs one action; resolves with its error so the form can show it and keep its input. */
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

  const handleRequestOtp = (value: PhoneFieldValue) =>
    run(async () => {
      const result = fromActionResult(await requestOtpAction(value));
      if (!result.ok) return formError(result.error);
      notify.success(result.message);
      setOtpPhone(result.data);
      setStep("otp");
    });

  const handleResend = () =>
    run(async () => {
      const result = fromActionResult(await requestOtpAction(otpPhone));
      if (!result.ok) return formError(result.error);
      notify.success(result.message);
    });

  const handleVerify = (value: string) =>
    run(async () => {
      const result = fromActionResult(await verifyOtpAction(phone, value));
      if (!result.ok) return result.error;
      setCode(value);
      if (result.data.registrationRequired) setStep("register");
      else finish();
    });

  const handleRegister = (values: RegisterFormValues) =>
    run(async () => {
      const result = fromActionResult(
        await registerAction({ phone, code, ...values }),
      );
      if (!result.ok) return result.error;
      setStep("success");
    });

  const renderStep = () => {
    switch (step) {
      case "login":
        return <LoginForm onNext={handleRequestOtp} loading={pending} />;

      case "otp":
        return (
          <OtpForm
            phone={phone}
            onBack={() => setStep("login")}
            onVerify={handleVerify}
            onResend={handleResend}
            loading={pending}
          />
        );

      case "register":
        return (
          <RegisterForm
            onBack={() => setStep("otp")}
            onSubmit={handleRegister}
            loading={pending}
          />
        );

      case "success":
        return (
          <ResultDialog
            open
            status="success"
            description={t("description")}
            onClose={finish}
          />
        );
    }
  };

  return (
    <Dialog
      open={show}
      onClose={close}

      closeOnEscape={!pending}
      closeOnBackdrop={!pending}
      label="Authentication"
    >
      <Dialog.Header>
        <Dialog.Close className="ms-auto" />
      </Dialog.Header>
      <Dialog.Body>{renderStep()}</Dialog.Body>
    </Dialog>
  );
}
