import { useFormatter, useTranslations } from "next-intl";
import { FiInfo } from "react-icons/fi";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import type { RewardCatalogItem } from "../model";
import RewardTicket from "./RewardTicket";

interface Props {
  item: RewardCatalogItem | null;
  balance: number;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RedemptionConfirmDialog({
  item,
  balance,
  pending,
  error,
  onClose,
  onConfirm,
}: Props) {
  const t = useTranslations("rewards.redemption");
  const format = useFormatter();
  if (!item) return null;
  const balanceAfter = balance - item.pointsCost;

  return (
    <Dialog
      open
      onClose={onClose}
      closeOnEscape={!pending}
      closeOnBackdrop={!pending}
      size="sm"
      placement="bottom-sheet"
      className="gap-4! p-4! max-[575px]:pb-[max(2.125rem,env(safe-area-inset-bottom))]! sm:p-6!"
    >
      <span
        className="mx-auto h-1 w-10 rounded-full bg-neutral-200 min-[576px]:hidden"
        aria-hidden="true"
      />
      <Dialog.Header className="flex-col gap-0! text-center">
        <Dialog.Title className="text-xl! font-bold!">
          {t("confirmTitle")}
        </Dialog.Title>
        <Dialog.Description className="m-0! text-xs">
          {t("confirmDescription")}
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Body className="flex flex-col gap-4 pt-3">
        <RewardTicket
          as="div"
          variant="preview"
          card={{
            id: item.id,
            code: "",
            discountAmount: item.discountAmount,
            status: "active",
          }}
          statusLabel={t("new")}
          validityLabel={t("validForDays", { days: item.validityDays })}
        />
        <dl className="m-0 flex flex-col rounded-lg bg-neutral-50 px-4 py-1 text-sm">
          <div className="flex items-center justify-between gap-3 py-2">
            <dt className="text-text-subtle">{t("balanceBefore")}</dt>
            <dd className="m-0 font-semibold">
              {t("pointsAmount", { amount: format.number(balance) })}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-2">
            <dt className="text-text-subtle">{t("cost")}</dt>
            <dd className="m-0 font-semibold text-red-600">
              {t("costAmount", { amount: format.number(item.pointsCost) })}
            </dd>
          </div>
          <div className="border-stroke-light flex items-center justify-between gap-3 border-t py-2.5">
            <dt className="font-bold">{t("balanceAfter")}</dt>
            <dd className="text-action-primary m-0 text-base font-bold">
              {t("pointsAmount", { amount: format.number(balanceAfter) })}
            </dd>
          </div>
        </dl>
        <p className="text-text-subtle border-stroke-light m-0 flex items-start gap-2 rounded-lg border p-3 text-xs">
          <FiInfo
            className="text-action-primary mt-0.5 shrink-0 text-sm"
            aria-hidden="true"
          />
          <span>{t("tierPointsNote")}</span>
        </p>
        {error && (
          <p role="alert" className="text-status-error m-0 text-sm">
            {error}
          </p>
        )}
      </Dialog.Body>
      <Dialog.Footer className="flex-col">
        <Button
          type="button"
          size="lg"
          className="w-full"
          loading={pending}
          onClick={onConfirm}
        >
          {t("confirm")}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={onClose}
        >
          {t("cancel")}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
