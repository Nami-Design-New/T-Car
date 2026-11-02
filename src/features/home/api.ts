import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import {
  publicServerHttp,
  publicSiteServerHttp,
} from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { fail, ok, type Result } from "@/shared/lib/result";
import type {
  ContactMessage,
  FAQItem,
  HomeHeroContent,
  JoinUsRequest,
} from "./model";

export interface HomeApi {
  getHeroContent(locale: string): Promise<HomeHeroContent>;
}

export interface FaqsApi {
  listFaqs(locale: string): Promise<FAQItem[]>;
}

export interface ContactApi {
  /** Sends the message; success carries the backend's message for the toast. */
  sendMessage(message: ContactMessage): Promise<Result<null>>;
}

/** The company sizes come from the settings feature (GET /settings). */
export interface JoinUsApi {
  /** Sends a partner request; success carries the backend's message. */
  sendJoinRequest(request: JoinUsRequest): Promise<Result<null>>;
}

function isHomeHeroContent(value: unknown): value is {
  sub_title: string;
  title: string;
  description: string;
} {
  if (typeof value !== "object" || value === null) return false;
  const hero = value as Record<string, unknown>;
  return (
    typeof hero.sub_title === "string" &&
    typeof hero.title === "string" &&
    typeof hero.description === "string"
  );
}

async function getHeroContent(locale: string): Promise<HomeHeroContent> {
  const response = await publicSiteServerHttp.get<ApiEnvelope<unknown>>("/home", {
    headers: { "Accept-Language": locale },
  });
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    typeof response.data !== "object" ||
    response.data === null ||
    !isHomeHeroContent((response.data as Record<string, unknown>).hero)
  ) {
    throw new AppError("server");
  }
  const hero = (
    response.data as {
      hero: { sub_title: string; title: string; description: string };
    }
  ).hero;
  return {
    eyebrow: hero.sub_title,
    title: hero.title,
    description: hero.description,
  };
}

export const homeApi: HomeApi = { getHeroContent };

/** Success is body code 200 (201 accepted too); `data` is null. */
const isSuccessCode = (code: number) => code === 200 || code === 201;

function isFaq(value: unknown): value is {
  id: string | number;
  question: string;
  answer: string;
} {
  if (typeof value !== "object" || value === null) return false;
  const faq = value as Record<string, unknown>;
  return (
    (typeof faq.id === "string" ||
      (typeof faq.id === "number" && Number.isFinite(faq.id))) &&
    typeof faq.question === "string" &&
    typeof faq.answer === "string"
  );
}

async function listFaqs(locale: string): Promise<FAQItem[]> {
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>("/faqs", {
    headers: { "Accept-Language": locale },
  });
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !Array.isArray(response.data) ||
    !response.data.every(isFaq)
  ) {
    throw new AppError("server");
  }
  return response.data.map(({ id, question, answer }) => ({
    id: String(id),
    question,
    answer,
  }));
}

export const faqsApi: FaqsApi = { listFaqs };

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
