import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionTitle } from './SectionTitle';

describe('SectionTitle', () => {
  it('renders the title as a level-2 heading, centred by default', () => {
    const { container } = render(<SectionTitle title="Popular cities" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Popular cities' })).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('is-center', 'text-center');
  });

  it('shows the eyebrow and subtitle only when given', () => {
    const { container, rerender } = render(<SectionTitle title="FAQ" />);
    expect(screen.queryByText('Help')).not.toBeInTheDocument();
    expect(screen.queryByText('Answers to common questions')).not.toBeInTheDocument();

    rerender(<SectionTitle title="FAQ" smallTitle="Help" subtitle="Answers to common questions" />);
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('Answers to common questions')).toBeInTheDocument();
  });

  it('aligns left on request', () => {
    const { container } = render(<SectionTitle title="Offers" align="left" />);
    expect(container.firstChild).toHaveClass('is-left');
    expect(container.firstChild).not.toHaveClass('is-center');
  });
});
