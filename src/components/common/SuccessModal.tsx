'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Lottie from 'lottie-react';

import successAnimation from '@assets/images/successful_login.json';

interface Props {
  open: boolean;

  title: string;
  description: string;

  buttonText?: string;

  redirectTo?: string;

  autoRedirect?: boolean;
  duration?: number;

  onDone?: () => void;
  variant?: 'default' | 'wallet-topup';
  appearButton?: boolean;
  autoCloseDuration?: number;
}

export default function SuccessModal({
  open,
  title,
  description,
  buttonText = 'حسناً',
  redirectTo,
  autoRedirect = false,
  duration = 2200,
  onDone,
  variant = 'default',
  appearButton = true,
  autoCloseDuration = 2000,
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';

    let timer: NodeJS.Timeout;
    let closeTimer: NodeJS.Timeout;

    if (autoRedirect && redirectTo) {
      timer = setTimeout(() => {
        router.push(redirectTo);
      }, duration);
    }

    if (onDone) closeTimer = setTimeout(onDone, autoCloseDuration);

    return () => {
      document.body.style.overflow = '';

      if (timer) clearTimeout(timer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [open, autoRedirect, redirectTo, duration, router, onDone, autoCloseDuration]);

  if (!open || !mounted) return null;

  const handleClick = () => {
    if (onDone) {
      onDone();
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  return createPortal(
    <div className="modal_overlay">
      <div className="success_modal">
        <Lottie animationData={successAnimation} loop={false} className="success_animation" />

        <h2>{title}</h2>

        <p>{description}</p>
        {appearButton && (
          <button className="auth_btn" onClick={handleClick}>
            {buttonText}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
