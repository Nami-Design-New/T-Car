"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { AppError } from "@/shared/lib/errors";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { AlertDialog } from "@/shared/ui/AlertDialog";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import type { BankAccount, BankAccountPayload } from "../model";
import { useBankAccounts } from "../hooks/useBankAccounts";
import BankAccountsTab from "./BankAccountsTab";
import BankAccountFormModal from "./BankAccountFormModal";

type ResultKind = "added" | "updated" | "deleted";

/** One step at a time, so two bank account sheets can never be open together. */
type BankAccountsFlow =
  | { step: "idle" }
  | { step: "add" }
  | { step: "edit"; account: BankAccount }
  | { step: "confirm-delete"; account: BankAccount }
  // No error means success; `message` is the backend's success text, shown in the dialog.
  | { step: "result"; kind: ResultKind; error?: AppError; message?: string };

export default function BankAccountsSection() {
  const t = useTranslations("bankAccounts");
  const { accounts, submitting, add, update, remove } = useBankAccounts();
  const errorMessage = useErrorMessage();
  const notify = useNotify();
  const [flow, setFlow] = useState<BankAccountsFlow>({ step: "idle" });

  const close = useCallback(() => setFlow({ step: "idle" }), []);

  /** Keeps the form open on errors so RHF can associate them with the entered fields. */
  const handleSubmit = async (
    payload: BankAccountPayload,
  ): Promise<AppError | undefined> => {
    if (flow.step !== "add" && flow.step !== "edit") return undefined;
    const kind: ResultKind = flow.step === "add" ? "added" : "updated";
    const result =
      flow.step === "add"
        ? await add(payload)
        : await update(flow.account.id, payload);

    if (result.ok) {
      setFlow({ step: "result", kind, message: result.message });
      return undefined;
    }
    // The backend's validation message is a toast only; the form stays open.
    if (result.error.kind === "validation" && result.error.serverMessage) {
      notify.error(result.error.serverMessage);
      return undefined;
    }
    // The edited account is gone (deleted elsewhere): nothing left to edit.
    if (result.error.kind === "not_found") {
      setFlow({ step: "result", kind, error: result.error });
      return undefined;
    }
    return result.error;
  };

  const handleDelete = async () => {
    if (flow.step !== "confirm-delete" || submitting) return;

    const result = await remove(flow.account.id);
    setFlow(
      result.ok
        ? { step: "result", kind: "deleted", message: result.message }
        : { step: "result", kind: "deleted", error: result.error },
    );
  };

  return (
    <>
      <BankAccountsTab
        accounts={accounts.items}
        loading={accounts.loading}
        hasMore={accounts.hasMore}
        error={accounts.error ?? undefined}
        onLoadMore={accounts.loadMore}
        onRetry={accounts.retry}
        onAdd={() => setFlow({ step: "add" })}
        onEdit={(account) => setFlow({ step: "edit", account })}
        onDelete={(account) => setFlow({ step: "confirm-delete", account })}
      />

      <BankAccountFormModal
        open={flow.step === "add" || flow.step === "edit"}
        mode={flow.step === "edit" ? "edit" : "add"}
        account={flow.step === "edit" ? flow.account : undefined}
        loading={submitting}
        onClose={close}
        onConfirm={handleSubmit}
      />

      <AlertDialog
        open={flow.step === "confirm-delete"}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
        primaryButtonText={t("delete", {
          bank: flow.step === "confirm-delete" ? flow.account.bankName : "",
        })}
        secondaryButtonText={t("cancel")}
        showButtons
        loading={submitting}
        onPrimary={handleDelete}
        onSecondary={() => {
          if (!submitting) close();
        }}
      />

      {flow.step === "result" && (
        <ResultDialog
          open
          status={flow.error ? "error" : "success"}
          description={flow.error ? errorMessage(flow.error) : flow.message}
          onClose={close}
        />
      )}
    </>
  );
}
