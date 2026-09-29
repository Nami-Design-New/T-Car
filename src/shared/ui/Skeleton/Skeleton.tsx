import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';
import './Skeleton.scss';

interface Props {
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

  return <span aria-hidden="true" className={cn('skeleton', `skeleton--${shape}`, className)} style={style} />;
}
