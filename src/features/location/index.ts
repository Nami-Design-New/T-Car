// Client-safe: the store, its readers, and the sync component are client code.
// Server components read the saved location from
// `@/features/account/queries` (`getSavedLocation`).
export { UserLocationSync } from "./components/UserLocationSync";
export {
  readCurrentLocation,
  subscribeCurrentLocation,
  useLocationSourceStore,
} from "./currentLocation";
export type { LocationSource } from "./currentLocation";
