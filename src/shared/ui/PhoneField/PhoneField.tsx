"use client";

import Image from "next/image";
import * as Popover from "@radix-ui/react-popover";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiGlobe,
  FiSearch,
} from "react-icons/fi";
import { cn } from "@/shared/lib/cn";
import { reportError } from "@/shared/lib/report";
import type {
  CountryPage,
  CountryPageRequest,
  PhoneCountry,
  PhoneFieldValue,
} from "@/shared/lib/phone";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { Button } from "@/shared/ui/Button";

export interface PhoneFieldProps {
  value?: PhoneFieldValue;
  defaultValue?: PhoneFieldValue;
  onChange?: (value: PhoneFieldValue) => void;
  loadCountries: (request: CountryPageRequest) => Promise<CountryPage>;
  onBlur?: () => void;
  disabled?: boolean;
  searchPlaceholder?: string;
  inputAriaLabel?: string;
  label?: string;
  required?: boolean;
  /** Already translated; announced and linked to the input. */
  error?: string;
  className?: string;
  inputClassName?: string;
  countryTriggerClassName?: string;
  dropdownClassName?: string;
}

// Small mock pages keep the paginated path visible before real API integration.
const PAGE_SIZE = 100;

export function PhoneField({
  value,
  defaultValue = { countryCode: "+966", phone: "" },
  onChange,
  loadCountries,
  onBlur,
  disabled = false,
  searchPlaceholder,
  inputAriaLabel,
  label,
  required = false,
  error,
  className,
  inputClassName,
  countryTriggerClassName,
  dropdownClassName,
}: PhoneFieldProps) {
  const t = useTranslations("phoneField");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const id = useId();
  const inputId = `${id}-phone`;
  const errorId = `${id}-error`;
  const listId = `${id}-countries`;
  const [internalValue, setInternalValue] =
    useState<PhoneFieldValue>(defaultValue);
  const current = value ?? internalValue;
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [countries, setCountries] = useState<PhoneCountry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (selectedCountry?.countryCode === current.countryCode) return;
    const controller = new AbortController();
    setSelectedCountry(undefined);
    void loadCountries({
      search: current.countryCode,
      limit: 1,
      signal: controller.signal,
    })
      .then((page) => {
        if (!controller.signal.aborted)
          setSelectedCountry(
            page.items.find(
              (country) => country.countryCode === current.countryCode,
            ),
          );
      })
      // The calling code remains usable; opening the list exposes its error/retry UI.
      .catch((cause) => {
        if (!controller.signal.aborted)
          reportError(cause, {
            component: "PhoneField",
            operation: "resolveCountry",
          });
      });
    return () => controller.abort();
  }, [current.countryCode, loadCountries, selectedCountry?.countryCode]);

  const updateValue = (next: PhoneFieldValue) => {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  };

  const changeOpen = (next: boolean) => {
    setOpen(next && !disabled);
    if (!next) setSearch("");
  };

  const fetchPage = useCallback(
    async (nextCursor: string | null, generation: number) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setLoadError(undefined);
      const controller = new AbortController();
      requestRef.current = controller;
      try {
        const page = await loadCountries({
          search: search.trim(),
          cursor: nextCursor,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });
        if (controller.signal.aborted || generation !== generationRef.current)
          return;
        setCountries((previous) => {
          const merged = nextCursor === null ? [] : previous;
          return [
            ...new Map(
              [...merged, ...page.items].map((country) => [
                country.id,
                country,
              ]),
            ).values(),
          ];
        });
        setCursor(page.nextCursor);
      } catch (cause) {
        if (
          !controller.signal.aborted &&
          generation === generationRef.current
        ) {
          reportError(cause, {
            component: "PhoneField",
            operation: "loadCountries",
          });
          setLoadError(errorMessage(cause));
        }
      } finally {
        if (
          !controller.signal.aborted &&
          generation === generationRef.current
        ) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [loadCountries, search, errorMessage],
  );

  useEffect(() => {
    requestRef.current?.abort();
    loadingRef.current = false;
    const generation = ++generationRef.current;
    setCountries([]);
    setCursor(null);
    setActiveIndex(-1);
    setLoadError(undefined);
    setLoading(open);
    if (!open || disabled) return;
    const timer = window.setTimeout(
      () => {
        void fetchPage(null, generation);
      },
      search ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      requestRef.current?.abort();
    };
  }, [open, disabled, search, fetchPage]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const loadMore = useCallback(() => {
    if (cursor && !loading && !loadError)
      void fetchPage(cursor, generationRef.current);
  }, [cursor, loading, loadError, fetchPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!open || !sentinel || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { root: listRef.current },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, loadMore]);

  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(`${listId}-${activeIndex}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, listId]);

  const selectCountry = (country: PhoneCountry) => {
    setSelectedCountry(country);
    updateValue({ countryCode: country.countryCode, phone: current.phone });
    changeOpen(false);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((previous) =>
        Math.max(0, Math.min(countries.length - 1, previous + direction)),
      );
      if (event.key === "ArrowDown" && activeIndex >= countries.length - 1)
        loadMore();
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (countries[activeIndex]) selectCountry(countries[activeIndex]);
    } else if ((event.key === "Home" || event.key === "End") && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : countries.length - 1);
    }
  };

  return (
    <div className={cn("phone_field flex w-full flex-col gap-2", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-text-primary text-sm font-semibold"
        >
          {label}
          {required && (
            <span aria-hidden="true" className="text-status-error ms-1">
              *
            </span>
          )}
        </label>
      )}
      <div className="flex w-full min-w-0 gap-2" dir="ltr">
        <Popover.Root open={open} onOpenChange={changeOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label={t("chooseCountry", {
                country: selectedCountry?.name ?? "",
                code: current.countryCode,
              })}
              className={cn(
                "border-stroke-light bg-surface-elevated text-text-primary focus-visible:border-action-primary focus-visible:ring-action-primary/15 flex min-h-12.5 shrink-0 items-center justify-center gap-2 rounded-md border px-3 transition focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                countryTriggerClassName,
              )}
            >
              {selectedCountry ? (
                <Image
                  src={selectedCountry.flagUrl}
                  alt=""
                  width={24}
                  height={18}
                  unoptimized
                  className="h-[18px] w-6 rounded-[2px] object-cover"
                />
              ) : (
                <FiGlobe aria-hidden="true" className="h-[18px] w-6" />
              )}
              <span dir="ltr">{current.countryCode}</span>
              {open ? (
                <FiChevronUp aria-hidden="true" />
              ) : (
                <FiChevronDown aria-hidden="true" />
              )}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={6}
              collisionPadding={12}
              aria-label={t("countries")}
              dir={locale === "ar" ? "rtl" : "ltr"}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                searchRef.current?.focus();
              }}
              className={cn(
                "border-stroke-light bg-surface-elevated text-text-primary z-[10002] w-[min(22rem,calc(100vw-24px))] overflow-hidden rounded-lg border p-2 shadow-xl outline-none",
                dropdownClassName,
              )}
            >
              <div className="relative mb-2">
                <FiSearch
                  aria-hidden="true"
                  className="text-text-subtle pointer-events-none absolute start-3 top-1/2 -translate-y-1/2"
                />
                <input
                  ref={searchRef}
                  type="text"
                  role="combobox"
                  aria-label={searchPlaceholder ?? t("searchPlaceholder")}
                  aria-autocomplete="list"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-activedescendant={
                    activeIndex >= 0 && countries[activeIndex]
                      ? `${listId}-${activeIndex}`
                      : undefined
                  }
                  autoComplete="off"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder ?? t("searchPlaceholder")}
                  className="border-stroke-light bg-surface-elevated focus:border-action-primary focus:ring-action-primary/15 min-h-11 w-full rounded-md border py-2 ps-9 pe-3 text-sm outline-none focus:ring-2"
                />
              </div>
              <div
                ref={listRef}
                className="phone-country-list max-h-[min(8rem,var(--radix-popover-content-available-height))] touch-pan-y overflow-y-auto overscroll-contain"
                onWheel={(event) => {
                  event.stopPropagation();

                  // Dialog scroll-lock treats a body-level popover portal as
                  // outside content. Recover the canceled wheel movement on
                  // the country list itself.
                  if (event.defaultPrevented) {
                    event.currentTarget.scrollTop += event.deltaY;
                  }
                }}
                onScroll={(event) => {
                  const list = event.currentTarget;
                  if (
                    list.scrollHeight - list.scrollTop - list.clientHeight <
                    40
                  )
                    loadMore();
                }}
              >
                <div
                  id={listId}
                  role="listbox"
                  aria-label={t("countries")}
                  aria-busy={loading}
                >
                  {countries.map((country, index) => (
                    <button
                      id={`${listId}-${index}`}
                      key={country.id}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-selected={selectedCountry?.id === country.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onPointerMove={() => setActiveIndex(index)}
                      onClick={() => selectCountry(country)}
                      className={cn(
                        "hover:bg-action-primary/10 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start text-sm",
                        activeIndex === index && "bg-action-primary/10",
                      )}
                    >
                      <Image
                        src={country.flagUrl}
                        alt=""
                        width={24}
                        height={18}
                        unoptimized
                        className="h-[18px] w-6 shrink-0 rounded-[2px] object-cover"
                      />
                      <span className="flex-1">{country.name}</span>
                      <span className="text-text-subtle" dir="ltr">
                        {country.countryCode}
                      </span>
                      {selectedCountry?.id === country.id && (
                        <FiCheck
                          aria-hidden="true"
                          className="text-action-primary shrink-0"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div ref={sentinelRef} className="h-px" aria-hidden="true" />
                {loading && (
                  <p
                    role="status"
                    className="text-text-subtle m-0 p-3 text-center text-sm"
                  >
                    {t(countries.length ? "loadingMore" : "loading")}
                  </p>
                )}
                {loadError && (
                  <div className="flex flex-col items-center gap-2 p-3">
                    <p role="alert" className="text-status-error m-0 text-sm">
                      {loadError}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void fetchPage(cursor, generationRef.current)
                      }
                    >
                      {t("retry")}
                    </Button>
                  </div>
                )}
                {!loading && !loadError && !countries.length && (
                  <p
                    role="status"
                    className="text-text-subtle m-0 p-3 text-center text-sm"
                  >
                    {t("empty")}
                  </p>
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <input
          id={inputId}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          dir="ltr"
          value={current.phone}
          onChange={(event) =>
            updateValue({
              ...current,
              phone: event.target.value.replace(/[^0-9]/g, ""),
            })
          }
          onBlur={onBlur}
          disabled={disabled}
          aria-label={inputAriaLabel ?? label ?? t("phoneNumber")}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "phone_input text-text-primary min-h-12.5 min-w-0 flex-1 rounded-md border px-4 text-left transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-status-error bg-status-error-background focus:border-status-error"
              : "border-stroke-light focus:border-action-primary bg-white",
            inputClassName,
          )}
        />
      </div>
      {error && (
        <p
          id={errorId}
          className="phone_field_error text-status-error m-0 text-[13px]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
