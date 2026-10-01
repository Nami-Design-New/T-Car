import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PaymentMethodModal from './PaymentMethodModal';
import { renderWithIntl } from '@/shared/test/render';

describe('PaymentMethodModal', () => {
  it('offers the payment methods as one radio group and confirms the chosen one', async () => {
    const onConfirm = vi.fn();
    renderWithIntl(<PaymentMethodModal open onClose={() => {}} onConfirm={onConfirm} />);

    const group = screen.getByRole('radiogroup', { name: 'Payment method' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);

    const wallet = screen.getAllByRole('radio')[0];
    expect(wallet).toBeChecked();
    expect(wallet).toHaveClass('payment_modal_option', 'selected');

    const tabby = screen.getAllByRole('radio')[2];
    await userEvent.click(tabby);
    expect(tabby).toBeChecked();
    expect(tabby).toHaveClass('selected');

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledWith('tabby');
  });

  it('keeps the points switch outside the payment choice', () => {
    renderWithIntl(<PaymentMethodModal open onClose={() => {}} onConfirm={() => {}} />);
    const points = screen.getByRole('switch');
    expect(screen.getByRole('radiogroup')).not.toContainElement(points);
  });
});
