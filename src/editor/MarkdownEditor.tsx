import Editor, { loader, type OnMount } from '@monaco-editor/react';
import { type JSX, useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { isMobileDevice } from '../utils/AppUtils';

// Configure Monaco to use local files instead of CDN
loader.config({ monaco });

// Expose Monaco globally for testing purposes
declare global {
  interface Window {
    monaco?: typeof monaco;
  }
}
if (typeof window !== 'undefined') {
  window.monaco = monaco;
}

interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly theme: 'light' | 'dark';
  readonly onEditorMount?: (
    editor: monaco.editor.IStandaloneCodeEditor
  ) => void;
  readonly onScroll?: () => void;
}

export function MarkdownEditor({
  value,
  onChange,
  theme,
  onEditorMount,
  onScroll,
}: MarkdownEditorProps): JSX.Element {
  // Use ref to always have the latest onScroll callback
  const onScrollRef = useRef(onScroll);
  
  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  const handleEditorChange = (newValue: string | undefined): void => {
    onChange(newValue ?? '');
  };

  const handleEditorMount: OnMount = (editor): void => {
    if (onEditorMount) {
      onEditorMount(editor);
    }
    // Use a wrapper that calls the ref to get the latest callback
    editor.onDidScrollChange((): void => {
      if (onScrollRef.current) {
        onScrollRef.current();
      }
    });
  };

  return (
    <div className="editor-container">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        options={{
          wordWrap: 'on',
          minimap: { enabled: false },
          fontSize: isMobileDevice() ? 16 : 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          renderWhitespace: 'selection',
          quickSuggestions: false,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          // Disable Monaco's custom context menu on mobile to allow native copy/paste
          contextmenu: !isMobileDevice(),
          unicodeHighlight: {
            ambiguousCharacters: false,
            invisibleCharacters: false,
            nonBasicASCII: false,
          },
        }}
      />
    </div>
  );
}
