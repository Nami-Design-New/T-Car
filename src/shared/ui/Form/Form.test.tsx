import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';
import { FormTextarea } from './FormTextarea';

describe('FormInput', () => {
  it('labels the input and passes its props through', async () => {
    const onChange = vi.fn();
    render(<FormInput id="name" label="Full name" placeholder="Your name" onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'Full name' });
    expect(input).toHaveAttribute('placeholder', 'Your name');

    await userEvent.type(input, 'Sara');
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('marks a required field and shows its error', () => {
    render(<FormInput id="email" label="Email" required error="Enter a valid email" />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });

  it('shows no error text when there is no error', () => {
    const { container } = render(<FormInput id="email" label="Email" />);
    expect(container.querySelector('.form_error')).not.toBeInTheDocument();
  });

  it('keeps its own class and adds the caller class', () => {
    render(<FormInput id="city" label="City" className="wide" />);
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveClass('form_input', 'wide');
  });
});

describe('FormTextarea', () => {
  it('labels the textarea and shows its error', async () => {
    const onChange = vi.fn();
    render(<FormTextarea id="notes" label="Notes" error="Too short" onChange={onChange} />);

    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(screen.getByText('Too short')).toBeInTheDocument();

    await userEvent.type(textarea, 'Hi');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('FormSelect', () => {
  const options = [
    { value: 'riyadh', label: 'Riyadh' },
    { value: 'jeddah', label: 'Jeddah' },
  ];

  it('offers a placeholder and the options', () => {
    renderWithIntl(<FormSelect id="city" label="City" options={options} />);

    const select = screen.getByRole('combobox', { name: 'City' });
    expect(select).toHaveValue('');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Choose...',
      'Riyadh',
      'Jeddah',
    ]);
  });

  it('reports the chosen option', async () => {
    const onChange = vi.fn();
    renderWithIntl(<FormSelect id="city" label="City" options={options} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'City' }), 'jeddah');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveValue('jeddah');
  });

  it('marks a required field and shows its error', () => {
    renderWithIntl(
      <FormSelect id="city" label="City" options={options} required error="Choose a city" />
    );
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('Choose a city')).toBeInTheDocument();
  });
});
