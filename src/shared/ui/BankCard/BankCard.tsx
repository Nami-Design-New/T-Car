"use client";

import { createContext, useContext, type ReactNode } from "react";
import Image from "next/image";
import { PiBank } from "react-icons/pi";
import { cn } from "@/shared/lib/cn";

export type BankCardVariant = "option" | "listed";

export interface Props {
  /**
   * `option`: a card to pick (e.g. a withdrawal account), with a hover border.
   * `listed`: a dashed card in a managed list, usually with `BankCard.Actions`.
   */
  variant?: BankCardVariant;
  /** Makes the whole card one button. Do not combine with `Actions`. */
  onSelect?: () => void;
  className?: string;
  children: ReactNode;
}

const VariantContext = createContext<BankCardVariant>("listed");

const rootClasses: Record<BankCardVariant, string> = {
  option: "rounded-md border border-transparent bg-surface-on-background p-3.5",
  listed:
    "rounded-md border border-dashed border-stroke-light bg-surface-on-background p-4",
};

const selectableClasses =
  "w-full cursor-pointer text-start transition-colors hover:border-action-primary focus-visible:border-action-primary focus-visible:outline-none";

/** A bank account card (doc 4): bank, masked number, and optional actions. */
function BankCardRoot({
  variant = "listed",
  onSelect,
  className,
  children,
}: Props) {
  const classes = cn(
    "flex items-center gap-3",
    rootClasses[variant],
    onSelect && selectableClasses,
    className,
  );

  return (
    <VariantContext.Provider value={variant}>
      {onSelect ? (
        <button type="button" className={classes} onClick={onSelect}>
          {children}
        </button>
      ) : (
        <div className={classes}>{children}</div>
      )}
    </VariantContext.Provider>
  );
}

/** Stacks `Bank` and `Number`; takes the space left by `Actions`. */
function Details({ children }: { children: ReactNode }) {
  const variant = useContext(VariantContext);
  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 flex-col items-start",
        variant === "option" ? "gap-2" : "gap-3",
      )}
    >
      {children}
    </span>
  );
}

interface BankProps {
  name: string;
  /** An absolute image URL; a bank icon shows without one. */
  logo?: string;
}

function Bank({ name, logo }: BankProps) {
  const option = useContext(VariantContext) === "option";
  return (
    <span
      className={cn(
        "text-text-primary flex items-center gap-2",
        option ? "text-[13px] font-bold" : "text-xs leading-4.25 font-semibold",
      )}
    >
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={option ? 28 : 45}
          height={option ? 28 : 20}
          className={option ? "object-contain" : "object-cover"}
        />
      ) : (
        <PiBank
          className={cn(
            "text-status-success shrink-0",
            option ? "text-[22px]" : "text-xl",
          )}
          aria-hidden="true"
        />
      )}
      <span>{name}</span>
    </span>
  );
}

/** The masked account number; always left-to-right. */
function AccountNumber({ children }: { children: ReactNode }) {
  const option = useContext(VariantContext) === "option";
  return (
    <span
      className={cn(
        "text-text-primary",
        option
          ? "text-[15px] font-bold tracking-[1px]"
          : "text-base leading-5.75",
      )}
      dir="ltr"
    >
      {children}
    </span>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <span className="flex shrink-0 items-center gap-2">{children}</span>;
}

interface ActionProps {
  /** The accessible name, e.g. "Edit Al Rajhi". */
  label: string;
  onClick: () => void;
  /** A 20px icon. */
  children: ReactNode;
}

function Action({ label, onClick, children }: ActionProps) {
  return (
    <button
      type="button"
      className="bg-surface-background grid size-7 shrink-0 place-items-center rounded-md border-0 p-0 transition-shadow hover:shadow-[0_0_0_1px_var(--color-stroke-light)] focus-visible:shadow-[0_0_0_1px_var(--color-stroke-light)] focus-visible:outline-none"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export const BankCard = Object.assign(BankCardRoot, {
  Details,
  Bank,
  Number: AccountNumber,
  Actions,
  Action,
});
