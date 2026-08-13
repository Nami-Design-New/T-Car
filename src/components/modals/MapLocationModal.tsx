'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { FiSearch, FiMapPin, FiNavigation, FiX, FiLoader } from 'react-icons/fi';
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
  const [position, setPosition] = useState(defaultCenter);
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const searchTimeout = useRef<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    language: 'ar',
    libraries: ['places'],
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // أي تغيير في position يحرك الخريطة فعليًا بسلاسة (panTo)
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo(position);
      mapRef.current.setZoom(16);
    }
  }, [position]);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        setAddress(results[0].formatted_address);
      }
    });
  }, []);

  const handleDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setPosition({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'تم رفض إذن الوصول للموقع'
            : 'تعذر تحديد موقعك الحالي'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search / Autocomplete
  useEffect(() => {
    if (!isLoaded) return;

    if (!search) {
      setPredictions(null);
      return;
    }

    if (searchTimeout.current) {
      window.clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = window.setTimeout(() => {
      if (!window.google) return;

      const service = new window.google.maps.places.AutocompleteService();

      service.getPlacePredictions({ input: search, language: 'ar' }, (preds) => {
        setPredictions(preds || null);
      });
    }, 300);

    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  }, [search, isLoaded]);

  const selectPrediction = (placeId: string, description?: string) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ placeId }, (results, status) => {
      if (status === 'OK' && results?.[0] && results[0].geometry?.location) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();

        // بيحرك الخريطة فورًا (الـ useEffect فوق بيمسك أي تغيير في position)
        setPosition({ lat, lng });
        setAddress(results[0].formatted_address || description || '');
        setPredictions(null);
        setSearch('');
      }
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
        </div>

        <div className="search_box">
          <FiSearch className="search_icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن عنوان أو مكان..."
          />
          {search && (
            <button
              type="button"
              className="clear_search"
              onClick={() => {
                setSearch('');
                setPredictions(null);
              }}
            >
              <FiX />
            </button>
          )}

          {predictions && predictions.length > 0 && (
            <ul className="predictions_list">
              {predictions.map((p) => (
                <li
                  key={p.place_id}
                  onClick={() => selectPrediction(p.place_id, p.description)}
                >
                  <FiMapPin />
                  <div>
                    <span className="main_text">
                      {p.structured_formatting?.main_text || p.description}
                    </span>
                    {p.structured_formatting?.secondary_text && (
                      <span className="secondary_text">
                        {p.structured_formatting.secondary_text}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="map_placeholder">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={position}
              zoom={14}
              onLoad={onMapLoad}
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

        {locationError && (
          <p className="location_error">{locationError}</p>
        )}

        <div className="location_actions">
          <button
            type="button"
            className="current_location"
            onClick={useCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <FiLoader className="spin" />
            ) : (
              <FiNavigation />
            )}
            <span>{isLocating ? 'جاري التحديد...' : 'استخدام موقعي الحالي'}</span>
          </button>

          <button
            type="button"
            className="confirm_btn"
            onClick={() =>
              onConfirm({
                lat: position.lat,
                lng: position.lng,
                address,
              })
            }
          >
            تأكيد الموقع
          </button>
        </div>
      </div>
    </div>
  );
}
