import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { OtpInput } from './OtpInput';

describe('OtpInput', () => {
  it('distributes typed digits and supports backspace navigation', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '12');
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');

    await user.click(inputs[1]);
    await user.keyboard('{Backspace}');
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('');
  });

  it('distributes pasted digits across the inputs', () => {
    render(<ControlledOtp />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '9876' },
    });

    expect(inputs.map((input) => (input as HTMLInputElement).value)).toEqual(['9', '8', '7', '6']);
  });

  it('renders the configured number of accessible inputs', () => {
    renderOtp('', () => {});
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
    expect(screen.getByRole('group', { name: 'Code' })).toBeInTheDocument();
  });
});

function renderOtp(value: string, onChange: (nextValue: string) => void) {
  return render(<OtpInput value={value} onChange={onChange} length={4} ariaLabel="Code" />);
}

function ControlledOtp() {
  const [value, setValue] = useState('');
  return <OtpInput value={value} onChange={setValue} length={4} ariaLabel="Code" />;
}
