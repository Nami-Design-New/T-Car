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
        title="Failed"
        description="Try again."
        action={{ label: 'Retry', onClick: onAction }}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Failed');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('auto-closes when configured', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    renderWithIntl(
      <ResultDialog open status="success" title="Done" autoCloseMs={1000} onClose={onClose} />
    );
    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
