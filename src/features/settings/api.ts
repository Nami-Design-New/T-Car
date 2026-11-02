import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import type { AppSettings } from "./model";

export interface SettingsApi {
  getSettings(): Promise<AppSettings>;
}

interface CompanySizeDto {
  id: number;
  size: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function isCompanySizeDto(value: unknown): value is CompanySizeDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isInteger(value.id) &&
    typeof value.size === "number" &&
    Number.isFinite(value.size)
  );
}

/** Validate GET /settings and map the fields the app uses. */
export function mapSettings(value: unknown): AppSettings {
  const data = isApiEnvelope(value) ? value.data : undefined;
  const sizes = isRecord(data) ? data.company_sizes : undefined;
  if (
    !isApiEnvelope(value) ||
    (value.code !== 200 && value.code !== 201) ||
    !Array.isArray(sizes) ||
    !sizes.every(isCompanySizeDto)
  ) {
    throw new AppError("server");
  }
  return {
    companySizes: sizes.map(({ id, size }) => ({ id: String(id), size })),
  };
}

/** GET /settings is public: no token (docs/api/contact-join-us-api.md R2). */
async function getSettings(): Promise<AppSettings> {
  const response =
    await publicServerHttp.get<ApiEnvelope<unknown>>("/settings");
  return mapSettings(response);
}

export const settingsApi: SettingsApi = { getSettings };
