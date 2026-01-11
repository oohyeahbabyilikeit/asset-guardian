import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import {
  saveInspectionOffline,
  getPendingInspections,
  markInspectionSynced,
  markInspectionFailed,
  getSyncQueueCount,
  savePhotoOffline,
  getPhotosForInspection,
  urlToBlob,
  blobToUrl,
} from '@/lib/offlineDb';
import type { TechnicianInspectionData } from '@/types/technicianInspection';
import { toast } from 'sonner';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  lastError: string | null;
}

interface UseOfflineSyncOptions {
  onSyncComplete?: (inspectionId: string) => void;
  onSyncError?: (inspectionId: string, error: string) => void;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
  });
  
  const syncInProgress = useRef(false);
  const currentInspectionId = useRef<string | null>(null);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await getSyncQueueCount();
    setSyncState(prev => ({ ...prev, pendingCount: count }));
  }, []);

  // Save inspection for offline/sync
  const saveInspection = useCallback(async (
    data: TechnicianInspectionData,
    propertyId?: string,
    photos?: { url: string; type: 'pressure' | 'condition' | 'dataplate' | 'other' }[]
  ): Promise<string> => {
    const id = currentInspectionId.current || `insp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    currentInspectionId.current = id;

    // Save inspection data
    await saveInspectionOffline(id, data, propertyId);

    // Save photos if provided
    if (photos) {
      for (const photo of photos) {
        try {
          const blob = await urlToBlob(photo.url);
          await savePhotoOffline(id, blob, photo.type);
        } catch (e) {
          console.warn('Failed to save photo offline:', e);
        }
      }
    }

    await updatePendingCount();

    // If online, trigger sync immediately
    if (isOnline) {
      syncPendingInspections();
    } else {
      toast.info('Saved offline', {
        description: 'Data will sync when connection is restored',
      });
    }

    return id;
  }, [isOnline, updatePendingCount]);

  // Sync all pending inspections
  const syncPendingInspections = useCallback(async () => {
    if (syncInProgress.current || !isOnline) return;
    
    syncInProgress.current = true;
    setSyncState(prev => ({ ...prev, isSyncing: true, lastError: null }));

    try {
      const pending = await getPendingInspections();
      
      for (const inspection of pending) {
        try {
          // Get associated photos
          const photos = await getPhotosForInspection(inspection.id);
          
          // TODO: Replace with actual Supabase upload
          // For now, simulate sync delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Here you would:
          // 1. Upload photos to Supabase storage
          // 2. Create assessment record with photo URLs
          // 3. Create/update water heater record
          
          console.log('Syncing inspection:', inspection.id, {
            data: inspection.data,
            photoCount: photos.length,
          });

          // Mark as synced
          await markInspectionSynced(inspection.id);
          options.onSyncComplete?.(inspection.id);
          
          toast.success('Inspection synced', {
            description: 'Data uploaded successfully',
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sync failed';
          await markInspectionFailed(inspection.id, errorMessage);
          options.onSyncError?.(inspection.id, errorMessage);
          
          setSyncState(prev => ({ ...prev, lastError: errorMessage }));
        }
      }

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: Date.now(),
      }));
    } finally {
      syncInProgress.current = false;
      await updatePendingCount();
    }
  }, [isOnline, options, updatePendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      toast.info('Back online', {
        description: 'Syncing pending data...',
      });
      syncPendingInspections();
      clearWasOffline();
    }
  }, [isOnline, wasOffline, syncPendingInspections, clearWasOffline]);

  // Initial pending count
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Get photo URL from offline storage
  const getOfflinePhotoUrl = useCallback(async (inspectionId: string, type: string): Promise<string | null> => {
    const photos = await getPhotosForInspection(inspectionId);
    const photo = photos.find(p => p.type === type);
    return photo ? blobToUrl(photo.blob) : null;
  }, []);

  // Start new inspection session
  const startNewInspection = useCallback(() => {
    currentInspectionId.current = `insp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return currentInspectionId.current;
  }, []);

  return {
    isOnline,
    wasOffline,
    ...syncState,
    saveInspection,
    syncPendingInspections,
    getOfflinePhotoUrl,
    startNewInspection,
    currentInspectionId: currentInspectionId.current,
  };
}
