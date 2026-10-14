import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { ResultDialog } from './ResultDialog';

afterEach(() => vi.useRealTimers());

describe('ResultDialog', () => {
  it('renders a labelled error result and calls its action', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <ResultDialog
        open
        status="error"
        description="Try again."
        action={{ label: 'Retry', onClick: onAction }}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Try again.');
    expect(screen.getByRole('presentation')).toHaveAttribute('src', '/animations/error.gif');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('auto-closes after the default duration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    renderWithIntl(<ResultDialog open status="success" description="Done" onClose={onClose} />);
    vi.advanceTimersByTime(2000);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
