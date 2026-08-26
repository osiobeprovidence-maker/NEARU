import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, MapPinOff, CheckCircle2, Crosshair, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { NIGERIAN_CITIES } from '../lib/geo';
import { useLocation } from '../contexts/LocationContext';

interface LocationFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RADII = [1, 2, 5, 10, 25, 50];

export default function LocationFilterModal({ isOpen, onClose }: LocationFilterModalProps) {
  const {
    city,
    radiusKm,
    geoState,
    isManual,
    position,
    locationLabel,
    error,
    setRadiusKmAction,
    setManualLocation,
    useCurrentLocation,
    requestLocation,
  } = useLocation();

  const [selectedRadius, setSelectedRadius] = useState(radiusKm);

  useEffect(() => {
    if (isOpen) {
      setSelectedRadius(radiusKm);
    }
  }, [isOpen, radiusKm]);

  const handleApply = () => {
    setRadiusKmAction(selectedRadius);
    onClose();
  };

  const handleManualCitySelect = (cityName: string) => {
    const cityData = NIGERIAN_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );
    if (cityData) {
      setManualLocation({ latitude: cityData.lat, longitude: cityData.lng });
    }
  };

  const handleUseCurrentLocation = () => {
    if (geoState === 'active' || geoState === 'manual') {
      useCurrentLocation();
    } else {
      requestLocation();
    }
  };

  const hasRealLocation = geoState === 'active' || geoState === 'updating';
  const isLocating = geoState === 'requesting' || geoState === 'locating';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:p-4 flex items-end md:items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100, transition: { duration: 0.2 } }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-md bg-white rounded-t-[2rem] md:rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-zinc-900 text-lg">Location</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {/* Current Location Status */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Current Location</h3>
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isManual ? (
                          <MapPin className="w-4 h-4 text-amber-500" />
                        ) : hasRealLocation ? (
                          <Crosshair className="w-4 h-4 text-emerald-500" />
                        ) : isLocating ? (
                          <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                        ) : (
                          <MapPinOff className="w-4 h-4 text-zinc-400" />
                        )}
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">
                            {city || locationLabel || 'Unknown'}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {isManual
                              ? 'Using selected location'
                              : hasRealLocation
                                ? 'Using GPS location'
                                : isLocating
                                  ? 'Finding your location...'
                                  : 'Location not available'}
                          </div>
                        </div>
                      </div>
                      {hasRealLocation && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>

                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className={cn(
                        "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                        hasRealLocation || isManual
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
                          <Crosshair className="w-4 h-4" />
                          Use my current location
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          Enable GPS location
                        </>
                      )}
                    </button>

                    {error && (
                      <p className="text-xs text-rose-500 mt-2 text-center">{error.message}</p>
                    )}
                  </div>
                </div>

                {/* Manual City Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">
                    {isManual ? 'Selected Location' : 'Or choose a city'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {NIGERIAN_CITIES.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => handleManualCitySelect(c.name)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-sm font-semibold transition-all border text-left flex items-center justify-between",
                          city?.toLowerCase() === c.name.toLowerCase()
                            ? "border-black bg-black text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                        )}
                      >
                        {c.name}
                        {city?.toLowerCase() === c.name.toLowerCase() && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius Selection */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">
                    Discovery radius
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {RADII.map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedRadius(r)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-sm font-semibold transition-all border text-center flex justify-center items-center",
                          selectedRadius === r
                            ? "border-black bg-black text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                        )}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 shrink-0">
                <button
                  onClick={handleApply}
                  className="w-full py-4 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
