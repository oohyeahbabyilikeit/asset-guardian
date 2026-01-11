import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InstallationContextResult {
  hasExpTank: boolean | null;
  expTankSize: 'small' | 'medium' | 'large' | null;
  hasPrv: boolean | null;
  hasRecircPump: boolean | null;
  hasBackflowPreventer: boolean | null;
  isClosedLoop: boolean | null;
  hasSoftener: boolean | null;
  hasWholeHouseFilter: boolean | null;
  hasDrainPan: boolean | null;
  pipingMaterial: 'copper' | 'pex' | 'cpvc' | 'galvanized' | 'mixed' | null;
  locationType: 'garage' | 'basement' | 'utility_closet' | 'attic' | 'crawl_space' | 'other' | null;
  additionalNotes: string;
  confidence: number;
}

export function useInstallationContextScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<InstallationContextResult | null>(null);

  const processImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 1400; // Larger for wide-angle context
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

  const scanInstallationContext = useCallback(async (file: File): Promise<InstallationContextResult | null> => {
    setIsScanning(true);
    setResult(null);
    
    try {
      toast.loading('Analyzing installation area...', { id: 'context-scan' });
      
      const imageBase64 = await processImage(file);
      
      const { data, error } = await supabase.functions.invoke('analyze-installation-context', {
        body: { imageBase64 }
      });
      
      if (error) throw error;
      
      const scanResult = data as InstallationContextResult;
      setResult(scanResult);
      
      // Build summary of what was found
      const equipment = [];
      if (scanResult.hasExpTank) equipment.push('expansion tank');
      if (scanResult.hasPrv) equipment.push('PRV');
      if (scanResult.hasRecircPump) equipment.push('recirc pump');
      if (scanResult.hasBackflowPreventer || scanResult.isClosedLoop) equipment.push('closed loop');
      if (scanResult.hasSoftener) equipment.push('softener');
      if (scanResult.hasDrainPan) equipment.push('drain pan');
      
      const context = [];
      if (scanResult.locationType) {
        context.push(scanResult.locationType.replace('_', ' '));
      }
      if (scanResult.pipingMaterial) {
        context.push(`${scanResult.pipingMaterial} piping`);
      }
      
      if (equipment.length > 0) {
        toast.success(`Found: ${equipment.join(', ')}`, { id: 'context-scan' });
      } else if (context.length > 0) {
        toast.success(`Location: ${context.join(', ')}`, { id: 'context-scan' });
      } else {
        toast.info('Analysis complete - review results', { id: 'context-scan' });
      }
      
      return scanResult;
    } catch (error) {
      console.error('Installation context scan error:', error);
      toast.error('Failed to analyze installation', { id: 'context-scan' });
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [processImage]);

  return { scanInstallationContext, isScanning, result };
}
