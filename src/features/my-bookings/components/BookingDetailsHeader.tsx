"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useRouter } from "@/i18n/navigation";
import { FiMoreHorizontal, FiEdit2, FiCalendar, FiX } from "react-icons/fi";

import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import {
  canCancel,
  canExtend,
  canModify,
  type BookingEditRequest,
  type CancelQuote,
  type Order,
} from "@/features/orders";
import { bookingTabFor, bookingsListPath, toEditRequest } from "../model";
import { useBookingActions } from "../hooks/useBookingActions";
import { BackButton } from "@/shared/ui/BackButton";
import { Menu } from "@/shared/ui/Menu";
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
  booking: Order;
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
  const router = useRouter();
  const [flow, setFlow] = useState<HeaderFlow>({ step: "idle" });
  const [cancelQuote, setCancelQuote] = useState<CancelQuote>();
  const { submitting, extend, requestEdit, getCancelQuote, cancel } =
    useBookingActions(booking.id);
  const errorMessage = useErrorMessage();

  const close = useCallback(() => setFlow({ step: "idle" }), []);
  const open = (step: "extend" | "edit" | "cancel") => setFlow({ step });

  const openCancel = async () => {
    setCancelQuote(undefined);
    setFlow({ step: "cancel" });
    const result = await getCancelQuote();
    if (!result.ok) setFlow({ step: "cancel", error: result.error });
    else setCancelQuote(result.data);
  };

  const allowEdit = canModify(booking);
  const allowExtend = canExtend(booking);
  const allowCancel = canCancel(booking);
  const hasActions = allowEdit || allowExtend || allowCancel;

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
    if (result.ok) {
      router.refresh();
      setFlow({ step: "result", kind: "cancelled" });
    } else {
      setFlow({ step: "cancel", error: result.error });
    }
  };

  return (
    <div className="flex items-center gap-3.5">
      {/* Back to the list this booking belongs to */}
      <BackButton
        aria-label={t("back")}
        onClick={() =>
          router.push(bookingsListPath(bookingTabFor(booking.status)))
        }
      />

      {/* Title */}
      <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
        <h1 className="text-text-primary m-0 text-base font-bold">
          {t("title")}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-text-subtle text-[0.82rem]">
          #{booking.orderNumber}
        </span>

        {/* Actions */}
        {hasActions && (
          <Menu.Root>
            <Menu.Trigger asChild>
              <button
                type="button"
                className="border-stroke-light bg-surface-elevated text-text-primary hover:border-action-primary hover:bg-action-primary focus-visible:outline-action-primary data-[state=open]:border-action-primary data-[state=open]:bg-action-primary grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border transition hover:text-white focus-visible:outline-2 data-[state=open]:text-white"
                aria-label={t("actions")}
              >
                <FiMoreHorizontal aria-hidden="true" />
              </button>
            </Menu.Trigger>

            <Menu.Content className="min-w-[150px]">
              {allowEdit && (
                <Menu.Item onSelect={() => open("edit")}>
                  <FiEdit2 aria-hidden="true" />
                  {t("requestEdit")}
                </Menu.Item>
              )}
              {allowExtend && (
                <Menu.Item onSelect={() => open("extend")}>
                  <FiCalendar aria-hidden="true" />
                  {t("extend")}
                </Menu.Item>
              )}
              {allowCancel && (
                <Menu.Item tone="danger" onSelect={() => void openCancel()}>
                  <FiX aria-hidden="true" />
                  {t("cancel")}
                </Menu.Item>
              )}
            </Menu.Content>
          </Menu.Root>
        )}
      </div>

      <ExtendDurationModal
        open={flow.step === "extend"}
        onClose={() => {
          if (!submitting) close();
        }}
        onConfirm={handleExtend}
        currentDays={booking.count}
        pricePerDay={booking.carPrice}
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
        pricePerDay={booking.carPrice}
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
        bookingAmount={booking.finalPrice}
        quote={cancelQuote}
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
