'use client';

import { useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import PhoneField from '@/components/common/PhoneField';
import type { UserProfile } from '@app-types/car';

interface Props {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

export default function ProfileTab({ profile, onSave }: Props) {
  const [form, setForm] = useState(profile);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="account-panel">
      <div className="form_field">
        <label>الاسم بالكامل</label>
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
        />
      </div>

      <div className="form_field">
        <label>البريد الإلكتروني</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </div>

      <div className="form_field">
        <label>تاريخ الميلاد</label>
        <div className="input_wrapper">
          <span className="icon">
            <FiCalendar />
          </span>
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
          />
        </div>
      </div>

      <div className="form_field">
        <label>رقم الجوال</label>

<PhoneField
  value={form.phone}
  onChange={(phone) => handleChange('phone', phone)}
/>
      </div>

      <button
        type="button"
        className="save_btn"
        onClick={() => onSave(form)}
      >
        حفظ التغييرات
      </button>
    </div>
  );
}