import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageSkeleton } from './PageSkeleton';
import { Skeleton } from './Skeleton';

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

describe('Skeleton', () => {
  it('is a text bone hidden from assistive technology by default', () => {
    const { container } = render(<Skeleton width="60%" height={16} />);
    const bone = container.firstChild as HTMLElement;
    expect(bone).toHaveAttribute('aria-hidden', 'true');
    expect(bone).toHaveClass('skeleton', 'skeleton--text');
    expect(bone).toHaveStyle({ width: '60%', height: '16px' });
  });

  it('sizes a circle by its diameter', () => {
    const { container } = render(<Skeleton shape="circle" size={40} width={999} />);
    const bone = container.firstChild as HTMLElement;
    expect(bone).toHaveClass('skeleton--circle');
    expect(bone).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('keeps the aspect ratio of a rect and adds the caller class', () => {
    const { container } = render(<Skeleton shape="rect" aspectRatio="16/10" className="thumb" />);
    const bone = container.firstChild as HTMLElement;
    expect(bone).toHaveClass('skeleton--rect', 'thumb');
    expect(bone.style.aspectRatio).toBe('16/10');
  });
});

describe('PageSkeleton', () => {
  it('announces loading once and shows six cards for a page', async () => {
    const { container } = render(await PageSkeleton({}));
    const region = container.firstChild as HTMLElement;
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveClass('page-skeleton--page', 'section');
    expect(screen.getByText('states.loading')).toHaveClass('visually-hidden');
    expect(container.querySelectorAll('.page-skeleton__card')).toHaveLength(6);
  });

  it('shows three cards inside a section layout', async () => {
    const { container } = render(await PageSkeleton({ variant: 'section' }));
    expect(container.firstChild).toHaveClass('page-skeleton--section');
    expect(container.firstChild).not.toHaveClass('section');
    expect(container.querySelectorAll('.page-skeleton__card')).toHaveLength(3);
  });
});
