import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PhoneField } from './PhoneField';

function ControlledPhoneField({ onChange }: { onChange: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  return (
    <PhoneField
      value={phone}
      onChange={(next) => {
        setPhone(next);
        onChange(next);
      }}
    />
  );
}

describe('PhoneField', () => {
  it('is a named phone input that autocompletes from the device', () => {
    render(<PhoneField value="" onChange={vi.fn()} inputAriaLabel="Mobile number" />);
    const input = screen.getByRole('textbox', { name: 'Mobile number' });
    expect(input).toHaveAttribute('name', 'phone');
    expect(input).toHaveAttribute('autocomplete', 'tel');
  });

  it('starts with the Saudi code and reports the full number', async () => {
    const onChange = vi.fn();
    render(<ControlledPhoneField onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'Phone number' });
    expect(input).toHaveValue('+966');

    await userEvent.type(input, '500000000');
    expect(onChange).toHaveBeenLastCalledWith('966500000000');
  });

  it('can be disabled', () => {
    render(<PhoneField value="966500000000" onChange={vi.fn()} disabled />);
    expect(screen.getByRole('textbox', { name: 'Phone number' })).toBeDisabled();
  });
});
