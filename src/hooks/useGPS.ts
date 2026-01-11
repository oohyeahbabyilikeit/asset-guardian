import { useState, useCallback } from 'react';
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

interface UseGPSResult {
  position: GeoPosition | null;
  address: ReverseGeocodedAddress | null;
  isLocating: boolean;
  isReverseGeocoding: boolean;
  error: string | null;
  getCurrentPosition: () => Promise<GeoPosition | null>;
  getAddressFromPosition: (lat: number, lng: number) => Promise<ReverseGeocodedAddress | null>;
  getPositionAndAddress: () => Promise<{ position: GeoPosition; address: ReverseGeocodedAddress } | null>;
}

export function useGPS(): UseGPSResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [address, setAddress] = useState<ReverseGeocodedAddress | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback(async (): Promise<GeoPosition | null> => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by this browser';
      setError(msg);
      toast({ title: 'GPS Unavailable', description: msg, variant: 'destructive' });
      return null;
    }

    setIsLocating(true);
    setError(null);

    try {
      // Try low accuracy first for faster response, then upgrade if needed
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        // First try with cached/low accuracy for speed
        navigator.geolocation.getCurrentPosition(
          resolve, 
          () => {
            // If low accuracy fails, try high accuracy
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 0,
            });
          }, 
          {
            enableHighAccuracy: false,
            timeout: 3000,
            maximumAge: 300000, // Accept 5 min old cache
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
      toast({ title: 'GPS Error', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  const getAddressFromPosition = useCallback(async (
    lat: number, 
    lng: number
  ): Promise<ReverseGeocodedAddress | null> => {
    setIsReverseGeocoding(true);
    
    try {
      // Use free Nominatim API with 5s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'WaterHeaterInspectionApp/1.0',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      if (!data.address) {
        throw new Error('No address found');
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
      console.error('Reverse geocoding error:', err);
      // Don't show toast for geocoding failures - just return null
      return null;
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  const getPositionAndAddress = useCallback(async () => {
    const pos = await getCurrentPosition();
    if (!pos) return null;

    const addr = await getAddressFromPosition(pos.latitude, pos.longitude);
    if (!addr) return null;

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

// Helper to calculate distance between two points (haversine formula)
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
