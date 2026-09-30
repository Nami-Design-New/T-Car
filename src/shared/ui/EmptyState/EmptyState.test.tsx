import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows the title, description, and action', () => {
    render(
      <EmptyState
        title="No bookings yet"
        description="Book a car to see it here."
        action={<a href="#cars">Book a car</a>}
      />
    );
    expect(screen.getByRole('heading', { name: 'No bookings yet' })).toBeInTheDocument();
    expect(screen.getByText('Book a car to see it here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Book a car' })).toBeInTheDocument();
  });

  it('is not announced as an alert (an empty result is not an error)', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hides the decorative illustration from assistive technology', () => {
    const { container } = render(<EmptyState title="Nothing here" />);
    expect(container.querySelector('.empty-state__illustration')).toHaveAttribute('aria-hidden', 'true');
  });

  it('drops the illustration and heading level in the inline size', () => {
    const { container } = render(<EmptyState title="No results" size="inline" />);
    expect(container.querySelector('.empty-state__illustration')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('No results')).toBeInTheDocument();
  });
});
