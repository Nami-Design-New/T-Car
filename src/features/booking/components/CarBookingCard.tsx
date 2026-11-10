"use client";

import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { usePaymentWindow } from "@/shared/hooks/usePaymentWindow";
import { useRouter } from "@/i18n/navigation";
import type { AppError } from "@/shared/lib/errors";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";
import { LazyAuthModal } from "@/features/auth";
import { LazyLicenseUploadDialog } from "@/features/account";

import { ICONS } from "@/shared/config/assets";
import type {
  BookingContext,
  BookingDetails,
  Order,
  PaymentChoice,
  BookingServiceSelection,
} from "@/features/orders";
import { ok, type Result } from "@/shared/lib/result";
const RiyalIcon = ICONS.riyal;

import { Button } from "@/shared/ui/Button";
import { Price } from "@/shared/ui/Price";
import { usePayOrder } from "../hooks/usePayOrder";
import { useCreateDraft } from "../hooks/useCreateDraft";

const BookingDailyModal = dynamic(() => import("./BookingDailyModal"), {
  ssr: false,
});
const BookingMonthlyModal = dynamic(() => import("./BookingMonthlyModal"), {
  ssr: false,
});
const BookingConfirmModal = dynamic(() => import("./BookingConfirmModal"), {
  ssr: false,
});
const PaymentMethodModal = dynamic(() => import("./PaymentMethodModal"), {
  ssr: false,
});
const BookingLoginRequiredModal = dynamic(
  () => import("./BookingLoginRequiredModal"),
  { ssr: false },
);

/**
 * One sheet at a time. A failed pay request keeps the payment sheet open with
 * the error; a gateway that reports failure shows "failed", then the sheet
 * again (the draft stays unpaid and can be paid again).
 */
type Flow =
  | { step: "closed" }
  | { step: "dates" }
  | { step: "confirm" }
  | { step: "payment"; error?: AppError }
  | { step: "success" }
  | { step: "failed" };

interface Props {
  carId: string;
  carName: string;
  carBrand: string;
  carYear: number;
  showroomLogo?: string;
  carImage: string;
  showroom: string;
  rating: number;
  /** API `lower_price`: the sale price, or 0 when there is no discount. */
  lowerPrice: number;
  /** API `max_price`: the regular price, struck through when discounted. */
  maxPrice: number;
  bookingContext: BookingContext;
  signedIn?: boolean;
  /** `false`: "Book now" asks for the driving license first. `null`/undefined: unknown, not blocked. */
  licenseUploaded?: boolean | null;
  selectedServices?: BookingServiceSelection[];
  selectedAddons?: { id: string; title: string; price: number }[];
}

export default function CarBookingCard({
  carId,
  carName,
  carBrand,
  carYear,
  showroomLogo,
  carImage,
  showroom,
  rating,
  lowerPrice,
  maxPrice,
  bookingContext,
  signedIn = true,
  licenseUploaded = null,
  selectedServices = [],
  selectedAddons = [],
}: Props) {
  const t = useTranslations("booking.card");
  // Same rule as the cars list: charge lower_price when set, else max_price.
  // The car-details read is made with the booking type, so for monthly these
  // are monthly prices.
  const pricePerDay = lowerPrice > 0 ? lowerPrice : maxPrice;
  const strikePrice =
    lowerPrice > 0 && maxPrice > lowerPrice ? maxPrice : undefined;
  const [flow, setFlow] = useState<Flow>({ step: "closed" });
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [hasLicense, setHasLicense] = useState(licenseUploaded !== false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const { step } = flow;
  const setStep = (next: "closed" | "dates" | "confirm" | "payment") => {
    if (next === "closed") {
      setBooking(null);
      setDraft(null);
    }
    setFlow({ step: next });
  };
  const { submitting, payOrder } = usePayOrder();
  const notify = useNotify();
  const router = useRouter();
  const { submitting: creatingDraft, createDraft } = useCreateDraft(carId);
  const errorMessage = useErrorMessage();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [draft, setDraft] = useState<Order | null>(null);
  const isPickupPointBooking =
    bookingContext.bookingType === "airport" ||
    bookingContext.bookingType === "station";
  // Airport and station bookings get their pickup point from the selected
  // airport/station. All other booking types still need the customer's map
  // location as well as the branch returned by the details read.
  const canBook = Boolean(
    bookingContext.branch &&
      (isPickupPointBooking || bookingContext.location),
  );

  const handleDatesConfirmed = async (
    details: BookingDetails,
  ): Promise<Result<void>> => {
    const result = await createDraft(bookingContext, details, selectedServices);
    if (!result.ok) return result;
    setBooking(details);
    setDraft(result.data);
    setStep("confirm");
    return ok(undefined);
  };

  // R10: the gateway tab reports back; the bookings list (drafts are never
  // listed there) is the confirmation, P6.
  const { watch, paying } = usePaymentWindow((outcome) => {
    if (outcome === "success") setFlow({ step: "success" });
    else if (outcome === "failed") setFlow({ step: "failed" });
    // Closed without an outcome: back to the sheet, nothing to report.
  });

  const handlePay = async (choice: PaymentChoice) => {
    if (!draft || submitting || paying) return;

    // Opened inside the click, before the request, so it is not blocked as a
    // pop-up. Only a gateway method can need it. No `noopener`: the payment
    // page reports back through `window.opener`.
    const tab = choice.paymentMethodId ? window.open("", "_blank") : null;
    const result = await payOrder(draft.id, choice);
    if (!result.ok) {
      tab?.close();
      // R5: the backend 422 message is a toast; the sheet stays open.
      if (result.error.kind === "validation" && result.error.serverMessage) {
        notify.error(result.error.serverMessage);
        setFlow({ step: "payment" });
        return;
      }
      setFlow({ step: "payment", error: result.error });
      return;
    }
    if (result.message) notify.success(result.message);
    if (result.data.kind === "paid") {
      tab?.close();
      setFlow({ step: "success" });
      return;
    }
    const { payment } = result.data;
    if (!tab) {
      // Pop-up blocked: pay in this tab.
      window.location.assign(payment.paymentUrl);
      return;
    }
    tab.location.href = payment.paymentUrl;
    watch(tab, payment);
    setFlow({ step: "payment" });
  };

  const handleBookingSuccess = () => router.push("/account/bookings");

  const handleBookNow = () => {
    if (!signedIn) {
      setLoginRequiredOpen(true);
      return;
    }
    if (!hasLicense) {
      setLicenseOpen(true);
      return;
    }
    setStep("dates");
  };

  const handleLicenseUploaded = () => {
    setHasLicense(true);
    setLicenseOpen(false);
    setStep("dates");
  };

  return (
    <aside className="border-stroke-light bg-surface-elevated rounded-xl border p-6 shadow-[0_2px_8px_rgba(30,30,30,0.06)] max-lg:flex max-lg:items-end max-lg:gap-4 max-lg:p-4">
      <div className="mb-4.5 flex flex-col items-center gap-2 max-lg:mb-0 max-lg:shrink-0 md:flex-row">
        <div className="flex items-end gap-2">
          <h2 className="m-0 flex items-center gap-1.5 leading-none">
            <Price amountClassName="text-action-primary" amount={pricePerDay} />
          </h2>
          <small className="text-text-subtle text-base">
            {t(
              bookingContext.bookingType === "monthly" ? "perMonth" : "perDay",
            )}
          </small>
        </div>
        <div className="flex items-center gap-2">
          <p className="m-0">{t("insteadOf")}</p>
          {strikePrice !== undefined && (
            <span className="block">
              <Price amount={strikePrice} strike={true} />
            </span>
          )}
        </div>
      </div>

      <Button
        type="button"
        className="w-full max-lg:flex-1"
        size="lg"
        onClick={handleBookNow}
        disabled={!canBook}
      >
        {t("bookNow")}
      </Button>

      {!canBook && (
        <p className="text-status-error mt-2 text-center text-sm">
          {t("chooseLocation")}
        </p>
      )}

      <BookingLoginRequiredModal
        open={loginRequiredOpen}
        onClose={() => setLoginRequiredOpen(false)}
        onLogin={() => {
          setLoginRequiredOpen(false);
          setAuthOpen(true);
        }}
      />

      {authOpen && <LazyAuthModal show onHide={() => setAuthOpen(false)} />}

      {licenseOpen && (
        <LazyLicenseUploadDialog
          open
          onClose={() => setLicenseOpen(false)}
          onUploaded={handleLicenseUploaded}
        />
      )}

      {step === "dates" && bookingContext.bookingType === "monthly" && (
        <BookingMonthlyModal
          open
          onClose={() => setStep("closed")}
          loading={creatingDraft}
          pricePerDay={pricePerDay}
          onConfirm={handleDatesConfirmed}
          availability={{
            carId,
            branchId: bookingContext.branch!.id,
            deliveryType: bookingContext.deliveryType ?? "from_branch",
            branch: bookingContext.branch!,
            showroom,
            showroomLogo,
            allowedDistanceKm: bookingContext.allowedDistanceKm,
          }}
        />
      )}

      {step === "dates" && bookingContext.bookingType !== "monthly" && (
        <BookingDailyModal
          open
          onClose={() => setStep("closed")}
          loading={creatingDraft}
          pricePerDay={pricePerDay}
          onConfirm={handleDatesConfirmed}
          availability={{
            carId,
            branchId: bookingContext.branch!.id,
            bookingType: bookingContext.bookingType,
            deliveryType: bookingContext.deliveryType,
            branch: bookingContext.branch!,
            showroom,
            showroomLogo,
            allowedDistanceKm: bookingContext.allowedDistanceKm,
            ...(bookingContext.bookingType === "airport" ||
            bookingContext.bookingType === "station"
              ? {
                  pickupPoint: {
                    kind: bookingContext.bookingType,
                    hasBranch: bookingContext.pickupPointHasBranch === true,
                  },
                }
              : {}),
          }}
        />
      )}

      {booking && draft && step === "confirm" && (
        <BookingConfirmModal
          open
          onClose={() => setStep("closed")}
          onBack={() => setStep("dates")}
          onContinue={() => setStep("payment")}
          carName={carName}
          carBrand={carBrand}
          carYear={carYear}
          showroomLogo={showroomLogo}
          carImage={carImage}
          showroom={showroom}
          rating={rating}
          booking={booking}
          draft={draft}
          selectedAddons={selectedAddons}
        />
      )}

      {draft && step === "payment" && (
        <PaymentMethodModal
          open
          onClose={() => {
            if (!submitting) setStep("closed");
          }}
          orderId={draft.id}
          amount={draft.finalPrice}
          onConfirm={handlePay}
          // The draft stays on the server unpaid; after topping up, the
          // customer books again (a new draft replaces it, §3.2).
          onTopUp={() => router.push("/account/wallet")}
          loading={submitting || paying}
          loadingLabel={paying ? t("waitingPayment") : undefined}
          error={
            flow.step === "payment" && flow.error
              ? errorMessage(flow.error)
              : undefined
          }
        />
      )}

      <ResultDialog
        open={step === "failed"}
        status="error"
        description={t("paymentFailed")}
        autoCloseMs={3000}
        onClose={() => setFlow({ step: draft ? "payment" : "closed" })}
      />

      <ResultDialog
        open={step === "success"}
        status="success"
        description={t("successDescription")}
        autoCloseMs={1500}
        onClose={handleBookingSuccess}
      />
    </aside>
  );
}
