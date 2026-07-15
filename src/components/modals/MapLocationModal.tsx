'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { FiMapPin, FiNavigation, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import type { MapLocationModalProps } from '@/types/car';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 24.7136,
  lng: 46.6753,
};

export default function MapLocationModal({
  open,
  onClose,
  onConfirm,
}: MapLocationModalProps) {
  const router = useRouter();

  const [position, setPosition] = useState(defaultCenter);
  const [address, setAddress] = useState('');

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    language: 'ar',
  });

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setAddress(results[0].formatted_address);
        }
      }
    );
  }, []);

  const handleDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setPosition({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const useCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      setPosition({ lat, lng });
      reverseGeocode(lat, lng);
    });
  };

  if (!open) return null;

  return (
    <div className="modal_overlay">
      <div className="map_modal">
        <button className="close_btn" onClick={onClose}>
          <FiX />
        </button>

        <div className="modal_header">
          <h2>حدد موقع الاستلام</h2>
          <p>اختر موقعك على الخريطة أو استخدم موقعك الحالي.</p>
        </div>

        <div className="map_placeholder">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={position}
              zoom={14}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
              }}
            >
              <Marker
                position={position}
                draggable
                onDragEnd={handleDragEnd}
              />
            </GoogleMap>
          ) : (
            <>
              <FiMapPin />
              <span>جاري تحميل الخريطة...</span>
            </>
          )}
        </div>

        {address && (
          <p className="selected_address">
            {address}
          </p>
        )}

        <div className="location_actions">
          <button
            type="button"
            className="current_location"
            onClick={useCurrentLocation}
          >
            <FiNavigation />
            <span>استخدام موقعي الحالي</span>
          </button>

          <button
            type="button"
            className="confirm_btn"
            onClick={() => {
              onConfirm({
                lat: position.lat,
                lng: position.lng,
                address,
              });

              router.push(
                `/cars?lat=${position.lat}&lng=${position.lng}&address=${encodeURIComponent(address)}`
              );
            }}
          >
            تأكيد الموقع
          </button>
        </div>
      </div>
    </div>
  );
}