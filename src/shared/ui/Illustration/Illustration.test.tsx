import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Illustration } from './Illustration';

// The Lottie player is replaced by a probe that shows the props it receives.
vi.mock('next/dynamic', () => ({
  default: () =>
    function LottieProbe({ loop, autoplay }: { loop: boolean; autoplay: boolean }) {
      return (
        <span data-testid="lottie" data-loop={String(loop)} data-autoplay={String(autoplay)} />
      );
    },
}));

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: reduce,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
}

describe('Illustration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is decorative and keeps the caller class', () => {
    const { container } = render(<Illustration name="empty" className="hero-art" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveClass('illustration', 'hero-art');
  });

  it('plays the named animation once it has loaded', async () => {
    mockReducedMotion(false);
    render(<Illustration name="success" />);
    const player = await screen.findByTestId('lottie');
    expect(player).toHaveAttribute('data-loop', 'true');
    expect(player).toHaveAttribute('data-autoplay', 'true');
  });

  it('holds a still frame when the user prefers reduced motion', async () => {
    mockReducedMotion(true);
    render(<Illustration name="empty" />);
    await waitFor(() => {
      expect(screen.getByTestId('lottie')).toHaveAttribute('data-autoplay', 'false');
    });
    expect(screen.getByTestId('lottie')).toHaveAttribute('data-loop', 'false');
  });
});
