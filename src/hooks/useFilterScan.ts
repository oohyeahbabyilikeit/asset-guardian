import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FilterScanResult {
  status: 'CLEAN' | 'DIRTY' | 'CLOGGED';
  blockagePercent: number;
  description: string;
  recommendation: string;
  urgency: 'none' | 'soon' | 'immediate';
  confidence: number;
}

export function useFilterScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<FilterScanResult | null>(null);

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

  const scanFilter = useCallback(async (file: File, filterType: 'air' | 'inlet'): Promise<FilterScanResult | null> => {
    setIsScanning(true);
    setResult(null);
    
    try {
      const filterLabel = filterType === 'air' ? 'air filter' : 'inlet filter';
      toast.loading(`Analyzing ${filterLabel}...`, { id: 'filter-scan' });
      
      const imageBase64 = await processImage(file);
      
      const { data, error } = await supabase.functions.invoke('analyze-filter-condition', {
        body: { imageBase64, filterType }
      });
      
      if (error) throw error;
      
      const scanResult = data as FilterScanResult;
      setResult(scanResult);
      
      if (scanResult.status === 'CLOGGED') {
        toast.error(`Filter is clogged - needs replacement`, { id: 'filter-scan' });
      } else if (scanResult.status === 'DIRTY') {
        toast.warning(`Filter is dirty - ${scanResult.recommendation}`, { id: 'filter-scan' });
      } else {
        toast.success('Filter looks clean!', { id: 'filter-scan' });
      }
      
      return scanResult;
    } catch (error) {
      console.error('Filter scan error:', error);
      toast.error('Failed to analyze filter', { id: 'filter-scan' });
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [processImage]);

  return { scanFilter, isScanning, result };
}
