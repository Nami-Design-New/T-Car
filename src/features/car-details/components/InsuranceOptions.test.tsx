import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import InsuranceOptions from './InsuranceOptions';

const OPTION = {
  id: '1',
  title: 'Insurance with deductible',
  subtitle: 'A deductible applies',
  pricePerDay: 500,
  terms: ['Report accidents'],
  cancellationPolicy: ['Free up to 24 hours'],
};

describe('InsuranceOptions', () => {
  it('shows the terms first and the cancellation policy on its tab', async () => {
    render(<InsuranceOptions option={OPTION} />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Report accidents');

    const cancellation = screen.getByRole('tab', { name: 'سياسة الإلغاء' });
    await userEvent.click(cancellation);
    expect(cancellation).toHaveAttribute('aria-selected', 'true');
    expect(cancellation).toHaveClass('active');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Free up to 24 hours');
  });
});
