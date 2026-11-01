"use client";

import type { BankAccount } from "@/features/bank-accounts";
import { useNotify } from "@/shared/hooks/useNotify";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useTopUpPayment } from "../hooks/useTopUpPayment";
import { useWallet } from "../hooks/useWallet";
import {
  MIN_TOP_UP,
  MIN_WITHDRAW,
  type WalletData,
  type WalletTopUpOutcome,
} from "../model";
import WalletTab from "./WalletTab";

const WalletAmountModal = dynamic(() => import("./WalletAmountModal"), {
  ssr: false,
});
const BankSelectModal = dynamic(() => import("./BankSelectModal"), {
  ssr: false,
});

type ResultKind = "topup" | "withdraw";

interface Props {
  initialData: WalletData;
}

/** One step at a time, so two wallet sheets can never be open together. */
type WalletFlow =
  | { step: "idle" }
  | { step: "topup-amount" }
  | { step: "withdraw-bank" }
  | { step: "withdraw-amount"; account: BankAccount }
  | { step: "result"; kind: ResultKind; status?: WalletTopUpOutcome };

export default function WalletSection({ initialData }: Props) {
  const t = useTranslations("wallet");
  const {
    summary,
    transactions,
    bankAccounts,
    loading,
    error,
    reload,
    submitting,
    topUp,
    withdraw,
  } = useWallet(initialData);
  const notify = useNotify();
  const [flow, setFlow] = useState<WalletFlow>({ step: "idle" });

  const close = useCallback(() => setFlow({ step: "idle" }), []);

  // The API owns the balance: re-read it whatever the payment tab reports.
  const { watch } = useTopUpPayment((outcome) => {
    reload();
    if (outcome) setFlow({ step: "result", kind: "topup", status: outcome });
  });

  const handleTopUp = async (amount: number) => {
    // Opened before the request, while the click still allows a new tab. No
    // `noopener`: the payment page reports back through `window.opener`.
    const tab = window.open("", "_blank");
    const result = await topUp(amount);
    if (!result.ok) {
      tab?.close();
      // The backend's validation message is a toast only; the sheet stays open.
      if (result.error.kind === "validation" && result.error.serverMessage) {
        notify.error(result.error.serverMessage);
        return undefined;
      }
      return result.error;
    }
    notify.success(result.message);
    if (!tab) {
      // Pop-up blocked: pay in this tab; no result dialog on return.
      window.location.assign(result.data.paymentUrl);
      return;
    }
    tab.location.href = result.data.paymentUrl;
    watch(tab, result.data);
    close();
  };

  const handleWithdraw = async (account: BankAccount, amount: number) => {
    const result = await withdraw({ bankAccountId: account.id, amount });
    if (!result.ok) return result.error;
    setFlow({ step: "result", kind: "withdraw" });
  };

  return (
    <>
      <WalletTab
        summary={summary}
        transactions={transactions}
        loading={loading}
        error={error ?? undefined}
        onRetry={reload}
        onTopUp={() => setFlow({ step: "topup-amount" })}
        onWithdraw={() => setFlow({ step: "withdraw-bank" })}
      />

      <WalletAmountModal
        open={flow.step === "topup-amount"}
        title={t("topUpTitle")}
        submitLabel={t("topUp")}
        min={MIN_TOP_UP}
        // max={MAX_TOP_UP}
        loading={submitting}
        onClose={close}
        onConfirm={handleTopUp}
      />

      <BankSelectModal
        open={flow.step === "withdraw-bank"}
        accounts={bankAccounts}
        onClose={close}
        onSelect={(account) => setFlow({ step: "withdraw-amount", account })}
      />

      <WalletAmountModal
        open={flow.step === "withdraw-amount"}
        title={t("withdrawTitle")}
        submitLabel={t("withdraw")}
        min={MIN_WITHDRAW}
        max={summary.withdrawable}
        loading={submitting}
        onClose={close}
        onConfirm={(amount) => {
          if (flow.step === "withdraw-amount")
            return handleWithdraw(flow.account, amount);
          return Promise.resolve(undefined);
        }}
      />

      {flow.step === "result" && (
        <ResultDialog
          open
          status={flow.status === "failed" ? "error" : "success"}
          description={
            flow.kind === "topup"
              ? t(flow.status === "failed" ? "topUpFailure" : "topUpSuccess")
              : undefined
          }
          onClose={close}
        />
      )}
    </>
  );
}
