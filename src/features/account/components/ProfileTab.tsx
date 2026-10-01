'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from '@/i18n/navigation';
import {
  FiCalendar,
  FiChevronLeft,
  FiCheck,
  FiAlertCircle,
  FiTrash2,
} from 'react-icons/fi';

import type { UserProfile } from '../model';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { fromActionResult } from '@/shared/lib/result';
import {
  deleteAccountAction,
  saveProfileAction,
  sendPhoneCodeAction,
  uploadLicenseAction,
  verifyPhoneAction,
} from '../actions';

const EditPhoneModal = dynamic(() => import('./EditPhoneModal'), { ssr: false });
const VerifyPhoneModal = dynamic(() => import('./VerifyPhoneModal'), { ssr: false });
const LicenseModal = dynamic(() => import('./LicenseModal'), { ssr: false });
const FailedModal = dynamic(() => import('@components/common/FailedModal'), { ssr: false });

interface Props {
  profile: UserProfile;
}

type PhoneStep = 'edit' | 'verify' | null;
type PendingAction = 'save' | 'send' | 'resend' | 'verify' | 'license' | 'delete' | null;

export default function ProfileTab({ profile }: Props) {
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ==================== Phone ====================

  const [phoneStep, setPhoneStep] =
    useState<PhoneStep>(null);

  const [pendingPhone, setPendingPhone] =
    useState('');

  // ==================== License ====================

  const [showLicenseModal, setShowLicenseModal] =
    useState(false);

  // ==================== Delete Account ====================

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  // ==================== Form Change ====================

  const handleChange = (
    field: keyof UserProfile,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ==================== Send OTP ====================

  const handleSendCode = async (phone: string) => {
    setPendingAction('send');
    setSendError(null);
    try {
      const result = fromActionResult(await sendPhoneCodeAction(phone));
      if (!result.ok) {
        setSendError(errorMessage(result.error));
        return;
      }
      setPendingPhone(phone);
      setResendError(null);
      setVerifyError(null);
      setPhoneStep('verify');
    } catch (error) {
      setSendError(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  // ==================== Resend OTP ====================

  const handleResendCode = async (phone: string) => {
    setPendingAction('resend');
    setResendError(null);
    try {
      const result = fromActionResult(await sendPhoneCodeAction(phone));
      if (!result.ok) {
        setResendError(errorMessage(result.error));
        return false;
      }
      return true;
    } catch (error) {
      setResendError(errorMessage(error));
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  // ==================== Verify Phone ====================

  const handleVerifyCode = async (code: string) => {
    setPendingAction('verify');
    setVerifyError(null);
    try {
      const result = fromActionResult(await verifyPhoneAction(pendingPhone, code));
      if (!result.ok) {
        setVerifyError(errorMessage(result.error));
        return false;
      }
      return true;
    } catch (error) {
      setVerifyError(errorMessage(error));
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const handleVerified = (phone: string) => {
    handleChange('phone', phone);

    setPhoneStep(null);
    setPendingPhone('');
  };

  // ==================== Submit License ====================

  const handleLicenseSubmit = async (file: File) => {
    setPendingAction('license');
    setLicenseError(null);
    try {
      const formData = new FormData();
      formData.set('license', file);
      const result = fromActionResult(await uploadLicenseAction(formData));
      if (!result.ok) {
        setLicenseError(errorMessage(result.error));
        return;
      }
      setShowLicenseModal(false);
    } catch (error) {
      setLicenseError(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  // ==================== Delete Account ====================

  const handleDeleteAccount = async () => {
    setPendingAction('delete');
    setDeleteError(null);
    try {
      const result = fromActionResult(await deleteAccountAction());
      if (!result.ok) {
        setDeleteError(errorMessage(result.error));
        return;
      }
      // The action also ended the session; leave the protected page.
      setShowDeleteModal(false);
      router.replace('/');
      router.refresh();
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveProfile = async () => {
    setPendingAction('save');
    setSaveError(null);
    setSaved(false);
    try {
      const result = fromActionResult(await saveProfileAction(form));
      if (!result.ok) {
        setSaveError(errorMessage(result.error));
        return;
      }
      setForm(result.data);
      setSaved(true);
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="account-panel profile_tab">

      {/* ==================== Full Name ==================== */}

      <div className="form_field">
        <label>
          الاسم بالكامل
        </label>

        <input
          type="text"
          value={form.fullName}
          onChange={(e) =>
            handleChange(
              'fullName',
              e.target.value
            )
          }
        />
      </div>

      {/* ==================== Email ==================== */}

      <div className="form_field">
        <label>
          البريد الإلكتروني
        </label>

        <input
          type="email"
          value={form.email}
          onChange={(e) =>
            handleChange(
              'email',
              e.target.value
            )
          }
        />
      </div>

      {/* ==================== Birth Date ==================== */}

      <div className="form_field">
        <label>
          تاريخ الميلاد
        </label>

        <div className="input_wrapper">
          <span className="icon">
            <FiCalendar />
          </span>

          <input
            type="date"
            value={form.birthDate}
            onChange={(e) =>
              handleChange(
                'birthDate',
                e.target.value
              )
            }
          />
        </div>
      </div>

      {/* ==================== Phone ==================== */}

      <div className="profile_action_field">
        <button
          type="button"
          className="profile_action_btn"
          onClick={() =>
            setPhoneStep('edit')
          }
        >
          <div className="profile_action_content">

            <span className="profile_action_title">
              رقم الجوال
            </span>

            <div className="profile_action_value">
              <FiCheck />

              <span>
                {form.phone}
              </span>
            </div>

          </div>

          <FiChevronLeft className="arrow" />
        </button>
      </div>

      {/* ==================== License Not Verified ==================== */}

      <div className="profile_action_field warning">
        <button
          type="button"
          className="profile_action_btn"
          onClick={() => {
            setLicenseError(null);
            setShowLicenseModal(true);
          }}
        >
          <div className="profile_action_content">

            <span className="profile_action_title">
              رخصة القيادة
            </span>

            <div className="profile_action_value">
              <FiAlertCircle />

              <span>
                يرجى إرفاق رخصة لكي نتمكن من
                التحقق من الحجز
              </span>
            </div>

          </div>

          <FiChevronLeft className="arrow" />
        </button>
      </div>

      {/* ==================== License Verified ==================== */}

      <div className="profile_action_field">
        <button
          type="button"
          className="profile_action_btn"
          onClick={() => {
            // TODO:
            // فتح تفاصيل الرخصة
          }}
        >
          <div className="profile_action_content">

            <span className="profile_action_title">
              رخصة القيادة
            </span>

            <div className="profile_action_value verified">
              <FiCheck />

              <span>
                تم التحقق من الرخصة
              </span>
            </div>

          </div>

          <FiChevronLeft className="arrow" />
        </button>
      </div>

      {/* ==================== Delete Account ==================== */}

      <button
        type="button"
        className="delete_account_btn mb-2"
        onClick={() => {
          setDeleteError(null);
          setShowDeleteModal(true);
        }}
      >
        <FiTrash2 />

        <span>
          حذف الحساب
        </span>
      </button>

      {/* ==================== Save ==================== */}

      <button
        type="button"
        className="save_btn"
        disabled={pendingAction === 'save'}
        aria-busy={pendingAction === 'save'}
        onClick={handleSaveProfile}
      >
        حفظ
      </button>

      {saveError && (
        <p className="text-danger small mt-2 mb-0" role="alert">
          {saveError}
        </p>
      )}
      {saved && (
        <p className="text-success small mt-2 mb-0" role="status">
          تم حفظ التعديلات
        </p>
      )}

      {/* ==================== Edit Phone Modal ==================== */}

      <EditPhoneModal
        open={phoneStep === 'edit'}
        onClose={() => {
          if (pendingAction !== 'send') {
            setSendError(null);
            setPhoneStep(null);
          }
        }}
        currentPhone={form.phone}
        onSendCode={handleSendCode}
        loading={pendingAction === 'send'}
        error={sendError ?? undefined}
      />

      {/* ==================== Verify Phone Modal ==================== */}

      <VerifyPhoneModal
        open={phoneStep === 'verify'}
        onClose={() =>
          setPhoneStep(null)
        }
        phone={pendingPhone}
        onEditPhone={() => {
          if (pendingAction !== 'resend') setPhoneStep('edit');
        }}
        onVerified={handleVerified}
        onResendCode={handleResendCode}
        onVerifyCode={handleVerifyCode}
        loading={pendingAction === 'resend' || pendingAction === 'verify'}
        error={verifyError ?? resendError ?? undefined}
      />

      {/* ==================== License Modal ==================== */}

      <LicenseModal
        open={showLicenseModal}
        onClose={() => {
          if (pendingAction !== 'license') setShowLicenseModal(false);
        }}
        onSubmit={handleLicenseSubmit}
        loading={pendingAction === 'license'}
        error={licenseError ?? undefined}
      />

      {/* ==================== Delete Account Modal ==================== */}

      <FailedModal
        open={showDeleteModal}
        title="تأسف لرغبتك في المغادرة."
        description="عند حذف الحساب سيتم إزالة بياناتك الشخصية وسجل حجوزاتك بشكل نهائي ولن يكون بإمكانك استرجاعها لاحقاً. هل أنت متأكد من رغبتك بالمتابعة؟"
        primaryButtonText="حذف الحساب"
        secondaryButtonText="الاحتفاظ بالحساب"
        showButtons
        loading={pendingAction === 'delete'}
        error={deleteError ?? undefined}
        onPrimary={handleDeleteAccount}
        onSecondary={() => {
          if (pendingAction !== 'delete') setShowDeleteModal(false);
        }}
      />

    </div>
  );
}
