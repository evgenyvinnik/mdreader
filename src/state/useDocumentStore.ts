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
  readonly refreshDocuments: () => Promise<void>;
}

// Generate title from first 5 words of content
function generateTitleFromContent(content: string): string {
  // Remove markdown headers and special characters
  const cleanContent = content
    .replace(/^#+\s*/gm, '') // Remove header markers
    .replace(/[*_`~[\]()]/g, '') // Remove markdown formatting
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
  const first5Words = words.slice(0, 5).join(' ');
  
  if (first5Words.length === 0) {
    return `Untitled-${String(Date.now())}`;
  }
  
  // Truncate if too long and add ellipsis
  return first5Words.length > 50 ? first5Words.slice(0, 47) + '...' : first5Words;
}

export function useDocumentStore(): DocumentStore {
  const [document, setDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);

  const refreshDocuments = useCallback(async (): Promise<void> => {
    const docs = await getAllDocuments();
    setDocuments(docs);
  }, []);

  // Load document on mount
  useEffect(() => {
    const loadDocument = async (): Promise<void> => {
      try {
        // Try to load the last document
        const lastDocId = localStorage.getItem(LAST_DOC_KEY);
        let doc: Document | undefined;

        if (lastDocId) {
          const { getDocument } = await import('../storage/indexedDb');
          doc = await getDocument(lastDocId);
        }

        doc ??= await getLastDocument();

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
        // Load all documents for the dropdown
        await refreshDocuments();
      } catch (error) {
        console.error('Failed to load document:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDocument();
  }, [refreshDocuments]);

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
    // Refresh documents list after a delay to ensure save completes
    setTimeout(() => refreshDocuments(), DEBOUNCE_DELAY + 100);
  }, [debouncedSave, refreshDocuments]);

  const updateContent = useCallback(
    (content: string) => {
      setDocument((prev) => {
        if (!prev) return prev;
        // Auto-generate title from content if still "Untitled"
        let title = prev.title;
        if (title === 'Untitled' && content.trim().length > 0) {
          title = generateTitleFromContent(content);
        }
        const updated = { ...prev, content, title, updatedAt: Date.now() };
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
      // Extract title from filename (remove .md or .markdown extension)
      const title = filename.replace(/\.(md|markdown)$/i, '');
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
    const doc = await getDocument(id);
    if (doc) {
      setDocument(doc);
      localStorage.setItem(LAST_DOC_KEY, doc.id);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    await deleteDocumentFromDb(id);
    await refreshDocuments();
    // If we deleted the current document, load another one
    if (document?.id === id) {
      const docs = await getAllDocuments();
      const firstDoc = docs[0];
      if (firstDoc) {
        setDocument(firstDoc);
        localStorage.setItem(LAST_DOC_KEY, firstDoc.id);
      } else {
        // Create a new document if all were deleted
        const newDoc: Document = {
          id: generateId(),
          title: 'Untitled',
          content: '',
          updatedAt: Date.now(),
        };
        await saveDocument(newDoc);
        localStorage.setItem(LAST_DOC_KEY, newDoc.id);
        setDocument(newDoc);
        await refreshDocuments();
      }
    }
  }, [document?.id, refreshDocuments]);

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
    refreshDocuments,
  };
}
