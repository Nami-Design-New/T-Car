import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionTitle } from './SectionTitle';

describe('SectionTitle', () => {
  it('renders the title as a level-2 heading, centred by default', () => {
    const { container } = render(<SectionTitle title="Popular cities" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Popular cities' })).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('section-title', 'is-center');
  });

  it('shows the eyebrow and subtitle only when given', () => {
    const { container, rerender } = render(<SectionTitle title="FAQ" />);
    expect(container.querySelector('.section-title-eyebrow')).not.toBeInTheDocument();
    expect(container.querySelector('.section-title-subtitle')).not.toBeInTheDocument();

    rerender(<SectionTitle title="FAQ" smallTitle="Help" subtitle="Answers to common questions" />);
    expect(screen.getByText('Help')).toHaveClass('section-title-eyebrow');
    expect(screen.getByText('Answers to common questions')).toHaveClass('section-title-subtitle');
  });

  it('aligns left on request', () => {
    const { container } = render(<SectionTitle title="Offers" align="left" />);
    expect(container.firstChild).toHaveClass('is-left');
    expect(container.firstChild).not.toHaveClass('is-center');
  });
});
