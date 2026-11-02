// Client-safe: the Server Action is a reference, the store and the sync
// component are client code, and the rest are types. Server components read
// the settings from `@/features/settings/queries`.
export { getSettingsAction } from "./actions";
export { SiteLinksSync } from "./components/SiteLinksSync";
export { useSiteLinks, useSiteLinksStore } from "./siteLinksStore";
export type {
  AppSettings,
  CompanySize,
  ContactSettings,
  SiteLinks,
  SiteSettings,
} from "./model";
