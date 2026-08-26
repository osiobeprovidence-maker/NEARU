import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  useLocation as useGeolocation,
  LocationState as GeoState,
  LocationPermissionState,
  LocationError,
} from '../hooks/useLocation';
import { GeoPoint, GeoLocation, ReverseGeocodeResult } from '../lib/geo';

interface LocationContextType {
  city: string;
  radius: string;
  radiusKm: number;
  setCity: (city: string) => void;
  setRadius: (radius: string) => void;
  setRadiusKm: (km: number) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (isOpen: boolean) => void;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  updateLocation: (city: string, radius: string) => void;

  geoState: GeoState;
  permissionState: LocationPermissionState;
  position: GeoLocation | null;
  reverseGeocodeResult: ReverseGeocodeResult | null;
  locationLabel: string;
  accuracy: number | null;
  isWatching: boolean;
  isManual: boolean;
  manualLocation: GeoPoint | null;
  error: LocationError | null;
  requestLocation: () => void;
  startWatching: () => void;
  stopWatching: () => void;
  setRadiusKmAction: (km: number) => void;
  setManualLocation: (point: GeoPoint) => void;
  useCurrentLocation: () => void;
  clearLocation: () => void;
  refreshGeocode: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const geo = useGeolocation();
  const [city, setCityState] = useState(() => {
    return localStorage.getItem('rally_city') || '';
  });
  const [radius, setRadiusStr] = useState(() => {
    return localStorage.getItem('rally_radius') || '5 km';
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    if (geo.reverseGeocode?.city) {
      setCityState(geo.reverseGeocode.city);
      localStorage.setItem('rally_city', geo.reverseGeocode.city);
    }
  }, [geo.reverseGeocode?.city]);

  useEffect(() => {
    localStorage.setItem('rally_radius', `${geo.radius} km`);
    setRadiusStr(`${geo.radius} km`);
  }, [geo.radius]);

  const setCity = (newCity: string) => {
    setCityState(newCity);
    localStorage.setItem('rally_city', newCity);
  };

  const setRadius = (newRadius: string) => {
    const match = newRadius.match(/(\d+)/);
    if (match) {
      const km = parseInt(match[1], 10);
      geo.setRadius(km);
    }
  };

  const setRadiusKm = (km: number) => {
    geo.setRadius(km);
  };

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
        radiusKm: geo.radius,
        setCity,
        setRadius,
        setRadiusKm,
        isLocationModalOpen,
        setIsLocationModalOpen,
        openLocationModal,
        closeLocationModal,
        updateLocation,

        geoState: geo.state,
        permissionState: geo.permissionState,
        position: geo.position,
        reverseGeocodeResult: geo.reverseGeocode,
        locationLabel: geo.locationLabel,
        accuracy: geo.accuracy,
        isWatching: geo.isWatching,
        isManual: geo.isManual,
        manualLocation: geo.manualLocation,
        error: geo.error,
        requestLocation: geo.requestLocation,
        startWatching: geo.startWatching,
        stopWatching: geo.stopWatching,
        setRadiusKmAction: geo.setRadius,
        setManualLocation: geo.setManualLocation,
        useCurrentLocation: geo.useCurrentLocation,
        clearLocation: geo.clearLocation,
        refreshGeocode: geo.refreshGeocode,
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
