import { test, expect, MDReaderPage } from './helpers/fixtures';

test.describe('Toolbar Controls', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
    await mdreader.goto();
  });

  test.describe('App Title', () => {
    test('should display the app title', async () => {
      await expect(mdreader.appTitle).toHaveText('MD Reader');
    });
  });

  test.describe('New Document Button', () => {
    test('should be visible and enabled', async () => {
      await expect(mdreader.newButton).toBeVisible();
      await expect(mdreader.newButton).toBeEnabled();
    });

    test('should have correct title tooltip', async () => {
      await expect(mdreader.newButton).toHaveAttribute('title', 'New document');
    });

    test('should display "New" text', async () => {
      await expect(mdreader.newButton).toContainText('New');
    });

    test('should create a new document when clicked', async ({ page }) => {
      // First, type something in the current document
      await mdreader.typeInEditor('Test content');
      await page.waitForTimeout(600); // Wait for debounce save

      // Get current document title
      const originalTitle = await mdreader.getCurrentDocumentTitle();

      // Click new document
      await mdreader.createNewDocument();
      await page.waitForTimeout(100);

      // The document title should change (new timestamp-based title)
      const newTitle = await mdreader.getCurrentDocumentTitle();
      expect(newTitle).not.toBe(originalTitle);
    });
  });

  test.describe('Open Button', () => {
    test('should be visible and enabled', async () => {
      await expect(mdreader.openButton).toBeVisible();
      await expect(mdreader.openButton).toBeEnabled();
    });

    test('should have correct title tooltip', async () => {
      await expect(mdreader.openButton).toHaveAttribute('title', 'Open .md file');
    });

    test('should display "Open" text', async () => {
      await expect(mdreader.openButton).toContainText('Open');
    });
  });

  test.describe('Save Button', () => {
    test('should be visible and enabled', async () => {
      await expect(mdreader.saveButton).toBeVisible();
      await expect(mdreader.saveButton).toBeEnabled();
    });

    test('should have correct title tooltip', async () => {
      await expect(mdreader.saveButton).toHaveAttribute('title', 'Save as .md file');
    });

    test('should display "Save" text', async () => {
      await expect(mdreader.saveButton).toContainText('Save');
    });
  });

  test.describe('Lock/Unlock Button', () => {
    test('should be visible and enabled', async () => {
      await expect(mdreader.lockButton).toBeVisible();
      await expect(mdreader.lockButton).toBeEnabled();
    });

    test('should show locked state by default', async () => {
      const isLocked = await mdreader.isScrollLocked();
      expect(isLocked).toBe(true);
    });

    test('should toggle scroll lock when clicked', async () => {
      const initialLocked = await mdreader.isScrollLocked();
      
      await mdreader.toggleScrollLock();
      const afterToggle = await mdreader.isScrollLocked();
      
      expect(afterToggle).toBe(!initialLocked);
    });

    test('should update button text when toggled', async ({ page }) => {
      // Initially locked
      await expect(mdreader.lockButton).toContainText('Locked');
      
      // Toggle to unlocked
      await mdreader.toggleScrollLock();
      await expect(mdreader.lockButton).toContainText('Unlocked');
      
      // Toggle back to locked
      await mdreader.toggleScrollLock();
      await expect(mdreader.lockButton).toContainText('Locked');
    });

    test('should update tooltip when toggled', async () => {
      // Initially locked - tooltip says "Unlock"
      await expect(mdreader.lockButton).toHaveAttribute('title', 'Unlock scroll sync');
      
      // Toggle to unlocked - tooltip says "Lock"
      await mdreader.toggleScrollLock();
      await expect(mdreader.lockButton).toHaveAttribute('title', 'Lock scroll sync');
    });

    test('should have active class when locked', async ({ page }) => {
      // Initially locked
      await expect(mdreader.lockButton).toHaveClass(/active/);
      
      // Toggle to unlocked
      await mdreader.toggleScrollLock();
      await expect(mdreader.lockButton).not.toHaveClass(/active/);
    });
  });

  test.describe('View Toggle Buttons', () => {
    test('should have all three view buttons visible', async () => {
      await expect(mdreader.editorViewButton).toBeVisible();
      await expect(mdreader.splitViewButton).toBeVisible();
      await expect(mdreader.previewViewButton).toBeVisible();
    });

    test('should have correct tooltips', async () => {
      await expect(mdreader.editorViewButton).toHaveAttribute('title', 'Editor only');
      await expect(mdreader.splitViewButton).toHaveAttribute('title', 'Split view');
      await expect(mdreader.previewViewButton).toHaveAttribute('title', 'Preview only');
    });

    test('should show split view as active by default', async () => {
      await expect(mdreader.splitViewButton).toHaveClass(/active/);
    });

    test('should switch to editor only view', async () => {
      await mdreader.setViewMode('editor');
      await expect(mdreader.editorViewButton).toHaveClass(/active/);
      await expect(mdreader.splitViewButton).not.toHaveClass(/active/);
      await expect(mdreader.previewViewButton).not.toHaveClass(/active/);
    });

    test('should switch to preview only view', async () => {
      await mdreader.setViewMode('preview');
      await expect(mdreader.previewViewButton).toHaveClass(/active/);
      await expect(mdreader.splitViewButton).not.toHaveClass(/active/);
      await expect(mdreader.editorViewButton).not.toHaveClass(/active/);
    });

    test('should switch back to split view', async () => {
      await mdreader.setViewMode('editor');
      await mdreader.setViewMode('both');
      await expect(mdreader.splitViewButton).toHaveClass(/active/);
    });
  });

  test.describe('Theme Button', () => {
    test('should be visible and enabled', async () => {
      await expect(mdreader.themeButton).toBeVisible();
      await expect(mdreader.themeButton).toBeEnabled();
    });

    test('should toggle theme when clicked', async () => {
      const initialTheme = await mdreader.getTheme();
      
      await mdreader.toggleTheme();
      const newTheme = await mdreader.getTheme();
      
      expect(newTheme).not.toBe(initialTheme);
    });

    test('should update button text based on theme', async ({ page }) => {
      // Check initial state and get expected text
      const initialTheme = await mdreader.getTheme();
      
      if (initialTheme === 'dark') {
        await expect(mdreader.themeButton).toContainText('Light');
      } else {
        await expect(mdreader.themeButton).toContainText('Dark');
      }

      // Toggle and check again
      await mdreader.toggleTheme();
      
      if (initialTheme === 'dark') {
        await expect(mdreader.themeButton).toContainText('Dark');
      } else {
        await expect(mdreader.themeButton).toContainText('Light');
      }
    });

    test('should update tooltip based on theme', async () => {
      const initialTheme = await mdreader.getTheme();
      
      if (initialTheme === 'dark') {
        await expect(mdreader.themeButton).toHaveAttribute('title', 'Switch to light theme');
      } else {
        await expect(mdreader.themeButton).toHaveAttribute('title', 'Switch to dark theme');
      }

      await mdreader.toggleTheme();

      if (initialTheme === 'dark') {
        await expect(mdreader.themeButton).toHaveAttribute('title', 'Switch to dark theme');
      } else {
        await expect(mdreader.themeButton).toHaveAttribute('title', 'Switch to light theme');
      }
    });
  });
});
