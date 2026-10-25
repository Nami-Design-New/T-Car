"use client";

import { useState } from "react";
import BookingModal from "@/components/modals/BookingModal";
import BookingMonthlyModal from "@/components/modals/BookingMonthlyModal";

export default function BookingModalPreviewPage() {
  const [monthly, setMonthly] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[10002] flex justify-center gap-2 bg-white/95 p-3 shadow-sm">
        <button
          type="button"
          className="rounded-md bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-action"
          onClick={() => setMonthly(false)}
        >
          Daily booking
        </button>
        <button
          type="button"
          className="rounded-md border border-action-primary px-4 py-2 text-sm font-semibold text-action-primary"
          onClick={() => setMonthly(true)}
        >
          Monthly booking
        </button>
      </div>
      {monthly ? (
        <BookingMonthlyModal
          open
          onClose={() => setMonthly(false)}
          pricePerDay={500}
          modal={false}
          onConfirm={() => undefined}
        />
      ) : (
        <BookingModal
          open
          onClose={() => undefined}
          pricePerDay={500}
          modal={false}
          onConfirm={() => undefined}
        />
      )}
    </>
  );
}
