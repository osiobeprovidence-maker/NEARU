export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoLocation extends GeoPoint {
  accuracy: number;
  capturedAt: number;
}

export interface ReverseGeocodeResult {
  city: string | null;
  state: string | null;
  country: string | null;
  neighbourhood: string | null;
  displayName: string | null;
  raw: Record<string, unknown>;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isWithinRadius(
  user: GeoPoint,
  target: GeoPoint,
  radiusKm: number
): boolean {
  return haversineDistance(user, target) <= radiusKm;
}

const GEOCODE_CACHE_KEY = 'rally_geocode_cache';
const GEOCODE_CACHE_TTL = 30 * 60 * 1000;
const GEOCODE_MIN_DISTANCE_KM = 0.5;

interface GeocodeCacheEntry {
  key: string;
  result: ReverseGeocodeResult;
  timestamp: number;
  latitude: number;
  longitude: number;
}

function getGeocodeCache(): GeocodeCacheEntry[] {
  try {
    const raw = localStorage.getItem(GEOCODE_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGeocodeCache(entries: GeocodeCacheEntry[]): void {
  try {
    const trimmed = entries.slice(-20);
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore storage errors
  }
}

function getCachedGeocode(lat: number, lng: number): ReverseGeocodeResult | null {
  const cache = getGeocodeCache();
  const now = Date.now();
  for (const entry of cache) {
    if (now - entry.timestamp > GEOCODE_CACHE_TTL) continue;
    const dist = haversineDistance(
      { latitude: lat, longitude: lng },
      { latitude: entry.latitude, longitude: entry.longitude }
    );
    if (dist < GEOCODE_MIN_DISTANCE_KM) {
      return entry.result;
    }
  }
  return null;
}

function cacheGeocodeResult(
  lat: number,
  lng: number,
  result: ReverseGeocodeResult
): void {
  const cache = getGeocodeCache();
  cache.push({
    key: `${lat.toFixed(4)},${lng.toFixed(4)}`,
    result,
    timestamp: Date.now(),
    latitude: lat,
    longitude: lng,
  });
  saveGeocodeCache(cache);
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  const cached = getCachedGeocode(lat, lng);
  if (cached) return cached;

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'RallyApp/1.0 (https://nearu-eight.vercel.app)',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const data = await response.json();

  const address = data.address || {};
  const result: ReverseGeocodeResult = {
    city:
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      null,
    state: address.state || null,
    country: address.country || null,
    neighbourhood: address.neighbourhood || address.suburb || address.hamlet || null,
    displayName: data.display_name || null,
    raw: data,
  };

  cacheGeocodeResult(lat, lng, result);

  return result;
}

export function formatLocationLabel(
  city: string | null,
  neighbourhood: string | null,
  state: string | null
): string {
  if (neighbourhood && city) return `${neighbourhood}, ${city}`;
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return 'Unknown location';
}

export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters}m`;
  }
  return `${km.toFixed(1)} km`;
}

const NIGERIAN_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Abuja', lat: 9.0579, lng: 7.4951 },
  { name: 'Port Harcourt', lat: 4.8156, lng: 7.0498 },
  { name: 'Ibadan', lat: 7.3775, lng: 3.9470 },
  { name: 'Kano', lat: 12.0022, lng: 8.5920 },
  { name: 'Enugu', lat: 6.4413, lng: 7.4988 },
  { name: 'Kaduna', lat: 10.5222, lng: 7.4383 },
  { name: 'Benin City', lat: 6.3350, lng: 5.6276 },
  { name: 'Jos', lat: 9.8965, lng: 8.8584 },
  { name: 'Owerri', lat: 5.4836, lng: 7.0333 },
];

export function findNearestCity(point: GeoPoint): { name: string; distance: number } | null {
  let nearest: { name: string; distance: number } | null = null;

  for (const city of NIGERIAN_CITIES) {
    const dist = haversineDistance(point, { latitude: city.lat, longitude: city.lng });
    if (!nearest || dist < nearest.distance) {
      nearest = { name: city.name, distance: dist };
    }
  }

  return nearest;
}

export function parseRadiusString(radius: string): number {
  const match = radius.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}

export function getStoredLocation(): GeoLocation | null {
  try {
    const raw = localStorage.getItem('rally_current_location');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeLocation(loc: GeoLocation): void {
  try {
    localStorage.setItem('rally_current_location', JSON.stringify(loc));
  } catch {
    // ignore
  }
}

export function getStoredRadius(): number {
  try {
    const raw = localStorage.getItem('rally_discovery_radius');
    return raw ? parseInt(raw, 10) : 5;
  } catch {
    return 5;
  }
}

export function storeRadius(km: number): void {
  try {
    localStorage.setItem('rally_discovery_radius', String(km));
  } catch {
    // ignore
  }
}

export function getStoredManualLocation(): GeoPoint | null {
  try {
    const raw = localStorage.getItem('rally_manual_location');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeManualLocation(point: GeoPoint | null): void {
  try {
    if (point) {
      localStorage.setItem('rally_manual_location', JSON.stringify(point));
    } else {
      localStorage.removeItem('rally_manual_location');
    }
  } catch {
    // ignore
  }
}

export function getStoredLocationMode(): 'browser' | 'manual' {
  try {
    return (localStorage.getItem('rally_location_mode') as 'browser' | 'manual') || 'browser';
  } catch {
    return 'browser';
  }
}

export function storeLocationMode(mode: 'browser' | 'manual'): void {
  try {
    localStorage.setItem('rally_location_mode', mode);
  } catch {
    // ignore
  }
}

export { NIGERIAN_CITIES };
