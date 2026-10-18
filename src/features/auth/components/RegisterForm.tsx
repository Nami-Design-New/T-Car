'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { FiArrowLeft } from 'react-icons/fi';
import { useErrorMessage, useFieldErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';
import { applyFieldErrors } from '@/shared/lib/validation';
import { Button } from '@/shared/ui/Button';
import { FormCheckbox, FormInput } from '@/shared/ui/Form';
import { registerFormSchema, type RegisterFormValues } from '../validation';

type Props = {
  onBack: () => void;
  /** Resolves with the error when registration fails; the form keeps its values for fixing. */
  onSubmit: (values: RegisterFormValues) => Promise<AppError | undefined>;
  loading?: boolean;
};

const FIELDS = ['fullName', 'email', 'birthDate', 'acceptTerms'] as const;

export default function RegisterForm({ onBack, onSubmit, loading = false }: Props) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { fullName: '', email: '', birthDate: '', acceptTerms: false },
  });

  const submit = handleSubmit(async (values) => {
    if (loading) return;
    const error = await onSubmit(values);
    if (error && !applyFieldErrors(error, setError, FIELDS)) {
      setError('root.server', { type: error.kind, message: errorMessage(error) });
    }
  });

  const formError = errors.root?.server?.message;

  return (
    <form className="register_form auth_register_form" onSubmit={submit} noValidate>
      <div className="otp_header">
        <button
          type="button"
          className="back_btn"
          onClick={onBack}
          aria-label={t('auth.register.backLabel')}
        >
          <FiArrowLeft className="mirror-in-rtl" aria-hidden="true" />
        </button>

        <h2>{t('auth.register.title')}</h2>
      </div>

      <div className="inputs">
        <FormInput
          id="register-name"
          label={t('auth.register.fullNameLabel')}
          type="text"
          placeholder={t('auth.register.fullNamePlaceholder')}
          autoComplete="name"
          required
          error={fieldError(errors.fullName?.message)}
          {...register('fullName')}
        />

        <FormInput
          id="register-email"
          label={t('auth.register.emailLabel')}
          className="email_input"
          type="email"
          dir="ltr"
          placeholder={t('auth.register.emailPlaceholder')}
          autoComplete="email"
          required
          error={fieldError(errors.email?.message)}
          {...register('email')}
        />

        <FormInput
          id="register-birth-date"
          label={t('auth.register.birthDateLabel')}
          className="date_input"
          type="date"
          dir="ltr"
          autoComplete="bday"
          required
          error={fieldError(errors.birthDate?.message)}
          {...register('birthDate')}
        />
      </div>

      <FormCheckbox
        id="register-terms"
        className="agree"
        label={t('auth.register.agreeToTerms')}
        required
        error={fieldError(errors.acceptTerms?.message)}
        {...register('acceptTerms')}
      />

      {formError && (
        <p className="text-danger small mt-2 mb-0" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-100" loading={loading}>
        {t('auth.register.submit')}
      </Button>
    </form>
  );
}
