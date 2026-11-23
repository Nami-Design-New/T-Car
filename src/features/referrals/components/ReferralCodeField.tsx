"use client";

import { useTranslations } from "next-intl";
import { useId, useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { FormInput } from "@/shared/ui/Form";
import {
  checkReferralCode,
  useReferralCodeStore,
  type ReferralCodeStatus,
} from "../referralCodeStore";

const ACTION_LABELS: Record<ReferralCodeStatus, string> = {
  empty: "check",
  entered: "check",
  checking: "checking",
  valid: "change",
  invalid: "recheck",
  network: "retry",
};

/**
 * The optional invite code on the sign-up profile (Figma `Auth/Referral-*`):
 * type a code, check it, then create the account with it or without one.
 */
export default function ReferralCodeField() {
  const t = useTranslations("auth.referral");
  const { code, status, inviterName, needsCheck, setCode, edit } =
    useReferralCodeStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  const failed = status === "invalid" || status === "network";
  const unchecked = needsCheck && status === "entered";
  const message =
    status === "valid"
      ? t("hint.valid", { name: inviterName ?? "" })
      : unchecked
        ? t("hint.unchecked")
        : t(`hint.${status}`);

  const act = () => {
    if (status === "valid") {
      edit();
      inputRef.current?.focus();
    } else {
      void checkReferralCode();
    }
  };

  const skip = () => {
    setCode("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <FormInput
        ref={inputRef}
        id="register-referral-code"
        label={t("label")}
        placeholder={t("placeholder")}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        value={code}
        readOnly={status === "valid" || status === "checking"}
        error={failed || unchecked ? message : undefined}
        aria-describedby={failed || unchecked ? undefined : hintId}
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={(event) => {
          // Enter checks the code instead of creating the account.
          if (event.key === "Enter" && code && status !== "valid") {
            event.preventDefault();
            void checkReferralCode();
          }
        }}
      />
      {!failed && !unchecked && (
        <small
          id={hintId}
          className={cn(
            "-mt-1 text-xs",
            status === "valid" ? "text-success-700" : "text-text-subtle",
          )}
        >
          {message}
        </small>
      )}
      {/* Announces the result of a check, which happens without a page change. */}
      <span className="sr-only" aria-live="polite">
        {status === "empty" || status === "entered" ? "" : message}
      </span>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!code}
        loading={status === "checking"}
        onClick={act}
      >
        {t(`actions.${ACTION_LABELS[status]}`)}
      </Button>
      {code && status !== "checking" && (
        <button
          type="button"
          className="text-action-primary cursor-pointer self-center border-0 bg-transparent p-1 text-sm"
          onClick={skip}
        >
          {t("actions.skip")}
        </button>
      )}
    </div>
  );
}
