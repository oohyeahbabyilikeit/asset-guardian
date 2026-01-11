import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SoftenerQualityTier, ControlHead } from '@/lib/softenerAlgorithm';

export interface SoftenerPlateScanResult {
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  capacityGrains: number | null;
  qualityTier: SoftenerQualityTier | null;
  controlHead: ControlHead | null;
  manufactureYear: number | null;
  estimatedAge: number | null;
  confidence: number;
}

export function useSoftenerPlateScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<SoftenerPlateScanResult | null>(null);

  const processImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 1200;
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
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const scanSoftenerPlate = useCallback(async (file: File): Promise<SoftenerPlateScanResult | null> => {
    setIsScanning(true);
    setResult(null);
    
    try {
      toast.loading('Scanning softener label...', { id: 'softener-scan' });
      
      const imageBase64 = await processImage(file);
      
      const { data, error } = await supabase.functions.invoke('scan-softener-plate', {
        body: { imageBase64 }
      });
      
      if (error) throw error;
      
      const scanResult = data as SoftenerPlateScanResult;
      setResult(scanResult);
      
      const extracted = [];
      if (scanResult.brand) extracted.push(scanResult.brand);
      if (scanResult.capacityGrains) extracted.push(`${scanResult.capacityGrains.toLocaleString()} grains`);
      if (scanResult.estimatedAge) extracted.push(`~${scanResult.estimatedAge} years old`);
      
      if (extracted.length > 0) {
        toast.success(`Found: ${extracted.join(', ')}`, { id: 'softener-scan' });
      } else {
        toast.info('Limited data extracted - enter manually', { id: 'softener-scan' });
      }
      
      return scanResult;
    } catch (error) {
      console.error('Softener scan error:', error);
      toast.error('Failed to scan label', { id: 'softener-scan' });
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [processImage]);

  return { scanSoftenerPlate, isScanning, result };
}
