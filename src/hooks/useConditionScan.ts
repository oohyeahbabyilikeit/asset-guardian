import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GeoTag {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface ConditionScanResult {
  visualRust: boolean;
  isLeaking: boolean;
  rustSeverity: 'none' | 'minor' | 'moderate' | 'severe';
  leakSeverity: 'none' | 'minor' | 'moderate' | 'severe';
  rustDetails: string;
  leakDetails: string;
  overallCondition: 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  confidence: number;
  geoTag?: GeoTag; // Photo location metadata
}

// Get current GPS position for geotagging
async function getGeoTag(): Promise<GeoTag | undefined> {
  if (!navigator.geolocation) return undefined;
  
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000,
      });
    });
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
  } catch {
    // Silently fail - geotagging is optional
    return undefined;
  }
}

export function useConditionScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ConditionScanResult | null>(null);

  const processImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 1024;
          let { width, height } = img;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const scanCondition = useCallback(async (file: File): Promise<ConditionScanResult | null> => {
    setIsScanning(true);
    setResult(null);
    
    try {
      toast.loading('Analyzing unit condition...', { id: 'condition-scan' });
      
      // Get geotag and process image in parallel
      const [imageBase64, geoTag] = await Promise.all([
        processImage(file),
        getGeoTag()
      ]);
      
      const { data, error } = await supabase.functions.invoke('analyze-unit-condition', {
        body: { imageBase64 }
      });
      
      if (error) throw error;
      
      // Attach geotag to result
      const scanResult: ConditionScanResult = {
        ...data,
        geoTag
      };
      
      setResult(scanResult);
      
      const issues = [];
      if (scanResult.visualRust) issues.push('rust detected');
      if (scanResult.isLeaking) issues.push('leak indicators found');
      
      if (issues.length > 0) {
        toast.warning(`Issues found: ${issues.join(', ')}`, { id: 'condition-scan' });
      } else {
        toast.success('Unit condition looks good!', { id: 'condition-scan' });
      }
      
      // Log geotag if available
      if (geoTag) {
        console.log('📍 Photo geotagged:', geoTag.latitude.toFixed(6), geoTag.longitude.toFixed(6));
      }
      
      return scanResult;
    } catch (error) {
      console.error('Condition scan error:', error);
      toast.error('Failed to analyze photo', { id: 'condition-scan' });
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [processImage]);

  return { scanCondition, isScanning, result };
}
