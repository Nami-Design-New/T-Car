export const ACCOUNT_TABS = [
  "profile",
  "bookings",
  "wallet",
  "bank-accounts",
  "notifications",
] as const;

export type AccountTab = (typeof ACCOUNT_TABS)[number];

export interface UserProfile {
  fullName: string;
  email: string;
  birthDate: string;
  phone: string;
  licenseUploaded: boolean;
}

export interface LicenseUpload {
  name: string;
  size: number;
  type: string;
}

/** Each account section is its own route: /account/<section>. */
/** Maximum accepted driving-license image size (5 MiB). */
export const LICENSE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const LICENSE_FILE_TYPES = ["image/jpeg", "image/png"] as const;

export const isLicenseFileType = (
  type: string,
): type is (typeof LICENSE_FILE_TYPES)[number] =>
  (LICENSE_FILE_TYPES as readonly string[]).includes(type);

export const accountSectionPath = (section: AccountTab) =>
  `/account/${section}` as const;

export const isAccountTab = (value: unknown): value is AccountTab =>
  typeof value === "string" &&
  (ACCOUNT_TABS as readonly string[]).includes(value);
