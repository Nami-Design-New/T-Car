'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiFacebook,
  FiInstagram,
  FiTwitter,
} from 'react-icons/fi';

export default function Contact() {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log(form);

    // TODO API
  };

  return (
    <section className="section contact" id="contact">
      <div className="container-tcar">

        <div className="contact_header">

          <span>{t('contact.smallTitle')}</span>

          <h2>{t('contact.title')}</h2>

          <p>{t('contact.subtitle')}</p>

        </div>

        <div className="contact_wrapper">

          <div className="contact_info">

            <h3>{t('contact.getInTouch')}</h3>

            <p>
              {t('contact.description')}
            </p>

            <div className="info_list">

              <div className="info_item">
                <FiPhone />
                <div>
                  <span>{t('contact.phone')}</span>
                  <strong>+966 500000000</strong>
                </div>
              </div>

              <div className="info_item">
                <FiMail />
                <div>
                  <span>{t('contact.email')}</span>
                  <strong>info@tcar.com</strong>
                </div>
              </div>

              <div className="info_item">
                <FiMapPin />
                <div>
                  <span>{t('contact.address')}</span>
                  <strong>Riyadh, Saudi Arabia</strong>
                </div>
              </div>

            </div>

            <div className="socials">

              <a href="#">
                <FiFacebook />
              </a>

              <a href="#">
                <FiInstagram />
              </a>

              <a href="#">
                <FiTwitter />
              </a>

            </div>

          </div>

          <form
            className="contact_form"
            onSubmit={handleSubmit}
          >

            <div className="row">

              <div className="field">
                <label>{t('contact.name')}</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t('contact.name')}
                />
              </div>

              <div className="field">
                <label>{t('contact.email')}</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('contact.email')}
                />
              </div>

            </div>

            <div className="field">

              <label>{t('contact.phone')}</label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t('contact.phone')}
              />

            </div>

            <div className="field">

              <label>{t('contact.message')}</label>

              <textarea
                rows={6}
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={t('contact.message')}
              />

            </div>

            <button
              type="submit"
              className="contact_btn"
            >
              {t('contact.send')}
            </button>

          </form>

        </div>

      </div>
    </section>
  );
}