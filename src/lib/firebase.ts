import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
  query,
  limit,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with offline persistence
let db: Firestore;
try {
  if (firebaseConfig.firestoreDatabaseId) {
    db = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId
    );
  } else {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
} catch {
  // If already initialized, get instance
  if (firebaseConfig.firestoreDatabaseId) {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }
}

export { app, db };

// Clean object of undefined values, DOM elements, functions, and circular references before saving to Firestore
export function cleanFirestoreData<T>(obj: T, seen = new WeakSet<object>()): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (typeof obj === 'function' || typeof obj === 'symbol') {
    return undefined as unknown as T;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }
  // Ignore DOM elements, events, or window references
  if (
    typeof window !== 'undefined' &&
    (obj instanceof Node ||
      obj instanceof Event ||
      (typeof Window !== 'undefined' && obj instanceof Window))
  ) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .map((item) => cleanFirestoreData(item, seen))
      .filter((item) => item !== undefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    if (seen.has(obj as object)) {
      return null as unknown as T;
    }
    seen.add(obj as object);

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip internal React fiber properties, $$typeof, or functions
      if (
        key.startsWith('__react') ||
        key.startsWith('$$') ||
        typeof value === 'function' ||
        typeof value === 'symbol'
      ) {
        continue;
      }
      if (value !== undefined) {
        const cleanedVal = cleanFirestoreData(value, seen);
        if (cleanedVal !== undefined) {
          cleaned[key] = cleanedVal;
        }
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Unified collection sync helper
// NOTE: We do NOT use includeMetadataChanges: true to avoid flooding listeners on local write queues
export function syncFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  onEmpty?: () => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const items: T[] = snapshot.docs.map((d) => ({
          ...(d.data() as T),
          id: d.id,
        }));
        onUpdate(items);
      } else {
        onUpdate([]);
        if (onEmpty) {
          onEmpty();
        }
      }
    },
    (err) => {
      console.warn(`Firestore sync error on ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );
}

// Unified doc sync helper
export function syncFirestoreDoc<T>(
  collectionName: string,
  docId: string,
  onUpdate: (data: T) => void,
  onNotFound?: () => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as T);
      } else if (onNotFound) {
        onNotFound();
      }
    },
    (err) => {
      console.warn(`Firestore sync error on ${collectionName}/${docId}:`, err);
      if (onError) onError(err);
    }
  );
}

// Get document once from Firestore
export async function getFirestoreDoc<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as T;
    }
    return null;
  } catch (err) {
    console.warn(`Error getting Firestore doc ${collectionName}/${docId}:`, err);
    return null;
  }
}

// Get all documents once from a Firestore collection
export async function getFirestoreDocs<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        ...(d.data() as T),
        id: d.id,
      }));
    }
    return [];
  } catch (err) {
    console.warn(`Error getting Firestore docs from ${collectionName}:`, err);
    return [];
  }
}

// In-memory write debouncing queue to prevent write stream exhaustion
const writeDebounceMap = new Map<string, NodeJS.Timeout>();

export interface SaveDocOptions {
  debounceMs?: number;
}

// Save document to Firestore with intelligent debouncing and error protection
export async function saveFirestoreDoc(
  collectionName: string,
  docId: string,
  data: any,
  options?: SaveDocOptions
): Promise<void> {
  const key = `${collectionName}/${docId}`;
  // For config and rapid updates, debounce by default to avoid exhausting write stream
  const debounceMs = options?.debounceMs ?? (collectionName === 'system' ? 250 : 0);

  if (debounceMs > 0) {
    if (writeDebounceMap.has(key)) {
      clearTimeout(writeDebounceMap.get(key));
    }
    return new Promise<void>((resolve) => {
      const timer = setTimeout(async () => {
        writeDebounceMap.delete(key);
        try {
          const docRef = doc(db, collectionName, docId);
          const sanitized = cleanFirestoreData(data);
          if (sanitized && typeof sanitized === 'object') {
            await setDoc(docRef, sanitized, { merge: true });
          }
        } catch (err: any) {
          if (err?.code === 'resource-exhausted') {
            console.warn(`Firestore write stream throttled for ${key} to protect backend.`);
          } else {
            console.warn(`Error saving to Firestore ${key}:`, err);
          }
        }
        resolve();
      }, debounceMs);
      writeDebounceMap.set(key, timer);
    });
  }

  try {
    const docRef = doc(db, collectionName, docId);
    const sanitized = cleanFirestoreData(data);
    if (sanitized && typeof sanitized === 'object') {
      await setDoc(docRef, sanitized, { merge: true });
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') {
      console.warn(`Firestore write stream throttled for ${key} to protect backend.`);
    } else {
      console.warn(`Error saving to Firestore ${key}:`, err);
    }
  }
}

// Delete document from Firestore
export async function deleteFirestoreDoc(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') {
      console.warn(`Firestore write stream throttled on delete for ${collectionName}/${docId}.`);
    } else {
      console.warn(`Error deleting from Firestore ${collectionName}/${docId}:`, err);
    }
  }
}

// In-memory guard to prevent multiple concurrent or repetitive seed operations
const seedingInProgress = new Set<string>();
const seededCollections = new Set<string>();

// Seed / Batch sync initial items if collection is empty
export async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string,
  initialItems: T[]
): Promise<void> {
  if (
    !initialItems ||
    initialItems.length === 0 ||
    seedingInProgress.has(collectionName) ||
    seededCollections.has(collectionName)
  ) {
    return;
  }

  seedingInProgress.add(collectionName);

  try {
    const colRef = collection(db, collectionName);
    // Use limit(1) to avoid reading unnecessary documents
    const checkQuery = query(colRef, limit(1));
    const snap = await getDocs(checkQuery);

    if (snap.empty) {
      // Chunk into batches of max 200 items (Firestore limit is 500)
      const chunkSize = 200;
      for (let i = 0; i < initialItems.length; i += chunkSize) {
        const chunk = initialItems.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const item of chunk) {
          if (item && item.id) {
            const docRef = doc(db, collectionName, item.id);
            const sanitized = cleanFirestoreData(item);
            if (sanitized && typeof sanitized === 'object') {
              batch.set(docRef, sanitized);
            }
          }
        }
        await batch.commit();
      }
    }
    seededCollections.add(collectionName);
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') {
      console.warn(`Firestore seeding delayed for ${collectionName} due to backend rate limits.`);
    } else {
      console.warn(`Error seeding Firestore collection ${collectionName}:`, err);
    }
    // Mark as seeded to avoid endless loop attempts
    seededCollections.add(collectionName);
  } finally {
    seedingInProgress.delete(collectionName);
  }
}
