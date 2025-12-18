import { useMemo, RefObject } from 'react';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTaskLists from 'markdown-it-task-lists';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

interface MarkdownPreviewProps {
  content: string;
  theme: 'light' | 'dark';
  previewRef?: RefObject<HTMLDivElement | null>;
  onScroll?: () => void;
}

// Configure markdown-it with plugins
const md = new MarkdownIt({
  html: false, // Disable raw HTML for security
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
      } catch {
        // Fallback to default
      }
    }
    return ''; // Use external default escaping
  },
})
  .use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.headerLink(),
    slugify: (s: string) =>
      s
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-'),
  })
  .use(markdownItTaskLists, { enabled: true, label: true })
  .use(markdownItEmoji);

export function MarkdownPreview({ content, theme, previewRef, onScroll }: MarkdownPreviewProps) {
  const renderedHtml = useMemo(() => {
    const rawHtml = md.render(content);
    // Sanitize the HTML output
    return DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target'],
    });
  }, [content]);

  return (
    <div
      className={`preview-container ${theme}`}
      ref={previewRef}
      onScroll={onScroll}
    >
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}
