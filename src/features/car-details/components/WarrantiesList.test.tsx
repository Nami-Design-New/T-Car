import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import WarrantiesList from './WarrantiesList';

const WARRANTIES = [
  { id: '1', title: 'On-time arrival', description: '20% off the first day if late.' },
  { id: '2', title: 'Clean car', description: '20% off the first day if not clean.' },
];

describe('WarrantiesList', () => {
  it('starts closed and opens one warranty at a time', async () => {
    render(<WarrantiesList warranties={WARRANTIES} />);
    const onTime = screen.getByRole('button', { name: 'On-time arrival' });
    const clean = screen.getByRole('button', { name: 'Clean car' });
    expect(onTime).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('20% off the first day if late.')).not.toBeInTheDocument();

    await userEvent.click(onTime);
    expect(onTime).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('20% off the first day if late.')).toBeInTheDocument();

    await userEvent.click(clean);
    expect(clean).toHaveAttribute('aria-expanded', 'true');
    expect(onTime).toHaveAttribute('aria-expanded', 'false');
  });
});
