'use client';

import { useCallback, useEffect, useRef } from 'react';

export type RailDirection = 'prev' | 'next';

interface UseCarouselRailOptions {
  isRTL: boolean;
  /** ms between autoplay steps. Pass 0 to disable autoplay entirely. */
  autoplayInterval?: number;
  /** px gap between slides, used to compute the scroll step. */
  gap?: number;
}

interface UseCarouselRail {
  trackRef: React.RefObject<HTMLDivElement>;
  scrollPrev: () => void;
  scrollNext: () => void;
  pause: () => void;
  resume: () => void;
}

const EDGE_TOLERANCE = 5;
const FALLBACK_STEP = 300;

/**
 * Drives a CSS scroll-snap rail (overflow-x + scroll-snap-type) with no
 * carousel dependency: autoplay, keyboard/drag-free arrow stepping, and a
 * manual loop back to the opposite edge.
 *
 * Direction is normalised so callers always think in "prev"/"next" while the
 * maths accounts for the browser's negative scrollLeft values in RTL.
 */
export function useCarouselRail({
  isRTL,
  autoplayInterval = 3500,
  gap = 24,
}: UseCarouselRailOptions): UseCarouselRail {
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const step = useCallback(
    (direction: RailDirection) => {
      const el = trackRef.current;

      if (!el) return;

      const slideWidth = el.firstElementChild?.clientWidth ?? FALLBACK_STEP;

      const amount = slideWidth + gap;

      const maxScroll = el.scrollWidth - el.clientWidth;

      if (maxScroll <= 0) return;

      const currentScroll = Math.abs(el.scrollLeft);

      if (direction === 'next' && currentScroll >= maxScroll - EDGE_TOLERANCE) {
        el.scrollTo({ left: isRTL ? -maxScroll : 0, behavior: 'smooth' });
        return;
      }

      if (direction === 'prev' && currentScroll <= EDGE_TOLERANCE) {
        el.scrollTo({ left: isRTL ? 0 : maxScroll, behavior: 'smooth' });
        return;
      }

      // scrollLeft counts down instead of up in RTL, so the step is inverted
      const sign = (direction === 'next') === isRTL ? -1 : 1;

      el.scrollBy({ left: sign * amount, behavior: 'smooth' });
    },
    [gap, isRTL]
  );

  const resume = useCallback(() => {
    pause();

    if (autoplayInterval <= 0) return;

    intervalRef.current = setInterval(() => {
      step('next');
    }, autoplayInterval);
  }, [autoplayInterval, pause, step]);

  useEffect(() => {
    resume();

    return pause;
  }, [pause, resume]);

  const stepManually = useCallback(
    (direction: RailDirection) => {
      pause();
      step(direction);
      resume();
    },
    [pause, resume, step]
  );

  return {
    trackRef,
    scrollPrev: useCallback(() => stepManually('prev'), [stepManually]),
    scrollNext: useCallback(() => stepManually('next'), [stepManually]),
    pause,
    resume,
  };
}
