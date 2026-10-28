"use client";

import { useTranslations } from "next-intl";
import { Toaster as SonnerToaster } from "sonner";

export interface Props {
  dir: "ltr" | "rtl";
}

/** Clears the mobile bottom navigation (shown below `lg`, see the body padding in the layout). */
const BOTTOM_OFFSET = "var(--toaster-bottom)";

/**
 * The app's single toast region: bottom, on the inline-end side (left in
 * Arabic, right in English). Show toasts with `useNotify()`.
 */
export function Toaster({ dir }: Props) {
  const t = useTranslations("common");

  return (
    <SonnerToaster
      dir={dir}
      position={dir === "rtl" ? "bottom-left" : "bottom-right"}
      richColors
      containerAriaLabel={t("notifications")}
      offset={{ top: 24, right: 24, bottom: BOTTOM_OFFSET, left: 24 }}
      mobileOffset={{ top: 16, right: 16, bottom: BOTTOM_OFFSET, left: 16 }}
      className="[--toaster-bottom:calc(5rem+env(safe-area-inset-bottom)+0.75rem)] lg:[--toaster-bottom:1.5rem]"
      style={{ fontFamily: "inherit" }}
    />
  );
}
