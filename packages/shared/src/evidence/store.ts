import { EvidenceRecord } from "./types";

const DB_NAME = "chronicle-db";
const STORE_NAME = "evidence";
const DB_VERSION = 2;
const FILES_STORE = "files"

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }

      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore(FILES_STORE, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function saveEvidence(
  record: EvidenceRecord
): Promise<void> {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put(record);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function updateEvidence(
  record: EvidenceRecord
): Promise<void> {
  const updatedRecord: EvidenceRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  };

  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put(updatedRecord);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getEvidence(
  id: string
): Promise<EvidenceRecord | null> {
  const db = await openDB();

  return new Promise<EvidenceRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onsuccess = () => {
      resolve(
        request.result
          ? (request.result as EvidenceRecord)
          : null
      );
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getAllEvidence(): Promise<
  EvidenceRecord[]
> {
  const db = await openDB();

  return new Promise<EvidenceRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as EvidenceRecord[]);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteEvidence(
  id: string
): Promise<void> {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}