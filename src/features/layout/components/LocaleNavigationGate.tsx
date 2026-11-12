"use client";

import { useEffect, type ReactNode } from "react";
import { Loader } from "@/shared/ui/Loader";
import { useLocaleNavigationStore } from "../localeNavigationStore";

interface Props {
  children: ReactNode;
}

/** Replaces the application while a locale change performs its full reload. */
export default function LocaleNavigationGate({ children }: Props) {
  const pendingLocation = useLocaleNavigationStore(
    (state) => state.pendingLocation,
  );

  useEffect(() => {
    if (!pendingLocation) return;

    const frame = window.requestAnimationFrame(() => {
      window.location.assign(pendingLocation);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingLocation]);

  if (pendingLocation) return <Loader />;
  return children;
}
