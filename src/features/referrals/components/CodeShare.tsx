import { useNotify } from "@/shared/hooks/useNotify";
import { Button } from "@/shared/ui/Button";
import { useTranslations } from "next-intl";
import { ReferralProgram } from "../model";
import { useCopyText } from "../useCopyText";

export default function CodeShare({ program }: { program: ReferralProgram }) {
  const t = useTranslations("account.referrals");
  const { copied, copy } = useCopyText();
  const notify = useNotify();

  const copyCode = async () => {
    if (await copy(program.code)) notify.success(t("codeCopied"));
    else notify.error(t("copyFailed"));
  };
  return (
    <div className="border-stroke-light bg-surface-elevated flex flex-wrap items-center rounded-lg border p-4">
      <div className="flex min-w-40 flex-1 flex-col gap-3">
        <span className="text-text-subtle text-xs">{t("codeLabel")}</span>
        <div className="flex items-center justify-between gap-3">
          <strong
            className="grow text-center text-[20px] font-semibold"
            dir="ltr"
          >
            {program.code}
          </strong>
          <Button variant="outline" onClick={copyCode}>
            {t("copy")}
          </Button>
        </div>
      </div>
    </div>
  );
}
