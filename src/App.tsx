import { useState, useEffect, useRef, useCallback } from 'react';
import { MarkdownEditor } from './editor/MarkdownEditor';
import { MarkdownPreview } from './preview/MarkdownPreview';
import { useDocumentStore } from './state/useDocumentStore';
import { openMarkdownFile, saveMarkdownFile } from './utils/fileOperations';
import { FileDropdown } from './components/FileDropdown';
import './App.css';
import type * as Monaco from 'monaco-editor';

type Theme = 'light' | 'dark';
type ViewMode = 'editor' | 'preview' | 'both';

const THEME_KEY = 'mdreader-theme';
const SCROLL_LOCK_KEY = 'mdreader-scroll-lock';
const VIEW_MODE_KEY = 'mdreader-view-mode';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  // Check system preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getInitialViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY);
  if (stored === 'editor' || stored === 'preview' || stored === 'both') return stored;
  return 'both';
}

function getInitialScrollLock(): boolean {
  const stored = localStorage.getItem(SCROLL_LOCK_KEY);
  if (stored === 'false') return false;
  return true; // Default to locked
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [scrollLocked, setScrollLocked] = useState<boolean>(getInitialScrollLock);
  const {
    document: doc,
    documents,
    isLoading,
    createNewDocument,
    updateContent,
    loadFromFile,
    loadDocument,
    deleteDocument,
  } = useDocumentStore();
  
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef<'editor' | 'preview' | null>(null);

  useEffect(() => {
    // Apply theme to document root
    window.document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SCROLL_LOCK_KEY, String(scrollLocked));
  }, [scrollLocked]);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const handleEditorScroll = useCallback(() => {
    if (!scrollLocked || isScrollingRef.current === 'preview') return;
    
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    isScrollingRef.current = 'editor';
    
    const scrollTop = editor.getScrollTop();
    const scrollHeight = editor.getScrollHeight();
    const clientHeight = editor.getLayoutInfo().height;
    
    const scrollPercentage = scrollTop / Math.max(1, scrollHeight - clientHeight);
    
    const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
    preview.scrollTop = scrollPercentage * previewScrollHeight;
    
    requestAnimationFrame(() => {
      isScrollingRef.current = null;
    });
  }, [scrollLocked]);

  const handlePreviewScroll = useCallback(() => {
    if (!scrollLocked || isScrollingRef.current === 'editor') return;
    
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    isScrollingRef.current = 'preview';
    
    const scrollTop = preview.scrollTop;
    const scrollHeight = preview.scrollHeight - preview.clientHeight;
    
    const scrollPercentage = scrollTop / Math.max(1, scrollHeight);
    
    const editorScrollHeight = editor.getScrollHeight() - editor.getLayoutInfo().height;
    editor.setScrollTop(scrollPercentage * editorScrollHeight);
    
    requestAnimationFrame(() => {
      isScrollingRef.current = null;
    });
  }, [scrollLocked]);

  const toggleScrollLock = () => {
    setScrollLocked((prev) => !prev);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenFile = async () => {
    const fileData = await openMarkdownFile();
    if (fileData) {
      loadFromFile(fileData.content, fileData.filename);
    }
  };

  const handleSaveFile = () => {
    if (doc) {
      saveMarkdownFile(doc.content, doc.title);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`app ${theme}`}>
      <header className="toolbar">
        <div className="toolbar-left">
          <h1 className="app-title">MD Reader</h1>
          <FileDropdown
            documents={documents}
            currentDocId={doc?.id}
            onSelect={loadDocument}
            onDelete={deleteDocument}
          />
        </div>
        <div className="toolbar-right">
          <button
            className="toolbar-button"
            onClick={createNewDocument}
            title="New document"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span>New</span>
          </button>
          <button
            className="toolbar-button"
            onClick={handleOpenFile}
            title="Open .md file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Open</span>
          </button>
          <button
            className="toolbar-button"
            onClick={handleSaveFile}
            title="Save as .md file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>Save</span>
          </button>
          <button
            className={`toolbar-button ${scrollLocked ? 'active' : ''}`}
            onClick={toggleScrollLock}
            title={scrollLocked ? 'Unlock scroll sync' : 'Lock scroll sync'}
          >
            {scrollLocked ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            )}
            <span>{scrollLocked ? 'Locked' : 'Unlocked'}</span>
          </button>
          <div className="view-toggle">
            <button
              className={`view-toggle-button ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => setViewMode('editor')}
              title="Editor only"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
            <button
              className={`view-toggle-button ${viewMode === 'both' ? 'active' : ''}`}
              onClick={() => setViewMode('both')}
              title="Split view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </button>
            <button
              className={`view-toggle-button ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="Preview only"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          <button
            className="toolbar-button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>
      <main className={`main-content view-${viewMode}`}>
        {(viewMode === 'editor' || viewMode === 'both') && (
          <div className="pane editor-pane">
            <div className="pane-header">Editor</div>
            <MarkdownEditor
              value={doc?.content ?? ''}
              onChange={updateContent}
              theme={theme}
              onEditorMount={(editor) => { editorRef.current = editor; }}
              onScroll={handleEditorScroll}
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'both') && (
          <div className="pane preview-pane">
            <div className="pane-header">Preview</div>
            <MarkdownPreview
              content={doc?.content ?? ''}
              theme={theme}
              previewRef={previewRef}
              onScroll={handlePreviewScroll}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
