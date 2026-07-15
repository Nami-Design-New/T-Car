'use client';

import Image from 'next/image';
import { useState } from 'react';
import PhoneField from '@/components/common/PhoneField';
import logo from '@assets/images/fav.svg';

type Props = {
  onNext: () => void;
  onRegister: () => void;
};

export default function LoginForm({
  onNext,
  onRegister,
}: Props) {
  const [phone, setPhone] = useState('+966');

  return (
    <div className="login_form">
      <div className="logo">
        <Image src={logo} alt="logo" width={70} height={70} />
      </div>

      <h2>تسجيل الدخول</h2>
      <p>أدخل رقم الجوال لإرسال رمز التحقق</p>

      <div className="phone_wrapper">
<PhoneField
  value={phone}
  onChange={setPhone}
/>
      </div>

      <button className="auth_btn" onClick={onNext}>
        إرسال رمز التحقق
      </button>

      <div className="bottom_text">
        ليس لديك حساب؟
        <button type="button" onClick={onRegister}>
          إنشاء حساب
        </button>
      </div>
    </div>
  );
}