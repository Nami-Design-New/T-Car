"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import {
  FiArrowRight,
  FiMoreVertical,
  FiEdit2,
  FiCalendar,
  FiX,
} from "react-icons/fi";

import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import {
  bookingTabFor,
  bookingsListPath,
  cancellationFee,
  isActiveBooking,
  toEditRequest,
  type BookingDetailsView,
  type BookingEditRequest,
} from "../model";
import { useBookingActions } from "../hooks/useBookingActions";
const ExtendDurationModal = dynamic(() => import("./ExtendDurationModal"), {
  ssr: false,
});
const EditDailyBookingModal = dynamic(() => import("./EditDailyBookingModal"), {
  ssr: false,
});
const CancelBookingModal = dynamic(() => import("./CancelBookingModal"), {
  ssr: false,
});

interface Props {
  booking: BookingDetailsView;
}

type ResultKind = "extended" | "editRequested" | "cancelled";

/** One dialog at a time. A failed extend or cancel keeps its dialog open with the error. */
type HeaderFlow =
  | { step: "idle" }
  | { step: "extend"; error?: AppError }
  | { step: "edit" }
  | { step: "cancel"; error?: AppError }
  | { step: "result"; kind: ResultKind; error?: AppError }; // no error means success

const RESULT_KEYS: Record<
  ResultKind,
  { description: string; failure: string }
> = {
  extended: { description: "empty", failure: "extendedFailure" },
  editRequested: {
    description: "editRequestedDescription",
    failure: "editRequestedFailure",
  },
  cancelled: { description: "empty", failure: "cancelledFailure" },
};

export default function BookingDetailsHeader({ booking }: Props) {
  const t = useTranslations("myBookings.details");
  const [showActions, setShowActions] = useState(false);
  const [flow, setFlow] = useState<HeaderFlow>({ step: "idle" });
  const { submitting, extend, requestEdit, cancel } = useBookingActions(
    booking.id,
  );
  const errorMessage = useErrorMessage();

  const close = useCallback(() => setFlow({ step: "idle" }), []);
  const open = (step: "extend" | "edit" | "cancel") => {
    setShowActions(false);
    setFlow({ step });
  };

  const isActive = isActiveBooking(booking.status);
  const fee = cancellationFee(booking.total, booking.cancellationPercent);

  const handleExtend = async (days: number) => {
    const result = await extend(days);
    setFlow(
      result.ok
        ? { step: "result", kind: "extended" }
        : { step: "extend", error: result.error },
    );
  };

  const handleEdit = async (request: BookingEditRequest) => {
    const result = await requestEdit(request);
    if (result.ok) setFlow({ step: "result", kind: "editRequested" });
    return result;
  };

  const handleCancel = async () => {
    if (submitting) return;
    const result = await cancel();
    setFlow(
      result.ok
        ? { step: "result", kind: "cancelled" }
        : { step: "cancel", error: result.error },
    );
  };

  return (
    <div className="flex items-center gap-3.5">
      {/* Back */}
      <Link
        href={bookingsListPath(bookingTabFor(booking.status))}
        className="grid size-9 shrink-0 place-items-center rounded-sm border border-stroke-light text-text-primary transition hover:border-action-primary hover:bg-action-primary hover:text-white focus-visible:outline-2 focus-visible:outline-action-primary"
        aria-label={t("back")}
      >
        <FiArrowRight />
      </Link>

      {/* Title */}
      <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
        <h1 className="m-0 text-base font-bold text-text-primary">
          {t("title")}
        </h1>

        <span className="text-[0.82rem] text-text-subtle">
          #{booking.reference}
        </span>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="relative shrink-0">
          {/* Trigger */}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-sm border border-stroke-light bg-surface-elevated text-text-primary transition hover:border-action-primary hover:bg-action-primary hover:text-white focus-visible:outline-2 focus-visible:outline-action-primary"
            onClick={() => setShowActions((prev) => !prev)}
            aria-label={t("actions")}
            aria-expanded={showActions}
          >
            <FiMoreVertical />
          </button>

          {/* Menu */}
          {showActions && (
            <div className="absolute top-[calc(100%+8px)] start-0 z-20 min-w-[150px] rounded-sm border border-stroke-light bg-surface-elevated p-1.5 shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm border-0 bg-transparent px-2.5 py-2 text-end text-xs text-text-primary transition hover:bg-surface-on-background"
                onClick={() => open("edit")}
              >
                <FiEdit2 />
                <span>{t("requestEdit")}</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm border-0 bg-transparent px-2.5 py-2 text-end text-xs text-text-primary transition hover:bg-surface-on-background"
                onClick={() => open("extend")}
              >
                <FiCalendar />
                <span>{t("extend")}</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm border-0 bg-transparent px-2.5 py-2 text-end text-xs text-status-error transition hover:bg-status-error-background"
                onClick={() => open("cancel")}
              >
                <FiX />
                <span>{t("cancel")}</span>
              </button>
            </div>
          )}
        </div>
      )}

      <ExtendDurationModal
        open={flow.step === "extend"}
        onClose={() => {
          if (!submitting) close();
        }}
        onConfirm={handleExtend}
        currentDays={booking.days}
        pricePerDay={booking.pricePerDay}
        loading={submitting}
        error={
          flow.step === "extend" && flow.error
            ? errorMessage(flow.error)
            : undefined
        }
      />

      <EditDailyBookingModal
        open={flow.step === "edit"}
        onClose={close}
        pricePerDay={booking.pricePerDay}
        initialDetails={toEditRequest(booking)}
        onSubmit={handleEdit}
        loading={submitting}
      />

      <CancelBookingModal
        open={flow.step === "cancel"}
        onClose={() => {
          if (!submitting) close();
        }}
        onConfirm={handleCancel}
        bookingAmount={booking.total}
        cancellationPercent={booking.cancellationPercent}
        cancellationFee={fee}
        loading={submitting}
        error={
          flow.step === "cancel" && flow.error
            ? errorMessage(flow.error)
            : undefined
        }
      />

      {flow.step === "result" && (
        <ResultDialog
          open
          status={flow.error ? "error" : "success"}
          description={
            flow.error
              ? errorMessage(flow.error)
              : t(RESULT_KEYS[flow.kind].description)
          }
          onClose={close}
        />
      )}
    </div>
  );
}
