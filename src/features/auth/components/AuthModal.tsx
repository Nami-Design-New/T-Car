"use client";

import { useTranslations } from "next-intl";

import { formatPhoneFieldValue } from "@/shared/lib/phone";
import { Dialog } from "@/shared/ui/Dialog";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import LoginForm from "./LoginForm";
import OtpForm from "./OtpForm";
import RegisterForm from "./RegisterForm";
import { useAuthFlow } from "./useAuthFlow";

type Props = {
  show: boolean;
  onHide: () => void;
  /** Where to go after signing in, e.g. the protected page that sent the user here. */
  next?: string;
};

/** The sign-in dialog. The flow (steps, actions, toasts) lives in `useAuthFlow`. */
export default function AuthModal({ show, onHide, next }: Props) {
  const t = useTranslations("authSuccess");
  const flow = useAuthFlow({ next, onDone: onHide });
  const { state, pending } = flow;

  const close = () => {
    if (pending) return;
    flow.reset();
    onHide();
  };

  const renderStep = () => {
    switch (state.step) {
      case "login":
        return (
          <LoginForm
            defaultPhone={state.phone}
            onNext={flow.requestOtp}
            loading={pending}
          />
        );

      case "otp":
        return (
          <OtpForm
            phone={formatPhoneFieldValue(state.phone)}
            onBack={flow.back}
            onEditPhone={flow.back}
            onVerify={flow.verify}
            onResend={flow.resend}
            loading={pending}
          />
        );

      case "register":
        return (
          <RegisterForm
            onBack={flow.back}
            onSubmit={flow.register}
            loading={pending}
          />
        );

      case "success":
        return (
          <ResultDialog
            open
            status="success"
            description={t("description")}
            onClose={flow.finish}
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
