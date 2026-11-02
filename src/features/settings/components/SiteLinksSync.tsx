"use client";

import { useEffect } from "react";
import type { SiteLinks } from "../model";
import { useSiteLinksStore } from "../siteLinksStore";

interface Props {
  /** From GET /settings, read by the root layout. */
  links: SiteLinks;
}

/**
 * Puts the root layout's site links into the store. An effect, so it runs in
 * the browser only: the server never writes the shared module store.
 */
export function SiteLinksSync({ links }: Props) {
  const setLinks = useSiteLinksStore((state) => state.setLinks);
  const { aboutUrl, termsUrl, privacyUrl } = links;

  useEffect(() => {
    setLinks({ aboutUrl, termsUrl, privacyUrl });
  }, [setLinks, aboutUrl, termsUrl, privacyUrl]);

  return null;
}
