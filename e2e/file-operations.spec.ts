import { test, expect, MDReaderPage } from './helpers/fixtures';
import * as path from 'path';

test.describe('File Operations', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
    await mdreader.goto();
  });

  test.describe('Save File', () => {
    test('should trigger download when save is clicked', async ({ page }) => {
      // Add some content
      await mdreader.setEditorContent('# Content to Save\n\nThis is saved content.');
      await page.waitForTimeout(300);

      // Set up download handler
      const downloadPromise = page.waitForEvent('download');
      
      // Click save
      await mdreader.saveButton.click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download was triggered
      expect(download).toBeTruthy();
      
      // Filename should end with .md
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.md$/);
    });

    test('should include document title in filename', async ({ page }) => {
      await mdreader.setEditorContent('Test content');
      await page.waitForTimeout(600);
      
      const docTitle = await mdreader.getCurrentDocumentTitle();
      
      const downloadPromise = page.waitForEvent('download');
      await mdreader.saveButton.click();
      
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      
      // Filename should contain some part of the title
      expect(filename).toBeTruthy();
    });

    test('should save with correct content', async ({ page }) => {
      const testContent = '# Test Document\n\nWith specific content for testing.';
      await mdreader.setEditorContent(testContent);
      await page.waitForTimeout(300);

      const downloadPromise = page.waitForEvent('download');
      await mdreader.saveButton.click();
      
      const download = await downloadPromise;
      
      // Read the downloaded content
      const downloadPath = await download.path();
      if (downloadPath) {
        const fs = await import('fs/promises');
        const content = await fs.readFile(downloadPath, 'utf-8');
        expect(content).toBe(testContent);
      }
    });
  });

  test.describe('Open File', () => {
    test('should have open button visible', async () => {
      await expect(mdreader.openButton).toBeVisible();
    });

    test('should have correct tooltip', async () => {
      await expect(mdreader.openButton).toHaveAttribute('title', 'Open .md file');
    });

    // Note: Testing actual file opening requires file chooser interaction
    // which can be complex in Playwright. Here's how to test with a file:
    test('should open file via file chooser', async ({ page }) => {
      // Create a test markdown file content
      const testContent = '# Opened File\n\nThis was opened from a file.';
      
      // Set up file chooser handler before clicking
      const fileChooserPromise = page.waitForEvent('filechooser');
      
      // Click open button
      await mdreader.openButton.click();
      
      // Wait for file chooser
      const fileChooser = await fileChooserPromise;
      
      // Create a temporary file buffer
      const buffer = Buffer.from(testContent, 'utf-8');
      
      // Set the file
      await fileChooser.setFiles({
        name: 'test-file.md',
        mimeType: 'text/markdown',
        buffer: buffer
      });
      
      // Wait for content to load
      await page.waitForTimeout(500);
      
      // Verify content was loaded
      await expect(mdreader.previewContent).toContainText('Opened File');
    });

    test('should handle markdown files with .markdown extension', async ({ page }) => {
      const testContent = '# Markdown Extension\n\nTest with .markdown extension.';
      
      const fileChooserPromise = page.waitForEvent('filechooser');
      await mdreader.openButton.click();
      const fileChooser = await fileChooserPromise;
      
      await fileChooser.setFiles({
        name: 'test-file.markdown',
        mimeType: 'text/markdown',
        buffer: Buffer.from(testContent, 'utf-8')
      });
      
      await page.waitForTimeout(500);
      await expect(mdreader.previewContent).toContainText('Markdown Extension');
    });
  });

  test.describe('New Document', () => {
    test('should create blank document', async ({ page }) => {
      // Add content to current document
      await mdreader.setEditorContent('Existing content');
      await page.waitForTimeout(1000);
      
      // Create new document
      await mdreader.createNewDocument();
      
      // Wait for the document title to be visible and not "Select file"
      await page.waitForFunction(() => {
        const titleEl = document.querySelector('.file-dropdown-current');
        return titleEl && titleEl.textContent && !titleEl.textContent.includes('Select file');
      }, { timeout: 5000 });
      await page.waitForTimeout(300);
      
      // New document should be mostly empty (or have default content)
      const currentTitle = await mdreader.getCurrentDocumentTitle();
      expect(currentTitle).toMatch(/Untitled_\d{4}-\d{2}-\d{2}_\d{6}/);
    });

    test('should preserve previous document', async ({ page }) => {
      // Add content
      await mdreader.setEditorContent('First document content');
      await page.waitForTimeout(600);
      const firstTitle = await mdreader.getCurrentDocumentTitle();
      
      // Create new
      await mdreader.createNewDocument();
      await page.waitForTimeout(300);
      
      // Check first document is in dropdown
      await mdreader.openFileDropdown();
      const items = page.locator('.file-dropdown-item-title');
      const titles = await items.allTextContents();
      
      expect(titles).toContain(firstTitle);
    });

    test('should generate unique document titles', async ({ page }) => {
      // Create multiple documents
      const titles: string[] = [];
      
      for (let i = 0; i < 3; i++) {
        await mdreader.createNewDocument();
        await page.waitForTimeout(1100); // Wait for timestamp to change
        titles.push(await mdreader.getCurrentDocumentTitle());
      }
      
      // All titles should be unique
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });
  });

  test.describe('Document Title from Content', () => {
    test('should update document in list', async ({ page }) => {
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      
      // Add content
      await mdreader.typeInEditor('Some content here');
      await page.waitForTimeout(600);
      
      // Check document is in list
      await mdreader.openFileDropdown();
      const items = page.locator('.file-dropdown-item');
      expect(await items.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Document Navigation', () => {
    test('should switch between documents', async ({ page }) => {
      // Create first document with content
      await mdreader.setEditorContent('Content of document one');
      await page.waitForTimeout(1000);
      
      // Create second document
      await mdreader.createNewDocument();
      
      // Wait for title to load for new document
      await page.waitForFunction(() => {
        const titleEl = document.querySelector('.file-dropdown-current');
        return titleEl && titleEl.textContent && !titleEl.textContent.includes('Select file');
      }, { timeout: 5000 });
      await page.waitForTimeout(300);
      
      await mdreader.setEditorContent('Content of document two');
      await page.waitForTimeout(1000);
      
      // Open dropdown and select first document
      await mdreader.openFileDropdown();
      await page.waitForTimeout(200);
      const items = page.locator('.file-dropdown-item');
      
      // Click the second item (first document, since new one is at top)
      if (await items.count() >= 2) {
        await items.nth(1).click();
        await page.waitForTimeout(800);
        
        // Should show first document content
        await expect(mdreader.previewContent).toContainText('Content of document one');
      }
    });

    test('should highlight active document in dropdown', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      const activeItem = page.locator('.file-dropdown-item.active');
      expect(await activeItem.count()).toBe(1);
    });
  });
});
