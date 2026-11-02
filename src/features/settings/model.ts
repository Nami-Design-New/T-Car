/** A company size the Join Us form offers. */
export interface CompanySize {
  /** Sent as `company_size_id`. */
  id: string;
  /** Shown to the user, e.g. 10. */
  size: number;
}

/**
 * The app settings from GET /settings. Only the fields the app uses are mapped;
 * add a field here (and to the mapper in `api.ts`) when a feature needs it,
 * e.g. the terms link, the booking-type switches, or the price filter range.
 */
export interface AppSettings {
  companySizes: CompanySize[];
}
