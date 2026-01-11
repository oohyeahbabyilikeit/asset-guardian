import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConditionScanResult {
  visualRust: boolean;
  isLeaking: boolean;
  rustSeverity: 'none' | 'minor' | 'moderate' | 'severe';
  leakSeverity: 'none' | 'minor' | 'moderate' | 'severe';
  rustDetails: string;
  leakDetails: string;
  overallCondition: 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  confidence: number;
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
      
      const imageBase64 = await processImage(file);
      
      const { data, error } = await supabase.functions.invoke('analyze-unit-condition', {
        body: { imageBase64 }
      });
      
      if (error) throw error;
      
      const scanResult = data as ConditionScanResult;
      setResult(scanResult);
      
      const issues = [];
      if (scanResult.visualRust) issues.push('rust detected');
      if (scanResult.isLeaking) issues.push('leak indicators found');
      
      if (issues.length > 0) {
        toast.warning(`Issues found: ${issues.join(', ')}`, { id: 'condition-scan' });
      } else {
        toast.success('Unit condition looks good!', { id: 'condition-scan' });
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
