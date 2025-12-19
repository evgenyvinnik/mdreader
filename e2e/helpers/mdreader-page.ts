import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for MD Reader application
 * Provides helper methods for interacting with UI elements
 */
export class MDReaderPage {
  readonly page: Page;

  // Toolbar elements
  readonly appTitle: Locator;
  readonly newButton: Locator;
  readonly openButton: Locator;
  readonly saveButton: Locator;
  readonly lockButton: Locator;
  readonly editorViewButton: Locator;
  readonly splitViewButton: Locator;
  readonly previewViewButton: Locator;
  readonly themeButton: Locator;

  // File dropdown elements
  readonly fileDropdown: Locator;
  readonly fileDropdownTrigger: Locator;
  readonly fileDropdownMenu: Locator;
  readonly fileSearchInput: Locator;

  // Panes
  readonly editorPane: Locator;
  readonly previewPane: Locator;
  readonly editorHeader: Locator;
  readonly previewHeader: Locator;

  // Monaco Editor
  readonly monacoEditor: Locator;
  readonly monacoTextArea: Locator;

  // Preview content
  readonly previewContent: Locator;
  readonly previewScrollContainer: Locator;

  // Loading state
  readonly loadingContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Toolbar
    this.appTitle = page.locator('.app-title');
    this.newButton = page.locator('button[title="New document"]');
    this.openButton = page.locator('button[title="Open .md file"]');
    this.saveButton = page.locator('button[title="Save as .md file"]');
    this.lockButton = page.locator('button[title*="scroll sync"]');
    this.editorViewButton = page.locator('button[title="Editor only"]');
    this.splitViewButton = page.locator('button[title="Split view"]');
    this.previewViewButton = page.locator('button[title="Preview only"]');
    this.themeButton = page.locator('button[title*="Switch to"]');

    // File dropdown
    this.fileDropdown = page.locator('.file-dropdown');
    this.fileDropdownTrigger = page.locator('.file-dropdown-trigger');
    this.fileDropdownMenu = page.locator('.file-dropdown-menu');
    this.fileSearchInput = page.locator('.file-dropdown-search input');

    // Panes
    this.editorPane = page.locator('.editor-pane');
    this.previewPane = page.locator('.preview-pane');
    this.editorHeader = page.locator('.editor-pane .pane-header');
    this.previewHeader = page.locator('.preview-pane .pane-header');

    // Monaco Editor
    this.monacoEditor = page.locator('.monaco-editor');
    this.monacoTextArea = page.locator('.monaco-editor textarea');

    // Preview
    this.previewContent = page.locator('.markdown-body');
    this.previewScrollContainer = page.locator('.preview-container');

    // Loading
    this.loadingContainer = page.locator('.loading-container');
  }

  /**
   * Navigate to the app and wait for it to load
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForAppLoad();
    // Ensure split view mode so both editor and preview are visible
    await this.setViewMode('both');
  }

  /**
   * Wait for the app to fully load (loading spinner gone)
   */
  async waitForAppLoad(): Promise<void> {
    // Wait for loading to disappear or not be present
    await this.page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading;
    }, { timeout: 30000 });
    
    // Wait for either Monaco editor OR preview container (for preview-only mode)
    await this.page.waitForFunction(() => {
      const monaco = document.querySelector('.monaco-editor');
      const preview = document.querySelector('.preview-container');
      return monaco !== null || preview !== null;
    }, { timeout: 30000 });
  }

  /**
   * Clear localStorage to reset app preferences
   * Note: IndexedDB clearing is unreliable across browsers, use fresh browser context instead
   */
  async resetAppState(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Get the current theme
   */
  async getTheme(): Promise<string> {
    return await this.page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') ?? 'dark';
    });
  }

  /**
   * Toggle the theme
   */
  async toggleTheme(): Promise<void> {
    await this.themeButton.click();
  }

  /**
   * Get the current view mode from the main content class
   */
  async getViewMode(): Promise<string> {
    const mainContent = this.page.locator('.main-content');
    const className = await mainContent.getAttribute('class');
    if (className?.includes('view-editor')) return 'editor';
    if (className?.includes('view-preview')) return 'preview';
    return 'both';
  }

  /**
   * Set the view mode
   */
  async setViewMode(mode: 'editor' | 'both' | 'preview'): Promise<void> {
    const buttons = {
      editor: this.editorViewButton,
      both: this.splitViewButton,
      preview: this.previewViewButton,
    };
    await buttons[mode].click();
  }

  /**
   * Check if scroll is locked
   */
  async isScrollLocked(): Promise<boolean> {
    const title = await this.lockButton.getAttribute('title');
    return title?.includes('Unlock') ?? false;
  }

  /**
   * Toggle scroll lock
   */
  async toggleScrollLock(): Promise<void> {
    await this.lockButton.click();
  }

  /**
   * Click the new document button
   */
  async createNewDocument(): Promise<void> {
    await this.newButton.click();
  }

  /**
   * Type content into the Monaco editor
   */
  async typeInEditor(text: string): Promise<void> {
    // Click on the editor to focus it
    await this.monacoEditor.click();
    
    // Wait for editor to be ready
    await this.page.waitForTimeout(100);
    
    // Type the text
    await this.page.keyboard.type(text, { delay: 10 });
  }

  /**
   * Clear and set editor content 
   * Uses Monaco's setValue and triggers model content changed event
   */
  async setEditorContent(text: string): Promise<void> {
    // Use Monaco's setValue which triggers onDidChangeModelContent 
    // which in turn triggers the onChange callback in React
    await this.page.evaluate((content) => {
      const win = window as unknown as { 
        monaco?: { 
          editor: { 
            getEditors: () => Array<{ 
              setValue: (value: string) => void;
              getModel: () => { getValue: () => string } | null;
            }> 
          } 
        } 
      };
      const editor = win.monaco?.editor.getEditors()[0];
      if (editor) {
        editor.setValue(content);
      }
    }, text);
    
    // Wait for content to be processed and preview to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Set editor content and wait for a specific element to appear in preview
   * More reliable than fixed timeouts for CI environments
   */
  async setEditorContentAndWaitFor(text: string, selector: string, timeout = 10000): Promise<void> {
    await this.setEditorContent(text);
    // Use .first() to handle cases where the selector matches multiple elements
    await this.page.locator(selector).first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Get the editor content via Monaco API
   */
  async getEditorContent(): Promise<string> {
    return await this.page.evaluate(() => {
      // Access Monaco through window
      const editor = (window as unknown as { monaco?: { editor: { getEditors: () => Array<{ getValue: () => string }> } } }).monaco?.editor.getEditors()[0];
      return editor?.getValue() ?? '';
    });
  }

  /**
   * Get the preview HTML content
   */
  async getPreviewContent(): Promise<string> {
    return await this.previewContent.innerHTML();
  }

  /**
   * Get the preview text content
   */
  async getPreviewText(): Promise<string> {
    return await this.previewContent.textContent() ?? '';
  }

  /**
   * Open the file dropdown
   */
  async openFileDropdown(): Promise<void> {
    await this.fileDropdownTrigger.click();
    await expect(this.fileDropdownMenu).toBeVisible();
  }

  /**
   * Close the file dropdown
   */
  async closeFileDropdown(): Promise<void> {
    // Click outside the dropdown
    await this.appTitle.click();
  }

  /**
   * Search for a document in the dropdown
   */
  async searchDocument(query: string): Promise<void> {
    await this.openFileDropdown();
    await this.fileSearchInput.fill(query);
  }

  /**
   * Get all document items in the dropdown
   */
  async getDocumentItems(): Promise<Locator> {
    return this.page.locator('.file-dropdown-item');
  }

  /**
   * Select a document from the dropdown by index
   */
  async selectDocumentByIndex(index: number): Promise<void> {
    const items = this.page.locator('.file-dropdown-item');
    await items.nth(index).click();
  }

  /**
   * Delete a document from the dropdown by index
   */
  async deleteDocumentByIndex(index: number): Promise<void> {
    const items = this.page.locator('.file-dropdown-item');
    const deleteButton = items.nth(index).locator('.file-dropdown-delete');
    
    // Handle the confirmation dialog
    this.page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    
    await deleteButton.click();
  }

  /**
   * Start renaming a document by index
   */
  async startRenameDocumentByIndex(index: number): Promise<Locator> {
    const items = this.page.locator('.file-dropdown-item');
    const editButton = items.nth(index).locator('.file-dropdown-edit');
    await editButton.click();
    return this.page.locator('.file-dropdown-edit-input');
  }

  /**
   * Get the current document title from the dropdown
   */
  async getCurrentDocumentTitle(): Promise<string> {
    return await this.page.locator('.file-dropdown-current').textContent() ?? '';
  }

  /**
   * Wait for preview to update with specific content
   */
  async waitForPreviewContent(expectedText: string, timeout = 5000): Promise<void> {
    await expect(this.previewContent).toContainText(expectedText, { timeout });
  }

  /**
   * Scroll the editor to a position
   * Note: We need to trigger the scroll event manually since programmatic setScrollTop
   * may not always trigger onDidScrollChange in the same way user scrolling does
   */
  async scrollEditor(scrollTop: number): Promise<void> {
    await this.page.evaluate((top) => {
      const monaco = (window as unknown as { 
        monaco?: { 
          editor: { 
            getEditors: () => Array<{ 
              setScrollTop: (top: number) => void;
              trigger: (source: string, handlerId: string, payload?: unknown) => void;
            }> 
          } 
        } 
      }).monaco;
      const editor = monaco?.editor.getEditors()[0];
      if (editor) {
        editor.setScrollTop(top);
        // Force scroll action trigger by using Monaco's internal trigger
        try {
          editor.trigger('test', 'scrollbar.updateScroll', {});
        } catch {
          // Ignore if trigger doesn't exist
        }
      }
    }, scrollTop);
    // Wait for scroll event to propagate
    await this.page.waitForTimeout(150);
  }

  /**
   * Scroll the preview to a position
   */
  async scrollPreview(scrollTop: number): Promise<void> {
    await this.previewScrollContainer.evaluate((el, top) => {
      el.scrollTop = top;
      // Dispatch scroll event to trigger sync
      el.dispatchEvent(new Event('scroll', { bubbles: true }));
    }, scrollTop);
    // Wait for scroll event to propagate
    await this.page.waitForTimeout(150);
  }

  /**
   * Get the preview scroll position
   */
  async getPreviewScrollTop(): Promise<number> {
    return await this.previewScrollContainer.evaluate((el) => el.scrollTop);
  }

  /**
   * Get the editor scroll position
   */
  async getEditorScrollTop(): Promise<number> {
    return await this.page.evaluate(() => {
      const editor = (window as unknown as { monaco?: { editor: { getEditors: () => Array<{ getScrollTop: () => number }> } } }).monaco?.editor.getEditors()[0];
      return editor?.getScrollTop() ?? 0;
    });
  }

  /**
   * Check if a specific element is visible in viewport
   */
  async isElementInViewport(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }
}

/**
 * Test data constants
 */
export const TestContent = {
  simple: '# Hello World\n\nThis is a test.',
  
  markdown: `# Heading 1
## Heading 2
### Heading 3

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

1. Numbered item 1
2. Numbered item 2

> This is a blockquote

\`\`\`javascript
const hello = 'world';
console.log(hello);
\`\`\`

[Link](https://example.com)

![Image](image.png)
`,

  gfm: `# GitHub Flavored Markdown

## Task Lists
- [x] Completed task
- [ ] Incomplete task

## Tables
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

## Strikethrough
~~deleted text~~

## Emoji
:smile: :heart: :+1:
`,

  longContent: Array(100).fill('# Line\n\nThis is paragraph content for testing scroll synchronization.\n\n').join(''),
};
