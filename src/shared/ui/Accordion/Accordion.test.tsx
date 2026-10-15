import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Accordion } from './Accordion';

function Example() {
  return (
    <Accordion.Root type="single" collapsible defaultValue="docs">
      <Accordion.Item value="docs">
        <Accordion.Trigger>Which documents?</Accordion.Trigger>
        <Accordion.Content>A valid licence.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="cancel">
        <Accordion.Trigger>Can I cancel?</Accordion.Trigger>
        <Accordion.Content>Up to 24 hours before.</Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

describe('Accordion', () => {
  it('puts each trigger in a heading and reports its expanded state', () => {
    render(<Example />);
    const docs = screen.getByRole('button', { name: 'Which documents?' });
    expect(docs.closest('h3')).toBeInTheDocument();
    expect(docs).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Can I cancel?' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('A valid licence.')).toBeVisible();
  });

  it('opens one item at a time and can collapse the open one', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Can I cancel?' }));
    expect(screen.getByRole('button', { name: 'Can I cancel?' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Which documents?' })).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Can I cancel?' }));
    expect(screen.getByRole('button', { name: 'Can I cancel?' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus between triggers with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Which documents?' }));
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Can I cancel?' })).toHaveFocus();
  });
});
