'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import Lottie from 'lottie-react';
import { Dialog } from '@/shared/ui/Dialog';

import successAnimation from '@/assets/animations/successful_login.json';

interface Props {
  open: boolean;

  title: string;
  description: string;

  buttonText?: string;

  redirectTo?: string;

  autoRedirect?: boolean;
  duration?: number;

  onDone?: () => void;
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
  appearButton = true,
  autoCloseDuration = 2000,
}: Props) {
  const router = useRouter();
  // The latest onDone, so a caller that re-renders (e.g. a ticking countdown) and passes a new
  // function each time does not restart the auto-close timer.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const hasOnDone = !!onDone;

  useEffect(() => {
    if (!open) return;

    let timer: NodeJS.Timeout;
    let closeTimer: NodeJS.Timeout;

    if (autoRedirect && redirectTo) {
      timer = setTimeout(() => {
        router.push(redirectTo);
      }, duration);
    }

    if (hasOnDone) closeTimer = setTimeout(() => onDoneRef.current?.(), autoCloseDuration);

    return () => {
      if (timer) clearTimeout(timer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [open, autoRedirect, redirectTo, duration, router, hasOnDone, autoCloseDuration]);

  const handleClick = () => {
    if (onDone) {
      onDone();
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClick}
      size="sm"
      className="success_modal"
      closeOnEscape={!!onDone || !!redirectTo}
      closeOnBackdrop={false}
    >
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>
      <Lottie animationData={successAnimation} loop={false} className="success_animation" />

      <Dialog.Description>{description}</Dialog.Description>
      {appearButton && (
        <button className="auth_btn" onClick={handleClick}>
          {buttonText}
        </button>
      )}
    </Dialog>
  );
}
