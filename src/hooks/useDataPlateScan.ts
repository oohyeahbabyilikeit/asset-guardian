import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FuelType } from '@/lib/opterraAlgorithm';

export interface ScannedDataPlate {
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  fuelType: FuelType | null;
  capacity: number | null;
  flowRate: number | null;
  warrantyYears: number | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  rawText: string;
}

interface UseDataPlateScanReturn {
  isScanning: boolean;
  scannedData: ScannedDataPlate | null;
  error: string | null;
  scanImage: (file: File) => Promise<ScannedDataPlate | null>;
  reset: () => void;
}

// Compress and convert image to base64
async function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Max dimension 1024px to reduce payload size
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with 85% quality
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function useDataPlateScan(): UseDataPlateScanReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedDataPlate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanImage = useCallback(async (file: File): Promise<ScannedDataPlate | null> => {
    setIsScanning(true);
    setError(null);
    setScannedData(null);

    try {
      // Process and compress image
      const imageBase64 = await processImage(file);
      
      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('scan-data-plate', {
        body: { imageBase64 }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to scan data plate');
      }

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else if (data.error.includes('credits')) {
          toast.error('AI service temporarily unavailable.');
        } else {
          toast.error(data.error);
        }
        setError(data.error);
        return null;
      }

      if (data?.extracted) {
        const extracted = data.extracted as ScannedDataPlate;
        setScannedData(extracted);
        
        // Show success toast with confidence
        const fieldsFound = [
          extracted.brand,
          extracted.model,
          extracted.serialNumber,
          extracted.fuelType
        ].filter(Boolean).length;
        
        if (fieldsFound >= 3) {
          toast.success(`Data plate scanned! ${fieldsFound} fields detected.`);
        } else if (fieldsFound > 0) {
          toast.info(`Partial scan: ${fieldsFound} fields detected. Please verify and complete.`);
        } else {
          toast.warning('Could not read data plate clearly. Please enter manually.');
        }
        
        return extracted;
      }

      setError('No data extracted from image');
      return null;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan data plate';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setScannedData(null);
    setError(null);
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    scannedData,
    error,
    scanImage,
    reset
  };
}
