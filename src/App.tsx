import { useState, useEffect } from 'react';
import { MarkdownEditor } from './editor/MarkdownEditor';
import { MarkdownPreview } from './preview/MarkdownPreview';
import { useDocumentStore } from './state/useDocumentStore';
import './App.css';

type Theme = 'light' | 'dark';

const THEME_KEY = 'mdreader-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  // Check system preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const { document: doc, isLoading, createNewDocument, updateContent } =
    useDocumentStore();

  useEffect(() => {
    // Apply theme to document root
    window.document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
      <main className="main-content">
        <div className="pane editor-pane">
          <div className="pane-header">Editor</div>
          <MarkdownEditor
            value={doc?.content ?? ''}
            onChange={updateContent}
            theme={theme}
          />
        </div>
        <div className="pane preview-pane">
          <div className="pane-header">Preview</div>
          <MarkdownPreview content={doc?.content ?? ''} theme={theme} />
        </div>
      </main>
    </div>
  );
}

export default App;
