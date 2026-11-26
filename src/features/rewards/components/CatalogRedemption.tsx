"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { fromActionResult } from "@/shared/lib/result";
import { StateCard } from "@/shared/ui/StateCard";
import { getRedemptionQuoteAction, redeemRewardAction } from "../actions";
import type {
  RewardCatalogData,
  RewardCatalogItem,
  RewardRedemption,
  RewardRedemptionQuote,
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
  const notify = useNotify();
  const [selected, setSelected] = useState<RewardCatalogItem | null>(null);
  const [quote, setQuote] = useState<RewardRedemptionQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<RewardRedemption | null>(null);
  // The + button that opened the flow; focus returns to it once every dialog
  // is gone (the success dialog opens from a confirm button that unmounts).
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef(false);
  // Guards a double click before the pending state re-renders the button.
  const pendingRef = useRef(false);
  // Drops a quote response that arrives after its dialog closed.
  const quoteRequestRef = useRef(0);

  useEffect(() => {
    if (selected || receipt || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    openerRef.current?.focus();
  }, [selected, receipt]);

  const loadQuote = async (itemId: string) => {
    const request = ++quoteRequestRef.current;
    setQuoteLoading(true);
    try {
      const result = fromActionResult(await getRedemptionQuoteAction(itemId));
      if (request !== quoteRequestRef.current) return;
      if (!result.ok) {
        if (result.error.kind === "validation") {
          notify.error(result.error.serverMessage);
        }
        setQuoteError(errorMessage(result.error));
        return;
      }
      setQuote(result.data);
    } catch (caught) {
      if (request !== quoteRequestRef.current) return;
      setQuoteError(errorMessage(caught));
    } finally {
      if (request === quoteRequestRef.current) setQuoteLoading(false);
    }
  };

  const open = (item: RewardCatalogItem, opener: HTMLButtonElement) => {
    openerRef.current = opener;
    setError(null);
    setQuote(null);
    setQuoteError(null);
    setSelected(item);
    void loadQuote(item.id);
  };

  const close = () => {
    if (pendingRef.current) return;
    quoteRequestRef.current++;
    restoreFocusRef.current = true;
    setSelected(null);
    setQuote(null);
    setQuoteError(null);
    setQuoteLoading(false);
    setError(null);
  };

  const closeSuccess = () => {
    restoreFocusRef.current = true;
    setReceipt(null);
  };

  const confirm = async () => {
    if (!selected || !quote || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      const result = fromActionResult(await redeemRewardAction(selected.id));
      if (result.ok) {
        setReceipt({ ...result.data, tierName: quote.tierName });
        setSelected(null);
        setQuote(null);
        router.refresh();
      } else if (result.error.kind === "validation") {
        // Backend 400/422: show its own localized text and keep the dialog.
        notify.error(result.error.serverMessage);
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
        quote={quote}
        quoteLoading={quoteLoading}
        pending={pending}
        error={error ?? quoteError}
        onClose={close}
        onConfirm={confirm}
      />
      <RedemptionSuccessDialog receipt={receipt} onClose={closeSuccess} />
    </section>
  );
}
