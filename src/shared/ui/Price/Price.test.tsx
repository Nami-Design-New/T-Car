import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { Price } from './Price';

describe('Price', () => {
  it('shows the formatted amount with the riyal sign', () => {
    const { container } = renderWithIntl(<Price amount={2500} />);
    expect(container).toHaveTextContent('2,500');
    expect(screen.getByRole('img', { name: 'SAR' })).toBeInTheDocument();
  });

  it('sizes the currency icon', () => {
    renderWithIntl(<Price amount={10} size="xl" />);
    const icon = screen.getByRole('img', { name: 'SAR' });
    expect(icon).toHaveAttribute('width', '30');
    expect(icon).toHaveAttribute('height', '30');
  });

  it('marks a previous price as deleted text', () => {
    const { container } = renderWithIntl(<Price amount={200} strike className="old" />);
    const del = container.querySelector('del');
    expect(del).toHaveClass('price', 'price--strike', 'old');
    expect(del).toHaveTextContent('200');
  });
});
