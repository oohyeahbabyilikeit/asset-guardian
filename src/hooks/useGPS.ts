import { useState, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface ReverseGeocodedAddress {
  streetNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  formattedAddress?: string;
}

interface CachedPosition {
  position: GeoPosition;
  address: ReverseGeocodedAddress | null;
  cachedAt: number;
}

interface UseGPSResult {
  position: GeoPosition | null;
  address: ReverseGeocodedAddress | null;
  isLocating: boolean;
  isReverseGeocoding: boolean;
  error: string | null;
  getCurrentPosition: () => Promise<GeoPosition | null>;
  getAddressFromPosition: (lat: number, lng: number) => Promise<ReverseGeocodedAddress | null>;
  getPositionAndAddress: () => Promise<{ position: GeoPosition; address: ReverseGeocodedAddress | null } | null>;
  cancelRequest: () => void;
}

// Cache duration: 2 minutes for positions
const CACHE_DURATION_MS = 2 * 60 * 1000;
// Distance threshold for cache hits: 100 meters
const CACHE_DISTANCE_THRESHOLD_M = 100;

// Global cache to persist across hook instances
let positionCache: CachedPosition | null = null;

export function useGPS(): UseGPSResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [address, setAddress] = useState<ReverseGeocodedAddress | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLocating(false);
    setIsReverseGeocoding(false);
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<GeoPosition | null> => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by this browser';
      setError(msg);
      toast({ title: 'GPS Unavailable', description: msg, variant: 'destructive' });
      return null;
    }

    // Check cache first - return immediately if valid
    if (positionCache && (Date.now() - positionCache.cachedAt) < CACHE_DURATION_MS) {
      setPosition(positionCache.position);
      setAddress(positionCache.address);
      return positionCache.position;
    }

    setIsLocating(true);
    setError(null);

    try {
      // Single attempt with reasonable timeout - no nested fallbacks
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject({ code: 3, message: 'Location request timed out' });
        }, 5000); // 5 second hard timeout

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve(position);
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
          {
            enableHighAccuracy: false, // Faster, usually accurate enough
            timeout: 4000,
            maximumAge: 60000, // Accept 1 minute old cache
          }
        );
      });

      const geoPos: GeoPosition = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };

      setPosition(geoPos);
      return geoPos;
    } catch (err: any) {
      let msg = 'Failed to get location';
      if (err.code === 1) msg = 'Location permission denied';
      else if (err.code === 2) msg = 'Location unavailable';
      else if (err.code === 3) msg = 'Location request timed out';
      
      setError(msg);
      // Don't show toast here - let the caller decide
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  const getAddressFromPosition = useCallback(async (
    lat: number, 
    lng: number
  ): Promise<ReverseGeocodedAddress | null> => {
    // Check if we have a cached address for nearby coordinates
    if (positionCache && positionCache.address) {
      const distance = calculateDistanceMeters(
        lat, lng,
        positionCache.position.latitude,
        positionCache.position.longitude
      );
      if (distance < CACHE_DISTANCE_THRESHOLD_M) {
        setAddress(positionCache.address);
        return positionCache.address;
      }
    }

    setIsReverseGeocoding(true);
    abortControllerRef.current = new AbortController();
    
    try {
      // Use Nominatim with shorter timeout
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'WaterHeaterInspectionApp/1.0',
          },
          signal: abortControllerRef.current.signal,
        }
      );
      
      // Add a race with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Geocoding timeout')), 3000);
      });
      
      const data = await Promise.race([response.json(), timeoutPromise]);
      
      if (!data.address) {
        return null;
      }

      const addr = data.address;
      const result: ReverseGeocodedAddress = {
        streetNumber: addr.house_number,
        street: addr.road || addr.street,
        city: addr.city || addr.town || addr.village || addr.municipality,
        state: addr.state,
        zipCode: addr.postcode,
        country: addr.country,
        formattedAddress: data.display_name,
      };

      setAddress(result);
      return result;
    } catch (err) {
      // Silent fail - geocoding is optional
      console.warn('Reverse geocoding failed:', err);
      return null;
    } finally {
      setIsReverseGeocoding(false);
      abortControllerRef.current = null;
    }
  }, []);

  const getPositionAndAddress = useCallback(async () => {
    // Get position first
    const pos = await getCurrentPosition();
    if (!pos) return null;

    // Start geocoding but don't wait too long
    const geocodePromise = getAddressFromPosition(pos.latitude, pos.longitude);
    
    // Race between geocoding and a 3-second timeout
    const addr = await Promise.race([
      geocodePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
    ]);

    // Cache the result
    positionCache = {
      position: pos,
      address: addr,
      cachedAt: Date.now(),
    };

    // Return position even if address failed
    return { position: pos, address: addr };
  }, [getCurrentPosition, getAddressFromPosition]);

  return {
    position,
    address,
    isLocating,
    isReverseGeocoding,
    error,
    getCurrentPosition,
    getAddressFromPosition,
    getPositionAndAddress,
    cancelRequest,
  };
}

// Helper to format coordinates for display
export function formatCoordinates(lat: number, lng: number, precision = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

// Helper to create Google Maps URL
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// Helper to calculate distance between two points in meters
function calculateDistanceMeters(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to calculate distance between two points (haversine formula) in miles
export function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
