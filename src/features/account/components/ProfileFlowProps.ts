import type { Dispatch, SetStateAction } from "react";

export type PendingAction =
  "save" | "send" | "resend" | "verify" | "license" | "delete" | null;

export interface ProfileFlowProps {
  pendingAction: PendingAction;
  setPendingAction: Dispatch<SetStateAction<PendingAction>>;
}
