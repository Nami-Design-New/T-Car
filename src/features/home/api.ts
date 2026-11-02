import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { fail, ok, type Result } from "@/shared/lib/result";
import type { ContactMessage, JoinUsRequest } from "./model";

export interface ContactApi {
  /** Sends the message; success carries the backend's message for the toast. */
  sendMessage(message: ContactMessage): Promise<Result<null>>;
}

/** The company sizes come from the settings feature (GET /settings). */
export interface JoinUsApi {
  /** Sends a partner request; success carries the backend's message. */
  sendJoinRequest(request: JoinUsRequest): Promise<Result<null>>;
}

/** Success is body code 200 (201 accepted too); `data` is null. */
const isSuccessCode = (code: number) => code === 200 || code === 201;

/**
 * POST /contact-us as JSON. The endpoint is public, so no token is sent
 * (docs/api/contact-join-us-api.md R2). Optional fields are left out when blank.
 */
async function sendMessage({
  name,
  email,
  contactReason,
  bookingNumber,
  message,
}: ContactMessage): Promise<Result<null>> {
  try {
    const response = await publicServerHttp.post<ApiEnvelope<unknown>>(
      "/contact-us",
      {
        name,
        email,
        message,
        ...(contactReason ? { reason: contactReason } : {}),
        ...(bookingNumber ? { order_number: bookingNumber } : {}),
      },
    );
    if (!isApiEnvelope(response) || !isSuccessCode(response.code)) {
      throw new AppError("server");
    }
    return ok(null, response.message);
  } catch (error) {
    return fail(error);
  }
}

export const contactApi: ContactApi = { sendMessage };

/**
 * POST /join-us as JSON, public (no token). The size goes as
 * `company_size_id` (Bruno's `size` is rejected) and the phone as its national
 * number; the API checks the Saudi format (§4.2).
 */
async function sendJoinRequest({
  name,
  phone,
  companyName,
  email,
  companySizeId,
}: JoinUsRequest): Promise<Result<null>> {
  try {
    const sizeId = Number(companySizeId);
    if (!Number.isSafeInteger(sizeId) || sizeId < 1) {
      throw new AppError(
        "validation",
        "joinUs.companySizeRequired",
        undefined,
        {
          companySizeId: "joinUs.companySizeRequired",
        },
      );
    }
    const response = await publicServerHttp.post<ApiEnvelope<unknown>>(
      "/join-us",
      {
        name,
        phone: phone.phone,
        company_name: companyName,
        email,
        company_size_id: sizeId,
      },
    );
    if (!isApiEnvelope(response) || !isSuccessCode(response.code)) {
      throw new AppError("server");
    }
    return ok(null, response.message);
  } catch (error) {
    return fail(error);
  }
}

export const joinUsApi: JoinUsApi = { sendJoinRequest };
