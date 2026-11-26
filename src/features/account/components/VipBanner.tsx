import { FiChevronRight, FiHeadphones } from "react-icons/fi";
import type { VipSettings } from "@/features/settings";

interface Props extends VipSettings {
  title: string;
  description: string;
  contactLabel: string;
}

/** The account's VIP support banner; the link is absent without a usable number. */
export default function VipBanner({
  isVip,
  whatsappNumber,
  title,
  description,
  contactLabel,
}: Props) {
  if (!isVip) return null;

  const digits = whatsappNumber?.replace(/\D/g, "");
  const href =
    digits && digits.length >= 6 && digits.length <= 15
      ? `https://wa.me/${digits}`
      : null;
  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 max-sm:size-10">
        <FiHeadphones className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-base leading-6 font-bold">{title}</span>
        <span className="block text-sm leading-5 text-white/85">
          {description}
        </span>
      </span>
      {href && (
        <FiChevronRight
          className="size-5 shrink-0 rtl:scale-x-[-1]"
          aria-hidden="true"
        />
      )}
    </>
  );
  const className =
    "mb-6 flex min-h-18 items-center gap-3 rounded-2xl bg-gradient-to-r from-[#2C72F9] to-[#0C1E4C] px-4 py-3 text-white shadow-[0_8px_20px_rgba(12,30,76,0.18)] rtl:bg-gradient-to-l max-sm:gap-2.5";

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={contactLabel}
      className={`${className} focus-visible:outline-action-primary transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
    >
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}
