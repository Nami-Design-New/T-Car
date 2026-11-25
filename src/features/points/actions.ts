"use server";

import { auth } from "@/auth";
import { AppError } from "@/shared/lib/errors";
import type { Page } from "@/shared/lib/pagination";
import { reportError } from "@/shared/lib/report";
import {
  fail,
  ok,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import { pointsApi } from "./api";
import type { PointsFilter, PointsTransaction } from "./model";

/** Loads one points-history page for the shared infinite list. */
export async function getPointsPageAction(
  page: number,
  filter: PointsFilter,
): Promise<ActionResult<Page<PointsTransaction>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      (filter !== "all" && filter !== "earned" && filter !== "spent")
    ) {
      throw new AppError("validation");
    }
    return toActionResult(
      ok((await pointsApi.getPoints(session.user.id, page, filter)).page),
    );
  } catch (error) {
    reportError(error, { scope: "points.history" });
    return toActionResult(fail(error));
  }
}
