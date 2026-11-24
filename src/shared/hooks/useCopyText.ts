"use client";

import { useEffect, useRef, useState } from "react";

const COPIED_MS = 2000;

/** Copies text to the clipboard; `copied` stays true briefly after a success. */
export function useCopyText() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async (text: string) => {
    try {
      // The Clipboard API exists only in secure contexts (https, localhost).
      await navigator.clipboard.writeText(text);
    } catch {
      return false;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    return true;
  };

  return { copied, copy };
}
