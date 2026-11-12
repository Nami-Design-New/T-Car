import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import MapLocationModal from './MapLocationModal';

const { mapsLoaded } = vi.hoisted(() => ({ mapsLoaded: { value: false } }));

vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Marker: ({
    icon,
    onDragEnd,
  }: {
    icon?: { url: string };
    onDragEnd?: (event: unknown) => void;
  }) => (
    <button
      type="button"
      data-testid="map-pin"
      data-icon={icon?.url}
      // Simulates dragging the pin to central Riyadh.
      onClick={() =>
        onDragEnd?.({ latLng: { lat: () => 24.7136, lng: () => 46.6753 } })
      }
    />
  ),
  Circle: ({ radius }: { radius: number }) => (
    <div data-testid="allowed-area" data-radius={radius} />
  ),
  useJsApiLoader: () => ({ isLoaded: mapsLoaded.value }),
}));

/** The Maps constructors the dialog uses once the script is loaded. */
function stubGoogle() {
  const win = window as unknown as { google?: unknown };
  win.google = {
    maps: {
      Size: class {},
      Point: class {},
      Geocoder: class {
        geocode() {}
      },
    },
  };
  mapsLoaded.value = true;
  return () => {
    mapsLoaded.value = false;
    delete win.google;
  };
}

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

  it('uses a supplied saved location, including its region', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <MapLocationModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        initialLocation={{
          lat: 21.4858,
          lng: 39.1925,
          address: 'Makkah',
          region: 'Makkah Region',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Confirm location' }));

    expect(onConfirm).toHaveBeenCalledWith({
      lat: 21.4858,
      lng: 39.1925,
      address: 'Makkah',
      region: 'Makkah Region',
    });
  });

  it('draws the allowed area as a circle in metres, with the design pin', () => {
    const restore = stubGoogle();
    try {
      renderWithIntl(
        <MapLocationModal
          open
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          allowedArea={{ center: { lat: 30.04, lng: 31.23 }, radiusKm: 60 }}
        />,
      );
      expect(screen.getByTestId('allowed-area')).toHaveAttribute(
        'data-radius',
        '60000',
      );
      expect(screen.getByTestId('map-pin')).toHaveAttribute(
        'data-icon',
        '/icons/map-marker.svg',
      );
    } finally {
      restore();
    }
  });

  it('allows confirming inside the allowed distance and shows the limit', async () => {
    const onConfirm = vi.fn();
    renderWithIntl(
      <MapLocationModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        // The default map point is central Riyadh.
        allowedArea={{ center: { lat: 24.7136, lng: 46.6753 }, radiusKm: 20 }}
      />,
    );
    expect(
      screen.getByText(/The location must be within/),
    ).toHaveTextContent('The location must be within 20 km of the showroom');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm location' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('opens at the area centre when the start point is outside it', async () => {
    const onConfirm = vi.fn();
    renderWithIntl(
      <MapLocationModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        // Cairo branch, 20 km: the default point (central Riyadh) is outside.
        allowedArea={{ center: { lat: 30.04, lng: 31.23 }, radiusKm: 20 }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm location' }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 30.04, lng: 31.23 }),
    );
  });

  it('snaps a pin dragged outside back to the last point inside', async () => {
    const restore = stubGoogle();
    try {
      const onConfirm = vi.fn();
      renderWithIntl(
        <MapLocationModal
          open
          onClose={vi.fn()}
          onConfirm={onConfirm}
          initialLocation={{
            lat: 30.05,
            lng: 31.24,
            address: 'Inside',
            region: 'Cairo',
          }}
          allowedArea={{ center: { lat: 30.04, lng: 31.23 }, radiusKm: 20 }}
        />,
      );
      await userEvent.click(screen.getByTestId('map-pin'));
      expect(screen.getByRole('alert')).toHaveTextContent('20 km');
      await userEvent.click(
        screen.getByRole('button', { name: 'Confirm location' }),
      );
      expect(onConfirm).toHaveBeenCalledWith({
        lat: 30.05,
        lng: 31.24,
        address: 'Inside',
        region: 'Cairo',
      });
    } finally {
      restore();
    }
  });

  it('puts "use my location" on the map as a floating button', async () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });
    renderWithIntl(
      <MapLocationModal open onClose={vi.fn()} onConfirm={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: "Use my current location" });
    expect(button.closest('.map_placeholder')).not.toBeNull();
    await userEvent.click(button);
    expect(getCurrentPosition).toHaveBeenCalled();
  });
});
