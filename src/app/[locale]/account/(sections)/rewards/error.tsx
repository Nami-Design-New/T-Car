"use client";

import { useTranslations } from "next-intl";
import { SectionLoadError } from "../_components/SectionLoadError";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RewardsError({ error, reset }: Props) {
  const t = useTranslations("rewards");
  return (
    <SectionLoadError
      error={error}
      reset={reset}
      title={t("unavailableTitle")}
      scope="account.rewards"
    />
  );
}
