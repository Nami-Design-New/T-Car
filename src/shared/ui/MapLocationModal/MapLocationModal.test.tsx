import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import MapLocationModal from './MapLocationModal';

vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Marker: () => null,
  useJsApiLoader: () => ({ isLoaded: false }),
}));

describe('MapLocationModal', () => {
  it('confirms the default map location', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <MapLocationModal open onClose={vi.fn()} onConfirm={onConfirm} />
    );

    expect(screen.getByText('Set pickup location')).toBeInTheDocument();
    expect(screen.getByText('Loading map...')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm location' }));

    expect(onConfirm).toHaveBeenCalledWith({
      lat: 24.7136,
      lng: 46.6753,
      address: '',
    });
  });
});
