// Client-safe: the Server Action is a reference, and the rest are types.
// Server components read the settings from `@/features/settings/queries`.
export { getSettingsAction } from "./actions";
export type { AppSettings, CompanySize } from "./model";
