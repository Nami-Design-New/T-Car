"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppError } from "@/shared/lib/errors";
import { reportError } from "@/shared/lib/report";
import { fail, fromActionResult, type Result } from "@/shared/lib/result";
import { getSettingsAction, type CompanySize } from "@/features/settings";
import { sendJoinRequestAction } from "../actions";
import type { JoinUsRequest } from "../model";

/**
 * The Join Us dialog's data: the company sizes, read from GET /settings each
 * time the dialog opens, and the send (public Server Action).
 */
export function useJoinUs(open: boolean) {
  const [sizes, setSizes] = useState<CompanySize[]>([]);
  // Loading from the first render while open, so the select never looks empty.
  const [loading, setLoading] = useState(open);
  const [error, setError] = useState<AppError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestRef = useRef(0);

  const loadSizes = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    const result = fromActionResult(await getSettingsAction());
    if (request !== requestRef.current) return;
    if (result.ok) setSizes(result.data.companySizes);
    else setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) void loadSizes();
    // Drop a response still in flight once the dialog closes.
    else requestRef.current++;
  }, [open, loadSizes]);

  const send = useCallback(
    async (request: JoinUsRequest): Promise<Result<null>> => {
      setSubmitting(true);
      try {
        return fromActionResult(await sendJoinRequestAction(request));
      } catch (sendError) {
        reportError(sendError, { scope: "joinUs.send" });
        return fail(sendError);
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return {
    sizes: { items: sizes, loading, error, retry: loadSizes },
    submitting,
    send,
  };
}
