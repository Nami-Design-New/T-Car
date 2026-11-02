import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/lib/errors';
import { renderWithIntl } from '@/shared/test/render';
import { useSiteLinksStore } from '@/features/settings';
import type { RegisterFormValues } from '../validation';
import RegisterForm from './RegisterForm';

// The settings index also exports a Server Action (server code); only the provider is used here.
vi.mock('@/features/settings/actions', () => ({ getSettingsAction: vi.fn() }));

// BackButton uses the locale-aware navigation, which needs the app router.
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
  Link: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
}));

// The site links live in a module store: start every test without them.
afterEach(() => useSiteLinksStore.setState({ links: {} }));

function renderForm(overrides: Partial<React.ComponentProps<typeof RegisterForm>> = {}) {
  const onSubmit = vi.fn<(values: RegisterFormValues) => Promise<AppError | undefined>>(
    async () => undefined
  );
  const user = userEvent.setup();
  renderWithIntl(<RegisterForm onBack={vi.fn()} onSubmit={onSubmit} {...overrides} />);
  return {
    onSubmit: overrides.onSubmit ?? onSubmit,
    user,
    name: screen.getByRole('textbox', { name: 'Full name' }),
    email: screen.getByRole('textbox', { name: 'Email address' }),
    // A date input has no ARIA role; its label also holds the hidden required mark.
    birthDate: screen.getByLabelText(/Date of birth/),
    submit: screen.getByRole('button', { name: 'Create account' }),
  };
}

async function fillValid({ user, name, email, birthDate }: ReturnType<typeof renderForm>) {
  await user.type(name, 'Ahmed Abdullah');
  await user.type(email, 'ahmed@domain.com');
  await user.type(birthDate, '1990-05-17');
}

describe('RegisterForm', () => {
  it.each([
    ['A', 'Full name must be at least 2 characters.'],
    ['A'.repeat(101), 'Full name must be no more than 100 characters.'],
  ])('shows the name length error', async (value, message) => {
    const { user, name } = renderForm();
    await user.type(name, value);
    await user.tab();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(name).toHaveAccessibleDescription(message);
  });

  it('shows a field error on blur and ties it to the field', async () => {
    const { user, email } = renderForm();
    await user.type(email, 'ahmed@');
    await user.tab();

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Enter a valid email address.');
  });

  it('reports every missing field on submit and focuses the first', async () => {
    const { onSubmit, user, name, submit } = renderForm();
    await user.click(submit);

    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email address is required.')).toBeInTheDocument();
    expect(screen.getByText('Date of birth is required.')).toBeInTheDocument();
    expect(name).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed values with the keyboard', async () => {
    const form = renderForm();
    await fillValid(form);
    await form.user.type(form.name, '  ');
    await form.user.keyboard('{Enter}');

    await waitFor(() =>
      expect(form.onSubmit).toHaveBeenCalledWith({
        fullName: 'Ahmed Abdullah',
        email: 'ahmed@domain.com',
        birthDate: '1990-05-17',
      })
    );
  });

  it('keeps the values and maps a server field error', async () => {
    const onSubmit = vi.fn(
      async () =>
        new AppError('validation', 'auth.nameRequired', undefined, {
          fullName: 'auth.nameRequired',
        })
    );
    const form = renderForm({ onSubmit });
    await fillValid(form);
    await form.user.click(form.submit);

    await waitFor(() => expect(form.name).toHaveAttribute('aria-invalid', 'true'));
    expect(form.name).toHaveAccessibleDescription('Full name is required.');
    expect(form.name).toHaveFocus();
    expect(form.name).toHaveValue('Ahmed Abdullah');
    expect(form.email).toHaveValue('ahmed@domain.com');
  });

  it('shows an error for a field the form does not have as a form message', async () => {
    const onSubmit = vi.fn(
      async () =>
        new AppError('validation', 'auth.invalidCode', undefined, { code: 'auth.invalidCode' })
    );
    const form = renderForm({ onSubmit });
    await fillValid(form);
    await form.user.click(form.submit);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The verification code is incorrect. Try again.'
    );
    expect(form.email).toHaveValue('ahmed@domain.com');
  });

  it('links the consent to the backend terms and privacy pages in a new tab', () => {
    useSiteLinksStore.setState({
      links: {
        termsUrl: 'https://t-car.app/user/terms?locale=en',
        privacyUrl: 'https://t-car.app/user/privacy?locale=en',
      },
    });
    renderForm();
    const terms = screen.getByRole('link', { name: 'Terms and Conditions' });
    expect(terms).toHaveAttribute('href', 'https://t-car.app/user/terms?locale=en');
    expect(terms).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      'https://t-car.app/user/privacy?locale=en'
    );
  });

  it('keeps the consent as plain text when the site links are unknown', () => {
    renderForm();
    expect(screen.queryByRole('link', { name: 'Terms and Conditions' })).not.toBeInTheDocument();
    expect(screen.getByText(/Terms and Conditions/)).toBeInTheDocument();
  });

  it('names the back button', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Back to verification' })).toBeInTheDocument();
  });

  it('cannot be submitted while pending', () => {
    const { submit } = renderForm({ loading: true });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
  });
});
