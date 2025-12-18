import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface Document {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly updatedAt: number;
}

interface DocumentDB extends DBSchema {
  documents: {
    key: string;
    value: Document;
    indexes: { 'by-updatedAt': number };
  };
}

const DB_NAME = 'mdreader-db';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
const FALLBACK_KEY = 'mdreader-documents';

let dbPromise: Promise<IDBPDatabase<DocumentDB>> | null = null;

function getDB(): Promise<IDBPDatabase<DocumentDB>> {
  dbPromise ??= openDB<DocumentDB>(DB_NAME, DB_VERSION, {
    upgrade(db): void {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('by-updatedAt', 'updatedAt');
    },
  });
  return dbPromise;
}

function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

// Fallback to localStorage
function getFromLocalStorage(): Document[] {
  try {
    const data = localStorage.getItem(FALLBACK_KEY);
    return data ? (JSON.parse(data) as Document[]) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(documents: Document[]): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(documents));
  } catch {
    console.error('Failed to save to localStorage');
  }
}

export async function getAllDocuments(): Promise<Document[]> {
  if (isIndexedDBAvailable()) {
    try {
      const db = await getDB();
      const docs = await db.getAllFromIndex(STORE_NAME, 'by-updatedAt');
      return docs.reverse(); // Most recent first
    } catch {
      return getFromLocalStorage();
    }
  }
  return getFromLocalStorage();
}

export async function getDocument(id: string): Promise<Document | undefined> {
  if (isIndexedDBAvailable()) {
    try {
      const db = await getDB();
      return await db.get(STORE_NAME, id);
    } catch {
      const docs = getFromLocalStorage();
      return docs.find((d) => d.id === id);
    }
  }
  const docs = getFromLocalStorage();
  return docs.find((d) => d.id === id);
}

export async function saveDocument(doc: Document): Promise<void> {
  if (isIndexedDBAvailable()) {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, doc);
      return;
    } catch {
      // Fallback to localStorage
    }
  }
  const docs = getFromLocalStorage();
  const index = docs.findIndex((d) => d.id === doc.id);
  if (index >= 0) {
    docs[index] = doc;
  } else {
    docs.push(doc);
  }
  saveToLocalStorage(docs);
}

export async function deleteDocument(id: string): Promise<void> {
  if (isIndexedDBAvailable()) {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, id);
      return;
    } catch {
      // Fallback to localStorage
    }
  }
  const docs = getFromLocalStorage();
  const filtered = docs.filter((d) => d.id !== id);
  saveToLocalStorage(filtered);
}

export async function getLastDocument(): Promise<Document | undefined> {
  const docs = await getAllDocuments();
  return docs[0]; // Already sorted by updatedAt descending
}

export function generateId(): string {
  return `doc-${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`;
}
