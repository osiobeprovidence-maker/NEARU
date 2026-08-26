import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GeoLocation,
  GeoPoint,
  ReverseGeocodeResult,
  reverseGeocode,
  formatLocationLabel,
  storeLocation,
  getStoredLocation,
  storeRadius,
  getStoredRadius,
  storeManualLocation,
  getStoredManualLocation,
  storeLocationMode,
  getStoredLocationMode,
  formatDistance,
} from '../lib/geo';

export type LocationPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unavailable';

export type LocationState =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'locating'
  | 'active'
  | 'updating'
  | 'denied'
  | 'unavailable'
  | 'error'
  | 'manual';

export interface LocationError {
  code: number | null;
  message: string;
}

interface UseLocationReturn {
  state: LocationState;
  permissionState: LocationPermissionState;
  position: GeoLocation | null;
  reverseGeocode: ReverseGeocodeResult | null;
  locationLabel: string;
  radius: number;
  radiusLabel: string;
  accuracy: number | null;
  isWatching: boolean;
  isManual: boolean;
  manualLocation: GeoPoint | null;
  error: LocationError | null;
  requestLocation: () => void;
  startWatching: () => void;
  stopWatching: () => void;
  setRadius: (km: number) => void;
  setManualLocation: (point: GeoPoint) => void;
  useCurrentLocation: () => void;
  clearLocation: () => void;
  refreshGeocode: () => void;
}

const WATCH_INTERVAL_MS = 30000;
const MIN_DISTANCE_CHANGE_KM = 0.2;

function getPermissionState(): LocationPermissionState {
  if (!navigator.geolocation) return 'unavailable';
  if (!window.isSecureContext) return 'unavailable';

  if ('permissions' in navigator) {
    try {
      const result = navigator.permissions.query({ name: 'geolocation' });
      if (result instanceof Promise) {
        return 'unknown';
      }
    } catch {
      // permissions API may not support geolocation
    }
  }

  return 'unknown';
}

export function useLocation(): UseLocationReturn {
  const [state, setState] = useState<LocationState>('idle');
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('unknown');
  const [position, setPosition] = useState<GeoLocation | null>(() => getStoredLocation());
  const [geocodeResult, setGeocodeResult] = useState<ReverseGeocodeResult | null>(null);
  const [radius, setRadiusState] = useState<number>(() => getStoredRadius());
  const [error, setError] = useState<LocationError | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [isManual, setIsManual] = useState(() => getStoredLocationMode() === 'manual');
  const [manualLocation, setManualLocationState] = useState<GeoPoint | null>(() => getStoredManualLocation());
  const [locationLabel, setLocationLabel] = useState('Unknown location');

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeoPoint | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation || !window.isSecureContext) {
      setPermissionState('unavailable');
      return;
    }

    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (!mountedRef.current) return;
          setPermissionState(result.state as LocationPermissionState);
          result.addEventListener('change', () => {
            if (mountedRef.current) {
              setPermissionState(result.state as LocationPermissionState);
            }
          });
        })
        .catch(() => {
          if (mountedRef.current) setPermissionState('unknown');
        });
    }
  }, []);

  const doReverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const result = await reverseGeocode(lat, lng);
      if (mountedRef.current) {
        setGeocodeResult(result);
        setLocationLabel(
          formatLocationLabel(result.city, result.neighbourhood, result.state)
        );
      }
    } catch {
      if (mountedRef.current) {
        setLocationLabel(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
      }
    }
  }, []);

  const processPosition = useCallback(
    (pos: GeolocationPosition) => {
      const loc: GeoLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        capturedAt: Date.now(),
      };

      if (!mountedRef.current) return;

      setPosition(loc);
      storeLocation(loc);
      setError(null);

      if (
        state === 'requesting' ||
        state === 'idle' ||
        state === 'locating'
      ) {
        setState('granted');
        setTimeout(() => {
          if (mountedRef.current) setState('active');
        }, 100);
      } else if (state === 'active' || state === 'updating') {
        setState('updating');
        setTimeout(() => {
          if (mountedRef.current) setState('active');
        }, 500);
      }

      const prev = lastPositionRef.current;
      if (prev) {
        const { haversineDistance } = require('../lib/geo');
        const dist = haversineDistance(
          { latitude: prev.latitude, longitude: prev.longitude },
          { latitude: loc.latitude, longitude: loc.longitude }
        );
        if (dist < MIN_DISTANCE_CHANGE_KM) return;
      }

      lastPositionRef.current = { latitude: loc.latitude, longitude: loc.longitude };
      doReverseGeocode(loc.latitude, loc.longitude);
    },
    [state, doReverseGeocode]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (!mountedRef.current) return;

    const errorMap: Record<number, { state: LocationState; message: string }> = {
      1: { state: 'denied', message: 'Location permission was denied.' },
      2: { state: 'unavailable', message: "We couldn't determine your location." },
      3: { state: 'error', message: 'Location is taking too long. Try again.' },
    };

    const mapped = errorMap[err.code] || {
      state: 'error',
      message: "We couldn't get your location right now. Try again.",
    };

    setState(mapped.state);
    setError({ code: err.code, message: mapped.message });
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState('unavailable');
      setError({ code: null, message: "Your browser doesn't support location services." });
      return;
    }

    if (!window.isSecureContext) {
      setState('error');
      setError({ code: null, message: 'HTTPS is required for location services. Please use HTTPS.' });
      return;
    }

    setState('requesting');
    setError(null);

    navigator.geolocation.getCurrentPosition(processPosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  }, [processPosition, handleError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || isWatching) return;

    const id = navigator.geolocation.watchPosition(
      processPosition,
      handleError,
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: WATCH_INTERVAL_MS,
      }
    );

    watchIdRef.current = id;
    setIsWatching(true);
  }, [isWatching, processPosition, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const setRadius = useCallback((km: number) => {
    setRadiusState(km);
    storeRadius(km);
  }, []);

  const setManualLocationFn = useCallback(
    (point: GeoPoint) => {
      setManualLocationState(point);
      setIsManual(true);
      storeManualLocation(point);
      storeLocationMode('manual');
      stopWatching();

      const loc: GeoLocation = {
        ...point,
        accuracy: 0,
        capturedAt: Date.now(),
      };
      setPosition(loc);
      storeLocation(loc);
      setState('manual');
      doReverseGeocode(point.latitude, point.longitude);
    },
    [stopWatching, doReverseGeocode]
  );

  const useCurrentLocation = useCallback(() => {
    setIsManual(false);
    setManualLocationState(null);
    storeManualLocation(null);
    storeLocationMode('browser');
    setState('idle');
    requestLocation();
  }, [requestLocation]);

  const clearLocation = useCallback(() => {
    stopWatching();
    setPosition(null);
    setGeocodeResult(null);
    setLocationLabel('Unknown location');
    setError(null);
    setState('idle');
    localStorage.removeItem('rally_current_location');
  }, [stopWatching]);

  const refreshGeocode = useCallback(() => {
    const loc = position;
    if (loc) {
      doReverseGeocode(loc.latitude, loc.longitude);
    }
  }, [position, doReverseGeocode]);

  useEffect(() => {
    if (isManual && manualLocation) {
      doReverseGeocode(manualLocation.latitude, manualLocation.longitude);
    } else if (position && !geocodeResult) {
      doReverseGeocode(position.latitude, position.longitude);
    }
  }, []);

  useEffect(() => {
    if (position) {
      setLocationLabel(
        geocodeResult
          ? formatLocationLabel(geocodeResult.city, geocodeResult.neighbourhood, geocodeResult.state)
          : `${position.latitude.toFixed(2)}, ${position.longitude.toFixed(2)}`
      );
    }
  }, [geocodeResult, position]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  const effectivePoint = isManual ? manualLocation : position;

  return {
    state,
    permissionState,
    position: isManual && manualLocation
      ? { ...manualLocation, accuracy: 0, capturedAt: Date.now() }
      : position,
    reverseGeocode: geocodeResult,
    locationLabel,
    radius,
    radiusLabel: `${radius} km`,
    accuracy: position?.accuracy ?? null,
    isWatching,
    isManual,
    manualLocation,
    error,
    requestLocation,
    startWatching,
    stopWatching,
    setRadius,
    setManualLocation: setManualLocationFn,
    useCurrentLocation,
    clearLocation,
    refreshGeocode,
  };
}
