"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { BankAccount } from "@/features/bank-accounts";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useWallet } from "../hooks/useWallet";
import { MAX_TOP_UP, MIN_TOP_UP, MIN_WITHDRAW } from "../model";
import WalletTab from "./WalletTab";
const WalletAmountModal = dynamic(() => import("./WalletAmountModal"), {
  ssr: false,
});
const BankSelectModal = dynamic(() => import("./BankSelectModal"), {
  ssr: false,
});

type ResultKind = "topup" | "withdraw";

/** One step at a time, so two wallet sheets can never be open together. */
type WalletFlow =
  | { step: "idle" }
  | { step: "topup-amount" }
  | { step: "withdraw-bank" }
  | { step: "withdraw-amount"; account: BankAccount }
  | { step: "result"; kind: ResultKind };

export default function WalletSection() {
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
  } = useWallet();
  const [flow, setFlow] = useState<WalletFlow>({ step: "idle" });

  const close = useCallback(() => setFlow({ step: "idle" }), []);

  const handleTopUp = async (amount: number) => {
    const result = await topUp(amount);
    if (!result.ok) return result.error;
    setFlow({ step: "result", kind: "topup" });
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
        max={MAX_TOP_UP}
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
        <ResultDialog open status="success" onClose={close} />
      )}
    </>
  );
}
