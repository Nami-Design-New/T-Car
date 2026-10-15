import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { DateTimePicker, type DateTimePickerProps } from './DateTimePicker';

type Value = DateTimePickerProps['value'];

function ControlledPicker({
  initial,
  minDate,
  onChange,
}: {
  initial: Value;
  minDate?: string;
  onChange?: (value: Value) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <DateTimePicker
      label="Pickup"
      placeholder="Choose a date"
      value={value}
      minDate={minDate}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const trigger = () => screen.getByRole('button', { name: /Pickup/ });
const day = (n: number) => screen.getByRole('button', { name: String(n) });

describe('DateTimePicker', () => {
  it('starts closed, showing the label and the placeholder', () => {
    renderWithIntl(<ControlledPicker initial={{ date: '', time: '' }} />);
    expect(trigger()).toHaveTextContent('Pickup');
    expect(screen.getByText('Choose a date')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });

  it('opens on the month of the chosen date', async () => {
    renderWithIntl(<ControlledPicker initial={{ date: '2026-10-15', time: '' }} />);
    await userEvent.click(trigger());
    expect(screen.getByText('October 2026')).toBeInTheDocument();
    expect(screen.getAllByText('Sun')).toHaveLength(1);
  });

  it('moves between months', async () => {
    renderWithIntl(<ControlledPicker initial={{ date: '2026-10-15', time: '' }} />);
    await userEvent.click(trigger());

    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('September 2026')).toBeInTheDocument();
  });

  it('disables days before the minimum date', async () => {
    // Days well away from the minimum, so the check holds in every time zone.
    renderWithIntl(
      <ControlledPicker initial={{ date: '2026-10-15', time: '' }} minDate="2026-10-10" />
    );
    await userEvent.click(trigger());
    expect(day(5)).toBeDisabled();
    expect(day(20)).toBeEnabled();
  });

  it('enables Done only after a day and a time are chosen', async () => {
    const onChange = vi.fn();
    renderWithIntl(<ControlledPicker initial={{ date: '', time: '' }} onChange={onChange} />);
    await userEvent.click(trigger());
    const done = screen.getByRole('button', { name: 'Done' });
    expect(done).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    await userEvent.click(day(12));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: expect.stringMatching(/^\d{4}-\d{2}-12$/), time: '' })
    );
    expect(done).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '09:30' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ time: '09:30' }));
    expect(done).toBeEnabled();

    await userEvent.click(done);
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });

  it('offers half-hour slots from 06:00 to 23:30', async () => {
    renderWithIntl(<ControlledPicker initial={{ date: '2026-10-15', time: '' }} />);
    await userEvent.click(trigger());
    const slots = screen.getAllByRole('button', { name: /^\d{2}:\d{2}$/ });
    expect(slots).toHaveLength(36);
    expect(slots[0]).toHaveTextContent('06:00');
    expect(slots[35]).toHaveTextContent('23:30');
  });

  it('closes when the user clicks outside', async () => {
    renderWithIntl(
      <>
        <ControlledPicker initial={{ date: '2026-10-15', time: '' }} />
        <p>Outside</p>
      </>
    );
    await userEvent.click(trigger());
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();

    await userEvent.click(screen.getByText('Outside'));
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });
});
