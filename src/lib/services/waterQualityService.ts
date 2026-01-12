/**
 * Water Quality Service - USGS/EPA Data Integration + AI-Powered CCR Lookup
 * 
 * "Digital-First" Architecture:
 * - Fetches regional water hardness by geolocation from USGS/EPA Water Quality Portal
 * - Provides fallback regional estimates when API fails
 * - AI-powered Consumer Confidence Report (CCR) lookup for sanitizer type
 * - Used to populate streetHardnessGPG and sanitizerType for algorithm calculations
 */

import { supabase } from '@/integrations/supabase/client';

const GPG_CONVERSION = 17.1; // 1 GPG = 17.1 mg/L (ppm)

export interface WaterQualityData {
  hardnessGPG: number;
  source: 'USGS' | 'EPA' | 'FALLBACK';
  sampleCount: number;
  lastSampleDate?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Regional fallback map for when API fails
// Based on USGS groundwater surveys
const REGIONAL_FALLBACKS: Record<string, number> = {
  // Southwest (Very Hard - High mineral content)
  'AZ': 18, 'NM': 16, 'TX': 15, 'NV': 14, 'UT': 16,
  
  // Midwest (Hard - Limestone aquifers)
  'IN': 14, 'OH': 13, 'WI': 12, 'IL': 11, 'MI': 10,
  'MN': 11, 'IA': 13, 'MO': 12, 'KS': 16, 'NE': 14,
  'ND': 15, 'SD': 14,
  
  // Southeast (Moderate)
  'FL': 10, 'GA': 8, 'NC': 7, 'SC': 7, 'AL': 9, 'MS': 8,
  'LA': 9, 'TN': 10, 'KY': 11, 'VA': 7, 'WV': 9,
  
  // West Coast (Soft to Moderate - Variable by region)
  'CA': 8, 'OR': 4, 'WA': 3,
  
  // Mountain (Moderate to Hard)
  'CO': 10, 'ID': 9, 'MT': 8, 'WY': 11,
  
  // Northeast (Soft - Granite/Glacial aquifers)
  'NY': 4, 'MA': 3, 'CT': 3, 'ME': 2, 'NH': 2, 'VT': 3,
  'RI': 3, 'NJ': 6, 'PA': 8, 'MD': 7, 'DE': 6, 'DC': 6,
  
  // Alaska/Hawaii
  'AK': 2, 'HI': 3,
  
  // Default for unknown
  'DEFAULT': 10
};

/**
 * Fetch water hardness from USGS/EPA Water Quality Portal
 * 
 * @param lat - Latitude
 * @param lng - Longitude  
 * @returns WaterQualityData or null if API fails
 */
export async function fetchHardnessFromAPI(
  lat: number, 
  lng: number
): Promise<WaterQualityData | null> {
  try {
    // Search for "Hardness" measurements within ~7 miles, last 5 years
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 5);
    const dateStr = startDate.toISOString().split('T')[0];
    
    const bbox = `${lng-0.1},${lat-0.1},${lng+0.1},${lat+0.1}`;
    const url = `https://www.waterqualitydata.us/data/Result/search?bBox=${bbox}&characteristicName=Hardness,%20Ca,%20Mg&startDateLo=${dateStr}&mimeType=json`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const results = data.Provider?.Result || [];
    
    if (results.length === 0) return null;
    
    // Average recent samples
    let total = 0, count = 0;
    let latestDate: string | undefined;
    
    for (const r of results) {
      const val = parseFloat(r.ResultMeasureValue);
      if (!isNaN(val)) { 
        total += val; 
        count++;
        if (r.ActivityStartDate) {
          latestDate = r.ActivityStartDate;
        }
      }
    }
    
    if (count === 0) return null;
    
    const avgPpm = total / count;
    const hardnessGPG = parseFloat((avgPpm / GPG_CONVERSION).toFixed(1));
    
    return {
      hardnessGPG,
      source: 'USGS',
      sampleCount: count,
      lastSampleDate: latestDate,
      confidence: count > 10 ? 'HIGH' : count > 3 ? 'MEDIUM' : 'LOW'
    };
  } catch (e) {
    console.error("Water API Error:", e);
    return null; // Fail silently to fallback
  }
}

/**
 * Get fallback hardness based on US state code
 * 
 * @param stateCode - 2-letter US state code (e.g., "CA", "TX")
 * @returns WaterQualityData with regional estimate
 */
export function getFallbackHardness(stateCode: string): WaterQualityData {
  const gpg = REGIONAL_FALLBACKS[stateCode.toUpperCase()] || REGIONAL_FALLBACKS['DEFAULT'];
  return {
    hardnessGPG: gpg,
    source: 'FALLBACK',
    sampleCount: 0,
    confidence: 'LOW'
  };
}

/**
 * Get water hardness from GPS coordinates
 * This is the preferred method for mobile technician apps with GPS
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @param stateCode - Optional state code for fallback
 * @returns WaterQualityData (API data or fallback)
 */
export async function getHardnessFromCoordinates(
  lat: number, 
  lng: number, 
  stateCode?: string
): Promise<WaterQualityData> {
  // Try API first
  const apiResult = await fetchHardnessFromAPI(lat, lng);
  if (apiResult) {
    return apiResult;
  }
  
  // Fall back to state-based estimate if we have a state code
  if (stateCode) {
    return getFallbackHardness(stateCode);
  }
  
  // Default fallback
  return getFallbackHardness('DEFAULT');
}

/**
 * Get location-based hardness using browser geolocation
 * Falls back to null if geolocation unavailable or denied
 * 
 * @returns WaterQualityData from API or null
 */
export async function getLocationHardness(): Promise<WaterQualityData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const result = await fetchHardnessFromAPI(latitude, longitude);
        resolve(result);
      },
      () => resolve(null), // Silently fail on permission denied
      { 
        timeout: 5000, 
        maximumAge: 86400000 // Cache for 24 hours
      }
    );
  });
}

/**
 * Get hardness from zip code (via geocoding + API)
 * This is the preferred method for technician apps
 * 
 * @param zipCode - US zip code
 * @returns WaterQualityData or null
 */
export async function getHardnessFromZipCode(zipCode: string): Promise<WaterQualityData | null> {
  try {
    // Use a free geocoding service to convert zip to lat/lng
    // For now, we'll use the census.gov geocoder
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${zipCode}&benchmark=2020&format=json`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const match = data.result?.addressMatches?.[0];
    
    if (!match) return null;
    
    const { x: lng, y: lat } = match.coordinates;
    return await fetchHardnessFromAPI(lat, lng);
  } catch (e) {
    console.error("Zip lookup error:", e);
    return null;
  }
}

/**
 * Get hardness classification label
 * 
 * @param gpg - Grains per gallon
 * @returns Human-readable classification
 */
export function getHardnessLabel(gpg: number): string {
  if (gpg <= 1) return 'Soft';
  if (gpg <= 3.5) return 'Slightly Hard';
  if (gpg <= 7) return 'Moderately Hard';
  if (gpg <= 10.5) return 'Hard';
  if (gpg <= 14) return 'Very Hard';
  return 'Extremely Hard';
}

/**
 * Get hardness badge color for UI
 * 
 * @param gpg - Grains per gallon
 * @returns Semantic color token
 */
export function getHardnessBadgeColor(gpg: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (gpg <= 3.5) return 'green';
  if (gpg <= 7) return 'yellow';
  if (gpg <= 14) return 'orange';
  return 'red';
}

// ============================================================================
// SANITIZER TYPE LOOKUP (AI-Powered CCR Analysis)
// ============================================================================

export interface SanitizerLookupResult {
  sanitizerType: 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN';
  utilityName?: string;
  hardnessGPG?: number | null;
  sourceUrl?: string;
  confidence: number;
  cached: boolean;
  error?: string;
}

/**
 * Get sanitizer type (chlorine vs chloramine) for a zip code
 * Uses AI to search Consumer Confidence Reports (CCRs)
 * Results are cached in water_districts table for 365 days
 * 
 * @param zipCode - 5-digit US zip code
 * @returns SanitizerLookupResult with sanitizer type and metadata
 */
export async function getSanitizerFromZipCode(zipCode: string): Promise<SanitizerLookupResult> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-water-quality', {
      body: { zipCode }
    });

    if (error) {
      console.error('Sanitizer lookup error:', error);
      return { 
        sanitizerType: 'UNKNOWN', 
        confidence: 0, 
        cached: false,
        error: error.message 
      };
    }

    if (data.error) {
      return { 
        sanitizerType: 'UNKNOWN', 
        confidence: 0, 
        cached: false,
        error: data.error 
      };
    }

    return {
      sanitizerType: data.sanitizer || 'UNKNOWN',
      utilityName: data.utilityName,
      hardnessGPG: data.hardnessGPG,
      sourceUrl: data.sourceUrl,
      confidence: data.confidence || 0,
      cached: data.cached || false
    };
  } catch (e) {
    console.error('Sanitizer lookup exception:', e);
    return { 
      sanitizerType: 'UNKNOWN', 
      confidence: 0, 
      cached: false,
      error: e instanceof Error ? e.message : 'Unknown error' 
    };
  }
}

/**
 * Get cached sanitizer data from database without calling AI
 * Useful for quick lookups when you don't want to trigger AI
 * 
 * @param zipCode - 5-digit US zip code
 * @returns Cached result or null if not found/expired
 */
export async function getCachedSanitizer(zipCode: string): Promise<SanitizerLookupResult | null> {
  try {
    const cacheThreshold = new Date();
    cacheThreshold.setDate(cacheThreshold.getDate() - 365);

    const { data, error } = await supabase
      .from('water_districts')
      .select('*')
      .eq('zip_code', zipCode)
      .gte('last_verified', cacheThreshold.toISOString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      sanitizerType: (data.sanitizer_type as 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN') || 'UNKNOWN',
      utilityName: data.utility_name || undefined,
      hardnessGPG: data.hardness_gpg,
      sourceUrl: data.source_url || undefined,
      confidence: data.confidence || 0,
      cached: true
    };
  } catch (e) {
    console.error('Cache lookup error:', e);
    return null;
  }
}
