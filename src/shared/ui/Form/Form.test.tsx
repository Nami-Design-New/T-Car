import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { FormCheckbox } from './FormCheckbox';
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

describe('field errors and required marks', () => {
  it('links the error to the input and marks it invalid', () => {
    render(<FormInput id="email" label="Email" error="Enter a valid email" />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email');
  });

  it('keeps a description the caller already linked', () => {
    render(
      <>
        <p id="hint">We never share it</p>
        <FormInput id="email" label="Email" aria-describedby="hint" error="Enter a valid email" />
      </>
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'We never share it Enter a valid email'
    );
  });

  it('announces required without the browser blocking the submit or the mark in the name', () => {
    render(<FormInput id="name" label="Full name" required />);
    const input = screen.getByRole('textbox', { name: 'Full name' });
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).not.toHaveAttribute('required');
  });

  it('is not invalid without an error', () => {
    render(<FormInput id="name" label="Full name" />);
    const input = screen.getByRole('textbox', { name: 'Full name' });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('labels the control without an id', () => {
    render(<FormInput label="City" error="Choose a city" />);
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveAccessibleDescription(
      'Choose a city'
    );
  });

  it('forwards the ref, as react-hook-form register needs', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<FormInput id="name" label="Full name" ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Full name' }));
  });

  it('shows a decorative icon without changing the name or the error link', () => {
    render(
      <FormInput
        id="birth"
        label="Date of birth"
        icon={<svg data-testid="calendar" />}
        error="Date of birth is required."
      />
    );
    const input = screen.getByRole('textbox', { name: 'Date of birth' });
    expect(input).toHaveClass('form_input', 'form_input--with-icon');
    expect(screen.getByTestId('calendar').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(input).toHaveAccessibleDescription('Date of birth is required.');
  });

  it('wires textarea and select errors the same way', () => {
    renderWithIntl(
      <>
        <FormTextarea id="notes" label="Notes" error="Too short" />
        <FormSelect id="city" label="City" options={[]} error="Choose a city" />
      </>
    );
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAccessibleDescription(
      'Too short'
    );
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveAccessibleDescription(
      'Choose a city'
    );
  });
});

describe('FormCheckbox', () => {
  it('is a labelled checkbox that toggles', async () => {
    const onChange = vi.fn();
    render(<FormCheckbox id="terms" label="I agree" onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox', { name: 'I agree' });
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('shows its error and links it', () => {
    render(<FormCheckbox id="terms" label="I agree" required error="Accept the terms" />);
    const checkbox = screen.getByRole('checkbox', { name: 'I agree' });
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAttribute('aria-required', 'true');
    expect(checkbox).toHaveAccessibleDescription('Accept the terms');
  });
});
