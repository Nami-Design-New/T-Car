import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { RadioCards } from './RadioCards';

function Example() {
  const [value, setValue] = useState('wallet');
  return (
    <RadioCards.Root value={value} onValueChange={setValue} aria-label="Payment method">
      <RadioCards.Item value="wallet">Wallet</RadioCards.Item>
      <RadioCards.Item value="card">Card</RadioCards.Item>
      <RadioCards.Item value="tabby">Tabby</RadioCards.Item>
    </RadioCards.Root>
  );
}

describe('RadioCards', () => {
  it('is a labelled radiogroup with one checked card', () => {
    render(<Example />);
    expect(screen.getByRole('radiogroup', { name: 'Payment method' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Wallet' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Card' })).not.toBeChecked();
  });

  it('selects a card on click', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('radio', { name: 'Tabby' }));
    expect(screen.getByRole('radio', { name: 'Tabby' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Wallet' })).not.toBeChecked();
  });

  it('moves the selection with the arrow keys, as native radios do', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('radio', { name: 'Wallet' }));
    // Radix selects on focus only while the arrow key is still down, and moves
    // focus in a timeout; a real key press is held that long, user-event's
    // instant press-and-release is not, so hold the key explicitly.
    await user.keyboard('{ArrowDown>}');
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Card' })).toHaveFocus());
    expect(screen.getByRole('radio', { name: 'Card' })).toBeChecked();
    await user.keyboard('{/ArrowDown}');
  });
});
