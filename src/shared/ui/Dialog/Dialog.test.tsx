import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { Dialog, type DialogProps } from './Dialog';

type HarnessProps = Partial<Omit<DialogProps, 'open' | 'onClose' | 'children'>> & {
  onClose?: () => void;
  withTitle?: boolean;
};

function Harness({ onClose, withTitle = true, ...props }: HarnessProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <Dialog
        {...props}
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
      >
        <Dialog.Header>
          {withTitle && <Dialog.Title>Top up</Dialog.Title>}
          <Dialog.Close />
        </Dialog.Header>
        <Dialog.Description>Choose an amount</Dialog.Description>
        <Dialog.Body>
          <input aria-label="amount" />
        </Dialog.Body>
        <Dialog.Footer>
          <button type="button">confirm</button>
        </Dialog.Footer>
      </Dialog>
    </>
  );
}

// Radix sets pointer-events: none on the page behind a modal; clicking the
// backdrop in jsdom needs the check off, as a real pointer would.
const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

async function openDialog(props: HarnessProps = {}) {
  const user = setup();
  renderWithIntl(<Harness {...props} />);
  await user.click(screen.getByRole('button', { name: 'open' }));
  return { user, dialog: screen.getByRole('dialog') };
}

describe('Dialog', () => {
  it('renders nothing while closed', () => {
    renderWithIntl(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a labelled, described modal in a portal', async () => {
    const { dialog } = await openDialog();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Top up');
    expect(dialog).toHaveAccessibleDescription('Choose an amount');
    expect(dialog.parentElement).toBe(document.body);
  });

  it('takes its name from `label` when there is no visible title', async () => {
    const { dialog } = await openDialog({ withTitle: false, label: 'Pick a country' });
    expect(dialog).toHaveAccessibleName('Pick a country');
  });

  it('moves focus inside and keeps Tab within the dialog', async () => {
    const { user, dialog } = await openDialog();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    for (let i = 0; i < 5; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('focuses initialFocusRef instead of the first focusable element', async () => {
    function WithInitialFocus() {
      const [open, setOpen] = useState(false);
      const target = useRef<HTMLInputElement>(null);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            open
          </button>
          <Dialog open={open} onClose={() => setOpen(false)} initialFocusRef={target}>
            <Dialog.Title>Edit</Dialog.Title>
            <button type="button">first</button>
            <input aria-label="target" ref={target} />
          </Dialog>
        </>
      );
    }
    const user = setup();
    renderWithIntl(<WithInitialFocus />);
    await user.click(screen.getByRole('button', { name: 'open' }));
    expect(screen.getByRole('textbox', { name: 'target' })).toHaveFocus();
  });

  it('closes on Escape and returns focus to the opener', async () => {
    const onClose = vi.fn();
    const { user } = await openDialog({ onClose });
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'open' })).toHaveFocus();
  });

  it('ignores Escape when closeOnEscape is false', async () => {
    const onClose = vi.fn();
    const { user } = await openDialog({ onClose, closeOnEscape: false });
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on a backdrop click but not on a click inside', async () => {
    const onClose = vi.fn();
    const { user, dialog } = await openDialog({ onClose });

    await user.click(within(dialog).getByRole('button', { name: 'confirm' }));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(document.querySelector('.dialog-backdrop') as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores backdrop clicks when closeOnBackdrop is false', async () => {
    const onClose = vi.fn();
    const { user } = await openDialog({ onClose, closeOnBackdrop: false });
    await user.click(document.querySelector('.dialog-backdrop') as Element);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes from its localized close button', async () => {
    const onClose = vi.fn();
    const { user, dialog } = await openDialog({ onClose });
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('lets only the topmost of two stacked dialogs handle Escape, and keeps scroll locked until both close', async () => {
    const outerClose = vi.fn();
    const innerClose = vi.fn();

    function Nested() {
      const [outer, setOuter] = useState(true);
      const [inner, setInner] = useState(false);
      return (
        <Dialog
          open={outer}
          onClose={() => {
            outerClose();
            setOuter(false);
          }}
        >
          <Dialog.Title>Booking</Dialog.Title>
          <button type="button" onClick={() => setInner(true)}>
            pick on map
          </button>
          <Dialog
            open={inner}
            onClose={() => {
              innerClose();
              setInner(false);
            }}
          >
            <Dialog.Title>Map</Dialog.Title>
            <button type="button">done</button>
          </Dialog>
        </Dialog>
      );
    }

    const user = setup();
    renderWithIntl(<Nested />);
    await user.click(screen.getByRole('button', { name: 'pick on map' }));
    expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(2);

    await user.keyboard('{Escape}');
    expect(innerClose).toHaveBeenCalledTimes(1);
    expect(outerClose).not.toHaveBeenCalled();
    expect(document.body).toHaveAttribute('data-scroll-locked');

    await user.keyboard('{Escape}');
    expect(outerClose).toHaveBeenCalledTimes(1);
    expect(document.body).not.toHaveAttribute('data-scroll-locked');
  });
});
