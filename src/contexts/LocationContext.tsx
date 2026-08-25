import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationContextType {
  city: string;
  radius: string;
  setCity: (city: string) => void;
  setRadius: (radius: string) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (isOpen: boolean) => void;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  updateLocation: (city: string, radius: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState(() => {
    return localStorage.getItem('rally_city') || 'Lagos';
  });

  const [radius, setRadius] = useState(() => {
    return localStorage.getItem('rally_radius') || '5 km';
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('rally_city', city);
  }, [city]);

  useEffect(() => {
    localStorage.setItem('rally_radius', radius);
  }, [radius]);

  const openLocationModal = () => setIsLocationModalOpen(true);
  const closeLocationModal = () => setIsLocationModalOpen(false);

  const updateLocation = (newCity: string, newRadius: string) => {
    setCity(newCity);
    setRadius(newRadius);
    setIsLocationModalOpen(false);
  };

  return (
    <LocationContext.Provider
      value={{
        city,
        radius,
        setCity,
        setRadius,
        isLocationModalOpen,
        setIsLocationModalOpen,
        openLocationModal,
        closeLocationModal,
        updateLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
