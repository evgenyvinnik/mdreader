import { useState, useEffect, useCallback, useRef } from 'react';
import type { Document } from '../storage/indexedDb';
import {
  saveDocument,
  getLastDocument,
  generateId,
} from '../storage/indexedDb';

const DEBOUNCE_DELAY = 500;
const LAST_DOC_KEY = 'mdreader-last-document-id';

interface DocumentStore {
  document: Document | null;
  isLoading: boolean;
  createNewDocument: () => void;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
}

export function useDocumentStore(): DocumentStore {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);

  // Load document on mount
  useEffect(() => {
    const loadDocument = async () => {
      try {
        // Try to load the last document
        const lastDocId = localStorage.getItem(LAST_DOC_KEY);
        let doc: Document | undefined;

        if (lastDocId) {
          const { getDocument } = await import('../storage/indexedDb');
          doc = await getDocument(lastDocId);
        }

        if (!doc) {
          doc = await getLastDocument();
        }

        if (doc) {
          setDocument(doc);
        } else {
          // Create a new document if none exists
          const newDoc: Document = {
            id: generateId(),
            title: 'Untitled',
            content: '# Welcome to MD Reader\n\nStart writing your Markdown here...\n',
            updatedAt: Date.now(),
          };
          await saveDocument(newDoc);
          localStorage.setItem(LAST_DOC_KEY, newDoc.id);
          setDocument(newDoc);
        }
      } catch (error) {
        console.error('Failed to load document:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, []);

  // Debounced save
  const debouncedSave = useCallback((doc: Document) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        await saveDocument(doc);
        localStorage.setItem(LAST_DOC_KEY, doc.id);
      } catch (error) {
        console.error('Failed to save document:', error);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  const createNewDocument = useCallback(() => {
    const newDoc: Document = {
      id: generateId(),
      title: 'Untitled',
      content: '',
      updatedAt: Date.now(),
    };
    setDocument(newDoc);
    debouncedSave(newDoc);
  }, [debouncedSave]);

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

  return {
    document,
    isLoading,
    createNewDocument,
    updateContent,
    updateTitle,
  };
}
