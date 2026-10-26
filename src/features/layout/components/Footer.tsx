import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDownload,
} from "react-icons/fi";

import { IMAGES } from "@/shared/config/assets";
const logo = IMAGES.brandLogo;
const appStore = IMAGES.appStore;
const googlePlay = IMAGES.googlePlay;

import { NAV_LINKS } from "@/shared/config/site";

export default async function Footer() {
  const t = await getTranslations();

  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand text-text-on-brand">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-12.5 px-2 py-17.5 max-[480px]:grid-cols-1 max-[480px]:gap-[30px] max-lg:gap-[35px] max-md:grid-cols-2 max-md:gap-[35px] max-md:py-12">
        <div>
          {/* <div className="flex flex-col items-start gap-2 max-md:flex-row"> */}
          <Image
            src={logo.src}
            alt="T-Car"
            width={logo.width}
            height={logo.height}
            className="mb-5.5 brightness-0 invert max-md:mb-2.5"
          />

          <p className="text-text-on-brand/75 mb-6 max-w-80 leading-[1.8] max-lg:max-w-full">
            {t("hero.subtitle")}
          </p>
          {/* </div> */}

          <div className="flex gap-3.5 max-md:justify-start">
            <a
              href="#"
              className="bg-text-on-brand/8 hover:bg-action-primary flex size-11 items-center justify-center rounded-full transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_25px_rgba(31,127,250,0.35)]"
            >
              <FiFacebook />
            </a>

            <a
              href="#"
              className="bg-text-on-brand/8 hover:bg-action-primary flex size-11 items-center justify-center rounded-full transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_25px_rgba(31,127,250,0.35)]"
            >
              <FiInstagram />
            </a>

            <a
              href="#"
              className="bg-text-on-brand/8 hover:bg-action-primary flex size-11 items-center justify-center rounded-full transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_25px_rgba(31,127,250,0.35)]"
            >
              <FiTwitter />
            </a>
          </div>
        </div>
        <div className="flex justify-between gap-2">
          {" "}
          <div className="flex-1">
            <h4 className="mb-5.5 text-lg font-bold">
              {t("footer.quickLinks")}
            </h4>

            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-on-brand/75 hover:text-action-primary transition duration-300 hover:ps-2"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-1 flex-col gap-4.5">
            <h4 className="mb-[4px] text-lg font-bold">
              {t("footer.contactUs")}
            </h4>

            <div className="text-text-on-brand/75 hover:text-text-on-brand flex items-center gap-3 transition duration-300 max-md:justify-start">
              <FiMail className="text-action-primary shrink-0 text-lg" />
              <a
                href="mailto:info@tcar.com"
                className="text-text-on-brand/75 hover:text-action-primary transition duration-300"
              >
                {t("footer.emailValue")}
              </a>
            </div>

            <div className="text-text-on-brand/75 hover:text-text-on-brand flex items-center gap-3 transition duration-300 max-md:justify-start">
              <FiPhone className="text-action-primary shrink-0 text-lg" />
              <a
                href="tel:+966500000000"
                className="text-text-on-brand/75 hover:text-action-primary transition duration-300"
              >
                {t("footer.phoneValue")}
              </a>
            </div>

            <div className="text-text-on-brand/75 hover:text-text-on-brand flex items-center gap-3 transition duration-300 max-md:justify-start">
              <FiMapPin className="text-action-primary shrink-0 text-lg" />
              <a
                href="https://maps.google.com/?q=Riyadh,Saudi Arabia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-on-brand/75 hover:text-action-primary transition duration-300"
              >
                {t("footer.addressValue")}
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 max-md:col-span-full">
          <h4 className="mb-[4px] flex items-center gap-2.5 text-lg font-bold">
            <FiDownload className="text-action-primary" />
            {t("footer.downloadApp")}
          </h4>
          <div className="flex gap-3.5">
            <a
              href="#"
              className="block w-fit transition duration-300 hover:-translate-y-1"
            >
              <Image
                src={appStore}
                alt={t("downloadApp.appStoreAlt")}
                width={170}
                className="h-auto w-42.5 rounded-md transition duration-300 hover:scale-[1.04] hover:shadow-[0_15px_35px_rgba(30,30,30,0.25)]"
              />
            </a>

            <a
              href="#"
              className="block w-fit transition duration-300 hover:-translate-y-1"
            >
              <Image
                src={googlePlay}
                alt={t("downloadApp.playStoreAlt")}
                width={170}
                className="h-auto w-42.5 rounded-md transition duration-300 hover:scale-[1.04] hover:shadow-[0_15px_35px_rgba(30,30,30,0.25)]"
              />
            </a>
          </div>
        </div>
      </div>

      <div className="border-text-on-brand/8 mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-5 border-t px-2 py-5.5">
        <div className="text-text-on-brand/70 text-sm">
          © {year} T-Car. {t("footer.rights")}
        </div>
        <div className="flex gap-6 max-[480px]:gap-3">
          <Link
            href="/terms"
            className="text-text-on-brand/70 hover:text-action-primary transition duration-300"
          >
            {t("footer.terms")}
          </Link>

          <Link
            href="/privacy"
            className="text-text-on-brand/70 hover:text-action-primary transition duration-300"
          >
            {t("footer.privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
