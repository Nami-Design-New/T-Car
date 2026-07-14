'use client';

import Modal from 'react-bootstrap/Modal';
import { useState } from 'react';

import LoginForm from './LoginForm';
import OtpForm from './OtpForm';
import RegisterForm from './RegisterForm';
import SuccessModal from '../common/SuccessModal';

type Props = {
  show: boolean;
  onHide: () => void;
};

export default function AuthModal({ show, onHide }: Props) {
  const [step, setStep] = useState<
    'login' | 'otp' | 'register' | 'success'
  >('login');

  const renderStep = () => {
    switch (step) {
      case 'login':
        return (
          <LoginForm
            onNext={() => setStep('otp')}
            onRegister={() => setStep('register')}
          />
        );
case 'otp':
  return (
    <OtpForm
      phone="+966 5********"
      onBack={() => setStep('login')}
      onVerify={() => setStep('register')}
    />
  );

case 'register':
  return (
    <RegisterForm
      onBack={() => setStep('otp')}
      onSuccess={() => setStep('success')}
    />
  );
case 'success':
  return (
    <SuccessModal
      open={true}
      title="تم إنشاء الحساب بنجاح"
      description="يمكنك الآن الاستمتاع بجميع خدمات T-Car."
      buttonText="ابدأ الآن"
      onDone={() => {
        setStep('login');
        onHide();
      }}
    />
  );
    }
  };

  return (
   <Modal
  show={show}
  onHide={onHide}
  centered
  backdrop="static"
  className="auth_modal_wrapper"
>
  <Modal.Header closeButton className="auth_modal_header" />

  <Modal.Body className="auth_modal">
    {renderStep()}
  </Modal.Body>
</Modal>
  );
}