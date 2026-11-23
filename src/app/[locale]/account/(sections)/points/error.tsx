"use client";

import { useTranslations } from "next-intl";
import { SectionLoadError } from "../_components/SectionLoadError";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PointsError({ error, reset }: Props) {
  const t = useTranslations("account.points");
  return (
    <SectionLoadError
      error={error}
      reset={reset}
      title={t("unavailableTitle")}
      scope="account.points"
    />
  );
}
