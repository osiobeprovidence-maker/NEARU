import React from 'react';
import { useLocation } from '../contexts/LocationContext';

export default function LocationDebug() {
  if (import.meta.env.PROD) return null;

  const {
    geoState,
    permissionState,
    position,
    accuracy,
    radiusKm,
    locationLabel,
    isManual,
    isWatching,
    error,
    reverseGeocodeResult,
    city,
  } = useLocation();

  const isSecure = window.isSecureContext;
  const hasGeolocation = !!navigator.geolocation;

  return (
    <div className="fixed bottom-20 right-4 z-[200] bg-zinc-900 text-white text-[10px] font-mono p-3 rounded-xl shadow-2xl max-w-[260px] opacity-80 hover:opacity-100 transition-opacity">
      <div className="font-bold text-[11px] mb-1 text-zinc-300">Location Debug</div>
      <div className="space-y-0.5">
        <div>Support: {hasGeolocation ? 'YES' : 'NO'}</div>
        <div>HTTPS: {isSecure ? 'YES' : 'NO'}</div>
        <div>Permission: {permissionState}</div>
        <div>State: {geoState}</div>
        <div>Lat: {position?.latitude?.toFixed(6) ?? '—'}</div>
        <div>Lng: {position?.longitude?.toFixed(6) ?? '—'}</div>
        <div>Accuracy: {accuracy ? `${Math.round(accuracy)}m` : '—'}</div>
        <div>Radius: {radiusKm} km</div>
        <div>Watching: {isWatching ? 'YES' : 'NO'}</div>
        <div>Manual: {isManual ? 'YES' : 'NO'}</div>
        <div>City: {city || '—'}</div>
        <div>Label: {locationLabel || '—'}</div>
        <div>Geocode: {reverseGeocodeResult ? 'OK' : 'none'}</div>
        {error && <div className="text-rose-400">Error: {error.message}</div>}
      </div>
    </div>
  );
}
