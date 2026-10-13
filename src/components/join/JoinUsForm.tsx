'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { FormInput, FormSelect } from '@/shared/ui/Form';
import { PhoneField } from '@/shared/ui/PhoneField';

interface JoinUsFormState {
  firstName: string;
  phone: string;
  companyName: string;
  companySize: string;
  email: string;
}

const EMPTY_FORM: JoinUsFormState = {
  firstName: '',
  phone: '+966',
  companyName: '',
  companySize: '',
  email: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function JoinusForm({ open, onClose }: Props) {
  const t = useTranslations('joinUs');
  const [form, setForm] = useState<JoinUsFormState>(EMPTY_FORM);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      className="register_showroom join_us_dialog"
      label={t('title')}
    >
      <Dialog.Header className="join_us_dialog_header">
        <div className="section_heading">
          <Dialog.Title>{t('title')}</Dialog.Title>
          <Dialog.Description>
            {t('descriptionBeforeBrand')}
            <span> {t('brand')} </span>
            {t('descriptionAfterBrand')}
          </Dialog.Description>
        </div>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body>
        <form
          id="join-us-form"
          className="register_form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="form_grid">
            <FormInput
              id="firstName"
              name="firstName"
              label={t('fields.firstName.label')}
              placeholder={t('fields.firstName.placeholder')}
              value={form.firstName}
              onChange={handleChange}
              required
            />

            <div className="form_group">
              <label className="form_label">
                {t('fields.phone.label')}
                <span>*</span>
              </label>
              <PhoneField
                value={form.phone}
                onChange={(phone) => setForm((previous) => ({ ...previous, phone }))}
                defaultCountry="sa"
                searchPlaceholder={t('fields.phone.searchPlaceholder')}
                inputAriaLabel={t('fields.phone.label')}
              />
            </div>

            <FormInput
              id="companyName"
              name="companyName"
              label={t('fields.companyName.label')}
              placeholder={t('fields.companyName.placeholder')}
              value={form.companyName}
              onChange={handleChange}
              required
            />

            <FormSelect
              id="companySize"
              name="companySize"
              label={t('fields.companySize.label')}
              options={[
                { value: '1-10', label: t('companySizes.small') },
                { value: '11-50', label: t('companySizes.medium') },
                { value: '51-200', label: t('companySizes.large') },
                { value: '201+', label: t('companySizes.enterprise') },
              ]}
              value={form.companySize}
              onChange={handleChange}
              required
            />

            <FormInput
              id="join-us-email"
              name="email"
              type="email"
              label={t('fields.email.label')}
              placeholder={t('fields.email.placeholder')}
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
        </form>
      </Dialog.Body>

      <Dialog.Footer>
        <Button type="submit" form="join-us-form" size="lg">
          {t('submit')}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
