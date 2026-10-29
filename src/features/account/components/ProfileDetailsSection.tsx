"use client";

import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FiCalendar } from "react-icons/fi";
import { useRouter } from "@/i18n/navigation";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { fromActionResult } from "@/shared/lib/result";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { FormInput } from "@/shared/ui/Form";
import type { ProfileChanges } from "../model";
import { profileFormSchema, type ProfileFormValues } from "../validation";
import { saveProfileAction } from "../actions";
import type { ProfileFlowProps } from "./ProfileFlowProps";

interface Props extends ProfileFlowProps {
  profile: ProfileChanges;
  children: ReactNode;
}

const PROFILE_FIELDS = ["fullName", "email", "birthDate"] as const;
const editableFields = ({
  fullName,
  email,
  birthDate,
}: ProfileChanges): ProfileFormValues => ({ fullName, email, birthDate });

export default function ProfileDetailsSection({
  profile,
  children,
  pendingAction,
  setPendingAction,
}: Props) {
  const t = useTranslations("account.profile");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const notify = useNotify();
  const router = useRouter();
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

  const handleSaveProfile = handleSubmit(async (values) => {
    if (pendingAction === "save") return;
    setPendingAction("save");
    try {
      const result = fromActionResult(await saveProfileAction(values));
      if (!result.ok) {
        if (result.error.kind === "validation" && result.error.serverMessage) {
          notify.error(result.error.serverMessage);
          return;
        }
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
      notify.success(result.message);
      router.refresh();
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
    <>
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
      {children}
      {saveError && (
        <p className="text-status-error mt-2 mb-0 text-sm" role="alert">
          {saveError}
        </p>
      )}
    </>
  );
}
