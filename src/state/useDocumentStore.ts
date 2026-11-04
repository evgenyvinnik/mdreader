import { useState, useEffect, useCallback, useRef } from 'react';
import type { Document } from '../storage/indexedDb';
import {
  saveDocument,
  getLastDocument,
  generateId,
  getAllDocuments,
  deleteDocument as deleteDocumentFromDb,
  getDocument,
} from '../storage/indexedDb';

const DEBOUNCE_DELAY = 500;
const LAST_DOC_KEY = 'mdreader-last-document-id';

interface DocumentStore {
  readonly document: Document | null;
  readonly documents: Document[];
  readonly isLoading: boolean;
  readonly createNewDocument: () => void;
  readonly updateContent: (content: string) => void;
  readonly updateTitle: (title: string) => void;
  readonly loadFromFile: (content: string, filename: string) => void;
  readonly loadDocument: (id: string) => Promise<void>;
  readonly deleteDocument: (id: string) => Promise<void>;
  readonly renameDocument: (id: string, newTitle: string) => Promise<void>;
  readonly refreshDocuments: () => Promise<void>;
}

// Generate title with timestamp format: Untitled_YYYY-MM-DD_HHMMSS
function generateTimestampTitle(): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `Untitled_${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

export function useDocumentStore(): DocumentStore {
  const [document, setDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pendingSaveRef = useRef<{ timer: number; doc: Document } | null>(null);
  // Set once a document is chosen explicitly (file launch, drop, open, new, select)
  // so the async restore of the last document can't overwrite it
  const hasChosenDocumentRef = useRef(false);

  const refreshDocuments = useCallback(async (): Promise<void> => {
    const docs = await getAllDocuments();
    setDocuments(docs);
  }, []);

  // Restore the last document on mount
  useEffect(() => {
    let cancelled = false;

    const restoreLastDocument = async (): Promise<void> => {
      try {
        const lastDocId = localStorage.getItem(LAST_DOC_KEY);
        let doc = lastDocId ? await getDocument(lastDocId) : undefined;
        doc ??= await getLastDocument();

        // A file opened from the OS (launchQueue) usually arrives while we are
        // still waiting on IndexedDB; it wins over the remembered document
        const isSuperseded = (): boolean =>
          cancelled || hasChosenDocumentRef.current;

        if (!doc && !isSuperseded()) {
          // Create a new document if none exists
          doc = {
            id: generateId(),
            title: generateTimestampTitle(),
            content:
              '# Welcome to MD Reader\n\nStart writing your Markdown here...\n',
            updatedAt: Date.now(),
          };
          await saveDocument(doc);
        }
        if (doc && !isSuperseded()) {
          setDocument(doc);
        }
        if (!cancelled) {
          // Load all documents for the dropdown
          await refreshDocuments();
        }
      } catch (error) {
        console.error('Failed to load document:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void restoreLastDocument();
    return (): void => {
      cancelled = true;
    };
  }, [refreshDocuments]);

  // Remember whichever document is on screen so it reopens on next launch
  const documentId = document?.id;
  useEffect(() => {
    if (documentId) {
      localStorage.setItem(LAST_DOC_KEY, documentId);
    }
  }, [documentId]);

  const persist = useCallback(async (doc: Document): Promise<void> => {
    try {
      await saveDocument(doc);
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  }, []);

  // Debounced save
  const debouncedSave = useCallback(
    (doc: Document) => {
      const pending = pendingSaveRef.current;
      if (pending) {
        window.clearTimeout(pending.timer);
        // Switching documents must not drop the previous one's unsaved edits
        if (pending.doc.id !== doc.id) {
          void persist(pending.doc);
        }
      }
      const timer = window.setTimeout(() => {
        pendingSaveRef.current = null;
        void persist(doc);
      }, DEBOUNCE_DELAY);
      pendingSaveRef.current = { timer, doc };
    },
    [persist]
  );

  const createNewDocument = useCallback(() => {
    hasChosenDocumentRef.current = true;
    const newDoc: Document = {
      id: generateId(),
      title: generateTimestampTitle(),
      content: '',
      updatedAt: Date.now(),
    };
    setDocument(newDoc);
    debouncedSave(newDoc);
    // Refresh documents list after a delay to ensure save completes
    setTimeout(() => refreshDocuments(), DEBOUNCE_DELAY + 100);
  }, [debouncedSave, refreshDocuments]);

  const updateContent = useCallback(
    (content: string) => {
      setDocument((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, content, updatedAt: Date.now() };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave]
  );

  const updateTitle = useCallback(
    (title: string) => {
      setDocument((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, title, updatedAt: Date.now() };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave]
  );

  const loadFromFile = useCallback(
    (content: string, filename: string) => {
      hasChosenDocumentRef.current = true;
      // Extract title from filename (remove the markdown extension)
      const title = filename.replace(/\.(md|markdown|mdown|mkd)$/i, '');
      const newDoc: Document = {
        id: generateId(),
        title,
        content,
        updatedAt: Date.now(),
      };
      setDocument(newDoc);
      debouncedSave(newDoc);
      // Refresh documents list after a delay to ensure save completes
      setTimeout(() => refreshDocuments(), DEBOUNCE_DELAY + 100);
    },
    [debouncedSave, refreshDocuments]
  );

  const loadDocument = useCallback(async (id: string) => {
    hasChosenDocumentRef.current = true;
    const doc = await getDocument(id);
    if (doc) {
      setDocument(doc);
    }
  }, []);

  const deleteDocument = useCallback(
    async (id: string) => {
      await deleteDocumentFromDb(id);
      await refreshDocuments();
      // If we deleted the current document, load another one
      if (document?.id === id) {
        const docs = await getAllDocuments();
        const firstDoc = docs[0];
        if (firstDoc) {
          setDocument(firstDoc);
        } else {
          // Create a new document if all were deleted
          const newDoc: Document = {
            id: generateId(),
            title: generateTimestampTitle(),
            content: '',
            updatedAt: Date.now(),
          };
          await saveDocument(newDoc);
          setDocument(newDoc);
          await refreshDocuments();
        }
      }
    },
    [document?.id, refreshDocuments]
  );

  const renameDocument = useCallback(
    async (id: string, newTitle: string): Promise<void> => {
      const doc = await getDocument(id);
      if (doc) {
        const updatedDoc = { ...doc, title: newTitle, updatedAt: Date.now() };
        await saveDocument(updatedDoc);
        await refreshDocuments();
        // If we renamed the current document, update state
        if (document?.id === id) {
          setDocument(updatedDoc);
        }
      }
    },
    [document?.id, refreshDocuments]
  );

  return {
    document,
    documents,
    isLoading,
    createNewDocument,
    updateContent,
    updateTitle,
    loadFromFile,
    loadDocument,
    deleteDocument,
    renameDocument,
    refreshDocuments,
  };
}
