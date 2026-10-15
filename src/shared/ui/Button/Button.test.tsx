import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './index';

describe('Button', () => {
  it('renders a button with the variant and size classes', () => {
    render(<Button variant="outline" size="sm">Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('btn', 'btn-outline', 'btn-sm');
    expect(button).toBeEnabled();
  });

  it('is busy and disabled while loading, and keeps its accessible name', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('.btn__spinner')).toBeInTheDocument();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('puts the button styles on its child with asChild', () => {
    render(
      <Button asChild size="lg">
        <a href="#details">Browse cars</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Browse cars' });
    expect(link).toHaveAttribute('href', '#details');
    expect(link).toHaveClass('btn', 'btn-primary', 'btn-lg');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
