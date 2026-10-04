'use client';

import { FormInput, FormSelect, FormTextarea } from '@/shared/ui/Form';
import { Button } from '@/shared/ui/Button';

export default function JoinusForm() {
  return (
    <section id="register-form" className="register_showroom section">
      <div className="container-tcar">
        <div className="register_card">
          <div className="section_heading">
            <h2>معلومات الشركة</h2>
            <p>
              يرجى تعبئة البيانات التالية وسيتواصل معك فريق
              <span> تي كار </span>
              في أقرب وقت.
            </p>
          </div>

          <form className="register_form">
            <div className="form_grid">
              <FormInput
                id="companyName"
                label="اسم الشركة"
                placeholder="اكتب اسم الشركة"
                required
              />

              <FormInput
                id="headOffice"
                label="المقر الرئيسي"
                placeholder="المدينة أو الدولة"
                required
              />

              <FormInput
                id="contactPerson"
                label="اسم المسؤول للتواصل"
                placeholder="الاسم الكامل"
                required
              />

              <FormInput
                id="phone"
                type="tel"
                label="رقم التواصل"
                placeholder="05xxxxxxxx"
                required
              />

              <FormInput
                id="email"
                type="email"
                label="البريد الإلكتروني"
                placeholder="company@email.com"
                required
              />

              <FormInput id="managerName" label="اسم مدير الشركة" placeholder="الاسم" required />

              <FormInput
                id="managerEmail"
                type="email"
                label="إيميل مدير الشركة"
                placeholder="manager@email.com"
                required
              />

              <FormInput
                id="managerPhone"
                type="tel"
                label="رقم تواصل مدير الشركة"
                placeholder="05xxxxxxxx"
                required
              />

              <FormInput id="branches" type="number" label="عدد الفروع" placeholder="3" />

              <FormInput id="fleet" type="number" label="إجمالي أسطول السيارات" placeholder="122" />
            </div>

            <div className="form_grid mt-4">
              <FormSelect
                id="locations"
                label="مناطق تواجد الفروع"
                options={[
                  { value: 'riyadh', label: 'الرياض' },
                  { value: 'jeddah', label: 'جدة' },
                  { value: 'dammam', label: 'الدمام' },
                  { value: 'makkah', label: 'مكة' },
                  { value: 'madinah', label: 'المدينة' },
                ]}
              />

              <FormSelect
                id="fleetTypes"
                label="أنواع الأسطول"
                options={[
                  { value: 'economy', label: 'اقتصادية' },
                  { value: 'sedan', label: 'سيدان' },
                  { value: 'suv', label: 'SUV' },
                  { value: 'luxury', label: 'فاخرة' },
                  { value: 'pickup', label: 'بيك أب' },
                ]}
              />
            </div>
            <div className="upload_field">
              <label htmlFor="commercialRegister">
                السجل التجاري
                <span>*</span>
              </label>

              <input
                id="commercialRegister"
                name="commercialRegister"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                required
              />

              <small>الصيغ المسموح بها: PDF, JPG, PNG, WEBP</small>
            </div>
            <div className="submit_area">
              <Button size="lg">إرسال الطلب</Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
