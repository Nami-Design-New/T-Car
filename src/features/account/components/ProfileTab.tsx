"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useRouter } from "@/i18n/navigation";
import { AlertDialog } from "@/shared/ui/AlertDialog";
import { Button } from "@/shared/ui/Button";
import { FormInput } from "@/shared/ui/Form";
import {
  FiCalendar,
  FiChevronRight,
  FiCheck,
  FiAlertCircle,
  FiTrash2,
} from "react-icons/fi";

import type { UserProfile } from "../model";
import { profileFormSchema, type ProfileFormValues } from "../validation";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import { toAppError, type AppError } from "@/shared/lib/errors";
import { fromActionResult } from "@/shared/lib/result";
import { applyFieldErrors } from "@/shared/lib/validation";
import {
  deleteAccountAction,
  saveProfileAction,
  sendPhoneCodeAction,
  uploadLicenseAction,
  verifyPhoneAction,
} from "../actions";
import PhoneChangeModal from "./PhoneChangeModal";
import { ICONS } from "@/shared/config/assets";
import Image from "next/image";

const checkMark = ICONS.checkMark;
const arrowIcon = ICONS.arrowIcon;
const xIcon = ICONS.xIcon;

const LicenseModal = dynamic(() => import("./LicenseModal"), { ssr: false });

interface Props {
  profile: UserProfile;
}

type PhoneStep = "edit" | "verify" | null;
type PendingAction =
  "save" | "send" | "resend" | "verify" | "license" | "delete" | null;

const PROFILE_FIELDS = ["fullName", "email", "birthDate"] as const;

const editableFields = ({
  fullName,
  email,
  birthDate,
}: UserProfile): ProfileFormValues => ({
  fullName,
  email,
  birthDate,
});

export default function ProfileTab({ profile }: Props) {
  const t = useTranslations("account.profile");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const router = useRouter();
  // The phone and license status; the editable fields live in the form below.
  const [form, setForm] = useState(profile);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: editableFields(profile),
  });

  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ==================== Phone ====================

  const [phoneStep, setPhoneStep] = useState<PhoneStep>(null);

  const [pendingPhone, setPendingPhone] = useState("");

  // ==================== License ====================

  const [showLicenseModal, setShowLicenseModal] = useState(false);

  // ==================== Delete Account ====================

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ==================== Send OTP ====================

  /** The phone actions resolve with their error; the dialogs show it next to the input. */
  const runPhoneAction = async (
    action: Exclude<PendingAction, null>,
    write: () => Promise<AppError | undefined>,
  ) => {
    setPendingAction(action);
    try {
      return await write();
    } catch (error) {
      return toAppError(error);
    } finally {
      setPendingAction(null);
    }
  };

  const handleSendCode = (phone: string) =>
    runPhoneAction("send", async () => {
      const result = fromActionResult(await sendPhoneCodeAction(phone));
      if (!result.ok) return result.error;
      setPendingPhone(phone);
      setPhoneStep("verify");
    });

  // ==================== Resend OTP ====================

  const handleResendCode = (phone: string) =>
    runPhoneAction("resend", async () => {
      const result = fromActionResult(await sendPhoneCodeAction(phone));
      if (!result.ok) return result.error;
    });

  // ==================== Verify Phone ====================

  const handleVerifyCode = (code: string) =>
    runPhoneAction("verify", async () => {
      const result = fromActionResult(
        await verifyPhoneAction(pendingPhone, code),
      );
      if (!result.ok) return result.error;
    });

  const handleVerified = (phone: string) => {
    setForm((previous) => ({ ...previous, phone }));

    setPhoneStep(null);
    setPendingPhone("");
  };

  // ==================== Submit License ====================

  const handleLicenseSubmit = async (
    file: File,
  ): Promise<AppError | undefined> => {
    setPendingAction("license");
    try {
      const formData = new FormData();
      formData.set("license", file);
      const result = fromActionResult(await uploadLicenseAction(formData));
      if (!result.ok) return result.error;
      setForm((previous) => ({ ...previous, licenseUploaded: true }));
      setShowLicenseModal(false);
    } catch (error) {
      return toAppError(error);
    } finally {
      setPendingAction(null);
    }
  };

  // ==================== Delete Account ====================

  const handleDeleteAccount = async () => {
    setPendingAction("delete");
    setDeleteError(null);
    try {
      const result = fromActionResult(await deleteAccountAction());
      if (!result.ok) {
        setDeleteError(errorMessage(result.error));
        return;
      }
      // The action also ended the session; leave the protected page.
      setShowDeleteModal(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveProfile = handleSubmit(async (values) => {
    if (pendingAction === "save") return;
    setPendingAction("save");
    setSaved(false);
    try {
      const result = fromActionResult(await saveProfileAction(values));
      if (!result.ok) {
        if (!applyFieldErrors(result.error, setError, PROFILE_FIELDS)) {
          setError("root.server", {
            type: result.error.kind,
            message: errorMessage(result.error),
          });
        }
        return;
      }
      // The phone and license status keep their own flows' state.
      reset(editableFields(result.data));
      setSaved(true);
    } catch (error) {
      setError("root.server", {
        type: "unknown",
        message: errorMessage(error),
      });
    } finally {
      setPendingAction(null);
    }
  });

  const saveError = errors.root?.server?.message;

  return (
    <div className="border-stroke-light bg-surface-elevated flex w-full flex-col rounded-xl border p-6 max-md:p-4">
      {/* The form closes before the dialogs below: their submit events would
          otherwise bubble through the portals into this form. */}
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSaveProfile}
        noValidate
      >
        {/* ==================== Full Name ==================== */}

        <FormInput
          id="profile-full-name"
          label={t("fullName")}
          type="text"
          autoComplete="name"
          required
          error={fieldError(errors.fullName?.message)}
          {...register("fullName")}
        />

        {/* ==================== Email ==================== */}

        <FormInput
          id="profile-email"
          label={t("email")}
          type="email"
          autoComplete="email"
          required
          error={fieldError(errors.email?.message)}
          {...register("email")}
        />

        {/* ==================== Birth Date ==================== */}

        <FormInput
          id="profile-birth-date"
          label={t("birthDate")}
          type="date"
          autoComplete="bday"
          required
          icon={<FiCalendar />}
          error={fieldError(errors.birthDate?.message)}
          {...register("birthDate")}
        />
        <Button
          type="submit"
          size="lg"
          className="mb-5"
          loading={pendingAction === "save"}
        >
          {t("save")}
        </Button>
      </form>
      <div className="flex flex-col gap-5">
        {/* ==================== Phone ==================== */}
        <button
          type="button"
          className="bg-surface-on-background flex min-h-14.5 w-full items-center justify-between gap-3 rounded-sm border-0 px-3 py-2 text-start transition-colors hover:opacity-85 max-md:px-2.5"
          onClick={() => setPhoneStep("edit")}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-text-primary text-[13px] leading-[1.4] font-semibold max-md:text-xs">
              {t("phone")}
            </span>

            <div className="text-text-subtle [&>svg]:text-status-success flex min-w-0 items-center gap-1.5 text-[11px] leading-[1.5] max-md:text-[10px] [&>svg]:shrink-0 [&>svg]:text-sm">
              <span className="min-w-0 wrap-anywhere" dir="ltr">
                {form.phone}
              </span>
              <Image
                src={checkMark.src}
                width={checkMark.width}
                height={checkMark.height}
                alt="check icon"
              />
            </div>
          </div>
          <Image
            src={arrowIcon.src}
            width={arrowIcon.width}
            height={arrowIcon.height}
            alt="arrow icon"
            className="size-5 shrink-0 ltr:scale-x-[-1]"
          />
        </button>
        {/* ==================== License ==================== */}
        {form.licenseUploaded ? (
          <div className="bg-surface-elevated mb-3 w-full rounded-sm transition-colors">
            <div
              className="flex min-h-14.5 w-full items-center justify-between gap-3 px-3 py-2 max-md:px-2.5"
              role="status"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-text-primary text-[13px] leading-[1.4] font-semibold max-md:text-xs">
                  {t("license")}
                </span>
                <Image
                  src={checkMark.src}
                  width={checkMark.width}
                  height={checkMark.height}
                  alt="check icon"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-status-error-background w-full rounded-sm transition-colors">
            <button
              type="button"
              className="flex min-h-14.5 w-full items-center justify-between gap-3 border-0 bg-transparent px-3 py-2 text-start transition-opacity hover:opacity-85 max-md:px-2.5"
              onClick={() => setShowLicenseModal(true)}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-text-primary text-[13px] leading-[1.4] font-semibold max-md:text-xs">
                  {t("license")}
                </span>

                <div className="text-text-subtle flex min-w-0 items-center gap-1.5 text-xs">
                  <span className="min-w-0 wrap-anywhere">
                    {t("licenseRequired")}
                  </span>
                  <Image
                    src={xIcon.src}
                    width={xIcon.width}
                    height={xIcon.height}
                    alt="x icon"
                    className="size-3.5 shrink-0"
                  />
                </div>
              </div>

              <Image
                src={arrowIcon.src}
                width={arrowIcon.width}
                height={arrowIcon.height}
                alt="arrow icon"
                className="size-5 shrink-0 ltr:scale-x-[-1]"
              />
            </button>
          </div>
        )}
        {/* ==================== Delete Account ==================== */}
        <button
          type="button"
          className="text-status-error mb-2 flex w-full items-center justify-start gap-1.5 border-0 bg-transparent px-0 py-1 text-end text-sm font-semibold transition-opacity hover:opacity-80 max-md:text-xs [&>svg]:text-[17px] max-md:[&>svg]:text-[15px]"
          onClick={() => {
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
        >
          <Image
            src={xIcon.src}
            width={xIcon.width}
            height={xIcon.height}
            alt="x icon"
            className="size-3.5 shrink-0"
          />
          <span>{t("deleteAccount")}</span>
        </button>
      </div>

      {/* ==================== Save ==================== */}

      {saveError && (
        <p className="text-status-error mt-2 mb-0 text-sm" role="alert">
          {saveError}
        </p>
      )}
      {saved && (
        <p className="text-status-success mt-2 mb-0 text-sm" role="status">
          {t("saved")}
        </p>
      )}

      {/* ==================== Phone Change Modal ==================== */}

      <PhoneChangeModal
        open={phoneStep !== null}
        onClose={() => {
          if (pendingAction === "send" || pendingAction === "resend" || pendingAction === "verify") return;
          setPhoneStep(null);
        }}
        currentPhone={form.phone}
        pendingPhone={pendingPhone}
        step={phoneStep}
        onStepChange={(step) => {
          if (step === "edit" && pendingAction === "resend") return;
          setPhoneStep(step);
        }}
        onSendCode={handleSendCode}
        onResendCode={handleResendCode}
        onVerifyCode={handleVerifyCode}
        onVerified={handleVerified}
        loading={pendingAction === "send" || pendingAction === "resend" || pendingAction === "verify"}
      />

      {/* ==================== License Modal ==================== */}

      <LicenseModal
        open={showLicenseModal}
        onClose={() => {
          if (pendingAction !== "license") setShowLicenseModal(false);
        }}
        onSubmit={handleLicenseSubmit}
        loading={pendingAction === "license"}
      />

      {/* ==================== Delete Account Modal ==================== */}

      <AlertDialog
        open={showDeleteModal}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
        primaryButtonText={t("deleteAccount")}
        secondaryButtonText={t("keepAccount")}
        showButtons
        error={deleteError ?? undefined}
        loading={pendingAction === "delete"}
        onPrimary={handleDeleteAccount}
        onSecondary={() => {
          if (pendingAction !== "delete") setShowDeleteModal(false);
        }}
      />
    </div>
  );
}
