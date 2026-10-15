import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import FAQ from './FAQ';

const FAQS = [
  { id: '1', question: 'Q1', answer: 'A1' },
  { id: '2', question: 'Q2', answer: 'A2' },
  { id: '3', question: 'Q3', answer: 'A3' },
];

describe('FAQ', () => {
  it('renders every answer, so they are in the server HTML', () => {
    renderWithIntl(<FAQ faqs={FAQS} />);
    for (const { answer } of FAQS) {
      expect(screen.getByText(answer)).toBeInTheDocument();
    }
  });

  it('opens only the first item, and groups all items into one exclusive set', () => {
    const { container } = renderWithIntl(<FAQ faqs={FAQS} />);
    const items = container.querySelectorAll('details.faq-item');
    expect(items).toHaveLength(3);
    expect([...items].map((item) => item.hasAttribute('open'))).toEqual([true, false, false]);
    expect([...items].every((item) => item.getAttribute('name') === 'faq')).toBe(true);
  });
});
