import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';

function Example() {
  return (
    <Tabs.Root defaultValue="terms">
      <Tabs.List aria-label="Insurance details">
        <Tabs.Trigger value="terms">Terms</Tabs.Trigger>
        <Tabs.Trigger value="cancellation">Cancellation</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="terms">Report accidents</Tabs.Content>
      <Tabs.Content value="cancellation">Free up to 24 hours</Tabs.Content>
    </Tabs.Root>
  );
}

describe('Tabs', () => {
  it('exposes a labelled tablist with the selected tab and its panel', () => {
    render(<Example />);
    expect(screen.getByRole('tablist', { name: 'Insurance details' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Terms' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Report accidents');
  });

  it('switches panels on click', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('tab', { name: 'Cancellation' }));
    expect(screen.getByRole('tab', { name: 'Cancellation' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Free up to 24 hours');
  });

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('tab', { name: 'Terms' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Cancellation' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Free up to 24 hours');
  });
});
