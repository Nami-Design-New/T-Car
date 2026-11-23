"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { REFERRAL_CODE_PARAM, normalizeReferralCode } from "../model";
import { checkReferralCode, useReferralCodeStore } from "../referralCodeStore";

/**
 * Takes the code from an invite link (`?ref=CODE`) and checks it, so the
 * sign-in dialog shows the invite and the profile step has the code filled in.
 * Render it inside `<Suspense>` (it reads the search params).
 */
export default function ReferralInviteCapture() {
  const ref = useSearchParams().get(REFERRAL_CODE_PARAM);

  useEffect(() => {
    if (!ref) return;
    const code = normalizeReferralCode(ref);
    const store = useReferralCodeStore.getState();
    if (!code || store.code === code) return;
    store.setCode(code);
    void checkReferralCode();
  }, [ref]);

  return null;
}
