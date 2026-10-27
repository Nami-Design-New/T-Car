"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import {
  FiSearch,
  FiMapPin,
  FiNavigation,
  FiX,
  FiLoader,
} from "react-icons/fi";
import { Dialog } from "@/shared/ui/Dialog";
import { FormInput } from "../Form";
import { Button } from "../Button";
import type { LocationData } from "@/shared/lib/location";

export interface MapLocationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (location: LocationData) => void;
  title?: string;
  initialLocation?: LocationData | null;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 24.7136,
  lng: 46.6753,
};

/** First locale the Maps script was requested with; see the note in the component. */
let pinnedMapsLanguage: string | undefined;

/** The first-level administrative area (e.g. "Riyadh Province"), if the geocoder has one. */
function regionOf(result: google.maps.GeocoderResult): string | undefined {
  return result.address_components?.find((component) =>
    component.types.includes("administrative_area_level_1"),
  )?.long_name;
}

export default function MapLocationModal({
  open,
  onClose,
  onConfirm,
  title,
  initialLocation,
}: MapLocationModalProps) {
  const t = useTranslations("rentalSearch.map");
  const [position, setPosition] = useState(defaultCenter);
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<string | undefined>(
    initialLocation?.region,
  );
  const [search, setSearch] = useState("");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[] | null
  >(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const locale = useLocale();
  const displayTitle = title ?? t("title");

  // The Maps script is injected once per page session, and useJsApiLoader
  // throws ("must not be called again with different options") if it is later
  // called with a different `language`. Pinning the locale that was active on
  // first mount keeps the loader params stable, so switching language can
  // never retrigger the script or crash the render. The pin lives at module
  // level because callers mount this dialog only while it is open, so it
  // remounts on every open.
  // Trade-off: the map keeps the language it first loaded with until the page
  // is reloaded. That is a limit of the Maps API, not something we can fix
  // here -- the script exposes no way to change its language after load.
  pinnedMapsLanguage ??= locale;
  const mapsLanguage = pinnedMapsLanguage;

  const searchTimeout = useRef<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    language: mapsLanguage,
    libraries: ["places"],
  });

  useEffect(() => {
    if (!open || !initialLocation) return;
    setPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
    setAddress(initialLocation.address);
  }, [initialLocation, open]);

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
      if (status === "OK" && results?.[0]) {
        setAddress(results[0].formatted_address);
        setRegion(regionOf(results[0]));
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
      setLocationError(t("unsupported"));
      return;
    }

    setIsLocating(true);
    setLocationError("");

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
            ? t("permissionDenied")
            : t("unavailable"),
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
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

      service.getPlacePredictions(
        { input: search, language: mapsLanguage },
        (preds) => {
          setPredictions(preds || null);
        },
      );
    }, 300);

    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  }, [search, isLoaded, mapsLanguage]);

  const selectPrediction = (placeId: string, description?: string) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ placeId }, (results, status) => {
      if (status === "OK" && results?.[0] && results[0].geometry?.location) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();

        // بيحرك الخريطة فورًا (الـ useEffect فوق بيمسك أي تغيير في position)
        setPosition({ lat, lng });
        setAddress(results[0].formatted_address || description || "");
        setRegion(regionOf(results[0]));
        setPredictions(null);
        setSearch("");
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} size="xl" className="map_modal">
      <Dialog.Header>
        <Dialog.Title>{displayTitle}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <div className="search_box relative mb-5 flex w-full items-center">
          <div className="search_input flex-1">
            <FormInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              icon={<FiSearch />}
            />
          </div>
          {search && (
            <button
              type="button"
              className="clear_search text-text-placeholder hover:text-text-primary absolute end-7 flex cursor-pointer items-center border-0 bg-transparent text-base"
              onClick={() => {
                setSearch("");
                setPredictions(null);
              }}
            >
              <FiX />
            </button>
          )}

          {predictions && predictions.length > 0 && (
            <ul className="predictions_list border-stroke-light bg-surface-elevated absolute inset-x-0 top-[calc(100%+6px)] z-20 m-0 max-h-[260px] list-none overflow-y-auto rounded-md border p-2 shadow-[0_8px_24px_rgba(30,30,30,0.1)]">
              {predictions.map((p) => (
                <li
                  key={p.place_id}
                  className="hover:bg-surface-card-primary flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 transition duration-150"
                  onClick={() => selectPrediction(p.place_id, p.description)}
                >
                  <FiMapPin className="text-action-primary shrink-0" />
                  <div className="flex min-w-0 flex-col overflow-hidden">
                    <span className="main_text text-text-primary overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap">
                      {p.structured_formatting?.main_text || p.description}
                    </span>
                    {p.structured_formatting?.secondary_text && (
                      <span className="secondary_text text-text-subtle text-xs">
                        {p.structured_formatting.secondary_text}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="map_placeholder border-stroke-heavy bg-surface-on-background flex h-[420px] flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed max-md:h-[300px]">
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
              <Marker position={position} draggable onDragEnd={handleDragEnd} />
            </GoogleMap>
          ) : (
            <>
              <FiMapPin className="text-action-primary text-[70px]" />
              <span className="text-text-subtle font-semibold">
                {t("loading")}
              </span>
            </>
          )}
        </div>

        {address && <p className="selected_address">{address}</p>}
        {locationError && (
          <p className="location_error text-status-error mt-2 mb-0 text-[13px]">
            {locationError}
          </p>
        )}
      </Dialog.Body>

      <Dialog.Footer>
        <div className="location_actions mt-6 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={useCurrentLocation}
            disabled={isLocating}
            loading={isLocating}
            icon={<FiNavigation />}
          >
            {/* {isLocating ? <FiLoader className="spin" /> : <FiNavigation />} */}
            <span>{t("useCurrentLocation")}</span>
          </Button>

          <Button
            type="button"
            onClick={() =>
              onConfirm({
                lat: position.lat,
                lng: position.lng,
                address,
                region,
              })
            }
          >
            {t("confirm")}
          </Button>
        </div>
      </Dialog.Footer>
    </Dialog>
  );
}
