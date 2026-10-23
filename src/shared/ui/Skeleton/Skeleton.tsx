import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';

export interface Props {
  shape?: 'text' | 'rect' | 'circle';
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  /** For `circle`: the diameter. */
  size?: CSSProperties['width'];
  /** For `rect`, e.g. '16/10' for an image placeholder. */
  aspectRatio?: CSSProperties['aspectRatio'];
  className?: string;
}

/**
 * A placeholder bone (doc 6). Hidden from assistive technology: the container
 * that holds the skeletons sets aria-busy and a visually hidden "Loading…".
 */
export function Skeleton({ shape = 'text', width, height, size, aspectRatio, className }: Props) {
  const style: CSSProperties =
    shape === 'circle' ? { width: size, height: size } : { width, height, aspectRatio };

  return (
    <span
      aria-hidden="true"
      className={cn(
        'skeleton block animate-[skeleton-shimmer_1.4s_ease-in-out_infinite] bg-[linear-gradient(90deg,var(--color-neutral-200)_0%,var(--color-neutral-100)_50%,var(--color-neutral-200)_100%)] bg-[length:200%_100%] motion-reduce:animate-none',
        shape === 'text' && 'skeleton--text h-[1em] rounded-xs',
        shape === 'rect' && 'skeleton--rect w-full rounded-md',
        shape === 'circle' && 'skeleton--circle shrink-0 rounded-full',
        className,
      )}
      style={style}
    />
  );
}
