import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ErrorCode {
  code: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ErrorCodeScanResult {
  errorCodes: ErrorCode[];
  errorCount: number;
  flowRateGPM: number | null;
  temperature: number | null;
  temperatureUnit: 'F' | 'C' | null;
  displayStatus: 'normal' | 'error' | 'warning' | 'standby' | 'unknown';
  confidence: number;
}

export function useErrorCodeScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ErrorCodeScanResult | null>(null);

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

  const scanErrorCodes = useCallback(async (file: File, brand?: string): Promise<ErrorCodeScanResult | null> => {
    setIsScanning(true);
    setResult(null);
    
    try {
      toast.loading('Reading display...', { id: 'error-scan' });
      
      const imageBase64 = await processImage(file);
      
      const { data, error } = await supabase.functions.invoke('read-error-codes', {
        body: { imageBase64, brand }
      });
      
      if (error) throw error;
      
      const scanResult = data as ErrorCodeScanResult;
      setResult(scanResult);
      
      if (scanResult.errorCount > 0) {
        const criticalCount = scanResult.errorCodes.filter(e => e.severity === 'critical').length;
        if (criticalCount > 0) {
          toast.error(`${criticalCount} critical error(s) detected!`, { id: 'error-scan' });
        } else {
          toast.warning(`${scanResult.errorCount} error code(s) found`, { id: 'error-scan' });
        }
      } else {
        toast.success('No error codes detected', { id: 'error-scan' });
      }
      
      return scanResult;
    } catch (error) {
      console.error('Error code scan error:', error);
      toast.error('Failed to read display', { id: 'error-scan' });
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [processImage]);

  return { scanErrorCodes, isScanning, result };
}
