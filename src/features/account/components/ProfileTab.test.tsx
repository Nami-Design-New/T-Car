import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionResult } from '@/shared/lib/result';
import type { PhoneFieldValue } from '@/shared/lib/phone';
import { renderWithIntl } from '@/shared/test/render';
import type { ProfileChanges, UserProfile } from '../model';

const { saveProfileAction, sendPhoneCodeAction, verifyPhoneAction, uploadLicenseAction, deleteAccountAction, notify, router } = vi.hoisted(() => ({
  saveProfileAction: vi.fn<(input: unknown) => Promise<ActionResult<ProfileChanges>>>(),
  sendPhoneCodeAction: vi.fn<(phone: PhoneFieldValue) => Promise<ActionResult<PhoneFieldValue>>>(),
  verifyPhoneAction: vi.fn<(phone: string, code: string) => Promise<ActionResult<void>>>(),
  uploadLicenseAction: vi.fn<(data: FormData) => Promise<ActionResult<void>>>(),
  deleteAccountAction: vi.fn<() => Promise<ActionResult<void>>>(),
  notify: { success: vi.fn(), error: vi.fn() },
  router: { replace: vi.fn(), refresh: vi.fn() },
}));

vi.mock('@/shared/hooks/useNotify', () => ({ useNotify: () => notify }));

vi.mock('../actions', () => ({
  saveProfileAction,
  deleteAccountAction,
  sendPhoneCodeAction,
  uploadLicenseAction,
  verifyPhoneAction,
}));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => router }));
vi.mock('@/features/phone-countries', async () => {
  const { phoneCountriesMock } = await import('@/features/phone-countries/api.mock');
  return { loadPhoneCountries: phoneCountriesMock.listCountries };
});

import ProfileTab from './ProfileTab';

const profile: UserProfile = {
  fullName: 'Ahmed Abdullah',
  email: 'ahmed@domain.com',
  birthDate: '1993-03-15',
  phone: '+966500000000',
  licenseUploaded: true,
};

function renderTab(initialProfile: UserProfile = profile) {
  const user = userEvent.setup();
  renderWithIntl(<ProfileTab profile={initialProfile} />);
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
  sendPhoneCodeAction.mockImplementation(async (phone) => ({ ok: true, data: phone, message: 'Code sent.' }));
  verifyPhoneAction.mockResolvedValue({ ok: false, error: { kind: 'validation', code: 'account.phoneVerificationUnavailable' } });
  uploadLicenseAction.mockResolvedValue({ ok: true, data: undefined });
  deleteAccountAction.mockResolvedValue({ ok: true, data: undefined });
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

  it('sends a structured phone number and keeps the current number until verification is integrated', async () => {
    const { user } = renderTab();
    await user.click(screen.getByRole('button', { name: /Mobile number/ }));
    const dialog = await screen.findByRole('dialog');
    const phone = within(dialog).getByRole('textbox', { name: 'Mobile number' });
    await user.clear(phone);
    await user.type(phone, '511111111');
    await user.click(within(dialog).getByRole('button', { name: 'Send verification code' }));

    await waitFor(() => expect(sendPhoneCodeAction).toHaveBeenCalledOnce());
    const sentPhone = sendPhoneCodeAction.mock.calls[0][0];
    expect(sentPhone).toEqual({ countryCode: '+966', phone: '511111111' });
    expect(notify.success).toHaveBeenCalledWith('Code sent.');
    expect(screen.getByText('+966500000000')).toBeInTheDocument();
    await user.type(await screen.findByRole('textbox', { name: 'Digit 1 of 4' }), '1234');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    await waitFor(() => expect(verifyPhoneAction).toHaveBeenCalledWith('+966511111111', '1234'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Phone verification is temporarily unavailable');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('toasts a backend validation message and keeps the phone form open', async () => {
    sendPhoneCodeAction.mockResolvedValueOnce({ ok: false, error: { kind: 'validation', status: 422, serverMessage: 'Phone already in use.' } });
    const { user } = renderTab();
    await user.click(screen.getByRole('button', { name: /Mobile number/ }));
    const dialog = await screen.findByRole('dialog');
    const phone = within(dialog).getByRole('textbox', { name: 'Mobile number' });
    await user.clear(phone);
    await user.type(phone, '511111111');
    await user.click(within(dialog).getByRole('button', { name: 'Send verification code' }));
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith('Phone already in use.'));
    expect(within(dialog).getByRole('textbox', { name: 'Mobile number' })).toHaveValue('511111111');
  });

  it('rejects a short national number before sending a code', async () => {
    const { user } = renderTab();
    await user.click(screen.getByRole('button', { name: /Mobile number/ }));
    const dialog = await screen.findByRole('dialog');
    const phone = within(dialog).getByRole('textbox', { name: 'Mobile number' });
    await user.clear(phone);
    await user.type(phone, '1234567');
    await user.click(within(dialog).getByRole('button', { name: 'Send verification code' }));
    expect(await within(dialog).findByText(/at least 8 digits/)).toBeInTheDocument();
    expect(sendPhoneCodeAction).not.toHaveBeenCalled();
  });

  it('uploads a license and updates its status after success', async () => {
    const { user } = renderTab({ ...profile, licenseUploaded: false });
    await user.click(screen.getByRole('button', { name: /Driving license/ }));
    const dialog = await screen.findByRole('dialog');
    const input = dialog.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('License input is missing');
    const file = new File(['license'], 'license.jpg', { type: 'image/jpeg' });
    await user.upload(input, file);
    await user.click(within(dialog).getByRole('button', { name: 'Upload' }));
    await waitFor(() => expect(uploadLicenseAction).toHaveBeenCalledOnce());
    expect(uploadLicenseAction.mock.calls[0][0].get('license')).toEqual(file);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('Driving license');
  });

  it('keeps deletion errors in the confirmation and leaves the page only after success', async () => {
    deleteAccountAction.mockResolvedValueOnce({ ok: false, error: { kind: 'server' } });
    const { user } = renderTab();
    await user.click(screen.getByRole('button', { name: /Delete account/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete account' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(router.replace).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Delete account' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(router.refresh).toHaveBeenCalled();
  });
});
