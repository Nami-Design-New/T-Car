"use client";

import { create } from "zustand";

interface LocaleNavigationState {
  pendingLocation: string | null;
  startLocaleNavigation: (location: string) => void;
}

/** Browser-only state for the required full-document locale navigation. */
export const useLocaleNavigationStore = create<LocaleNavigationState>(
  (set) => ({
    pendingLocation: null,
    startLocaleNavigation: (location) => set({ pendingLocation: location }),
  }),
);
