"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { assignLocationAction } from "../actions";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import type { LocationData } from "@/shared/lib/location";
import { fromActionResult } from "@/shared/lib/result";
import { ResultDialog } from "@/shared/ui/ResultDialog";

const MapLocationModal = dynamic(
  () =>
    import("@/shared/ui/MapLocationModal").then(
      ({ MapLocationModal }) => MapLocationModal,
    ),
  { ssr: false },
);

interface Props {
  successOpen: boolean;
  locationOpen: boolean;
  onSuccessClose: () => void;
  onLocationClose: () => void;
}

/** The post-registration dialogs, separate from the authentication dialog. */
export default function AuthOnboardingModals({
  successOpen,
  locationOpen,
  onSuccessClose,
  onLocationClose,
}: Props) {
  const authSuccessT = useTranslations("authSuccess");
  const authT = useTranslations("auth");
  const notify = useNotify();
  const errorMessage = useErrorMessage();

  const handleLocationConfirm = async (location: LocationData) => {
    const result = fromActionResult(await assignLocationAction(location));
    if (!result.ok) {
      notify.error(result.error.serverMessage ?? errorMessage(result.error));
      return;
    }
    notify.success(result.message);
    onLocationClose();
  };

  return (
    <>
      <ResultDialog
        open={successOpen}
        status="success"
        description={authSuccessT("description")}
        onClose={onSuccessClose}
      />
      {locationOpen && (
        <MapLocationModal
          open
          title={authT("location.title")}
          onClose={onLocationClose}
          onConfirm={handleLocationConfirm}
        />
      )}
    </>
  );
}
