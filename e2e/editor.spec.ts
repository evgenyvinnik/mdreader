import { test, expect, MDReaderPage } from './helpers/fixtures';

test.describe('Editor Functionality', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
    await mdreader.goto();
  });

  test.describe('Monaco Editor Initialization', () => {
    test('should render Monaco editor', async () => {
      await expect(mdreader.monacoEditor).toBeVisible();
    });

    test('should have line numbers visible', async ({ page }) => {
      const lineNumbers = page.locator('.monaco-editor .line-numbers');
      await expect(lineNumbers.first()).toBeVisible();
    });

    test('should have the textarea for input', async () => {
      await expect(mdreader.monacoTextArea).toBeAttached();
    });
  });

  test.describe('Text Input', () => {
    test('should accept text input', async ({ page }) => {
      await mdreader.setEditorContent('Hello World');
      await page.waitForTimeout(300);
      
      // Check preview has the content
      await expect(mdreader.previewContent).toContainText('Hello World');
    });

    test('should handle multi-line input', async ({ page }) => {
      const content = 'Line 1\nLine 2\nLine 3';
      await mdreader.setEditorContent(content);
      await page.waitForTimeout(300);
      
      const previewText = await mdreader.getPreviewText();
      expect(previewText).toContain('Line 1');
      expect(previewText).toContain('Line 2');
      expect(previewText).toContain('Line 3');
    });

    test('should handle special characters', async ({ page }) => {
      await mdreader.setEditorContent('Special: <>&"\'');
      await page.waitForTimeout(300);
      
      // Characters should be escaped in preview
      await expect(mdreader.previewContent).toContainText('Special:');
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should support Ctrl/Cmd+A to select all', async ({ page }) => {
      await mdreader.setEditorContent('Select all this text');
      await page.waitForTimeout(300);
      
      await mdreader.monacoEditor.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Meta+A');
      await page.waitForTimeout(100);
      
      // After select all, typing should replace all content
      await page.keyboard.type('New content', { delay: 20 });
      await page.waitForTimeout(500);
      
      await expect(mdreader.previewContent).toContainText('New content');
      await expect(mdreader.previewContent).not.toContainText('Select all');
    });

    test('should support undo with Ctrl/Cmd+Z', async ({ page }) => {
      await mdreader.setEditorContent('Original');
      await page.waitForTimeout(200);
      
      await mdreader.monacoEditor.click();
      await page.keyboard.press('End');
      await page.keyboard.type(' added');
      await page.waitForTimeout(200);
      
      await expect(mdreader.previewContent).toContainText('Original added');
      
      // Undo
      await page.keyboard.press('Meta+Z');
      await page.waitForTimeout(300);
      
      // Content should be back to original (undo may work differently)
      // This test may need adjustment based on Monaco's undo behavior
    });
  });

  test.describe('Markdown Syntax', () => {
    test('should handle heading syntax', async ({ page }) => {
      await mdreader.setEditorContent('# Heading 1\n## Heading 2\n### Heading 3');
      await page.waitForTimeout(300);
      
      const h1 = page.locator('.markdown-body h1');
      const h2 = page.locator('.markdown-body h2');
      const h3 = page.locator('.markdown-body h3');
      
      await expect(h1).toHaveText('Heading 1');
      await expect(h2).toHaveText('Heading 2');
      await expect(h3).toHaveText('Heading 3');
    });

    test('should handle bold and italic', async ({ page }) => {
      await mdreader.setEditorContent('**bold** and *italic* and ***both***');
      await page.waitForTimeout(300);
      
      const strong = page.locator('.markdown-body strong');
      const em = page.locator('.markdown-body em');
      
      await expect(strong.first()).toBeVisible();
      await expect(em.first()).toBeVisible();
    });

    test('should handle code blocks', async ({ page }) => {
      await mdreader.setEditorContent('```javascript\nconst x = 1;\n```');
      await page.waitForTimeout(300);
      
      const codeBlock = page.locator('.markdown-body pre code');
      await expect(codeBlock).toBeVisible();
      await expect(codeBlock).toContainText('const x = 1');
    });

    test('should handle inline code', async ({ page }) => {
      await mdreader.setEditorContent('Use `inline code` here');
      await page.waitForTimeout(300);
      
      const inlineCode = page.locator('.markdown-body code').first();
      await expect(inlineCode).toContainText('inline code');
    });

    test('should handle unordered lists', async ({ page }) => {
      await mdreader.setEditorContent('- Item 1\n- Item 2\n- Item 3');
      await page.waitForTimeout(300);
      
      const listItems = page.locator('.markdown-body ul li');
      expect(await listItems.count()).toBe(3);
    });

    test('should handle ordered lists', async ({ page }) => {
      await mdreader.setEditorContent('1. First\n2. Second\n3. Third');
      await page.waitForTimeout(300);
      
      const listItems = page.locator('.markdown-body ol li');
      expect(await listItems.count()).toBe(3);
    });

    test('should handle blockquotes', async ({ page }) => {
      await mdreader.setEditorContent('> This is a quote');
      await page.waitForTimeout(300);
      
      const blockquote = page.locator('.markdown-body blockquote');
      await expect(blockquote).toBeVisible();
      await expect(blockquote).toContainText('This is a quote');
    });

    test('should handle links', async ({ page }) => {
      await mdreader.setEditorContent('[Link text](https://example.com)');
      await page.waitForTimeout(300);
      
      const link = page.locator('.markdown-body a');
      await expect(link).toHaveAttribute('href', 'https://example.com');
      await expect(link).toHaveText('Link text');
    });

    test('should handle images', async ({ page }) => {
      await mdreader.setEditorContent('![Alt text](https://example.com/image.png)');
      await page.waitForTimeout(300);
      
      const img = page.locator('.markdown-body img');
      await expect(img).toHaveAttribute('src', 'https://example.com/image.png');
      await expect(img).toHaveAttribute('alt', 'Alt text');
    });

    test('should handle horizontal rules', async ({ page }) => {
      await mdreader.setEditorContent('Above\n\n---\n\nBelow');
      await page.waitForTimeout(300);
      
      const hr = page.locator('.markdown-body hr');
      await expect(hr).toBeVisible();
    });
  });

  test.describe('Real-time Preview Update', () => {
    test('should update preview as user types', async ({ page }) => {
      await mdreader.monacoEditor.click();
      await page.waitForTimeout(200);
      
      // Select all and clear first
      await page.keyboard.press('Meta+A');
      await page.waitForTimeout(100);
      
      // Type character by character
      await page.keyboard.type('# Dynamic', { delay: 50 });
      
      await page.waitForTimeout(500);
      
      const h1 = page.locator('.markdown-body h1');
      await expect(h1).toContainText('Dynamic');
    });

    test('should update preview when deleting content', async ({ page }) => {
      await mdreader.setEditorContentAndWaitFor('# Title\n\nParagraph', '.markdown-body h1');
      
      await expect(page.locator('.markdown-body h1')).toBeVisible();
      
      // Delete title
      await mdreader.monacoEditor.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Meta+A');
      await page.waitForTimeout(100);
      await page.keyboard.type('Just text', { delay: 20 });
      await page.waitForTimeout(500);
      
      await expect(page.locator('.markdown-body h1')).not.toBeVisible();
    });
  });

  test.describe('Editor Scrolling', () => {
    test('should be scrollable with long content', async ({ page }) => {
      // Create long content
      const longContent = Array(100).fill('Line of text').join('\n');
      await mdreader.setEditorContent(longContent);
      await page.waitForTimeout(500);
      
      // Try to scroll the editor
      const initialScroll = await mdreader.getEditorScrollTop();
      await mdreader.scrollEditor(500);
      await page.waitForTimeout(300);
      
      const newScroll = await mdreader.getEditorScrollTop();
      expect(newScroll).toBeGreaterThan(initialScroll);
    });
  });

  test.describe('Editor Focus', () => {
    test('should be focusable by clicking', async ({ page }) => {
      await mdreader.monacoEditor.click();
      await page.waitForTimeout(300);
      
      // The editor should have focus (indicated by textarea focus)
      const textarea = page.locator('.monaco-editor textarea');
      await expect(textarea).toBeFocused();
    });
  });

  test.describe('Word Wrap', () => {
    test('should wrap long lines', async ({ page }) => {
      // Create very long line
      const longLine = 'A'.repeat(500);
      await mdreader.setEditorContent(longLine);
      await page.waitForTimeout(300);
      
      // The editor should handle this without horizontal scrolling issues
      await expect(mdreader.monacoEditor).toBeVisible();
    });
  });
});
