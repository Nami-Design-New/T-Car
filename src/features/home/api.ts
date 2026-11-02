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
  HomeContent,
  FAQItem,
  JoinUsRequest,
} from "./model";

export interface HomeApi {
  getContent(locale: string): Promise<HomeContent>;
}

interface HomeSectionDto {
  sub_title: string;
  title: string;
  description: string;
}

interface HomeContentDto {
  hero: HomeSectionDto;
  partners: HomeSectionDto;
  support: HomeSectionDto;
  apps: HomeSectionDto;
  contacts: HomeSectionDto & {
    form_title: string;
    form_description: string;
  };
  join_us: { title: string; description: string; image: string };
  footer: { text: string };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHomeSectionContent(value: unknown): value is HomeSectionDto {
  if (!isRecord(value)) return false;
  const section = value;
  return (
    typeof section.sub_title === "string" &&
    typeof section.title === "string" &&
    typeof section.description === "string"
  );
}

function isHomeContentData(value: unknown): value is HomeContentDto {
  if (!isRecord(value)) return false;
  if (
    !isHomeSectionContent(value.hero) ||
    !isHomeSectionContent(value.partners) ||
    !isHomeSectionContent(value.support) ||
    !isHomeSectionContent(value.apps) ||
    !isRecord(value.contacts) ||
    !isHomeSectionContent(value.contacts) ||
    typeof value.contacts.form_title !== "string" ||
    typeof value.contacts.form_description !== "string" ||
    !isRecord(value.join_us) ||
    typeof value.join_us.title !== "string" ||
    typeof value.join_us.description !== "string" ||
    typeof value.join_us.image !== "string" ||
    !isRecord(value.footer) ||
    typeof value.footer.text !== "string"
  ) {
    return false;
  }
  return true;
}

function mapHomeSection(section: HomeSectionDto) {
  return {
    eyebrow: section.sub_title,
    title: section.title,
    description: section.description,
  };
}

async function getContent(locale: string): Promise<HomeContent> {
  const response = await publicSiteServerHttp.get<ApiEnvelope<unknown>>("/home", {
    headers: { "Accept-Language": locale },
  });
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isHomeContentData(response.data)
  ) {
    throw new AppError("server");
  }
  const { data } = response;
  return {
    hero: mapHomeSection(data.hero),
    partners: mapHomeSection(data.partners),
    support: mapHomeSection(data.support),
    apps: mapHomeSection(data.apps),
    contacts: {
      ...mapHomeSection(data.contacts),
      formTitle: data.contacts.form_title,
      formDescription: data.contacts.form_description,
    },
    joinUs: {
      title: data.join_us.title,
      description: data.join_us.description,
      image: data.join_us.image,
    },
    footer: { text: data.footer.text },
  };
}

export const homeApi: HomeApi = { getContent };

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
