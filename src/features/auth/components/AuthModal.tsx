"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import type { AppError } from "@/shared/lib/errors";
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

  const [step, setStep] = useState<Step>("login");
  const [phone, setPhone] = useState("");
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

  const handleRequestOtp = (value: string) =>
    run(async () => {
      const result = fromActionResult(await requestOtpAction(value));
      if (!result.ok) return result.error;
      setPhone(value);
      setStep("otp");
    });

  const handleResend = () =>
    run(async () => {
      const result = fromActionResult(await requestOtpAction(phone));
      if (!result.ok) return result.error;
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
