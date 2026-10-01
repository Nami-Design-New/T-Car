'use client';

import { useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';
import { fromActionResult } from '@/shared/lib/result';
import { Dialog } from '@/shared/ui/Dialog';
import { ResultDialog } from '@/shared/ui/ResultDialog';
import { registerAction, requestOtpAction, verifyOtpAction } from '../actions';
import type { RegistrationInput } from '../model';
import LoginForm from './LoginForm';
import OtpForm from './OtpForm';
import RegisterForm, { type RegisterValues } from './RegisterForm';

interface SuccessProps {
  open: boolean;
  title: string;
  description: string;
  buttonText: string;
  onDone: () => void;
}

function SuccessModal({ open, title, description, buttonText, onDone }: SuccessProps) {
  return (
    <ResultDialog
      open={open}
      status="success"
      title={title}
      description={description}
      action={{ label: buttonText, onClick: onDone }}
      onClose={onDone}
    />
  );
}

type Props = {
  show: boolean;
  onHide: () => void;
  /** Where to go after signing in, e.g. the protected page that sent the user here. */
  next?: string;
};

type Step = 'login' | 'otp' | 'register' | 'success';

export default function AuthModal({ show, onHide, next }: Props) {
  const router = useRouter();
  const errorMessage = useErrorMessage();

  const [step, setStep] = useState<Step>('login');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const reset = () => {
    setStep('login');
    setCode('');
    setError(null);
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

  const run = async <T,>(action: () => Promise<T>) => {
    setPending(true);
    setError(null);
    try {
      return await action();
    } finally {
      setPending(false);
    }
  };

  const handleRequestOtp = (value: string) =>
    run(async () => {
      const result = fromActionResult(await requestOtpAction(value));
      if (!result.ok) return setError(result.error);
      setPhone(value);
      setStep('otp');
    });

  const handleResend = () =>
    run(async () => {
      const result = fromActionResult(await requestOtpAction(phone));
      if (!result.ok) setError(result.error);
    });

  const handleVerify = (value: string) =>
    run(async () => {
      const result = fromActionResult(await verifyOtpAction(phone, value));
      if (!result.ok) return setError(result.error);
      setCode(value);
      if (result.data.registrationRequired) setStep('register');
      else finish();
    });

  const handleRegister = (values: RegisterValues) =>
    run(async () => {
      const input: RegistrationInput = { phone, code, ...values };
      const result = fromActionResult(await registerAction(input));
      if (!result.ok) return setError(result.error);
      setStep('success');
    });

  const errorText = error ? errorMessage(error) : undefined;

  const renderStep = () => {
    switch (step) {
      case 'login':
        return <LoginForm onNext={handleRequestOtp} loading={pending} error={errorText} />;

      case 'otp':
        return (
          <OtpForm
            phone={phone}
            onBack={() => {
              setError(null);
              setStep('login');
            }}
            onVerify={handleVerify}
            onResend={handleResend}
            loading={pending}
            error={errorText}
          />
        );

      case 'register':
        return (
          <RegisterForm
            onBack={() => {
              setError(null);
              setStep('otp');
            }}
            onSubmit={handleRegister}
            loading={pending}
            error={errorText}
          />
        );

      case 'success':
        return (
          <SuccessModal
            open={true}
            title="تم إنشاء الحساب بنجاح"
            description="يمكنك الآن الاستمتاع بجميع خدمات T-Car."
            buttonText="ابدأ الآن"
            onDone={finish}
          />
        );
    }
  };

  return (
    <Dialog
      open={show}
      onClose={close}
      className="auth_modal_wrapper"
      closeOnEscape={!pending}
      closeOnBackdrop={!pending}
      label="Authentication"
    >
      <Dialog.Header className="auth_modal_header">
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body className="auth_modal">{renderStep()}</Dialog.Body>
    </Dialog>
  );
}
