'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css'; 
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
        <PhoneInput
          defaultCountry="sa"
          value={phone}
          onChange={setPhone}
          className="phone_field"
          inputClassName="phone_input"
          countrySelectorStyleProps={{
            buttonClassName: 'country_selector_btn',
          }}
          forceDialCode
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