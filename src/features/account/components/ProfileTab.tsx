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
import EditPhoneModal from "./EditPhoneModal";
import VerifyPhoneModal from "./VerifyPhoneModal";

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
      // Let the edit dialog unmount before opening the verification dialog.
      // Radix restores focus when a dialog closes; opening both in one render
      // can otherwise leave the verification step behind the closing portal.
      setPhoneStep(null);
      window.setTimeout(() => setPhoneStep("verify"), 0);
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
    <div className="account-panel profile_tab">
      {/* The form closes before the dialogs below: their submit events would
          otherwise bubble through the portals into this form. */}
      <form className="profile_form" onSubmit={handleSaveProfile} noValidate>
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
          dir="ltr"
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
          dir="ltr"
          autoComplete="bday"
          required
          icon={<FiCalendar />}
          error={fieldError(errors.birthDate?.message)}
          {...register("birthDate")}
        />

        {/* ==================== Phone ==================== */}

        <div className="profile_action_field">
          <button
            type="button"
            className="profile_action_btn"
            onClick={() => setPhoneStep("edit")}
          >
            <div className="profile_action_content">
              <span className="profile_action_title">{t("phone")}</span>

              <div className="profile_action_value">
                <FiCheck />

                <span dir="ltr">{form.phone}</span>
              </div>
            </div>

            <FiChevronRight
              className="arrow mirror-in-rtl"
              aria-hidden="true"
            />
          </button>
        </div>

        {/* ==================== License ==================== */}

        {form.licenseUploaded ? (
          <div className="profile_action_field">
            <div className="profile_action_btn" role="status">
              <div className="profile_action_content">
                <span className="profile_action_title">{t("license")}</span>

                <div className="profile_action_value verified">
                  <FiCheck />
                  <span>{t("licenseVerified")}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile_action_field warning">
            <button
              type="button"
              className="profile_action_btn"
              onClick={() => setShowLicenseModal(true)}
            >
              <div className="profile_action_content">
                <span className="profile_action_title">{t("license")}</span>

                <div className="profile_action_value">
                  <FiAlertCircle />
                  <span>{t("licenseRequired")}</span>
                </div>
              </div>

              <FiChevronRight
                className="arrow mirror-in-rtl"
                aria-hidden="true"
              />
            </button>
          </div>
        )}

        {/* ==================== Delete Account ==================== */}

        <button
          type="button"
          className="delete_account_btn mb-2"
          onClick={() => {
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
        >
          <FiTrash2 />

          <span>{t("deleteAccount")}</span>
        </button>

        {/* ==================== Save ==================== */}

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2"
          loading={pendingAction === "save"}
        >
          {t("save")}
        </Button>

        {saveError && (
          <p className="text-status-error text-sm mt-2 mb-0" role="alert">
            {saveError}
          </p>
        )}
        {saved && (
          <p className="text-status-success text-sm mt-2 mb-0" role="status">
            {t("saved")}
          </p>
        )}
      </form>

      {/* ==================== Edit Phone Modal ==================== */}

      <EditPhoneModal
        open={phoneStep === "edit"}
        onClose={() => {
          if (pendingAction !== "send") setPhoneStep(null);
        }}
        currentPhone={form.phone}
        onSendCode={handleSendCode}
        loading={pendingAction === "send"}
      />

      {/* ==================== Verify Phone Modal ==================== */}

      <VerifyPhoneModal
        open={phoneStep === "verify"}
        onClose={() => setPhoneStep(null)}
        phone={pendingPhone}
        onEditPhone={() => {
          if (pendingAction !== "resend") setPhoneStep("edit");
        }}
        onVerified={handleVerified}
        onResendCode={handleResendCode}
        onVerifyCode={handleVerifyCode}
        loading={pendingAction === "resend" || pendingAction === "verify"}
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
