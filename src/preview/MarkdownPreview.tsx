import { useMemo, type RefObject, type JSX } from 'react';
import MarkdownIt, { type PluginSimple } from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTaskLists from 'markdown-it-task-lists';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

interface MarkdownPreviewProps {
  readonly content: string;
  readonly theme: 'light' | 'dark';
  readonly previewRef?: RefObject<HTMLDivElement | null>;
  readonly onScroll?: () => void;
}

// Configure markdown-it with plugins
const md = new MarkdownIt({
  html: false, // Disable raw HTML for security
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
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
    slugify: (s: string): string =>
      s
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-'),
  })
  .use(markdownItTaskLists, { enabled: true, label: true })
  .use(markdownItEmoji as PluginSimple);

export function MarkdownPreview({ content, theme, previewRef, onScroll }: MarkdownPreviewProps): JSX.Element {
  const renderedHtml = useMemo((): string => {
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
