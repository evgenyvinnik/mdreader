import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure Monaco to use local files instead of CDN
loader.config({ monaco });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
}

export function MarkdownEditor({ value, onChange, theme }: MarkdownEditorProps) {
  const handleEditorChange = (newValue: string | undefined) => {
    onChange(newValue ?? '');
  };

  return (
    <div className="editor-container">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        onChange={handleEditorChange}
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
