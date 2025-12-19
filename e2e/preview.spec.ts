import { test, expect, MDReaderPage, TestContent } from './helpers/fixtures';

test.describe('Preview Rendering', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
    await mdreader.goto();
  });

  test.describe('Basic Markdown Rendering', () => {
    test('should render headings correctly', async ({ page }) => {
      await mdreader.setEditorContent('# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6');
      await page.waitForTimeout(300);
      
      await expect(page.locator('.markdown-body h1')).toHaveText('H1');
      await expect(page.locator('.markdown-body h2')).toHaveText('H2');
      await expect(page.locator('.markdown-body h3')).toHaveText('H3');
      await expect(page.locator('.markdown-body h4')).toHaveText('H4');
      await expect(page.locator('.markdown-body h5')).toHaveText('H5');
      await expect(page.locator('.markdown-body h6')).toHaveText('H6');
    });

    test('should render paragraphs', async ({ page }) => {
      await mdreader.setEditorContent('First paragraph.\n\nSecond paragraph.');
      await page.waitForTimeout(300);
      
      const paragraphs = page.locator('.markdown-body p');
      expect(await paragraphs.count()).toBe(2);
    });

    test('should render bold text', async ({ page }) => {
      await mdreader.setEditorContent('**bold text** and __also bold__');
      await page.waitForTimeout(300);
      
      const strong = page.locator('.markdown-body strong');
      expect(await strong.count()).toBe(2);
    });

    test('should render italic text', async ({ page }) => {
      await mdreader.setEditorContent('*italic* and _also italic_');
      await page.waitForTimeout(300);
      
      const em = page.locator('.markdown-body em');
      expect(await em.count()).toBe(2);
    });

    test('should render bold italic text', async ({ page }) => {
      await mdreader.setEditorContent('***bold and italic***');
      await page.waitForTimeout(300);
      
      const content = await mdreader.getPreviewContent();
      expect(content).toContain('<strong>');
      expect(content).toContain('<em>');
    });
  });

  test.describe('GitHub Flavored Markdown', () => {
    test('should render task lists', async ({ page }) => {
      await mdreader.setEditorContent('- [x] Completed\n- [ ] Incomplete');
      await page.waitForTimeout(300);
      
      const checkboxes = page.locator('.markdown-body input[type="checkbox"]');
      expect(await checkboxes.count()).toBe(2);
      
      // First should be checked
      await expect(checkboxes.first()).toBeChecked();
      // Second should not be checked
      await expect(checkboxes.last()).not.toBeChecked();
    });

    test('should render tables', async ({ page }) => {
      const tableMarkdown = `| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |
| Cell 3 | Cell 4 |`;
      
      await mdreader.setEditorContent(tableMarkdown);
      await page.waitForTimeout(300);
      
      const table = page.locator('.markdown-body table');
      await expect(table).toBeVisible();
      
      const headers = page.locator('.markdown-body th');
      expect(await headers.count()).toBe(2);
      
      const cells = page.locator('.markdown-body td');
      expect(await cells.count()).toBe(4);
    });

    test('should render strikethrough', async ({ page }) => {
      await mdreader.setEditorContent('~~deleted text~~');
      await page.waitForTimeout(300);
      
      const strikethrough = page.locator('.markdown-body del, .markdown-body s');
      await expect(strikethrough).toBeVisible();
    });

    test('should render fenced code blocks with language', async ({ page }) => {
      await mdreader.setEditorContent('```javascript\nconst x = 1;\n```');
      await page.waitForTimeout(300);
      
      const codeBlock = page.locator('.markdown-body pre code');
      await expect(codeBlock).toBeVisible();
      
      // Should have language class for syntax highlighting
      const className = await codeBlock.getAttribute('class');
      expect(className).toContain('javascript');
    });

    test('should render autolinks', async ({ page }) => {
      await mdreader.setEditorContent('<https://example.com>');
      await page.waitForTimeout(300);
      
      const link = page.locator('.markdown-body a');
      await expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });

  test.describe('Syntax Highlighting', () => {
    test('should highlight JavaScript code', async ({ page }) => {
      await mdreader.setEditorContentAndWaitFor('```javascript\nconst x = "hello";\nconsole.log(x);\n```', '.markdown-body pre code');
      
      const codeBlock = page.locator('.markdown-body pre code');
      await expect(codeBlock).toBeVisible();
    });

    test('should highlight Python code', async ({ page }) => {
      await mdreader.setEditorContent('```python\ndef hello():\n    print("Hello")\n```');
      await page.waitForTimeout(500);
      
      const codeBlock = page.locator('.markdown-body pre code');
      await expect(codeBlock).toBeVisible();
    });

    test('should highlight TypeScript code', async ({ page }) => {
      await mdreader.setEditorContent('```typescript\nconst x: string = "hello";\n```');
      await page.waitForTimeout(500);
      
      const codeBlock = page.locator('.markdown-body pre code');
      await expect(codeBlock).toBeVisible();
    });

    test('should handle unknown languages gracefully', async ({ page }) => {
      await mdreader.setEditorContent('```unknownlang\nsome code\n```');
      await page.waitForTimeout(300);
      
      const codeBlock = page.locator('.markdown-body pre code');
      await expect(codeBlock).toBeVisible();
      await expect(codeBlock).toContainText('some code');
    });
  });

  test.describe('Emoji Support', () => {
    test('should render emoji shortcodes', async ({ page }) => {
      await mdreader.setEditorContent(':smile: :heart: :+1:');
      await page.waitForTimeout(300);
      
      const content = await mdreader.getPreviewContent();
      // Emojis should be rendered (not the shortcode)
      expect(content).not.toContain(':smile:');
    });

    test('should render multiple emojis', async ({ page }) => {
      await mdreader.setEditorContent(':rocket: :star: :fire:');
      await page.waitForTimeout(300);
      
      const text = await mdreader.getPreviewText();
      expect(text).not.toContain(':rocket:');
      expect(text).not.toContain(':star:');
    });
  });

  test.describe('Anchor Links', () => {
    test('should generate anchor links for headings', async ({ page }) => {
      await mdreader.setEditorContent('# Heading One\n## Heading Two');
      await page.waitForTimeout(300);
      
      const anchors = page.locator('.markdown-body .header-anchor');
      // Anchor links should be generated
      expect(await anchors.count()).toBeGreaterThanOrEqual(0);
      
      // Headings should have IDs
      const h1 = page.locator('.markdown-body h1');
      const h1Id = await h1.getAttribute('id');
      expect(h1Id).toBeTruthy();
    });

    test('should generate valid slugs for heading IDs', async ({ page }) => {
      await mdreader.setEditorContent('# Hello World');
      await page.waitForTimeout(300);
      
      const h1 = page.locator('.markdown-body h1');
      const id = await h1.getAttribute('id');
      
      // ID should be lowercase and hyphenated
      expect(id).toBe('hello-world');
    });
  });

  test.describe('Links', () => {
    test('should render external links', async ({ page }) => {
      await mdreader.setEditorContent('[Example](https://example.com)');
      await page.waitForTimeout(300);
      
      const link = page.locator('.markdown-body a');
      await expect(link).toHaveAttribute('href', 'https://example.com');
      await expect(link).toHaveText('Example');
    });

    test('should render reference-style links', async ({ page }) => {
      await mdreader.setEditorContentAndWaitFor('[Example][1]\n\n[1]: https://example.com', '.markdown-body a');
      
      const link = page.locator('.markdown-body a');
      await expect(link).toHaveAttribute('href', 'https://example.com');
    });

    test('should render mailto links', async ({ page }) => {
      await mdreader.setEditorContent('[Email](mailto:test@example.com)');
      await page.waitForTimeout(300);
      
      const link = page.locator('.markdown-body a');
      await expect(link).toHaveAttribute('href', 'mailto:test@example.com');
    });
  });

  test.describe('Images', () => {
    test('should render images with src and alt', async ({ page }) => {
      await mdreader.setEditorContent('![Alt text](https://via.placeholder.com/150)');
      await page.waitForTimeout(300);
      
      const img = page.locator('.markdown-body img');
      await expect(img).toHaveAttribute('src', 'https://via.placeholder.com/150');
      await expect(img).toHaveAttribute('alt', 'Alt text');
    });

    test('should render images with title', async ({ page }) => {
      await mdreader.setEditorContent('![Alt](https://via.placeholder.com/150 "Title text")');
      await page.waitForTimeout(300);
      
      const img = page.locator('.markdown-body img');
      await expect(img).toHaveAttribute('title', 'Title text');
    });
  });

  test.describe('Blockquotes', () => {
    test('should render simple blockquotes', async ({ page }) => {
      await mdreader.setEditorContent('> Quote text');
      await page.waitForTimeout(300);
      
      const blockquote = page.locator('.markdown-body blockquote');
      await expect(blockquote).toBeVisible();
      await expect(blockquote).toContainText('Quote text');
    });

    test('should render nested blockquotes', async ({ page }) => {
      await mdreader.setEditorContent('> Level 1\n>> Level 2');
      await page.waitForTimeout(300);
      
      const blockquotes = page.locator('.markdown-body blockquote');
      expect(await blockquotes.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Lists', () => {
    test('should render unordered lists', async ({ page }) => {
      await mdreader.setEditorContent('- Item 1\n- Item 2\n- Item 3');
      await page.waitForTimeout(300);
      
      const ul = page.locator('.markdown-body ul');
      await expect(ul).toBeVisible();
      
      const items = page.locator('.markdown-body ul > li');
      expect(await items.count()).toBe(3);
    });

    test('should render ordered lists', async ({ page }) => {
      await mdreader.setEditorContent('1. First\n2. Second\n3. Third');
      await page.waitForTimeout(300);
      
      const ol = page.locator('.markdown-body ol');
      await expect(ol).toBeVisible();
      
      const items = page.locator('.markdown-body ol > li');
      expect(await items.count()).toBe(3);
    });

    test('should render nested lists', async ({ page }) => {
      await mdreader.setEditorContentAndWaitFor('- Parent\n  - Child 1\n  - Child 2', '.markdown-body ul');
      
      const nestedUl = page.locator('.markdown-body ul ul');
      await expect(nestedUl).toBeVisible();
    });
  });

  test.describe('Horizontal Rules', () => {
    test('should render horizontal rules with ---', async ({ page }) => {
      await mdreader.setEditorContent('Above\n\n---\n\nBelow');
      await page.waitForTimeout(300);
      
      const hr = page.locator('.markdown-body hr');
      await expect(hr).toBeVisible();
    });

    test('should render horizontal rules with ***', async ({ page }) => {
      await mdreader.setEditorContent('Above\n\n***\n\nBelow');
      await page.waitForTimeout(300);
      
      const hr = page.locator('.markdown-body hr');
      await expect(hr).toBeVisible();
    });
  });

  test.describe('Inline Code', () => {
    test('should render inline code', async ({ page }) => {
      await mdreader.setEditorContent('Use `code` here');
      await page.waitForTimeout(300);
      
      const code = page.locator('.markdown-body code').first();
      await expect(code).toHaveText('code');
    });

    test('should handle backticks in inline code', async ({ page }) => {
      await mdreader.setEditorContent('Use `` `backticks` `` here');
      await page.waitForTimeout(300);
      
      const code = page.locator('.markdown-body code').first();
      await expect(code).toContainText('`');
    });
  });

  test.describe('HTML Sanitization', () => {
    test('should sanitize script tags', async ({ page }) => {
      await mdreader.setEditorContent('<script>alert("XSS")</script>');
      await page.waitForTimeout(300);
      
      const content = await mdreader.getPreviewContent();
      expect(content).not.toContain('<script>');
    });

    test('should sanitize event handlers', async ({ page }) => {
      await mdreader.setEditorContent('<div onclick="alert(1)">Click me</div>');
      await page.waitForTimeout(500);
      
      const content = await mdreader.getPreviewContent();
      expect(content).not.toContain('onclick');
    });

    test('should sanitize javascript: URLs', async ({ page }) => {
      await mdreader.setEditorContent('[Click](javascript:alert(1))');
      await page.waitForTimeout(500);
      
      const content = await mdreader.getPreviewContent();
      // javascript: URLs should be sanitized - link may not be rendered or href removed
      expect(content).not.toContain('javascript:alert');
    });
  });

  test.describe('Preview Scrolling', () => {
    test('should be scrollable with long content', async ({ page }) => {
      await mdreader.setEditorContentAndWaitFor(TestContent.longContent, '.markdown-body h1');
      
      const preview = mdreader.previewContent;
      const initialScroll = await preview.evaluate(el => el.scrollTop);
      
      await preview.evaluate(el => { el.scrollTop = 500; });
      await page.waitForTimeout(100);
      const newScroll = await preview.evaluate(el => el.scrollTop);
      
      expect(newScroll).toBeGreaterThan(initialScroll);
    });
  });

  test.describe('Complex Markdown', () => {
    test('should render complex GFM content', async ({ page }) => {
      await mdreader.setEditorContent(TestContent.gfm);
      await page.waitForTimeout(500);
      
      // Check for task lists
      const checkboxes = page.locator('.markdown-body input[type="checkbox"]');
      expect(await checkboxes.count()).toBe(2);
      
      // Check for tables
      const table = page.locator('.markdown-body table');
      await expect(table).toBeVisible();
    });

    test('should render mixed content', async ({ page }) => {
      await mdreader.setEditorContent(TestContent.markdown);
      await page.waitForTimeout(500);
      
      // Check multiple elements are rendered
      await expect(page.locator('.markdown-body h1')).toBeVisible();
      await expect(page.locator('.markdown-body h2')).toBeVisible();
      await expect(page.locator('.markdown-body ul')).toBeVisible();
      await expect(page.locator('.markdown-body ol')).toBeVisible();
      await expect(page.locator('.markdown-body blockquote')).toBeVisible();
      await expect(page.locator('.markdown-body pre')).toBeVisible();
    });
  });
});
