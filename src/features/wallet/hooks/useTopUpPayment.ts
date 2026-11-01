"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  topUpOutcome,
  type WalletTopUpOutcome,
  type WalletTopUpPayment,
} from "../model";

/** The payment tab being watched, and the origins allowed to report its outcome. */
interface PendingPayment {
  /** The tab opened for `paymentUrl`; messages must come from it. */
  tab: Window;
  /** Origins of `successUrl` and `failUrl`, the backend pages that post the outcome. */
  origins: string[];
}

/** How often to check whether the customer closed the tab without paying. */
const CLOSED_CHECK_MS = 1000;

/**
 * Watches a payment tab opened by this page. The tab's result page posts the
 * outcome back (`topUpOutcome`) and this page closes the tab; a tab closed
 * without one reports `null`.
 * Only messages from that tab and the API's success/fail origins count.
 */
export function useTopUpPayment(
  onDone: (outcome: WalletTopUpOutcome | null) => void,
) {
  // null while no payment tab is open; set by `watch`.
  const [pending, setPending] = useState<PendingPayment | null>(null);
  // Keeps the latest callback without re-subscribing the listener every render.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!pending) return;

    // Stops watching (the cleanup below removes the listener and the timer),
    // so the outcome is reported once.
    const finish = (outcome: WalletTopUpOutcome | null) => {
      setPending(null);
      onDoneRef.current(outcome);
    };

    // The backend's result page calls `window.opener.postMessage(...)`.
    const onMessage = (event: MessageEvent) => {
      // Ignore messages from other windows or other sites.
      if (
        event.source !== pending.tab ||
        !pending.origins.includes(event.origin)
      )
        return;
      // Only 'payment-success' / 'payment-failed' count.
      const outcome = topUpOutcome(event.data);
      if (!outcome) return;
      pending.tab.close();
      finish(outcome);
    };

    // No message comes if the customer closes the tab; `closed` is readable
    // across origins, so poll it and report `null` (no result to show).
    const timer = window.setInterval(() => {
      if (pending.tab.closed) finish(null);
    }, CLOSED_CHECK_MS);

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(timer);
    };
  }, [pending]);

  /** Starts watching `tab` once it has been sent to `payment.paymentUrl`. */
  const watch = useCallback((tab: Window, payment: WalletTopUpPayment) => {
    setPending({
      tab,
      origins: [
        new URL(payment.successUrl).origin,
        new URL(payment.failUrl).origin,
      ],
    });
  }, []);

  // `paying` is true while a payment tab is being watched.
  return { watch, paying: pending !== null };
}
