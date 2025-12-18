import Editor, { loader, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure Monaco to use local files instead of CDN
loader.config({ monaco });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
  onEditorMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  onScroll?: () => void;
}

export function MarkdownEditor({ value, onChange, theme, onEditorMount, onScroll }: MarkdownEditorProps) {
  const handleEditorChange = (newValue: string | undefined) => {
    onChange(newValue ?? '');
  };

  const handleEditorMount: OnMount = (editor) => {
    if (onEditorMount) {
      onEditorMount(editor);
    }
    if (onScroll) {
      editor.onDidScrollChange(() => {
        onScroll();
      });
    }
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
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          renderWhitespace: 'selection',
          quickSuggestions: false,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  );
}
