import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import { fail, fromActionResult, ok, toActionResult } from "./result";

describe("Result across the Server Action boundary", () => {
  it("carries the success message, and omits it when there is none", () => {
    expect(toActionResult(ok({ id: 1 }, "Saved."))).toEqual({
      ok: true,
      data: { id: 1 },
      message: "Saved.",
    });
    expect(ok(1)).toEqual({ ok: true, data: 1 });
    expect("message" in ok(1)).toBe(false);
  });

  it("restores an AppError with the backend message", () => {
    const error = new AppError("validation", undefined, 422, undefined, {
      serverMessage: "The name field is required.",
    });
    const sent = JSON.parse(JSON.stringify(toActionResult(fail(error))));
    const restored = fromActionResult(sent);

    expect(restored.ok).toBe(false);
    if (restored.ok) return;
    expect(restored.error).toBeInstanceOf(AppError);
    expect(restored.error.kind).toBe("validation");
    expect(restored.error.serverMessage).toBe("The name field is required.");
  });
});
