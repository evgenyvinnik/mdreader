import { test, expect, MDReaderPage } from './helpers/fixtures';

test.describe('View Modes', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
    await mdreader.goto();
  });

  test.describe('Default State (Split View)', () => {
    test('should show both editor and preview panes by default', async () => {
      await expect(mdreader.editorPane).toBeVisible();
      await expect(mdreader.previewPane).toBeVisible();
    });

    test('should have "view-both" class on main content', async ({ page }) => {
      const viewMode = await mdreader.getViewMode();
      expect(viewMode).toBe('both');
    });

    test('should show Editor header', async () => {
      await expect(mdreader.editorHeader).toHaveText('Editor');
    });

    test('should show Preview header', async () => {
      await expect(mdreader.previewHeader).toHaveText('Preview');
    });

    test('should have split view button active', async () => {
      await expect(mdreader.splitViewButton).toHaveClass(/active/);
    });
  });

  test.describe('Editor Only View', () => {
    test('should show only editor pane when editor view is selected', async () => {
      await mdreader.setViewMode('editor');
      
      await expect(mdreader.editorPane).toBeVisible();
      await expect(mdreader.previewPane).not.toBeVisible();
    });

    test('should have "view-editor" class on main content', async () => {
      await mdreader.setViewMode('editor');
      
      const viewMode = await mdreader.getViewMode();
      expect(viewMode).toBe('editor');
    });

    test('should have editor view button active', async () => {
      await mdreader.setViewMode('editor');
      
      await expect(mdreader.editorViewButton).toHaveClass(/active/);
      await expect(mdreader.splitViewButton).not.toHaveClass(/active/);
      await expect(mdreader.previewViewButton).not.toHaveClass(/active/);
    });

    test('should allow typing in editor', async ({ page }) => {
      await mdreader.setViewMode('editor');
      
      // Clear existing content first
      await mdreader.setEditorContent('Test in editor only mode');
      
      // Content should be saved (verified when switching back to split view)
      await mdreader.setViewMode('both');
      await mdreader.waitForPreviewContent('Test in editor only mode');
    });
  });

  test.describe('Preview Only View', () => {
    test('should show only preview pane when preview view is selected', async () => {
      await mdreader.setViewMode('preview');
      
      await expect(mdreader.previewPane).toBeVisible();
      await expect(mdreader.editorPane).not.toBeVisible();
    });

    test('should have "view-preview" class on main content', async () => {
      await mdreader.setViewMode('preview');
      
      const viewMode = await mdreader.getViewMode();
      expect(viewMode).toBe('preview');
    });

    test('should have preview view button active', async () => {
      await mdreader.setViewMode('preview');
      
      await expect(mdreader.previewViewButton).toHaveClass(/active/);
      await expect(mdreader.splitViewButton).not.toHaveClass(/active/);
      await expect(mdreader.editorViewButton).not.toHaveClass(/active/);
    });

    test('should display rendered content', async ({ page }) => {
      // First add content in split view
      await mdreader.setEditorContent('# Preview Mode Test');
      await page.waitForTimeout(300);
      
      // Switch to preview only
      await mdreader.setViewMode('preview');
      
      // Check content is rendered
      await expect(mdreader.previewContent).toContainText('Preview Mode Test');
      
      // Check it's an H1
      const h1 = page.locator('.markdown-body h1');
      await expect(h1).toBeVisible();
    });
  });

  test.describe('View Mode Switching', () => {
    test('should preserve content when switching from editor to split', async ({ page }) => {
      await mdreader.setViewMode('editor');
      await mdreader.setEditorContent('# Content preserved');
      await page.waitForTimeout(300);
      
      await mdreader.setViewMode('both');
      
      await expect(mdreader.previewContent).toContainText('Content preserved');
    });

    test('should preserve content when switching from split to preview', async ({ page }) => {
      await mdreader.setEditorContent('# From split to preview');
      await page.waitForTimeout(300);
      
      await mdreader.setViewMode('preview');
      
      await expect(mdreader.previewContent).toContainText('From split to preview');
    });

    test('should preserve content when switching from preview to editor', async ({ page }) => {
      await mdreader.setEditorContent('# Preserved content');
      await page.waitForTimeout(300);
      
      await mdreader.setViewMode('preview');
      await mdreader.setViewMode('editor');
      await mdreader.setViewMode('both');
      
      await expect(mdreader.previewContent).toContainText('Preserved content');
    });

    test('should cycle through all view modes', async () => {
      // Start with both
      expect(await mdreader.getViewMode()).toBe('both');
      
      // Go to editor
      await mdreader.setViewMode('editor');
      expect(await mdreader.getViewMode()).toBe('editor');
      
      // Go to preview
      await mdreader.setViewMode('preview');
      expect(await mdreader.getViewMode()).toBe('preview');
      
      // Back to both
      await mdreader.setViewMode('both');
      expect(await mdreader.getViewMode()).toBe('both');
    });
  });

  test.describe('View Mode Persistence', () => {
    test('should persist view mode in localStorage', async ({ page }) => {
      await mdreader.setViewMode('editor');
      
      const storedMode = await page.evaluate(() => localStorage.getItem('mdreader-view-mode'));
      expect(storedMode).toBe('editor');
    });

    test('should restore view mode on page reload', async ({ page }) => {
      await mdreader.setViewMode('preview');
      await page.waitForTimeout(300);
      
      // Reload the page
      await page.reload();
      await mdreader.waitForAppLoad();
      await page.waitForTimeout(500);
      
      const viewMode = await mdreader.getViewMode();
      expect(viewMode).toBe('preview');
    });
  });

  test.describe('Responsive Layout', () => {
    test('should adjust pane widths in split view', async ({ page }) => {
      await mdreader.setViewMode('both');
      
      const editorBox = await mdreader.editorPane.boundingBox();
      const previewBox = await mdreader.previewPane.boundingBox();
      
      expect(editorBox).not.toBeNull();
      expect(previewBox).not.toBeNull();
      
      // Both panes should have similar widths in split view
      if (editorBox && previewBox) {
        const widthDiff = Math.abs(editorBox.width - previewBox.width);
        expect(widthDiff).toBeLessThan(100); // Allow some difference for borders/gaps
      }
    });

    test('should expand editor to full width in editor mode', async ({ page }) => {
      await mdreader.setViewMode('editor');
      
      const mainContent = page.locator('.main-content');
      const mainBox = await mainContent.boundingBox();
      const editorBox = await mdreader.editorPane.boundingBox();
      
      if (mainBox && editorBox) {
        // Editor should take most of the main content width
        expect(editorBox.width).toBeGreaterThan(mainBox.width * 0.9);
      }
    });

    test('should expand preview to full width in preview mode', async ({ page }) => {
      await mdreader.setViewMode('preview');
      
      const mainContent = page.locator('.main-content');
      const mainBox = await mainContent.boundingBox();
      const previewBox = await mdreader.previewPane.boundingBox();
      
      if (mainBox && previewBox) {
        // Preview should take most of the main content width
        expect(previewBox.width).toBeGreaterThan(mainBox.width * 0.9);
      }
    });
  });
});
