"use client";

import { create } from "zustand";
import type { SiteLinks } from "./model";

interface SiteLinksState {
  links: SiteLinks;
  setLinks: (links: SiteLinks) => void;
}

/**
 * The backend's about, terms, and privacy pages for client components.
 * Written only in the browser (`SiteLinksSync`, in an effect), so the module
 * store on the server stays empty and is never shared between requests.
 */
export const useSiteLinksStore = create<SiteLinksState>()((set) => ({
  links: {},
  setLinks: (links) => set({ links }),
}));

/** The site links; empty until `SiteLinksSync` has run in the browser. */
export const useSiteLinks = () => useSiteLinksStore((state) => state.links);
