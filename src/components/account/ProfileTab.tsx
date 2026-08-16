'use client';

import { useState } from 'react';
import {
  FiCalendar,
  FiChevronLeft,
  FiCheck,
  FiAlertCircle,
  FiTrash2,
} from 'react-icons/fi';

import type { UserProfile } from '@app-types/car';

import EditPhoneModal from '@components/modals/Editphonemodal';
import VerifyPhoneModal from '@components/modals/Verifyphonemodal';
import LicenseModal from '../modals/LicenseModal';

interface Props {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

type PhoneStep = 'edit' | 'verify' | null;

export default function ProfileTab({
  profile,
  onSave,
}: Props) {
  const [form, setForm] = useState(profile);

  // ==================== Phone ====================
  const [phoneStep, setPhoneStep] =
    useState<PhoneStep>(null);

  const [pendingPhone, setPendingPhone] =
    useState('');

  // ==================== License ====================
  const [showLicenseModal, setShowLicenseModal] =
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

  const handleSendCode = (phone: string) => {
    setPendingPhone(phone);

    // TODO:
    // إرسال OTP للـ backend

    setPhoneStep('verify');
  };

  // ==================== Resend OTP ====================

  const handleResendCode = (phone: string) => {
    // TODO:
    // إعادة إرسال OTP

    console.log('Resend code to:', phone);
  };

  // ==================== Verify Phone ====================

  const handleVerified = (phone: string) => {
    handleChange('phone', phone);

    setPhoneStep(null);
    setPendingPhone('');
  };

  // ==================== Submit License ====================

  const handleLicenseSubmit = (file: File) => {
    console.log('License file:', file);

    // TODO:
    // إرسال الملف للـ API

    setShowLicenseModal(false);
  };

  return (
    <div className="account-panel profile_tab">


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

      <div className="profile_action_field warning">

        <button
          type="button"
          className="profile_action_btn"
          onClick={() =>
            setShowLicenseModal(true)
          }
        >

          <div className="profile_action_content">

            <span className="profile_action_title">
              رخصة القيادة
            </span>

            <div className="profile_action_value">

              <FiAlertCircle />

              <span>
                يرجى إرفاق رخصة لكي نتمكن من التحقق من الحجز
              </span>

            </div>

          </div>

          <FiChevronLeft className="arrow" />

        </button>

      </div>

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


      <button
        type="button"
        className="delete_account_btn mb-2"
        onClick={() => {
          // TODO:
          // فتح DeleteAccountModal
        }}
      >

        <FiTrash2 />

        <span>
          حذف الحساب
        </span>

      </button>



      <button
        type="button"
        className="save_btn"
        onClick={() => onSave(form)}
      >
        حفظ
      </button>

      <EditPhoneModal
        open={phoneStep === 'edit'}
        onClose={() =>
          setPhoneStep(null)
        }
        currentPhone={form.phone}
        onSendCode={handleSendCode}
      />


      {/* ================================================= */}
      {/* Verify Phone Modal */}
      {/* ================================================= */}

      <VerifyPhoneModal
        open={phoneStep === 'verify'}
        onClose={() =>
          setPhoneStep(null)
        }
        phone={pendingPhone}
        onEditPhone={() =>
          setPhoneStep('edit')
        }
        onVerified={handleVerified}
        onResendCode={handleResendCode}
      />


      {/* ================================================= */}
      {/* License Modal */}
      {/* ================================================= */}

      <LicenseModal
        open={showLicenseModal}
        onClose={() =>
          setShowLicenseModal(false)
        }
        onSubmit={handleLicenseSubmit}
      />

    </div>
  );
}