"use client";

import { create } from "zustand";
import { fromActionResult } from "@/shared/lib/result";
import { checkReferralCodeAction } from "./actions";
import { normalizeReferralCode } from "./model";

/** Where the sign-up invite code is; each value has its own Figma state. */
export type ReferralCodeStatus =
  "empty" | "entered" | "checking" | "valid" | "invalid" | "network";

interface ReferralCodeState {
  code: string;
  status: ReferralCodeStatus;
  /** The friend whose code it is, once the code is valid. */
  inviterName: string | null;
  /** Creating the account was tried with a code that is not checked yet. */
  needsCheck: boolean;
  setCode: (value: string) => void;
  /** Makes a valid code editable again ("Change code"). */
  edit: () => void;
  flagUnchecked: () => void;
  reset: () => void;
}

const EMPTY = {
  code: "",
  status: "empty",
  inviterName: null,
  needsCheck: false,
} as const;

/**
 * The invite code on its way to sign-up: typed in the profile step or taken
 * from an invite link (`?ref=`), and shown as a banner on the phone and code
 * steps. Written only in the browser (events and effects).
 */
export const useReferralCodeStore = create<ReferralCodeState>()((set) => ({
  ...EMPTY,
  setCode: (value) => {
    const code = normalizeReferralCode(value);
    set({
      code,
      status: code ? "entered" : "empty",
      inviterName: null,
      needsCheck: false,
    });
  },
  edit: () => set({ status: "entered", inviterName: null }),
  flagUnchecked: () => set({ needsCheck: true }),
  reset: () => set(EMPTY),
}));

/** Checks the current code; a result for a code changed meanwhile is dropped. */
export async function checkReferralCode() {
  const { code } = useReferralCodeStore.getState();
  if (!code) return;
  useReferralCodeStore.setState({ status: "checking", needsCheck: false });

  let next: Pick<ReferralCodeState, "status" | "inviterName">;
  try {
    const result = fromActionResult(await checkReferralCodeAction(code));
    next = !result.ok
      ? { status: "network", inviterName: null }
      : result.data.valid
        ? { status: "valid", inviterName: result.data.inviterName }
        : { status: "invalid", inviterName: null };
  } catch {
    // The request itself failed, e.g. offline.
    next = { status: "network", inviterName: null };
  }
  if (useReferralCodeStore.getState().code === code) {
    useReferralCodeStore.setState(next);
  }
}

/**
 * Whether the profile can be sent: with no code or a valid one. Otherwise the
 * field asks for a check (or "continue without") and this returns false.
 */
export function referralCodeAllowsSubmit() {
  const { status, flagUnchecked } = useReferralCodeStore.getState();
  if (status === "empty" || status === "valid") return true;
  flagUnchecked();
  return false;
}

/** Forgets the code, e.g. once the account is created. */
export const resetReferralCode = () => useReferralCodeStore.getState().reset();
