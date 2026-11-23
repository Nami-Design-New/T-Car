"use client";

import { startTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { reportError } from "@/shared/lib/report";
import { Button } from "@/shared/ui/Button";
import { StateCard } from "@/shared/ui/StateCard";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  /** What failed to load, e.g. "Your invite code could not be loaded". */
  title: string;
  scope: string;
}

/**
 * A section whose data did not load, in the design's card (Figma
 * Ref/NetworkError). Production hides a server error's details from the
 * browser, so the copy is the design's "check your connection" for any failure.
 */
export function SectionLoadError({ error, reset, title, scope }: Props) {
  const t = useTranslations("account.loadError");
  const router = useRouter();

  useEffect(() => {
    reportError(error, { scope, digest: error.digest });
  }, [error, scope]);

  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <StateCard
      icon="info"
      role="alert"
      title={title}
      description={t("description")}
      action={<Button onClick={retry}>{t("retry")}</Button>}
    />
  );
}
