import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LocationFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  currentRadius: string;
  onApply: (city: string, radius: string) => void;
}

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'];
const RADII = ['1 km', '5 km', '10 km', '25 km', '50 km'];

export default function LocationFilterModal({ isOpen, onClose, currentCity, currentRadius, onApply }: LocationFilterModalProps) {
  const [city, setCity] = useState(currentCity);
  const [radius, setRadius] = useState(currentRadius);

  // Sync state when opened with new props
  useEffect(() => {
    if (isOpen) {
      setCity(currentCity);
      setRadius(currentRadius);
    }
  }, [isOpen, currentCity, currentRadius]);

  const handleApply = () => {
    onApply(city, radius);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:p-4 flex items-end md:items-center justify-center"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100, transition: { duration: 0.2 } }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-md bg-white rounded-t-[2rem] md:rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-zinc-900 text-lg">Location Filter</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto">
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Select City</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {CITIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setCity(c)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-sm font-semibold transition-all border text-left flex items-center justify-between",
                          city === c 
                            ? "border-black bg-black text-white" 
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                        )}
                      >
                        {c}
                        {city === c && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Distance Radius</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {RADII.map(r => (
                      <button
                        key={r}
                        onClick={() => setRadius(r)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-sm font-semibold transition-all border text-center flex justify-center items-center",
                          radius === r 
                            ? "border-black bg-black text-white" 
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-100 shrink-0">
                <button
                  onClick={handleApply}
                  className="w-full py-4 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
