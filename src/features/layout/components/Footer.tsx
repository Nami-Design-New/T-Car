import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import {
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDownload,
} from 'react-icons/fi';

import { IMAGES } from '@/shared/config/assets';
const logo = IMAGES.brandMark;
const appStore = IMAGES.appStore;
const googlePlay = IMAGES.googlePlay;

import { NAV_LINKS } from '@/shared/config/site';

export default async function Footer() {
  const t = await getTranslations();

  const year = new Date().getFullYear();

  return (
   <footer className="footer bg-brand text-text-on-brand">
      
      <div className="mx-auto w-full max-w-[1280px] px-4 footer_top grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[50px] py-[70px] max-lg:gap-[35px] max-md:grid-cols-2 max-md:gap-[35px] max-[480px]:grid-cols-1 max-[480px]:gap-[30px]">

        <div className="footer_brand">
          <Image src={logo} alt="T-Car" width={160} height={48} className="mb-[22px] brightness-0 invert" />

          <p className="mb-6 max-w-80 text-text-on-brand/75 leading-[1.8] max-lg:max-w-full">{t('hero.subtitle')}</p>

          <div className="footer_socials flex gap-3.5 max-md:justify-center">
            <a href="#" className="flex size-11 items-center justify-center rounded-full bg-text-on-brand/[0.08] transition duration-300 hover:-translate-y-1.5 hover:bg-action-primary hover:shadow-[0_10px_25px_rgba(31,127,250,0.35)]">
              <FiFacebook />
            </a>

            <a href="#" className="flex size-11 items-center justify-center rounded-full bg-text-on-brand/[0.08] transition duration-300 hover:-translate-y-1.5 hover:bg-action-primary hover:shadow-[0_10px_25px_rgba(31,127,250,0.35)]">
              <FiInstagram />
            </a>

            <a href="#" className="flex size-11 items-center justify-center rounded-full bg-text-on-brand/[0.08] transition duration-300 hover:-translate-y-1.5 hover:bg-action-primary hover:shadow-[0_10px_25px_rgba(31,127,250,0.35)]">
              <FiTwitter />
            </a>
          </div>
        </div>

        <div className="footer_links max-md:text-start max-[480px]:text-center">
          <h4 className="mb-[22px] text-lg font-bold">{t('footer.quickLinks')}</h4>

          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-text-on-brand/75 transition duration-300 hover:ps-2 hover:text-action-primary">{t(link.label)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer_contact flex flex-col gap-[18px] max-md:text-start max-[480px]:text-center">
          <h4 className="mb-[4px] text-lg font-bold">{t('footer.contactUs')}</h4>

          <div className="contact_item flex items-center gap-3 text-text-on-brand/75 transition duration-300 hover:text-text-on-brand max-md:justify-start">
            <FiMail className="shrink-0 text-lg text-action-primary" />
            <a href="mailto:info@tcar.com" className="text-text-on-brand/75 transition duration-300 hover:text-action-primary">{t('footer.emailValue')}</a>
          </div>

          <div className="contact_item flex items-center gap-3 text-text-on-brand/75 transition duration-300 hover:text-text-on-brand max-md:justify-start">
            <FiPhone className="shrink-0 text-lg text-action-primary" />
            <a href="tel:+966500000000" className="text-text-on-brand/75 transition duration-300 hover:text-action-primary">{t('footer.phoneValue')}</a>
          </div>

          <div className="contact_item flex items-center gap-3 text-text-on-brand/75 transition duration-300 hover:text-text-on-brand max-md:justify-start">
            <FiMapPin className="shrink-0 text-lg text-action-primary" />
            <a
              href="https://maps.google.com/?q=Riyadh,Saudi Arabia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-on-brand/75 transition duration-300 hover:text-action-primary"
            >
              {t('footer.addressValue')}
            </a>
          </div>
        </div>

        <div className="footer_apps flex flex-col gap-3.5 max-md:col-span-full max-md:items-center max-md:text-center">
          <h4 className="mb-[4px] flex items-center gap-2.5 text-lg font-bold">
            <FiDownload className="text-action-primary" />
            {t('footer.downloadApp')}
          </h4>

          <a href="#" className="block w-fit transition duration-300 hover:-translate-y-1">
            <Image src={appStore} alt={t('downloadApp.appStoreAlt')} width={170} className="h-auto w-[170px] rounded-md transition duration-300 hover:scale-[1.04] hover:shadow-[0_15px_35px_rgba(30,30,30,0.25)]" />
          </a>

          <a href="#" className="block w-fit transition duration-300 hover:-translate-y-1">
            <Image src={googlePlay} alt={t('downloadApp.playStoreAlt')} width={170} className="h-auto w-[170px] rounded-md transition duration-300 hover:scale-[1.04] hover:shadow-[0_15px_35px_rgba(30,30,30,0.25)]" />
          </a>
        </div>
      </div>

      <div className="footer_bottom mx-auto w-full max-w-[1280px] px-4 flex flex-wrap items-center justify-between gap-5 border-t border-text-on-brand/[0.08] py-[22px]">
        <div className="footer_copy text-sm text-text-on-brand/70">
          © {year} T-Car. {t('footer.rights')}
        </div>
        <div className="footer_bottom_links flex gap-6 max-[480px]:gap-3">
          <Link href="/terms" className="text-text-on-brand/70 transition duration-300 hover:text-action-primary">{t('footer.terms')}</Link>

          <Link href="/privacy" className="text-text-on-brand/70 transition duration-300 hover:text-action-primary">{t('footer.privacy')}</Link>
        </div>
      </div>
    </footer>
 
  );
}
