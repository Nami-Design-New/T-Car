import { useFormatter, useTranslations } from "next-intl";
import { FiCheck } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import type { RewardRedemption } from "../model";
import RewardTicket from "./RewardTicket";

interface Props {
  receipt: RewardRedemption | null;
  onClose: () => void;
}

/** Decorative confetti around the success burst (Figma 07), CSS only. */
const CONFETTI = [
  "top-0 start-1/2 h-1 w-2.5 -rotate-30 bg-success-500",
  "top-6 end-6 h-1 w-2.5 rotate-30 bg-action-primary",
  "top-10 start-3 h-1 w-2.5 -rotate-12 bg-amber-400",
  "top-16 start-6 size-1.5 rounded-full bg-action-primary",
  "top-20 end-3 size-1.5 rounded-full bg-amber-400",
  "top-28 end-1 h-1 w-2.5 -rotate-30 bg-orange-500",
  "bottom-16 start-2 h-1 w-2.5 rotate-6 bg-success-500",
  "bottom-12 end-4 size-1.5 rounded-full bg-success-500",
  "bottom-6 end-10 h-1 w-2.5 -rotate-45 bg-neutral-300",
  "bottom-4 start-10 size-1.5 rounded-full bg-amber-400",
  "bottom-0 start-1/3 h-1 w-2.5 -rotate-12 bg-action-primary",
];

export default function RedemptionSuccessDialog({ receipt, onClose }: Props) {
  const t = useTranslations("rewards.redemption");
  const format = useFormatter();
  if (!receipt) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      placement="bottom-sheet"
      className="bg-surface-card-primary! gap-4! p-4! max-[575px]:pb-[max(2.125rem,env(safe-area-inset-bottom))]! sm:p-6!"
    >
      <Dialog.Close className="border-stroke-light size-11! self-end rounded-xl! border! bg-white! text-xl! hover:bg-neutral-100!" />
      <Dialog.Body className="flex flex-col items-center gap-5">
        <div
          className="relative grid size-56 shrink-0 place-items-center"
          aria-hidden="true"
        >
          {CONFETTI.map((piece) => (
            <span key={piece} className={`absolute rounded-full ${piece}`} />
          ))}
          <span className="bg-primary-100 grid size-52 place-items-center rounded-full">
            <span className="bg-primary-200 grid size-40 place-items-center rounded-full">
              <span className="grid size-29 place-items-center rounded-full bg-[linear-gradient(150deg,#2d91ff,#1354c7)] text-5xl text-white shadow-[0_9px_18px_rgba(31,77,153,0.2)]">
                <FiCheck />
              </span>
            </span>
          </span>
        </div>
        <div className="text-center">
          <Dialog.Title className="text-2xl! font-bold!">
            {t("successTitle")}
          </Dialog.Title>
          <Dialog.Description className="mx-auto! max-w-md text-sm">
            {t("successDescription")}
          </Dialog.Description>
        </div>
        <ul className="m-0 w-full list-none p-0">
          <RewardTicket card={receipt.card} statusLabel={t("new")} />
        </ul>
        <p className="border-stroke-light m-0 flex w-full flex-col gap-0.5 rounded-xl border bg-white p-3 text-center">
          <strong className="text-action-primary text-base">
            {t("balanceAfterAmount", {
              amount: format.number(receipt.balanceAfter),
            })}
          </strong>
          <span className="text-text-subtle text-xs">
            {t("tierPointsUnchanged", {
              tier: receipt.tierName,
              amount: format.number(receipt.tierPoints),
            })}
          </span>
        </p>
      </Dialog.Body>
      <Dialog.Footer className="flex-col">
        <Button asChild size="lg" className="w-full">
          <Link href="/account/rewards/cards">{t("viewCards")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/account/rewards">{t("backToRewards")}</Link>
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
