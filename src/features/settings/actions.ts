"use server";

import { reportError } from "@/shared/lib/report";
import {
  fail,
  ok,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import type { AppSettings } from "./model";
import { getSettings } from "./queries";

/** The app settings for client components (GET /settings is public). */
export async function getSettingsAction(): Promise<ActionResult<AppSettings>> {
  try {
    return toActionResult(ok(await getSettings()));
  } catch (error) {
    reportError(error, { scope: "settings.read" });
    return toActionResult(fail(error));
  }
}
