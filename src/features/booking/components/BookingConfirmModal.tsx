"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/shared/lib/cn";
import { formatAmount } from "@/shared/lib/format";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import { FormCheckbox } from "@/shared/ui/Form";
import { Price } from "@/shared/ui/Price";
import { useFieldErrorMessage } from "@/shared/hooks/useErrorMessage";
import type { BookingDetails, Order } from "@/features/orders";
import { bookingTermsSchema, type BookingTermsValues } from "../validation";
import Image from "next/image";
import { BackButton } from "@/shared/ui/BackButton";
import { ICONS } from "@/shared/config/assets";
import { HtmlContent } from "@/shared/ui/HtmlContent";
import { PriceRow } from "@/shared/ui/PriceRow";

const timeline = ICONS.timeline;

interface Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onContinue: () => void;
  carName: string;
  carBrand: string;
  carYear: number;
  showroomLogo?: string;
  carImage: string;
  showroom: string;
  rating: number;
  booking: BookingDetails;
  draft?: Order;
  selectedAddons?: { id: string; title: string; price: number }[];
}

export default function BookingConfirmModal({
  open,
  onClose,
  onBack,
  onContinue,
  carName,
  carBrand,
  carYear,
  showroomLogo,
  carImage,
  showroom,
  rating,
  booking,
  draft,
  selectedAddons = [],
}: Props) {
  const t = useTranslations("booking.confirm");
  const locale = useLocale();
  const fieldError = useFieldErrorMessage();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingTermsValues>({
    resolver: zodResolver(bookingTermsSchema),
    mode: "onSubmit",
  });
  const submit = handleSubmit(() => onContinue());
  const carPrice = draft?.carPrice ?? booking.pricePerDay;
  const rentalCount = draft?.count ?? booking.days;
  const rentalPrice = draft?.price ?? booking.subtotal;
  const deliveryFee = draft?.deliveryFee ?? 0;
  const serviceFee = draft?.serviceFee ?? 0;
  const completionFee = draft?.completionFee ?? 0;
  const discount = draft?.discount ?? 0;
  const additionalServicesCost = draft?.additionalServicesCost ?? 0;
  const totalBeforeTax = draft?.totalPrice ?? booking.subtotal;
  const taxValue = draft?.taxValue ?? booking.vat;
  const finalPrice = draft?.finalPrice ?? booking.total;
  const pickupAddress =
    draft?.pickupLocation.address ??
    draft?.branch.address ??
    booking.pickupAddress ??
    showroom;
  const dropoffAddress =
    draft?.deliveryLocation.address ??
    draft?.branch.address ??
    booking.dropoffAddress ??
    showroom;
  const formatDateTime = (date: Date) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  const pickupTime = draft
    ? formatDateTime(new Date(draft.pickupAt))
    : formatDateTime(booking.startDate);
  const dropoffTime = draft
    ? formatDateTime(new Date(draft.returnAt))
    : formatDateTime(booking.endDate);
  return (
    <Dialog open={open} onClose={onClose} size="lg" label={t("dialogLabel")}>
      <Dialog.Header>
        <div className="flex  items-center gap-2">
          <BackButton onClick={onBack} />
          <Dialog.Title>{t("title")}</Dialog.Title>
        </div>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body className="min-h-0 flex-1 overflow-hidden">
        <div className="rounded-xl">
          <form
            onSubmit={submit}
            noValidate
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl px-2.5 bg-[#EFF6FE] py-6 sm:px-3">
              <div className=" flex items-center gap-3 rounded-md mb-4 bg-surface-card-primary px-3 py-3 shadow-[0_4px_14px_rgba(31,127,250,0.04)]">
                <div className="relative size-15 shrink-0 overflow-hidden rounded-md bg-surface-on-background">
                  <Image src={carImage} alt={carName} fill sizes="70px" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="m-0 mb-1 text-sm font-bold text-text-primary">
                    {carBrand} {carName}
                  </h4>
                  <span className="mb-1 flex items-center gap-1 text-base text-text-subtle">
                    {showroomLogo ? (
                      <Image
                        src={showroomLogo}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0 object-contain"
                        aria-hidden="true"
                      />
                    ) : null}
                    {showroom}
                  </span>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Price
                      amount={carPrice}
                      size="sm"
                      suffix={t(
                        (draft?.bookingType ?? booking.bookingType) ===
                          "monthly"
                          ? "perMonth"
                          : "perDay",
                      )}
                      amountClassName="text-base font-bold text-action-primary"
                    />
                  </div>
                </div>

                <span className="shrink-0 self-start rounded-sm bg-surface-card-primary px-3 py-2 text-[11px] font-semibold leading-none text-action-primary">
                  {carYear}
                </span>
              </div>

              <div className="relative mb-4 rounded-lg bg-surface-elevated px-4 py-3 ps-10 shadow-[0_4px_14px_rgba(30,30,30,0.03)]">
                <span
                  className="pointer-events-none absolute inset-s-2.5 top-4 flex "
                  aria-hidden="true"
                >
                  <Image
                    src={timeline.src}
                    alt="Timeline"
                    width={15}
                    height={130}
                  />
                </span>
                {[
                  [t("pickupAddress"), pickupAddress],
                  [t("dropoffAddress"), dropoffAddress],
                ].map(([label, value], index, rows) => (
                  <div
                    className={cn(
                      "flex min-h-14.5 items-center justify-between gap-3 border-b-2 border-t-0 border-x-0 border-dotted border-stroke-light py-2 text-start last:border-b-0",
                      index < 2 &&
                        "min-h-16.5 flex-col items-stretch justify-center gap-1",
                      index === rows.length - 1 && "min-h-10.5",
                    )}
                    key={label}
                  >
                    <span className="text-sm text-text-subtle">{label}</span>
                    <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-md font-medium text-text-primary">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-4 flex flex-col gap-3 rounded-lg bg-surface-elevated px-4 py-4">
                <DateValue label={t("pickupTime")} value={pickupTime} />
                <DateValue label={t("dropoffTime")} value={dropoffTime} />
                <DateValue
                  label={t("additionalDetails")}
                  value={booking.notes || t("notProvided")}
                />
              </div>

              <div className="mb-4 rounded-lg bg-surface-elevated px-4 py-4 shadow-[0_4px_14px_rgba(30,30,30,0.03)]">
                <h3 className="mb-2.5 border-b border-stroke-light pb-2 text-base font-bold text-text-primary">
                  {t("priceDetails")}
                </h3>

                <div className="flex flex-col gap-0">
                  <PriceRow
                    label={t("dailyPrice")}
                    amount={rentalPrice}
                    hint={`${rentalCount} × ${formatAmount(carPrice)}`}
                  />
                  {deliveryFee > 0 && (
                    <PriceRow label={t("deliveryFee")} amount={deliveryFee} />
                  )}
                  {serviceFee > 0 && (
                    <PriceRow label={t("serviceFee")} amount={serviceFee} />
                  )}
                  {completionFee > 0 && (
                    <PriceRow
                      label={t("completionFee")}
                      amount={completionFee}
                    />
                  )}
                  {discount > 0 && (
                    <PriceRow label={t("discount")} amount={discount} />
                  )}
                  {additionalServicesCost > 0 && (
                    <PriceRow
                      label={t("additionalServices")}
                      amount={additionalServicesCost}
                    />
                  )}
                  <PriceRow
                    label={t("totalBeforeTax")}
                    amount={totalBeforeTax}
                  />
                  {taxValue > 0 && (
                    <PriceRow
                      label={t("tax")}
                      amount={taxValue}
                      hint={
                        draft?.taxRateType === "percent"
                          ? `${formatAmount(draft.taxRate)}%`
                          : undefined
                      }
                    />
                  )}
                  <PriceRow label={t("total")} amount={finalPrice} total />
                </div>
              </div>

              <div className="mb-0 rounded-lg bg-surface-elevated px-4 py-4 shadow-[0_4px_14px_rgba(30,30,30,0.03)]">
                <h3 className="mb-2.5 border-b border-stroke-light pb-2 text-base font-bold text-text-primary">
                  {t("termsTitle")}
                </h3>

                {selectedAddons.length > 0 && (
                  <div className="mb-4 rounded-md bg-surface-card-primary p-3">
                    <h4 className="mb-2 text-sm font-bold text-text-primary">
                      {t("selectedAddons")}
                    </h4>
                    <ul className="m-0 list-disc ps-4 text-sm text-text-primary">
                      {selectedAddons.map((addon) => (
                        <li key={addon.id}>{addon.title}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {draft?.terms ? (
                  <HtmlContent
                    html={draft.terms}
                    className="mb-3 text-md leading-[1.7] text-text-primary"
                  />
                ) : (
                  <ul className="mb-3 list-disc ps-4.5 flex flex-col gap-3 text-md leading-[1.7] text-text-primary">
                    <li>{t("terms.license")}</li>
                    <li>{t("terms.identity")}</li>
                    <li>{t("terms.refundable")}</li>
                    <li>{t("terms.agree")}</li>
                  </ul>
                )}

                <FormCheckbox
                  id="booking-terms"
                  label={t("eligibility")}
                  required
                  error={fieldError(errors.termsAccepted?.message)}
                  className="text-md leading-normal text-text-primary"
                  {...register("termsAccepted")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 rounded-xl border-t border-stroke-light bg-surface-elevated p-2.5">
              <Button
                type="submit"
                className="h-10.5 w-full rounded-sm text-md"
              >
                {t("continuePayment")}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Body>
    </Dialog>
  );
}

function DateValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-text-primary border-stroke-light flex items-start gap-3 border-x-0 border-t-0 border-b-2 border-dashed pb-2 text-sm leading-relaxed last:border-b-0">
      <div className="flex min-w-0 flex-col gap-3">
        <span className="text-text-subtle text-sm font-normal">{label}</span>
        <span className="text-text-primary text-base font-medium">{value}</span>
      </div>
    </div>
  );
}
