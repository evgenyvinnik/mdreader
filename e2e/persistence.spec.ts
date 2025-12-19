import { test, expect, MDReaderPage } from './helpers/fixtures';

test.describe('Persistence', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
  });

  test.describe('Document Auto-save', () => {
    test('should auto-save document content after typing', async ({ page }) => {
      await mdreader.goto();
      
      // Type some content
      await mdreader.setEditorContent('# Auto-saved Content');
      
      // Wait for debounce save (500ms + buffer)
      await page.waitForTimeout(800);
      
      // Reload the page
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // Content should be restored
      await expect(mdreader.previewContent).toContainText('Auto-saved Content');
    });

    test('should save document title', async ({ page }) => {
      await mdreader.goto();
      
      // Create new document and add content
      await mdreader.createNewDocument();
      
      // Wait for title to load
      await page.waitForFunction(() => {
        const titleEl = document.querySelector('.file-dropdown-current');
        return titleEl && titleEl.textContent && !titleEl.textContent.includes('Select file');
      }, { timeout: 5000 });
      await page.waitForTimeout(300);
      
      await mdreader.typeInEditor('New document content');
      await page.waitForTimeout(1000);
      
      const title = await mdreader.getCurrentDocumentTitle();
      
      // Reload
      await page.reload();
      await mdreader.waitForAppLoad();
      await page.waitForTimeout(500);
      
      // Document should still exist in dropdown
      await mdreader.openFileDropdown();
      const items = page.locator('.file-dropdown-item-title');
      const titles = await items.allTextContents();
      expect(titles.some(t => t.includes(title) || title.includes(t))).toBe(true);
    });

    test('should update document on content change', async ({ page }) => {
      await mdreader.goto();
      
      await mdreader.setEditorContent('Version 1');
      await page.waitForTimeout(800);
      
      await mdreader.setEditorContent('Version 2');
      await page.waitForTimeout(800);
      
      // Reload
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // Should have the latest version
      await expect(mdreader.previewContent).toContainText('Version 2');
      await expect(mdreader.previewContent).not.toContainText('Version 1');
    });
  });

  test.describe('Last Document Memory', () => {
    test('should remember last edited document', async ({ page }) => {
      await mdreader.goto();
      
      // Create first document
      await mdreader.setEditorContent('First document');
      await page.waitForTimeout(1000);
      
      // Create second document
      await mdreader.createNewDocument();
      await page.waitForTimeout(500);
      
      // Wait for the document title to be visible and not "Select file"
      await page.waitForFunction(() => {
        const titleEl = document.querySelector('.file-dropdown-current');
        return titleEl && titleEl.textContent && !titleEl.textContent.includes('Select file');
      }, { timeout: 5000 });
      
      await mdreader.typeInEditor('Second document');
      await page.waitForTimeout(1000);
      const secondTitle = await mdreader.getCurrentDocumentTitle();
      
      // Reload - should open second document (last edited)
      await page.reload();
      await mdreader.waitForAppLoad();
      await page.waitForTimeout(500);
      
      const currentTitle = await mdreader.getCurrentDocumentTitle();
      expect(currentTitle).toBe(secondTitle);
    });

    test('should store last document ID in localStorage', async ({ page }) => {
      await mdreader.goto();
      
      const lastDocId = await page.evaluate(() => 
        localStorage.getItem('mdreader-last-document-id')
      );
      
      expect(lastDocId).toBeTruthy();
    });
  });

  test.describe('Theme Persistence', () => {
    test('should persist theme setting', async ({ page }) => {
      await mdreader.goto();
      
      // Get initial theme and toggle
      const initialTheme = await mdreader.getTheme();
      await mdreader.toggleTheme();
      const newTheme = await mdreader.getTheme();
      
      // Verify stored
      const storedTheme = await page.evaluate(() => 
        localStorage.getItem('mdreader-theme')
      );
      expect(storedTheme).toBe(newTheme);
      
      // Reload and verify restored
      await page.reload();
      await mdreader.waitForAppLoad();
      
      const restoredTheme = await mdreader.getTheme();
      expect(restoredTheme).toBe(newTheme);
    });
  });

  test.describe('View Mode Persistence', () => {
    test('should persist view mode setting', async ({ page }) => {
      await mdreader.goto();
      
      // Change to editor-only view
      await mdreader.setViewMode('editor');
      
      // Verify stored
      const storedMode = await page.evaluate(() => 
        localStorage.getItem('mdreader-view-mode')
      );
      expect(storedMode).toBe('editor');
      
      // Reload and verify
      await page.reload();
      await mdreader.waitForAppLoad();
      
      const viewMode = await mdreader.getViewMode();
      expect(viewMode).toBe('editor');
    });

    test('should persist preview-only view mode', async ({ page }) => {
      await mdreader.goto();
      
      await mdreader.setViewMode('preview');
      await page.waitForTimeout(300);
      
      await page.reload();
      await mdreader.waitForAppLoad();
      await page.waitForTimeout(500);
      
      const viewMode = await mdreader.getViewMode();
      expect(viewMode).toBe('preview');
    });
  });

  test.describe('Scroll Lock Persistence', () => {
    test('should persist scroll lock setting', async ({ page }) => {
      await mdreader.goto();
      
      // Toggle scroll lock (default is locked)
      const initialLocked = await mdreader.isScrollLocked();
      await mdreader.toggleScrollLock();
      const newLocked = await mdreader.isScrollLocked();
      
      // Verify stored
      const storedLock = await page.evaluate(() => 
        localStorage.getItem('mdreader-scroll-lock')
      );
      expect(storedLock).toBe(String(newLocked));
      
      // Reload and verify
      await page.reload();
      await mdreader.waitForAppLoad();
      
      const restoredLocked = await mdreader.isScrollLocked();
      expect(restoredLocked).toBe(newLocked);
    });
  });

  test.describe('IndexedDB Storage', () => {
    test('should store documents in IndexedDB', async ({ page }) => {
      await mdreader.goto();
      
      await mdreader.setEditorContent('IndexedDB test content');
      await page.waitForTimeout(800);
      
      // Check if IndexedDB has the data
      const hasData = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          const request = indexedDB.open('mdreader-db');
          request.onsuccess = () => {
            const db = request.result;
            const hasStore = db.objectStoreNames.contains('documents');
            db.close();
            resolve(hasStore);
          };
          request.onerror = () => resolve(false);
        });
      });
      
      expect(hasData).toBe(true);
    });

    test('should retrieve documents from IndexedDB', async ({ page }) => {
      await mdreader.goto();
      
      await mdreader.setEditorContent('Retrievable content');
      await page.waitForTimeout(800);
      
      // Clear localStorage but keep IndexedDB
      await page.evaluate(() => {
        const lastDocId = localStorage.getItem('mdreader-last-document-id');
        localStorage.clear();
        if (lastDocId) {
          localStorage.setItem('mdreader-last-document-id', lastDocId);
        }
      });
      
      // Reload
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // Content should still be available from IndexedDB
      await expect(mdreader.previewContent).toContainText('Retrievable content');
    });
  });

  test.describe('Multiple Documents Persistence', () => {
    test('should persist multiple documents', async ({ page }) => {
      await mdreader.goto();
      
      // Create multiple documents
      await mdreader.setEditorContent('Document 1 content');
      await page.waitForTimeout(800);
      
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('Document 2 content');
      await page.waitForTimeout(800);
      
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('Document 3 content');
      await page.waitForTimeout(800);
      
      // Reload
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // Check all documents exist in dropdown
      await mdreader.openFileDropdown();
      const items = page.locator('.file-dropdown-item');
      const count = await items.count();
      
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should preserve document content across switches', async ({ page }) => {
      await mdreader.goto();
      
      // Create and save first document
      await mdreader.setEditorContent('First doc unique content');
      await page.waitForTimeout(800);
      const firstTitle = await mdreader.getCurrentDocumentTitle();
      
      // Create second document
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('Second doc unique content');
      await page.waitForTimeout(800);
      
      // Switch back to first document
      await mdreader.openFileDropdown();
      const items = page.locator('.file-dropdown-item');
      const count = await items.count();
      
      for (let i = 0; i < count; i++) {
        const title = await items.nth(i).locator('.file-dropdown-item-title').textContent();
        if (title === firstTitle) {
          await items.nth(i).click();
          break;
        }
      }
      
      await page.waitForTimeout(300);
      
      // First document content should be intact
      await expect(mdreader.previewContent).toContainText('First doc unique content');
    });
  });

  test.describe('Document Deletion Persistence', () => {
    test('should persist document deletion', async ({ page }) => {
      await mdreader.goto();
      
      // Create a document
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('To be deleted');
      await page.waitForTimeout(800);
      
      const titleToDelete = await mdreader.getCurrentDocumentTitle();
      
      // Create another document so we have something after deletion
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('Keeper document');
      await page.waitForTimeout(800);
      
      // Delete the first document
      await mdreader.openFileDropdown();
      
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });
      
      const items = page.locator('.file-dropdown-item');
      const count = await items.count();
      
      for (let i = 0; i < count; i++) {
        const title = await items.nth(i).locator('.file-dropdown-item-title').textContent();
        if (title === titleToDelete) {
          const deleteBtn = items.nth(i).locator('.file-dropdown-delete');
          await deleteBtn.click();
          break;
        }
      }
      
      await page.waitForTimeout(500);
      
      // Reload
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // Deleted document should not appear
      await mdreader.openFileDropdown();
      const newItems = page.locator('.file-dropdown-item');
      const newCount = await newItems.count();
      
      let foundDeleted = false;
      for (let i = 0; i < newCount; i++) {
        const title = await newItems.nth(i).locator('.file-dropdown-item-title').textContent();
        if (title === titleToDelete) {
          foundDeleted = true;
          break;
        }
      }
      
      expect(foundDeleted).toBe(false);
    });
  });

  test.describe('Document Rename Persistence', () => {
    test('should persist renamed document title', async ({ page }) => {
      await mdreader.goto();
      
      // Rename a document
      await mdreader.openFileDropdown();
      
      const editBtn = page.locator('.file-dropdown-item').first().locator('.file-dropdown-edit');
      await editBtn.click();
      
      const editInput = page.locator('.file-dropdown-edit-input');
      await editInput.fill('Renamed Document Title');
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(800);
      
      // Reload
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // Check if renamed title exists
      await mdreader.openFileDropdown();
      const items = page.locator('.file-dropdown-item-title');
      const titles = await items.allTextContents();
      
      expect(titles).toContain('Renamed Document Title');
    });
  });

  test.describe('State Reset', () => {
    test('should handle cleared localStorage gracefully', async ({ page }) => {
      await mdreader.goto();
      
      // Add content
      await mdreader.setEditorContent('Some content');
      await page.waitForTimeout(800);
      
      // Clear localStorage
      await page.evaluate(() => localStorage.clear());
      
      // Reload - should create new document or load from IndexedDB
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // App should still work
      await expect(mdreader.monacoEditor).toBeVisible();
    });

    test('should recover gracefully after storage issues', async ({ page }) => {
      await mdreader.goto();
      
      // App should work with fresh context
      await expect(mdreader.monacoEditor).toBeVisible();
      
      // Should be able to set content and see it in preview
      await mdreader.setEditorContent('Fresh start');
      await page.waitForTimeout(500);
      await expect(mdreader.previewContent).toContainText('Fresh start');
    });
  });
});
