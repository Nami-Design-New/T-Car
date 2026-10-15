import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { BackButton } from './BackButton';

const back = vi.hoisted(() => vi.fn());

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ back }),
}));

describe('BackButton', () => {
  it('goes back when pressed', async () => {
    renderWithIntl(<BackButton label="Back" />);

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(back).toHaveBeenCalledTimes(1);
  });
});
