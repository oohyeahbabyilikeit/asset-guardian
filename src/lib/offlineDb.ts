import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { TechnicianInspectionData } from '@/types/technicianInspection';

interface OfflinePhoto {
  id: string;
  inspectionId: string;
  blob: Blob;
  type: 'pressure' | 'condition' | 'dataplate' | 'other';
  geoTag?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  createdAt: number;
}

interface PendingInspection {
  id: string;
  data: TechnicianInspectionData;
  propertyId?: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  createdAt: number;
  updatedAt: number;
  errorMessage?: string;
}

interface OfflineDbSchema extends DBSchema {
  inspections: {
    key: string;
    value: PendingInspection;
    indexes: { 'by-status': string };
  };
  photos: {
    key: string;
    value: OfflinePhoto;
    indexes: { 'by-inspection': string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'inspection' | 'photo';
      referenceId: string;
      priority: number;
      createdAt: number;
    };
    indexes: { 'by-priority': number };
  };
}

const DB_NAME = 'opterra-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDbSchema> | null = null;

export async function getDb(): Promise<IDBPDatabase<OfflineDbSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Inspections store
      if (!db.objectStoreNames.contains('inspections')) {
        const inspectionStore = db.createObjectStore('inspections', { keyPath: 'id' });
        inspectionStore.createIndex('by-status', 'status');
      }

      // Photos store
      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('by-inspection', 'inspectionId');
      }

      // Sync queue
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        queueStore.createIndex('by-priority', 'priority');
      }
    },
  });

  return dbInstance;
}

// Inspection operations
export async function saveInspectionOffline(
  id: string,
  data: TechnicianInspectionData,
  propertyId?: string
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  
  const existing = await db.get('inspections', id);
  
  await db.put('inspections', {
    id,
    data,
    propertyId,
    status: 'pending',
    retryCount: existing?.retryCount ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  // Add to sync queue if not already there
  const queueItem = await db.get('syncQueue', `insp-${id}`);
  if (!queueItem) {
    await db.put('syncQueue', {
      id: `insp-${id}`,
      type: 'inspection',
      referenceId: id,
      priority: 1,
      createdAt: now,
    });
  }
}

export async function getOfflineInspection(id: string): Promise<PendingInspection | undefined> {
  const db = await getDb();
  return db.get('inspections', id);
}

export async function getPendingInspections(): Promise<PendingInspection[]> {
  const db = await getDb();
  return db.getAllFromIndex('inspections', 'by-status', 'pending');
}

export async function markInspectionSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('inspections', id);
  await db.delete('syncQueue', `insp-${id}`);
  
  // Also delete associated photos
  const photos = await db.getAllFromIndex('photos', 'by-inspection', id);
  for (const photo of photos) {
    await db.delete('photos', photo.id);
    await db.delete('syncQueue', `photo-${photo.id}`);
  }
}

export async function markInspectionFailed(id: string, errorMessage: string): Promise<void> {
  const db = await getDb();
  const inspection = await db.get('inspections', id);
  if (inspection) {
    await db.put('inspections', {
      ...inspection,
      status: 'failed',
      retryCount: inspection.retryCount + 1,
      errorMessage,
      updatedAt: Date.now(),
    });
  }
}

// Photo operations
export async function savePhotoOffline(
  inspectionId: string,
  blob: Blob,
  type: OfflinePhoto['type'],
  geoTag?: OfflinePhoto['geoTag']
): Promise<string> {
  const db = await getDb();
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const now = Date.now();

  await db.put('photos', {
    id,
    inspectionId,
    blob,
    type,
    geoTag,
    createdAt: now,
  });

  await db.put('syncQueue', {
    id: `photo-${id}`,
    type: 'photo',
    referenceId: id,
    priority: 2, // Photos sync after inspection data
    createdAt: now,
  });

  return id;
}

export async function getPhotosForInspection(inspectionId: string): Promise<OfflinePhoto[]> {
  const db = await getDb();
  return db.getAllFromIndex('photos', 'by-inspection', inspectionId);
}

export async function getPhotoBlob(photoId: string): Promise<Blob | undefined> {
  const db = await getDb();
  const photo = await db.get('photos', photoId);
  return photo?.blob;
}

// Sync queue operations
export async function getSyncQueue(): Promise<Array<{ id: string; type: string; referenceId: string }>> {
  const db = await getDb();
  return db.getAllFromIndex('syncQueue', 'by-priority');
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDb();
  return db.count('syncQueue');
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDb();
  await db.clear('syncQueue');
  await db.clear('inspections');
  await db.clear('photos');
}

// Convert blob URL to local blob for offline storage
export async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return response.blob();
}

// Create object URL from stored blob
export function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
