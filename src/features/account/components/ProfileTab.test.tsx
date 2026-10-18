import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionResult } from '@/shared/lib/result';
import { renderWithIntl } from '@/shared/test/render';
import type { UserProfile } from '../model';

const { saveProfileAction } = vi.hoisted(() => ({
  saveProfileAction: vi.fn<(input: unknown) => Promise<ActionResult<UserProfile>>>(),
}));

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
    saveProfileAction.mockResolvedValue({ ok: true, data: profile });
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
    expect(await screen.findByText('Changes saved')).toHaveAttribute('role', 'status');
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
    expect(screen.queryByText('Changes saved')).not.toBeInTheDocument();
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
    let finish: (value: ActionResult<UserProfile>) => void = () => {};
    saveProfileAction.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { user, save } = renderTab();
    await user.click(save);

    await waitFor(() => expect(save).toHaveAttribute('aria-busy', 'true'));
    expect(save).toBeDisabled();
    finish({ ok: true, data: profile });
    await waitFor(() => expect(save).not.toHaveAttribute('aria-busy'));
  });
});
