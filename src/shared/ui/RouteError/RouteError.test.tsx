import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { RouteError } from './RouteError';

const refresh = vi.fn();
const reportError = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => '/cars',
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/shared/lib/report', () => ({
  reportError: (...args: unknown[]) => reportError(...args),
}));

function routeError(digest?: string) {
  return Object.assign(new Error('render failed'), { digest });
}

describe('RouteError', () => {
  beforeEach(() => {
    refresh.mockClear();
    reportError.mockClear();
  });

  it('reports the error once with its scope and digest', () => {
    const error = routeError('d1g3st');
    renderWithIntl(<RouteError error={error} reset={vi.fn()} scope="cars" />);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(error, { scope: 'cars', digest: 'd1g3st' });
  });

  it('shows a page-level error with the digest as reference', () => {
    renderWithIntl(<RouteError error={routeError('d1g3st')} reset={vi.fn()} scope="cars" />);
    expect(screen.getByRole('alert')).toHaveClass('error-state--page');
    expect(screen.getByText('Reference: d1g3st')).toBeInTheDocument();
  });

  it('retries by refreshing the route and resetting the boundary', async () => {
    const reset = vi.fn();
    renderWithIntl(<RouteError error={routeError()} reset={reset} scope="cars" />);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
