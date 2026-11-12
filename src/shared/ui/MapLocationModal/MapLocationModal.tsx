"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Circle,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  FiSearch,
  FiMapPin,
  FiX,
  FiLoader,
} from "react-icons/fi";
import { Dialog } from "@/shared/ui/Dialog";
import { FormInput } from "../Form";
import { Button } from "../Button";
import { regionOf } from "@/shared/lib/geocode";
import { isWithinKm } from "@/shared/lib/geo";
import { ICONS } from "@/shared/config/assets";
import type { LocationData } from "@/shared/lib/location";

export interface MapLocationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (location: LocationData) => void;
  title?: string;
  initialLocation?: LocationData | null;
  /**
   * The area a location must be in (e.g. a branch's delivery range), drawn as a
   * circle; the map opens fitted to it. A point outside it cannot be confirmed.
   */
  allowedArea?: { center: { lat: number; lng: number }; radiusKm: number };
}

// Design: #1F7FFA1A (the brand blue at 0x1A ≈ 10% opacity).
const allowedAreaOptions = {
  strokeColor: "#1F7FFA",
  strokeOpacity: 0.6,
  strokeWeight: 1,
  fillColor: "#1F7FFA",
  fillOpacity: 0x1a / 0xff,
  clickable: false,
};

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

export default function MapLocationModal({
  open,
  onClose,
  onConfirm,
  title,
  initialLocation,
  allowedArea,
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
  // A point outside the allowed area cannot be confirmed (create-booking 422
  // validation.booking_location_outside_branch otherwise).
  const outsideAllowedArea =
    allowedArea !== undefined &&
    !isWithinKm(allowedArea.center, position, allowedArea.radiusKm);
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

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      // Show the whole allowed area first; the marker stays where it is.
      if (allowedArea && window.google) {
        const bounds = new window.google.maps.Circle({
          center: allowedArea.center,
          radius: allowedArea.radiusKm * 1000,
        }).getBounds();
        if (bounds) map.fitBounds(bounds);
      }
    },
    [allowedArea],
  );

  // أي تغيير في position يحرك الخريطة فعليًا بسلاسة (panTo)
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo(position);
      // With an allowed area, keep the zoom that shows it.
      if (!allowedArea) mapRef.current.setZoom(16);
    }
  }, [allowedArea, position]);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      { location: { lat, lng }, language: "ar" },
      (results, status) => {
        if (status === "OK" && results?.[0]) {
          setAddress(results[0].formatted_address);
          setRegion(regionOf(results[0]));
        }
      },
    );
  }, []);

  const isAllowed = useCallback(
    (point: { lat: number; lng: number }) =>
      !allowedArea ||
      isWithinKm(allowedArea.center, point, allowedArea.radiusKm),
    [allowedArea],
  );

  // The last point inside the allowed area, where the pin returns to.
  const lastAllowed = useRef<{
    position: { lat: number; lng: number };
    address: string;
    region?: string;
  } | null>(null);
  // True after a point outside the area was rejected, until the next valid one.
  const [snappedBack, setSnappedBack] = useState(false);

  useEffect(() => {
    if (isAllowed(position))
      lastAllowed.current = { position, address, region };
  }, [address, isAllowed, position, region]);

  /**
   * Moves the pin. Outside the allowed area the pin goes back to the last point
   * inside it (or the area's centre) and the limit message is shown. Returns
   * whether the point was accepted.
   */
  const moveTo = useCallback(
    (point: { lat: number; lng: number }): boolean => {
      if (isAllowed(point)) {
        setSnappedBack(false);
        setPosition(point);
        return true;
      }
      setSnappedBack(true);
      const back = lastAllowed.current;
      if (back) {
        // A new object, so a dragged marker is moved back too.
        setPosition({ ...back.position });
        setAddress(back.address);
        setRegion(back.region);
      } else if (allowedArea) {
        setPosition({ ...allowedArea.center });
        setAddress("");
        setRegion(undefined);
        reverseGeocode(allowedArea.center.lat, allowedArea.center.lng);
      }
      return false;
    },
    [allowedArea, isAllowed, reverseGeocode],
  );

  // Opening: the given point when it is allowed, else the area's centre.
  useEffect(() => {
    if (!open) return;
    lastAllowed.current = null;
    setSnappedBack(false);
    if (initialLocation && isAllowed(initialLocation)) {
      setPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
      setAddress(initialLocation.address);
      setRegion(initialLocation.region);
    } else if (allowedArea) {
      setPosition({ ...allowedArea.center });
      setAddress("");
      setRegion(undefined);
      reverseGeocode(allowedArea.center.lat, allowedArea.center.lng);
    } else if (initialLocation) {
      setPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
      setAddress(initialLocation.address);
      setRegion(initialLocation.region);
    }
    // Only when the dialog opens or its inputs change, not on every pin move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocation, open, allowedArea]);

  const handleDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    if (moveTo({ lat, lng })) reverseGeocode(lat, lng);
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

        if (moveTo({ lat, lng })) reverseGeocode(lat, lng);
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

    geocoder.geocode({ placeId, language: "ar" }, (results, status) => {
      if (status === "OK" && results?.[0] && results[0].geometry?.location) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();

        // بيحرك الخريطة فورًا (الـ useEffect فوق بيمسك أي تغيير في position)
        if (moveTo({ lat, lng })) {
          setAddress(results[0].formatted_address || description || "");
          setRegion(regionOf(results[0]));
        }
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

        <div className="map_placeholder border-stroke-heavy bg-surface-on-background relative flex h-[420px] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border-2 border-dashed max-md:h-[300px]">
          {/* Use my current location: a floating button in the map's bottom-left corner. */}
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={isLocating}
            aria-label={t("useCurrentLocation")}
            aria-busy={isLocating}
            title={t("useCurrentLocation")}
            className="bg-surface-elevated text-action-primary absolute bottom-3 left-3 z-10 grid size-11 place-items-center rounded-full border-0 shadow-[0_4px_14px_rgba(30,30,30,0.18)] transition-opacity hover:opacity-90 disabled:cursor-wait"
          >
            {isLocating ? (
              <FiLoader className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Image
                src={ICONS.gps.src}
                width={ICONS.gps.width}
                height={ICONS.gps.height}
                alt=""
                aria-hidden="true"
              />
            )}
          </button>
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
              {allowedArea && (
                <Circle
                  center={allowedArea.center}
                  radius={allowedArea.radiusKm * 1000}
                  options={allowedAreaOptions}
                />
              )}
              <Marker
                position={position}
                draggable
                onDragEnd={handleDragEnd}
                // The design pin; its tip (bottom centre) sits on the point.
                icon={{
                  url: ICONS.mapMarker.src,
                  scaledSize: new window.google.maps.Size(
                    ICONS.mapMarker.width,
                    ICONS.mapMarker.height,
                  ),
                  anchor: new window.google.maps.Point(
                    ICONS.mapMarker.width / 2,
                    ICONS.mapMarker.height,
                  ),
                }}
              />
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

        {locationError && (
          <p className="text-status-error mt-2 mb-0 text-[13px]">
            {locationError}
          </p>
        )}
      </Dialog.Body>

      <Dialog.Footer className={"flex flex-col"}>
        {address && (
          <p className="text-text-primary mt-3 mb-0 flex items-center gap-2 text-sm font-bold">
            <Image
              src={ICONS.locationChip.src}
              width={ICONS.locationChip.width}
              height={ICONS.locationChip.height}
              alt=""
              aria-hidden="true"
              className="size-6 shrink-0"
            />
            <span className="min-w-0">{address}</span>
          </p>
        )}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            className="w-full"
            disabled={outsideAllowedArea}
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
          {allowedArea && (
            <p
              className={
                outsideAllowedArea || snappedBack
                  ? "text-status-error mt-3 mb-0 text-sm"
                  : "text-text-primary mt-3 mb-0 text-sm"
              }
              role={outsideAllowedArea || snappedBack ? "alert" : undefined}
            >
              {t.rich("allowedDistance", {
                distance: allowedArea.radiusKm.toLocaleString(locale),
                strong: (chunks) => (
                  <strong className="text-action-primary font-bold">
                    {chunks}
                  </strong>
                ),
              })}
            </p>
          )}
        </div>
      </Dialog.Footer>
    </Dialog>
  );
}
