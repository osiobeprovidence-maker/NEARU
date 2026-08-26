import React, { useState, useEffect } from 'react';
import PageShell from '../components/PageShell';
import { MapPin, MapPinOff, Crosshair, Radio, Loader2, CheckCircle2, RefreshCw, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocation } from '../contexts/LocationContext';
import { NIGERIAN_CITIES, formatDistance } from '../lib/geo';

const RADII = [1, 2, 5, 10, 25, 50];

export default function LocationSettings() {
  const {
    city,
    radiusKm,
    geoState,
    permissionState,
    position,
    locationLabel,
    accuracy,
    isManual,
    error,
    requestLocation,
    useCurrentLocation,
    setRadiusKmAction,
    setManualLocation,
  } = useLocation();

  const [selectedRadius, setSelectedRadius] = useState(radiusKm);

  useEffect(() => {
    setSelectedRadius(radiusKm);
  }, [radiusKm]);

  const handleRadiusChange = (km: number) => {
    setSelectedRadius(km);
    setRadiusKmAction(km);
  };

  const handleManualCitySelect = (cityName: string) => {
    const cityData = NIGERIAN_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );
    if (cityData) {
      setManualLocation({ latitude: cityData.lat, longitude: cityData.lng });
    }
  };

  const hasRealLocation = geoState === 'active' || geoState === 'updating';
  const isLocating = geoState === 'requesting' || geoState === 'locating';

  return (
    <PageShell title="Location Settings">
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        {/* Location Access Status */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="p-5 sm:p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Location Access</h3>
            
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {isManual ? (
                    <Smartphone className="w-5 h-5 text-amber-500" />
                  ) : hasRealLocation ? (
                    <Crosshair className="w-5 h-5 text-emerald-500" />
                  ) : isLocating ? (
                    <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                  ) : (
                    <MapPinOff className="w-5 h-5 text-zinc-400" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-zinc-900">
                      {isManual
                        ? 'Manual Location'
                        : hasRealLocation
                          ? 'GPS Location Active'
                          : isLocating
                            ? 'Finding your location...'
                            : 'Location Unavailable'}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {isManual
                        ? `Using ${city || 'selected'} city`
                        : hasRealLocation
                          ? `Accuracy: ${accuracy ? formatDistance(accuracy / 1000) : 'Unknown'}`
                          : permissionState === 'denied'
                            ? 'Permission denied by browser'
                            : 'Tap below to enable'}
                    </div>
                  </div>
                </div>
                {hasRealLocation && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>

              {position && !isManual && (
                <div className="text-xs text-zinc-400 font-mono mt-2 pt-2 border-t border-zinc-200">
                  {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={hasRealLocation || isManual ? useCurrentLocation : requestLocation}
                disabled={isLocating}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  hasRealLocation
                    ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                    : "bg-zinc-900 text-white hover:bg-zinc-800",
                  isLocating && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Locating...
                  </>
                ) : hasRealLocation ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Refresh Location
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Enable Location
                  </>
                )}
              </button>
              {isManual && (
                <button
                  onClick={useCurrentLocation}
                  className="px-4 py-3 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
                >
                  Use GPS
                </button>
              )}
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-xs text-rose-600 font-medium">{error.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Discovery Radius */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="p-5 sm:p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-1">Discovery Radius</h3>
            <p className="text-xs text-zinc-500 mb-4">
              How far from your location to search for RALLYS.
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {RADII.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRadiusChange(r)}
                  className={cn(
                    "py-3 rounded-xl text-sm font-bold transition-all border-2 text-center",
                    selectedRadius === r
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  )}
                >
                  {r} km
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-zinc-50 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Radio className="w-3.5 h-3.5" />
                <span>Showing RALLYS within <strong className="text-zinc-700">{selectedRadius} km</strong> of your position</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Location Fallback */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="p-5 sm:p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-1">Manual Location</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Choose a city if you don't want to use GPS.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {NIGERIAN_CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleManualCitySelect(c.name)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-semibold transition-all border text-left flex items-center justify-between",
                    city?.toLowerCase() === c.name.toLowerCase() && isManual
                      ? "border-black bg-black text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                  )}
                >
                  {c.name}
                  {city?.toLowerCase() === c.name.toLowerCase() && isManual && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>

            {isManual && (
              <button
                onClick={useCurrentLocation}
                className="w-full mt-4 py-3 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                <Crosshair className="w-4 h-4" />
                Switch back to GPS location
              </button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
