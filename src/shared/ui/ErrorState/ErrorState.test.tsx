import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/lib/errors';
import { renderWithIntl } from '@/shared/test/render';
import { ErrorState } from './ErrorState';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/account/wallet',
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string; query?: Record<string, string> };
    children: React.ReactNode;
  }) => {
    const url =
      typeof href === 'string'
        ? href
        : `${href.pathname}?${new URLSearchParams(href.query ?? {}).toString()}`;
    return (
      <a href={url} {...props}>
        {children}
      </a>
    );
  },
}));

describe('ErrorState', () => {
  it('announces a generic failure with the fallback message', () => {
    renderWithIntl(<ErrorState error={new Error('boom')} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses a custom title and offers a retry', async () => {
    const onRetry = vi.fn();
    renderWithIntl(
      <ErrorState error={new Error('boom')} title="Could not load" onRetry={onRetry} />
    );
    expect(screen.getByRole('heading', { name: 'Could not load' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('adds an offline hint for network failures', () => {
    renderWithIntl(<ErrorState error={new TypeError('Failed to fetch')} />);
    expect(
      screen.getByText('Could not connect. Check your internet connection and try again.')
    ).toBeInTheDocument();
    expect(screen.getByText('You appear to be offline.')).toBeInTheDocument();
  });

  it('offers sign-in instead of retry when the session expired', () => {
    renderWithIntl(<ErrorState error={new AppError('unauthorized')} onRetry={vi.fn()} />);
    expect(screen.getByText('Your session has expired. Sign in to continue.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/?auth=login&next=%2Faccount%2Fwallet'
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('shows the support reference', () => {
    renderWithIntl(<ErrorState error={new Error('boom')} reference="abc123" />);
    expect(screen.getByText('Reference: abc123')).toBeInTheDocument();
  });

  it('uses a paragraph instead of a heading inline', () => {
    renderWithIntl(<ErrorState error={new Error('boom')} size="inline" />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Something went wrong').tagName).toBe('P');
  });
});
