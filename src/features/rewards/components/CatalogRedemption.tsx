"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { fromActionResult } from "@/shared/lib/result";
import { StateCard } from "@/shared/ui/StateCard";
import { redeemRewardAction } from "../actions";
import type {
  RewardCatalogData,
  RewardCatalogItem,
  RewardRedemption,
} from "../model";
import CatalogCard from "./CatalogCard";
import RedeemableBalanceCard from "./RedeemableBalanceCard";
import RedemptionConfirmDialog from "./RedemptionConfirmDialog";
import RedemptionSuccessDialog from "./RedemptionSuccessDialog";

interface Props {
  data: RewardCatalogData;
}

export default function CatalogRedemption({ data }: Props) {
  const t = useTranslations("rewards.catalog");
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const [selected, setSelected] = useState<RewardCatalogItem | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<RewardRedemption | null>(null);
  // The + button that opened the flow; focus returns to it once every dialog
  // is gone (the success dialog opens from a confirm button that unmounts).
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef(false);
  // Guards a double click before the pending state re-renders the button.
  const pendingRef = useRef(false);

  useEffect(() => {
    if (selected || receipt || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    openerRef.current?.focus();
  }, [selected, receipt]);

  const open = (item: RewardCatalogItem, opener: HTMLButtonElement) => {
    openerRef.current = opener;
    setError(null);
    setSelected(item);
  };

  const close = () => {
    if (pendingRef.current) return;
    restoreFocusRef.current = true;
    setSelected(null);
    setError(null);
  };

  const closeSuccess = () => {
    restoreFocusRef.current = true;
    setReceipt(null);
  };

  const confirm = async () => {
    if (!selected || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      const result = fromActionResult(await redeemRewardAction(selected.id));
      if (result.ok) {
        setReceipt(result.data);
        setSelected(null);
        router.refresh();
      } else {
        setError(errorMessage(result.error));
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  return (
    <section className="bg-surface-card-primary flex flex-col gap-4 rounded-xl">
      <RedeemableBalanceCard balance={data.balance} showHistory />
      {data.items.length === 0 ? (
        <StateCard
          icon="gift"
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {data.items.map((item) => (
            <CatalogCard
              key={item.id}
              item={item}
              onRedeem={(opener) => open(item, opener)}
            />
          ))}
        </div>
      )}
      <RedemptionConfirmDialog
        item={selected}
        balance={data.balance}
        pending={pending}
        error={error}
        onClose={close}
        onConfirm={confirm}
      />
      <RedemptionSuccessDialog receipt={receipt} onClose={closeSuccess} />
    </section>
  );
}
