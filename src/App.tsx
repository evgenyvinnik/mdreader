import { useState, useEffect, useRef, useCallback, type JSX } from 'react';
import { MarkdownEditor } from './editor/MarkdownEditor';
import { MarkdownPreview } from './preview/MarkdownPreview';
import { useDocumentStore } from './state/useDocumentStore';
import {
  openMarkdownFile,
  saveMarkdownFile,
  readDroppedFile,
} from './utils/fileOperations';
import {
  type Theme,
  type ViewMode,
  THEME_KEY,
  SCROLL_LOCK_KEY,
  VIEW_MODE_KEY,
  getInitialTheme,
  getInitialViewMode,
  getInitialScrollLock,
} from './utils/AppUtils';
import { FileDropdown } from './components/FileDropdown';
import {
  NewDocumentIcon,
  FolderIcon,
  SaveIcon,
  LockIcon,
  UnlockIcon,
  EditIcon,
  SplitViewIcon,
  EyeIcon,
  SunIcon,
  MoonIcon,
} from './components/Icons';
import './App.css';
import type * as Monaco from 'monaco-editor';

function App(): JSX.Element {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [scrollLocked, setScrollLocked] =
    useState<boolean>(getInitialScrollLock);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const {
    document: doc,
    documents,
    isLoading,
    createNewDocument,
    updateContent,
    loadFromFile,
    loadDocument,
    deleteDocument,
    renameDocument,
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

  // Handle files opened via PWA file handler
  useEffect(() => {
    if ('launchQueue' in window) {
      interface LaunchParams {
        files?: { getFile: () => Promise<File> }[];
      }
      interface LaunchQueue {
        setConsumer: (callback: (params: LaunchParams) => void) => void;
      }
      const queue = (window as unknown as { launchQueue: LaunchQueue })
        .launchQueue;
      queue.setConsumer((launchParams) => {
        const fileHandle = launchParams.files?.[0];
        if (fileHandle) {
          void fileHandle.getFile().then((file) => {
            void file.text().then((content) => {
              loadFromFile(content, file.name);
            });
          });
        }
      });
    }
  }, [loadFromFile]);

  const handleEditorScroll = useCallback(() => {
    if (!scrollLocked || isScrollingRef.current === 'preview') return;

    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    isScrollingRef.current = 'editor';

    const scrollTop = editor.getScrollTop();
    const scrollHeight = editor.getScrollHeight();
    const clientHeight = editor.getLayoutInfo().height;

    const scrollPercentage =
      scrollTop / Math.max(1, scrollHeight - clientHeight);

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

    const editorScrollHeight =
      editor.getScrollHeight() - editor.getLayoutInfo().height;
    editor.setScrollTop(scrollPercentage * editorScrollHeight);

    requestAnimationFrame(() => {
      isScrollingRef.current = null;
    });
  }, [scrollLocked]);

  const toggleScrollLock = (): void => {
    setScrollLocked((prev) => !prev);
  };

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenFile = async (): Promise<void> => {
    const fileData = await openMarkdownFile();
    if (fileData) {
      loadFromFile(fileData.content, fileData.filename);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the app container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent): Promise<void> => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      // Find first markdown file (supports .md, .markdown, .mdown, .mkd)
      const mdFile = files.find((f) => {
        const name = f.name.toLowerCase();
        return (
          name.endsWith('.md') ||
          name.endsWith('.markdown') ||
          name.endsWith('.mdown') ||
          name.endsWith('.mkd') ||
          f.type === 'text/markdown'
        );
      });

      if (mdFile) {
        const fileData = await readDroppedFile(mdFile);
        if (fileData) {
          loadFromFile(fileData.content, fileData.filename);
        }
      }
    },
    [loadFromFile]
  );

  const handleSaveFile = (): void => {
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
    <div
      className={`app ${theme}${isDragging ? ' dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e): void => {
        void handleDrop(e);
      }}
    >
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-overlay-content">
            <div className="drop-icon">📄</div>
            <p>Drop .md file to open</p>
          </div>
        </div>
      )}
      <header className="toolbar">
        <div className="toolbar-left">
          <h1 className="app-title">MD Reader</h1>
          <FileDropdown
            documents={documents}
            currentDocId={doc?.id}
            onSelect={(id): void => {
              void loadDocument(id);
            }}
            onDelete={(id): void => {
              void deleteDocument(id);
            }}
            onRename={(id, newTitle): void => {
              void renameDocument(id, newTitle);
            }}
          />
        </div>
        <div className="toolbar-right">
          <button
            className="toolbar-button"
            onClick={createNewDocument}
            title="New document"
          >
            <NewDocumentIcon />
            <span>New</span>
          </button>
          <button
            className="toolbar-button"
            onClick={(): void => {
              void handleOpenFile();
            }}
            title="Open .md file"
          >
            <FolderIcon />
            <span>Open</span>
          </button>
          <button
            className="toolbar-button"
            onClick={handleSaveFile}
            title="Save as .md file"
          >
            <SaveIcon />
            <span>Save</span>
          </button>
          <button
            className={`toolbar-button ${scrollLocked ? 'active' : ''}`}
            onClick={toggleScrollLock}
            title={scrollLocked ? 'Unlock scroll sync' : 'Lock scroll sync'}
          >
            {scrollLocked ? <LockIcon /> : <UnlockIcon />}
            <span>{scrollLocked ? 'Locked' : 'Unlocked'}</span>
          </button>
          <div className="view-toggle">
            <button
              className={`view-toggle-button ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('editor');
              }}
              title="Editor only"
            >
              <EditIcon size={16} />
            </button>
            <button
              className={`view-toggle-button ${viewMode === 'both' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('both');
              }}
              title="Split view"
            >
              <SplitViewIcon size={16} />
            </button>
            <button
              className={`view-toggle-button ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('preview');
              }}
              title="Preview only"
            >
              <EyeIcon size={16} />
            </button>
          </div>
          <button
            className="toolbar-button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
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
              onEditorMount={(editor) => {
                editorRef.current = editor;
              }}
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
