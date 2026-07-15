'use client';

import { useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';

type Props = {
  onBack: () => void;
  onSuccess: () => void;
};

export default function RegisterForm({ onBack, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    birthDate: '',
    agree: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="register_form">
      <button type="button" className="back_btn" onClick={onBack} aria-label="Back">
        <FiArrowLeft />
      </button>

      <h2>إنشاء حساب</h2>

      <p>أكمل البيانات التالية</p>

      <div className="inputs">
        <input name="name" placeholder="الاسم الكامل" value={form.name} onChange={handleChange} />

        <input
          name="email"
          type="email"
          placeholder="البريد الإلكتروني"
          value={form.email}
          onChange={handleChange}
        />

        <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} />
      </div>

      <label className="agree">
        <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />

        <span>أوافق على الشروط والأحكام</span>
      </label>

      <button className="auth_btn" onClick={onSuccess}>
        إنشاء الحساب
      </button>
    </div>
  );
}
