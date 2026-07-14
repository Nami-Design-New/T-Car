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

    if (autoRedirect && redirectTo) {
      timer = setTimeout(() => {
        router.push(redirectTo);
      }, duration);
    }

    return () => {
      document.body.style.overflow = '';

      if (timer) clearTimeout(timer);
    };
  }, [open, autoRedirect, redirectTo, duration, router]);

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

        <Lottie
          animationData={successAnimation}
          loop={false}
          className="success_animation"
        />

        <h2>{title}</h2>

        <p>{description}</p>

        <button
          className="auth_btn"
          onClick={handleClick}
        >
          {buttonText}
        </button>

      </div>
    </div>,
    document.body
  );
}