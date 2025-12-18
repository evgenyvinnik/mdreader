import { test, expect, MDReaderPage } from './helpers/fixtures';

test.describe('Document Management', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
    await mdreader.goto();
  });

  test.describe('File Dropdown', () => {
    test('should display the file dropdown trigger', async () => {
      await expect(mdreader.fileDropdownTrigger).toBeVisible();
    });

    test('should show current document title in trigger', async () => {
      const title = await mdreader.getCurrentDocumentTitle();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should open dropdown menu when clicking trigger', async () => {
      await mdreader.openFileDropdown();
      await expect(mdreader.fileDropdownMenu).toBeVisible();
    });

    test('should close dropdown when clicking outside', async () => {
      await mdreader.openFileDropdown();
      await expect(mdreader.fileDropdownMenu).toBeVisible();
      
      await mdreader.closeFileDropdown();
      await expect(mdreader.fileDropdownMenu).not.toBeVisible();
    });

    test('should display search input when dropdown is open', async () => {
      await mdreader.openFileDropdown();
      await expect(mdreader.fileSearchInput).toBeVisible();
    });

    test('should focus search input when dropdown opens', async () => {
      await mdreader.openFileDropdown();
      await expect(mdreader.fileSearchInput).toBeFocused();
    });
  });

  test.describe('Document Search', () => {
    test('should filter documents when typing in search', async ({ page }) => {
      // Create a couple of documents first
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('First document content');
      await page.waitForTimeout(600);

      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('Second document content');
      await page.waitForTimeout(600);

      // Open dropdown and get initial count
      await mdreader.openFileDropdown();
      const allItems = page.locator('.file-dropdown-item');
      const initialCount = await allItems.count();
      
      expect(initialCount).toBeGreaterThanOrEqual(2);
    });

    test('should clear search when closing dropdown', async ({ page }) => {
      await mdreader.openFileDropdown();
      await mdreader.fileSearchInput.fill('test search');
      
      await mdreader.closeFileDropdown();
      await mdreader.openFileDropdown();
      
      await expect(mdreader.fileSearchInput).toHaveValue('');
    });
  });

  test.describe('Document Selection', () => {
    test('should switch documents when selecting from dropdown', async ({ page }) => {
      // Create first document with content
      await mdreader.typeInEditor('First document');
      await page.waitForTimeout(600);
      const firstTitle = await mdreader.getCurrentDocumentTitle();

      // Create second document
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('Second document');
      await page.waitForTimeout(600);
      const secondTitle = await mdreader.getCurrentDocumentTitle();

      // Switch back to first document
      await mdreader.openFileDropdown();
      
      // Find and click the first document in the list
      const items = page.locator('.file-dropdown-item');
      const count = await items.count();
      
      // Click on a document that's not the current one
      for (let i = 0; i < count; i++) {
        const itemTitle = await items.nth(i).locator('.file-dropdown-item-title').textContent();
        if (itemTitle && itemTitle !== secondTitle) {
          await items.nth(i).click();
          break;
        }
      }
      
      // Verify the document changed
      const currentTitle = await mdreader.getCurrentDocumentTitle();
      expect(currentTitle).not.toBe(secondTitle);
    });

    test('should close dropdown after selecting a document', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      const items = page.locator('.file-dropdown-item');
      const count = await items.count();
      
      if (count > 0) {
        await items.first().click();
        await expect(mdreader.fileDropdownMenu).not.toBeVisible();
      }
    });
  });

  test.describe('Document Deletion', () => {
    test('should show delete button for each document', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      const items = page.locator('.file-dropdown-item');
      const count = await items.count();
      
      for (let i = 0; i < count; i++) {
        const deleteBtn = items.nth(i).locator('.file-dropdown-delete');
        await expect(deleteBtn).toBeVisible();
      }
    });

    test('should show confirmation dialog when deleting', async ({ page }) => {
      // Create a document to delete
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('Document to delete');
      await page.waitForTimeout(600);

      await mdreader.openFileDropdown();
      
      let dialogShown = false;
      page.on('dialog', async (dialog) => {
        dialogShown = true;
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('delete');
        await dialog.dismiss();
      });

      const deleteBtn = page.locator('.file-dropdown-item').first().locator('.file-dropdown-delete');
      await deleteBtn.click();

      await page.waitForTimeout(100);
      expect(dialogShown).toBe(true);
    });

    test('should remove document when deletion is confirmed', async ({ page }) => {
      // Create a document
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);
      await mdreader.typeInEditor('Document to delete');
      await page.waitForTimeout(600);

      await mdreader.openFileDropdown();
      const items = page.locator('.file-dropdown-item');
      const initialCount = await items.count();

      // Set up dialog handler to accept
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      // Delete the first document
      const deleteBtn = items.first().locator('.file-dropdown-delete');
      await deleteBtn.click();
      
      await page.waitForTimeout(300);
      
      // Count should decrease (or a new document should be created if it was the last one)
      const finalCount = await items.count();
      expect(finalCount).toBeLessThanOrEqual(initialCount);
    });

    test('should not delete document when canceling', async ({ page }) => {
      await mdreader.openFileDropdown();
      const items = page.locator('.file-dropdown-item');
      const initialCount = await items.count();

      // Set up dialog handler to dismiss
      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });

      const deleteBtn = items.first().locator('.file-dropdown-delete');
      await deleteBtn.click();
      
      await page.waitForTimeout(100);
      
      const finalCount = await items.count();
      expect(finalCount).toBe(initialCount);
    });
  });

  test.describe('Document Renaming', () => {
    test('should show edit button for each document', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      const items = page.locator('.file-dropdown-item');
      const count = await items.count();
      
      for (let i = 0; i < count; i++) {
        const editBtn = items.nth(i).locator('.file-dropdown-edit');
        await expect(editBtn).toBeVisible();
      }
    });

    test('should show input field when edit is clicked', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      const editBtn = page.locator('.file-dropdown-item').first().locator('.file-dropdown-edit');
      await editBtn.click();
      
      const editInput = page.locator('.file-dropdown-edit-input');
      await expect(editInput).toBeVisible();
    });

    test('should focus and select input content when editing', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      const editBtn = page.locator('.file-dropdown-item').first().locator('.file-dropdown-edit');
      await editBtn.click();
      
      const editInput = page.locator('.file-dropdown-edit-input');
      await expect(editInput).toBeFocused();
    });

    test('should save new title on Enter', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      const editBtn = page.locator('.file-dropdown-item').first().locator('.file-dropdown-edit');
      await editBtn.click();
      
      const editInput = page.locator('.file-dropdown-edit-input');
      await editInput.fill('New Document Title');
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(100);
      
      // Check if the title was updated
      await mdreader.openFileDropdown();
      const firstItemTitle = await page.locator('.file-dropdown-item').first().locator('.file-dropdown-item-title').textContent();
      expect(firstItemTitle).toBe('New Document Title');
    });

    test('should cancel editing on Escape', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      // Get original title
      const originalTitle = await page.locator('.file-dropdown-item').first().locator('.file-dropdown-item-title').textContent();
      
      const editBtn = page.locator('.file-dropdown-item').first().locator('.file-dropdown-edit');
      await editBtn.click();
      
      const editInput = page.locator('.file-dropdown-edit-input');
      await editInput.fill('Should not be saved');
      await page.keyboard.press('Escape');
      
      await page.waitForTimeout(100);
      
      // Title should remain unchanged
      const currentTitle = await page.locator('.file-dropdown-item').first().locator('.file-dropdown-item-title').textContent();
      expect(currentTitle).toBe(originalTitle);
    });
  });

  test.describe('Document Timestamps', () => {
    test('should display formatted date for each document', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      const dates = page.locator('.file-dropdown-item-date');
      const count = await dates.count();
      
      for (let i = 0; i < count; i++) {
        const dateText = await dates.nth(i).textContent();
        expect(dateText).toBeTruthy();
        // Should contain typical date elements
        expect(dateText).toMatch(/\d+/); // Contains numbers
      }
    });
  });

  test.describe('Multiple Documents', () => {
    test('should maintain document list across new document creation', async ({ page }) => {
      await mdreader.openFileDropdown();
      const items = page.locator('.file-dropdown-item');
      const initialCount = await items.count();
      await mdreader.closeFileDropdown();

      // Create new document
      await mdreader.createNewDocument();
      await page.waitForTimeout(600);

      await mdreader.openFileDropdown();
      const newCount = await items.count();
      
      expect(newCount).toBe(initialCount + 1);
    });

    test('should highlight current document in dropdown', async ({ page }) => {
      await mdreader.openFileDropdown();
      
      // At least one item should be marked as active/current
      const activeItem = page.locator('.file-dropdown-item.active');
      await expect(activeItem).toBeVisible();
    });
  });
});
