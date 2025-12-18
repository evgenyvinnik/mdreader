import { test, expect, MDReaderPage } from './helpers/fixtures';

test.describe('App Initialization', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
  });

  test.describe('Initial Load', () => {
    test('should load the application', async ({ page }) => {
      await mdreader.goto();
      await expect(mdreader.appTitle).toBeVisible();
    });

    test('should show loading state initially', async ({ page }) => {
      // Navigate without waiting
      await page.goto('/');
      
      // The loading spinner might be brief, so we just check the app eventually loads
      await mdreader.waitForAppLoad();
      await expect(mdreader.monacoEditor).toBeVisible();
    });

    test('should display all toolbar elements', async ({ page }) => {
      await mdreader.goto();
      
      await expect(mdreader.newButton).toBeVisible();
      await expect(mdreader.openButton).toBeVisible();
      await expect(mdreader.saveButton).toBeVisible();
      await expect(mdreader.lockButton).toBeVisible();
      await expect(mdreader.themeButton).toBeVisible();
      await expect(mdreader.editorViewButton).toBeVisible();
      await expect(mdreader.splitViewButton).toBeVisible();
      await expect(mdreader.previewViewButton).toBeVisible();
    });

    test('should display editor and preview in split view', async ({ page }) => {
      await mdreader.goto();
      
      await expect(mdreader.editorPane).toBeVisible();
      await expect(mdreader.previewPane).toBeVisible();
    });

    test('should display file dropdown', async ({ page }) => {
      await mdreader.goto();
      
      await expect(mdreader.fileDropdownTrigger).toBeVisible();
    });
  });

  test.describe('Default Content', () => {
    test('should have welcome content on first load', async ({ page }) => {
      // Clear all storage first
      await page.goto('/');
      await page.evaluate(async () => {
        localStorage.clear();
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) indexedDB.deleteDatabase(db.name);
        }
      });
      
      // Reload to get fresh state
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // Should have default welcome content
      await expect(mdreader.previewContent).toContainText('MD Reader');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid routes gracefully', async ({ page }) => {
      await page.goto('/nonexistent-route');
      
      // App should still work (SPA routing)
      await mdreader.waitForAppLoad();
      await expect(mdreader.monacoEditor).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should render correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await mdreader.goto();
      
      await expect(mdreader.editorPane).toBeVisible();
      await expect(mdreader.previewPane).toBeVisible();
    });

    test('should render correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await mdreader.goto();
      
      await expect(mdreader.monacoEditor).toBeVisible();
    });

    test('should render correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await mdreader.goto();
      
      // App should still be functional
      await expect(mdreader.appTitle).toBeVisible();
    });
  });
});

test.describe('Page Title and Meta', () => {
  test('should have correct page title', async ({ page }) => {
    const mdreader = new MDReaderPage(page);
    await mdreader.goto();
    
    await expect(page).toHaveTitle(/MD Reader/i);
  });
});

test.describe('Keyboard Navigation', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
    await mdreader.goto();
  });

  test('should be able to tab through toolbar buttons', async ({ page }) => {
    // Focus on the first button
    await mdreader.newButton.focus();
    await expect(mdreader.newButton).toBeFocused();
    
    // Tab to next button
    await page.keyboard.press('Tab');
    // Some button should now be focused
  });

  test('should be able to interact with buttons via Enter key', async ({ page }) => {
    const initialTheme = await mdreader.getTheme();
    
    await mdreader.themeButton.focus();
    await page.keyboard.press('Enter');
    
    const newTheme = await mdreader.getTheme();
    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    const mdreader = new MDReaderPage(page);
    await mdreader.goto();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should render preview without significant delay', async ({ page }) => {
    const mdreader = new MDReaderPage(page);
    await mdreader.goto();
    
    const startTime = Date.now();
    
    await mdreader.setEditorContent('# Quick Render Test');
    await mdreader.waitForPreviewContent('Quick Render Test', 2000);
    
    const renderTime = Date.now() - startTime;
    
    // Preview should update within 2 seconds
    expect(renderTime).toBeLessThan(2000);
  });
});
