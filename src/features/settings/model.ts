/** A company size the Join Us form offers. */
export interface CompanySize {
  /** Sent as `company_size_id`. */
  id: string;
  /** Shown to the user, e.g. 10. */
  size: number;
}

/**
 * T-Car's contact details, shown in the home Contact card and the footer. A
 * field the API leaves out (or sends in an unusable form) is absent and hidden.
 */
export interface ContactSettings {
  email?: string;
  /** As the API sends it, e.g. +966500000000. */
  phone?: string;
  /** Absolute http(s) URLs. */
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

/**
 * The backend's pages, in the request's language: about (the footer), terms
 * and privacy (the footer and the register form). Absent when not usable.
 */
export interface SiteLinks {
  aboutUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

/**
 * The app settings from GET /settings. Only the fields the app uses are mapped;
 * add a field here (and to the mapper in `api.ts`) when a feature needs it,
 * e.g. the booking-type switches, the price filter range, or the map position.
 */
export interface AppSettings {
  companySizes: CompanySize[];
  contact: ContactSettings;
  links: SiteLinks;
}

/** What every page needs from the settings: the contact details and the site links. */
export type SiteSettings = Pick<AppSettings, "contact" | "links">;
