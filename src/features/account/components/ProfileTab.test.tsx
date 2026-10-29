import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionResult } from '@/shared/lib/result';
import { renderWithIntl } from '@/shared/test/render';
import type { ProfileChanges, UserProfile } from '../model';

const { saveProfileAction, notify } = vi.hoisted(() => ({
  saveProfileAction: vi.fn<(input: unknown) => Promise<ActionResult<ProfileChanges>>>(),
  notify: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/shared/hooks/useNotify', () => ({ useNotify: () => notify }));

vi.mock('../actions', () => ({
  saveProfileAction,
  deleteAccountAction: vi.fn(),
  sendPhoneCodeAction: vi.fn(),
  uploadLicenseAction: vi.fn(),
  verifyPhoneAction: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

import ProfileTab from './ProfileTab';

const profile: UserProfile = {
  fullName: 'Ahmed Abdullah',
  email: 'ahmed@domain.com',
  birthDate: '1993-03-15',
  phone: '+966500000000',
  licenseUploaded: true,
};

function renderTab() {
  const user = userEvent.setup();
  renderWithIntl(<ProfileTab profile={profile} />);
  return {
    user,
    name: screen.getByRole('textbox', { name: 'Full name' }),
    email: screen.getByRole('textbox', { name: 'Email address' }),
    save: screen.getByRole('button', { name: 'Save' }),
  };
}

beforeEach(() => {
  saveProfileAction.mockReset();
  vi.clearAllMocks();
});

describe('ProfileTab', () => {
  it('shows a field error on blur and ties it to the field', async () => {
    const { user, name } = renderTab();
    await user.clear(name);
    await user.tab();

    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Full name is required.');
  });

  it('saves only the editable fields with the keyboard', async () => {
    saveProfileAction.mockResolvedValue({ ok: true, data: profile, message: 'Profile updated successfully.' });
    const { user, name } = renderTab();
    await user.type(name, ' ');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(saveProfileAction).toHaveBeenCalledWith({
        fullName: 'Ahmed Abdullah',
        email: 'ahmed@domain.com',
        birthDate: '1993-03-15',
      })
    );
    expect(notify.success).toHaveBeenCalledWith('Profile updated successfully.');
    expect(screen.getByText('+966500000000')).toBeInTheDocument();
  });

  it('does not save an invalid profile', async () => {
    const { user, email, save } = renderTab();
    await user.clear(email);
    await user.type(email, 'ahmed@');
    await user.click(save);

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(saveProfileAction).not.toHaveBeenCalled();
  });

  it('keeps the input and puts a server field error on its field', async () => {
    saveProfileAction.mockResolvedValue({
      ok: false,
      error: {
        kind: 'validation',
        code: 'account.profileRejected',
        fieldErrors: { email: 'account.profileRejected' },
      },
    });
    const { user, email, save } = renderTab();
    await user.clear(email);
    await user.type(email, 'fail@tcar.test');
    await user.click(save);

    await waitFor(() =>
      expect(email).toHaveAccessibleDescription(
        'The profile could not be saved. Check the details and try again.'
      )
    );
    expect(email).toHaveValue('fail@tcar.test');
    expect(notify.success).not.toHaveBeenCalled();
  });

  it('toasts the backend validation message and keeps edited input', async () => {
    saveProfileAction.mockResolvedValue({ ok: false, error: { kind: 'validation', status: 422, serverMessage: 'Email already exists.' } });
    const { user, email, save } = renderTab();
    await user.clear(email);
    await user.type(email, 'taken@example.com');
    await user.click(save);
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith('Email already exists.'));
    expect(email).toHaveValue('taken@example.com');
  });

  it('shows a failure without a field as a form message', async () => {
    saveProfileAction.mockResolvedValue({ ok: false, error: { kind: 'server' } });
    const { user, save } = renderTab();
    await user.click(save);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong on our side. Try again shortly.'
    );
  });

  it('marks the save button busy while saving', async () => {
    let finish: (value: ActionResult<ProfileChanges>) => void = () => {};
    saveProfileAction.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { user, save } = renderTab();
    await user.click(save);

    await waitFor(() => expect(save).toHaveAttribute('aria-busy', 'true'));
    expect(save).toBeDisabled();
    finish({ ok: true, data: profile });
    await waitFor(() => expect(save).not.toHaveAttribute('aria-busy'));
  });
});
