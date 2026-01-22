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
import { mapTechnicianToForensicInputs } from '@/types/technicianMapper';
import {
  mapInspectionToWaterHeater,
  mapInspectionToSoftener,
} from '@/lib/syncMappers';
import { supabase } from '@/integrations/supabase/client';
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

interface NewPropertyAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
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
  const currentPropertyId = useRef<string | undefined>(undefined);
  const currentNewAddress = useRef<NewPropertyAddress | undefined>(undefined);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await getSyncQueueCount();
    setSyncState(prev => ({ ...prev, pendingCount: count }));
  }, []);

  // Save inspection for offline/sync
  const saveInspection = useCallback(async (
    data: TechnicianInspectionData,
    propertyId?: string,
    photos?: { url: string; type: 'pressure' | 'condition' | 'dataplate' | 'other' }[],
    newAddress?: NewPropertyAddress
  ): Promise<string> => {
    const id = currentInspectionId.current || `insp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    currentInspectionId.current = id;
    currentPropertyId.current = propertyId;
    currentNewAddress.current = newAddress;

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

  // Upload photos to Supabase storage
  const uploadPhotos = useCallback(async (
    inspectionId: string,
    userId: string,
    photos: { blob: Blob; type: string }[]
  ): Promise<string[]> => {
    const photoUrls: string[] = [];
    
    for (const photo of photos) {
      try {
        const fileName = `${userId}/${inspectionId}/${photo.type}-${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('inspection-photos')
          .upload(fileName, photo.blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });
        
        if (error) {
          console.warn('Photo upload failed:', error);
          continue;
        }
        
        if (data) {
          const { data: urlData } = supabase.storage
            .from('inspection-photos')
            .getPublicUrl(fileName);
          photoUrls.push(urlData.publicUrl);
        }
      } catch (e) {
        console.warn('Photo upload error:', e);
      }
    }
    
    return photoUrls;
  }, []);

  // Sync all pending inspections
  const syncPendingInspections = useCallback(async () => {
    if (syncInProgress.current || !isOnline) return;
    
    syncInProgress.current = true;
    setSyncState(prev => ({ ...prev, isSyncing: true, lastError: null }));

    try {
      const pending = await getPendingInspections();
      
      for (const inspection of pending) {
        try {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.warn('No authenticated user, skipping sync');
            continue;
          }
          
          // Get associated photos
          const photos = await getPhotosForInspection(inspection.id);
          
          // Upload photos to storage
          const photoUrls = await uploadPhotos(
            inspection.id,
            user.id,
            photos.map(p => ({ blob: p.blob, type: p.type }))
          );
          
          console.log('📤 Syncing inspection:', inspection.id, {
            data: inspection.data,
            photoCount: photos.length,
            uploadedPhotos: photoUrls.length,
          });

          // Get forensic inputs for assessment
          const forensicInputs = mapTechnicianToForensicInputs(inspection.data);
          
          // Map to water heater insert format
          const waterHeaterData = mapInspectionToWaterHeater(
            inspection.data,
            '', // Will be set by edge function
            user.id,
            photoUrls
          );
          
          // Map to softener insert format (if present)
          const softenerData = mapInspectionToSoftener(
            inspection.data,
            '', // Will be set by edge function
            user.id,
            []
          );

          // Call the sync-inspection edge function
          const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-inspection', {
            body: {
              inspectionId: inspection.id,
              propertyId: inspection.propertyId || currentPropertyId.current,
              newPropertyAddress: currentNewAddress.current,
              buildingType: inspection.data.buildingType,
              waterHeater: {
                manufacturer: waterHeaterData.manufacturer,
                model_number: waterHeaterData.model_number,
                serial_number: waterHeaterData.serial_number,
                fuel_type: waterHeaterData.fuel_type,
                tank_capacity_gallons: waterHeaterData.tank_capacity_gallons,
                vent_type: waterHeaterData.vent_type,
                warranty_years: waterHeaterData.warranty_years,
                calendar_age_years: waterHeaterData.calendar_age_years,
                location: waterHeaterData.location,
                is_finished_area: waterHeaterData.is_finished_area,
                temp_setting: waterHeaterData.temp_setting,
                has_softener: waterHeaterData.has_softener,
                has_circ_pump: waterHeaterData.has_circ_pump,
                has_exp_tank: waterHeaterData.has_exp_tank,
                has_prv: waterHeaterData.has_prv,
                is_closed_loop: waterHeaterData.is_closed_loop,
                photo_urls: photoUrls,
                // v7.8-7.9 fields
                venting_scenario: waterHeaterData.venting_scenario,
                anode_count: waterHeaterData.anode_count,
                exp_tank_status: waterHeaterData.exp_tank_status,
                has_drain_pan: waterHeaterData.has_drain_pan,
                connection_type: waterHeaterData.connection_type,
                leak_source: waterHeaterData.leak_source,
                visual_rust: waterHeaterData.visual_rust,
                is_leaking: waterHeaterData.is_leaking,
                house_psi: waterHeaterData.house_psi,
                street_hardness_gpg: waterHeaterData.street_hardness_gpg,
                rated_flow_gpm: waterHeaterData.rated_flow_gpm,
                gas_line_size: waterHeaterData.gas_line_size,
                last_descale_years_ago: waterHeaterData.last_descale_years_ago,
                room_volume_type: waterHeaterData.room_volume_type,
                air_filter_status: waterHeaterData.air_filter_status,
                is_condensate_clear: waterHeaterData.is_condensate_clear,
                flame_rod_status: waterHeaterData.flame_rod_status,
                inlet_filter_status: waterHeaterData.inlet_filter_status,
                error_code_count: waterHeaterData.error_code_count,
                building_type: waterHeaterData.building_type,
                // v1.0 Tank Cleanup fields
                nipple_material: waterHeaterData.nipple_material,
                measured_hardness_gpg: waterHeaterData.measured_hardness_gpg,
                // v1.1 Algorithm Fields
                people_count: waterHeaterData.people_count,
                usage_type: waterHeaterData.usage_type,
                last_anode_replace_years_ago: waterHeaterData.last_anode_replace_years_ago,
                last_flush_years_ago: waterHeaterData.last_flush_years_ago,
                is_annually_maintained: waterHeaterData.is_annually_maintained,
                years_without_anode: waterHeaterData.years_without_anode,
                years_without_softener: waterHeaterData.years_without_softener,
                softener_salt_status: waterHeaterData.softener_salt_status,
                sanitizer_type: waterHeaterData.sanitizer_type,
              },
              softener: softenerData ? {
                capacity_grains: softenerData.capacity_grains,
                control_head: softenerData.control_head,
                visual_height: softenerData.visual_height,
                has_carbon_filter: softenerData.has_carbon_filter,
                salt_status: softenerData.salt_status,
                quality_tier: softenerData.quality_tier,
                visual_iron: softenerData.visual_iron,
                visual_condition: softenerData.visual_condition,
                sanitizer_type: softenerData.sanitizer_type,
              } : undefined,
              assessment: {
                forensic_inputs: forensicInputs,
                photos: photoUrls,
              },
            },
          });

          if (syncError) {
            throw new Error(syncError.message || 'Sync failed');
          }

          console.log('✅ Sync result:', syncResult);

          // Mark as synced
          await markInspectionSynced(inspection.id);
          options.onSyncComplete?.(inspection.id);
          
          toast.success('Inspection synced', {
            description: `Property and assessment saved successfully`,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sync failed';
          console.error('Sync error for inspection:', inspection.id, errorMessage);
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
  }, [isOnline, options, updatePendingCount, uploadPhotos]);

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
